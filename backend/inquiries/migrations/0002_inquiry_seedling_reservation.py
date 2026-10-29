from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inquiries', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='inquiry',
            name='kind',
            field=models.CharField(
                choices=[
                    ('contact', 'Contact'),
                    ('quote', 'Quote'),
                    ('partner', 'Partner'),
                    ('farm_reservation', 'Farm reservation'),
                    ('seedling_reservation', 'Seedling reservation'),
                ],
                max_length=20,
            ),
        ),
    ]
