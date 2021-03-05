from rest_framework.generics import (
    ListAPIView,
    RetrieveAPIView,
    CreateAPIView,
    UpdateAPIView,
    DestroyAPIView
)
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny,IsAuthenticated
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST
from core.models import Item, OrderItem, Order, Address, Payment, Coupon, Refund, Variation, ItemVariation
from .serializers import ItemSerializer, OrderSerializer, ItemDetailSerializer, AddressSerializer, PaymentSerializer
from django.http import Http404
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.core.exceptions import ObjectDoesNotExist
from django.conf import settings
from django_countries import countries
import stripe
import random
import string
stripe.api_key = settings.STRIPE_SECRET_KEY


def create_ref_code():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=20))

class UserIDView(APIView):
    def get(self, request, *args, **kwargs):
        return Response({'userId': request.user.id}, status=HTTP_200_OK)

class ItemListView(ListAPIView):
    permission_classes = (AllowAny, )
    serializer_class = ItemSerializer
    queryset = Item.objects.all()

    def get_queryset(self):
        search_title = self.request.query_params.get('search', None)
        qs = Item.objects.all()
        if search_title is None:
            return qs
        return Item.objects.filter(title__icontains=search_title)

class ItemDetailView(RetrieveAPIView):
    permission_classes = (AllowAny, )
    serializer_class = ItemDetailSerializer
    queryset = Item.objects.all()




class AddToCartView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        variations = request.data.get('variations', [])
        if slug is None:
            return Response({"message": "Invalid request"}, status=HTTP_400_BAD_REQUEST)
        item = get_object_or_404(Item, slug=slug)
        minimum_variation_count = Variation.objects.filter(item=item).count()
        if len(variations) < minimum_variation_count:
            return Response({"message": "Please specify the required variations"}, status=HTTP_400_BAD_REQUEST)


        order_item_qs = OrderItem.objects.filter(item=item, user=request.user, ordered=False)

        for v in variations:
            order_item_qs = order_item_qs.filter(item_variations__exact=v)

        if order_item_qs.exists():
            order_item = order_item_qs.first()
            order_item.quantity += 1
            order_item.save()
        else:
            order_item = OrderItem.objects.create(item=item, user=request.user, ordered=False)
            order_item.item_variations.add(*variations)
            order_item.save()


        order_qs = Order.objects.filter(user=request.user, ordered=False)
        if order_qs.exists():
            order = order_qs[0]
            if not order.items.filter(item__id=order_item.id).exists():
                order.items.add(order_item)
            return Response(status=HTTP_200_OK)
        else:
            ordered_date = timezone.now()
            order = Order.objects.create(user=request.user, ordered_date=ordered_date)
            order.items.add(order_item)
        return Response(status=HTTP_200_OK)

class OrderDetailView(RetrieveAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = OrderSerializer
    # queryset = Order.objects.all()

    def get_object(self):
        try:
            order = Order.objects.get(user=self.request.user, ordered=False)
            return order
        except ObjectDoesNotExist:
            raise Http404("You have not active order")
            # return Response({"message": "You have not active order"}, status=HTTP_400_BAD_REQUEST)

class PaymentView(APIView):
    def post(self, request, *args, **kwargs):
        order = Order.objects.get(user=self.request.user, ordered=False)
        amount = int(order.total_price() * 100)
        token = request.data.get('stripeToken')

        billing_address_id = request.data.get('selectedBillingAddress')
        shipping_address_id = request.data.get('selectedShippingAddress')
        billing_address = Address.objects.get(id=billing_address_id)
        shipping_address = Address.objects.get(id=shipping_address_id)

        try:
            charge = stripe.Charge.create(
                amount=amount,  # cents
                currency="usd",
                source=token
            )
            # create the payment
            payment = Payment()
            payment.stripe_charge_id = charge['id']
            payment.user = self.request.user
            payment.amount = charge['amount']
            payment.save()

            # assign the payment to the order
            order_items = order.items.all()
            order_items.update(ordered=True)
            for item in order_items:
                item.save()

            order.ordered = True
            order.payment = payment
            order.ref_code = create_ref_code()
            order.billing_address = billing_address
            order.shipping_address = shipping_address
            order.save()

            return Response(status=HTTP_200_OK)
        except stripe.error.CardError as e:
            return Response({"message": f"{err.get('messages')}"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.RateLimitError as e:
            return Response({"message": "Rate limit error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.InvalidRequestError as e:
            return Response({"message": "Invalid request error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.AuthenticationError as e:
            print(e)
            return Response({"message": "Authentication error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.APIConnectionError as e:
            return Response({"message": "Api connection error"}, status=HTTP_400_BAD_REQUEST)

        except stripe.error.StripeError as e:
            return Response({"message": "Stripe error"}, status=HTTP_400_BAD_REQUEST)

        except Exception as e:
            # send a email to ourselves
            return Response({"message": "Something wrong.Please try again.."}, status=HTTP_400_BAD_REQUEST)

class CouponView(APIView):
    def post(self, request, *args, **kwargs):
        code = request.data.get('code', None)
        print(code)
        if code is None or code == '':
            return Response({'message': 'Coupon is invalid'}, status=HTTP_400_BAD_REQUEST)
        order = Order.objects.get(user=self.request.user, ordered=False)
        coupon = get_object_or_404(Coupon, code=code)
        order.promo_code = coupon
        order.save()
        return Response(status=HTTP_200_OK)

class AddressListView(ListAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = AddressSerializer

    def get_queryset(self):
        address_type = self.request.query_params.get('address_type', None)
        qs = Address.objects.all()
        if address_type is None:
            return qs
        return qs.filter(user=self.request.user, address_type=address_type)

class CountryListView(APIView):
    def get(self, request, *args, **kwargs):
        return Response(countries, status=HTTP_200_OK)


class AddressCreateView(CreateAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = AddressSerializer
    queryset = Address.objects.all()

class AddressUpdateView(UpdateAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = AddressSerializer
    queryset = Address.objects.all()

class AddressDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated, )
    queryset = Address.objects.all()

class OrderDeleteView(DestroyAPIView):
    permission_classes = (IsAuthenticated, )
    queryset = OrderItem.objects.all()

class OrderMinusView(APIView):
    def post(self, request, *args, **kwargs):
        slug = request.data.get('slug', None)
        if slug is None:
            return Response({"message": "Invalid data"}, status=HTTP_400_BAD_REQUEST)
        item = get_object_or_404(Item, slug=slug)
        order_qs = Order.objects.filter(user=request.user, ordered=False)
        if order_qs.exists():
            order = order_qs[0]
            if order.items.filter(item__slug=item.slug).exists():
                order_item = OrderItem.objects.filter(item=item, user=request.user, ordered=False)[0]
                if order_item.quantity > 1:
                    order_item.quantity -= 1
                    order_item.save()
                else:
                    order.items.remove(order_item)
                return Response(status=HTTP_200_OK)

class PaymentListView(ListAPIView):
    permission_classes = (IsAuthenticated, )
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)





