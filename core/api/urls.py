from .view import (
    UserIDView,
    ItemListView,
    ItemDetailView,
    AddToCartView,
    OrderDetailView,
    PaymentView,
    CouponView,
    AddressListView,
    AddressCreateView,
    CountryListView,
    AddressUpdateView,
    AddressDeleteView,
    OrderDeleteView,
    OrderMinusView,
    PaymentListView
)
from django.urls import path

urlpatterns = [
    path('user-id/', UserIDView.as_view(), name='user-id'),
    path('countries/', CountryListView.as_view(), name='country-list'),
    path('addresses/', AddressListView.as_view(), name='address-list'),
    path('addresses/create/', AddressCreateView.as_view(), name='address-create'),
    path('addresses/<pk>/update/', AddressUpdateView.as_view(), name='address-update'),
    path('addresses/<pk>/delete/', AddressDeleteView.as_view(), name='address-delete'),
    path('products/', ItemListView.as_view(), name='product-list'),
    path('products/<pk>/', ItemDetailView.as_view(), name='product-detail'),
    path('add-to-cart/', AddToCartView.as_view(), name='add-to-cart'),
    path('order-summary/', OrderDetailView.as_view(), name='order-summary'),
    path('order-summary-minus/', OrderMinusView.as_view(), name='order-summary-minus'),
    path('order-summary/<pk>/delete/', OrderDeleteView.as_view(), name='order-summary-delete'),
    path('checkout/', PaymentView.as_view(), name='checkout'),
    path('coupon/', CouponView.as_view(), name='coupon'),
    path('payment-history/', PaymentListView.as_view(), name='payment-history'),
]