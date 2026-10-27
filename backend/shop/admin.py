from django.contrib import admin

from .models import Product, Review, ShareEvent, WishlistItem


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'price', 'wholesale_price', 'weight', 'roast', 'is_active')
    list_filter = ('is_active', 'roast')
    search_fields = ('name', 'slug', 'description')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('product', 'user', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('product__name', 'user__email', 'text')


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('user', 'product', 'created_at')
    search_fields = ('user__email', 'product__name')


@admin.register(ShareEvent)
class ShareEventAdmin(admin.ModelAdmin):
    list_display = ('product_name', 'product_slug', 'channel', 'created_at')
    list_filter = ('channel', 'created_at')
    search_fields = ('product_name', 'product_slug')
    readonly_fields = ('product', 'product_slug', 'product_name', 'channel', 'created_at')
