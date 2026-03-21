#!/usr/bin/env python3
"""
Create the disease_symptom_dataset table in Supabase.
Uses DATABASE_URL (Postgres connection string) from .env.

Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)
"""

import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main():
    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")
    load_dotenv(ROOT / ".env")

    url = os.getenv("DATABASE_URL")
    if not url:
        print("Error: Set DATABASE_URL in .env")
        print("Get it from: Supabase Dashboard → Settings → Database → Connection string (URI)")
        print("\nExample: postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres")
        return 1

    try:
        import psycopg2
    except ImportError:
        print("Installing psycopg2-binary...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2

    sql_path = ROOT / "supabase" / "migrations" / "001_create_disease_symptom_dataset.sql"
    sql = sql_path.read_text()

    print("Connecting to Supabase...")
    conn = psycopg2.connect(url)
    conn.autocommit = True
    cur = conn.cursor()
    print("Running migration...")
    cur.execute(sql)
    cur.close()
    conn.close()
    print("Table disease_symptom_dataset created.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
