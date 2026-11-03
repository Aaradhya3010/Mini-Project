#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys
from pathlib import Path

# Automatically add venv site-packages if present so manage.py works with both `python` and `venv/bin/python`
venv_site_packages = list(Path(__file__).resolve().parent.glob('venv/lib/python*/site-packages'))
for sp in venv_site_packages:
    if str(sp) not in sys.path:
        sys.path.insert(0, str(sp))


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
