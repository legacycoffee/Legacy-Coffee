import uuid

from django.db import migrations, models


def populate_notification_public_ids(apps, schema_editor):
    Notification = apps.get_model('accounts', 'Notification')
    for notification in Notification.objects.using(schema_editor.connection.alias).filter(
        public_id__isnull=True,
    ).iterator():
        Notification.objects.using(schema_editor.connection.alias).filter(
            pk=notification.pk,
        ).update(public_id=uuid.uuid4())


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0010_user_must_change_password'),
    ]

    operations = [
        migrations.AddField(
            model_name='notification',
            name='public_id',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(
            populate_notification_public_ids,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='notification',
            name='public_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
