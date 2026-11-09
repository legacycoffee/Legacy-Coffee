from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('shop', '0007_product_public_id'),
    ]

    operations = [
        migrations.AlterField(
            model_name='product',
            name='image',
            field=models.URLField(blank=True, max_length=500),
        ),
        migrations.AlterField(
            model_name='product',
            name='image_alt',
            field=models.CharField(blank=True, max_length=250),
        ),
    ]
