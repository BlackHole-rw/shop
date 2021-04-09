# Generated by Django 3.0.3 on 2021-01-05 08:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0002_auto_20210105_0333'),
    ]

    operations = [
        migrations.AlterField(
            model_name='address',
            name='address_type',
            field=models.CharField(choices=[('S', 'shipping'), ('B', 'billing')], max_length=1),
        ),
        migrations.AlterField(
            model_name='item',
            name='category',
            field=models.CharField(choices=[('OW', 'Out wear'), ('S', 'Shirt'), ('SW', 'Sport wear')], max_length=2),
        ),
        migrations.AlterField(
            model_name='item',
            name='label',
            field=models.CharField(choices=[('D', 'danger'), ('P', 'primary'), ('S', 'secondary')], max_length=1),
        ),
        migrations.AlterField(
            model_name='itemvariation',
            name='attachment',
            field=models.ImageField(null=True, upload_to=''),
        ),
    ]