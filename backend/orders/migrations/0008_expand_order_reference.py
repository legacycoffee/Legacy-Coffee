from django.db import migrations, models
import orders.models


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0007_order_public_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='reference',
            field=models.CharField(
                default=orders.models.generate_order_reference,
                max_length=35,
                unique=True,
            ),
        ),
    ]
