from django.db import migrations


def keep_only_order_reference(apps, schema_editor):
    Notification = apps.get_model('accounts', 'Notification')
    notifications = Notification.objects.exclude(details={}).iterator()
    for notification in notifications:
        reference = notification.details.get('reference') if isinstance(notification.details, dict) else None
        notification.details = {'reference': reference} if reference else {}
        notification.save(update_fields=('details',))


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_notification_details'),
    ]

    operations = [
        migrations.RunPython(
            keep_only_order_reference,
            migrations.RunPython.noop,
        ),
    ]
