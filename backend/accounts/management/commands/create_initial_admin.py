import os

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError


class Command(BaseCommand):
    help = 'Create the initial superuser from deployment environment variables.'

    def handle(self, *args, **options):
        email = os.environ.get('INITIAL_ADMIN_EMAIL', '').strip()
        username = os.environ.get('INITIAL_ADMIN_USERNAME', '').strip()
        password = os.environ.get('INITIAL_ADMIN_PASSWORD', '')
        configured_values = (email, username, password)

        if not any(configured_values):
            self.stdout.write('Initial admin variables are not configured; skipping.')
            return
        if not all(configured_values):
            raise CommandError(
                'Set INITIAL_ADMIN_EMAIL, INITIAL_ADMIN_USERNAME, and INITIAL_ADMIN_PASSWORD together.',
            )

        user_model = get_user_model()
        if user_model.objects.filter(is_superuser=True).exists():
            self.stdout.write('A superuser already exists; skipping initial admin creation.')
            return
        if user_model.objects.filter(email=email).exists():
            raise CommandError(
                f'An account already exists for {email}. Use a different INITIAL_ADMIN_EMAIL.',
            )
        try:
            validate_password(password)
        except ValidationError as error:
            raise CommandError(f'INITIAL_ADMIN_PASSWORD is not strong enough: {" ".join(error.messages)}') from error

        user_model.objects.create_superuser(
            email=email,
            username=username,
            password=password,
        )
        self.stdout.write(self.style.SUCCESS(f'Created initial superuser {email}.'))
