#!/usr/bin/env python
import os
import sys
from pathlib import Path

backend_dir = Path(__file__).resolve().parent / 'backend'
sys.path.insert(0, str(backend_dir))
os.chdir(str(backend_dir))

venv_site_packages = list(backend_dir.glob('venv/lib/python*/site-packages'))
for sp in venv_site_packages:
    if str(sp) not in sys.path:
        sys.path.insert(0, str(sp))

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'campus.settings')
    from django.core.management import execute_from_command_line
    execute_from_command_line(sys.argv)
