"""
Set (update) admin password from .env. Use when you get "correct email and password" error.
Usage: python manage.py set_admin_password

Reads backend/.env:
  ADMIN_EMAIL=admin@example.com
  ADMIN_PASSWORD=your-new-password
Then updates that user's password so you can log in to /admin/
"""
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


def load_dotenv():
    """Load .env from project root (backend/) into os.environ."""
    env_path = Path(settings.BASE_DIR) / '.env'
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding='utf-8', errors='ignore').splitlines():
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if '=' in line:
            key, _, value = line.partition('=')
            key = key.strip()
            value = value.strip().strip('"').strip("'")
            if key and key not in os.environ:
                os.environ[key] = value


class Command(BaseCommand):
    help = "Set admin password from ADMIN_EMAIL and ADMIN_PASSWORD in .env (fix login error)."

    def handle(self, *args, **options):
        load_dotenv()
        email = os.environ.get('ADMIN_EMAIL', '').strip()
        password = os.environ.get('ADMIN_PASSWORD', '')

        if not email or not password:
            self.stderr.write(
                self.style.ERROR(
                    'Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env then run:\n'
                    '  python manage.py set_admin_password'
                )
            )
            return

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            self.stderr.write(
                self.style.ERROR(
                    f'No user with email "{email}". Create one first:\n'
                    '  python manage.py create_admin_user'
                )
            )
            return

        user.set_password(password)
        user.save(update_fields=['password'])
        self.stdout.write(self.style.SUCCESS(f'Password updated for {email}. You can log in now.'))
