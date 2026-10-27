from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0003_shareevent'),
    ]

    operations = [
        migrations.AddField(
            model_name='product',
            name='wholesale_price',
            field=models.DecimalField(
                blank=True,
                decimal_places=0,
                help_text='Optional wholesale unit price. Leave blank to use the retail price estimate.',
                max_digits=12,
                null=True,
            ),
        ),
    ]
