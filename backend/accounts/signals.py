from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

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
    if created or not instance.user_id:
        return

    if getattr(instance, '_previous_status', None) == instance.status:
        return

    status_messages = {
        Order.Status.CONFIRMED: ('Order confirmed', 'has been confirmed'),
        Order.Status.FULFILLED: ('Order fulfilled', 'has been fulfilled'),
        Order.Status.CANCELLED: ('Order cancelled', 'has been cancelled'),
    }
    notification = status_messages.get(instance.status)
    if notification:
        title, message = notification
        create_order_notification(
            instance,
            kind=Notification.Kind.ORDER_STATUS,
            title=title,
            message=f'Your order {instance.reference} {message}.',
        )
