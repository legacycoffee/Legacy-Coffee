import uuid

from django.db import migrations, models


def populate_user_public_ids(apps, schema_editor):
    User = apps.get_model('accounts', 'User')
    database = schema_editor.connection.alias
    for user in User.objects.using(database).filter(public_id__isnull=True).iterator():
        User.objects.using(database).filter(pk=user.pk).update(public_id=uuid.uuid4())


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0011_notification_public_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='public_id',
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(
            populate_user_public_ids,
            migrations.RunPython.noop,
        ),
        migrations.AlterField(
            model_name='user',
            name='public_id',
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
