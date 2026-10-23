from orders.models import Order, OrderItem


def has_completed_purchase(user, product):
    return OrderItem.objects.filter(
        order__user=user,
        order__status=Order.Status.FULFILLED,
        product=product,
    ).exists()
