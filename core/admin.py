from django.contrib import admin
from .models import OrderItem, Order, Item, Payment, Coupon, Address, Variation, ItemVariation

def make_refund_acepted(modeladmin, request, queryset):
    queryset.update(refund_requested=False, refund_granted=True)

make_refund_acepted.short_description = "Update refund acepted"

class OrderAdmin(admin.ModelAdmin):
    list_display = ['user',
                    'ordered',
                    'being_delivered',
                    'received',
                    'refund_requested',
                    'refund_granted',
                    'billing_address',
                    'payment',
                    'promo_code']

    list_display_links = ['user',
                          'billing_address',
                          'payment',
                          'promo_code']

    search_fields = ['user__username', 'ref_code']

    list_filter = ['being_delivered',
                    'received',
                    'refund_requested',
                    'refund_granted']
    actions = [make_refund_acepted]

class AddressModel(admin.ModelAdmin):
    list_display = ['user',
                    'street_address',
                    'address_type',
                    'default']
    list_filter = ['default', 'address_type']
    search_fields = ['user', 'street_address', 'address_type']

class ItemVariationAdmin(admin.ModelAdmin):
    list_display = ['variation',
                    'value',
                    'attachment']
    list_filter = ['variation', 'variation__item']
    search_fields = ['value']

class ItemVariationInLineAdmin(admin.TabularInline):
    model = ItemVariation
    extra = 1

class VariationAdmin(admin.ModelAdmin):
    list_display = ['item',
                    'name']
    list_filter = ['item']
    search_fields = ['name']
    inlines = [ItemVariationInLineAdmin]

admin.site.register(OrderItem)
admin.site.register(Order, OrderAdmin)
admin.site.register(Item)
admin.site.register(Payment)
admin.site.register(Coupon)
admin.site.register(Address, AddressModel)
admin.site.register(ItemVariation, ItemVariationAdmin)
admin.site.register(Variation, VariationAdmin)



