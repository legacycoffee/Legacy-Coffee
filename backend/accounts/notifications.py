from accounts.models import Notification


def create_order_notification(order, *, kind, title, message):
    return Notification.objects.create(
        user=order.user,
        kind=kind,
        title=title,
        message=message,
        details={'reference': order.reference},
    )
