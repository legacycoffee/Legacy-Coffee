from django.db import transaction
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from accounts import email as account_email
from accounts.models import Notification
from accounts.notifications import create_order_notification
from orders.models import Order


@receiver(pre_save, sender=Order)
def remember_order_status(sender, instance, **kwargs):
    if instance.pk:
        instance._previous_status = (
            sender.objects.filter(pk=instance.pk)
            .values_list('status', flat=True)
            .first()
        )
    else:
        instance._previous_status = None


@receiver(post_save, sender=Order)
def notify_order_events(sender, instance, created, **kwargs):
    if created:
        return

    if getattr(instance, '_previous_status', None) == instance.status:
        return

    status_titles = {
        Order.Status.CONFIRMED: 'Order confirmed',
        Order.Status.FULFILLED: 'Order fulfilled',
        Order.Status.CANCELLED: 'Order cancelled',
    }
    title = status_titles.get(instance.status)
    if not title:
        return

    if instance.user_id:
        details_extra = None
        message = f'Order number: {instance.reference}'
        if instance.status == Order.Status.FULFILLED:
            review_products = [
                {'slug': item.product.slug, 'name': item.product_name}
                for item in instance.items.select_related('product')
                if item.product_id and item.product.is_active
            ]
            message = 'Your order is fulfilled. Rate and review the coffee you received.'
            details_extra = {'review_products': review_products}

        create_order_notification(
            instance,
            kind=Notification.Kind.ORDER_STATUS,
            title=title,
            message=message,
            details_extra=details_extra,
        )

    status_label = instance.get_status_display()
    transaction.on_commit(
        lambda order=instance, label=status_label: account_email.send_order_status_email(
            order,
            label,
        ),
    )
