#!/usr/bin/env python3
"""Database Initialization & Seed Script for Weather API Test Suite.

Creates SQLite database tables using sql/schema.sql and seeds realistic baseline
meteorological records using sql/seed.sql idempotently.
"""

import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "weather_api.db"
SCHEMA_PATH = BASE_DIR / "sql" / "schema.sql"
SEED_PATH = BASE_DIR / "sql" / "seed.sql"

def initialize_database():
    print(f"[*] Initializing weather database at: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = OFF;")

    # Drop existing tables cleanly
    tables = [
        "api_audit_log", "weather_alerts", "weather_records", "cities"
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table};")

    cursor.execute("PRAGMA foreign_keys = ON;")

    # Execute Schema
    print(f"[*] Executing weather schema DDL from: {SCHEMA_PATH.name}")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
    print(f"[+] Weather schema created successfully.")

    # Execute Seed
    print(f"[*] Seeding meteorological telemetry from: {SEED_PATH.name}")
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed_sql = f.read()
        cursor.executescript(seed_sql)
    print(f"[+] Meteorological seed data inserted successfully.")

    # Verification
    cursor.execute("SELECT COUNT(*) FROM cities;")
    cities_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM weather_records;")
    records_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM weather_alerts WHERE is_active = 1;")
    alerts_count = cursor.fetchone()[0]

    print(f"[+] Verification: {cities_count} weather stations, {records_count} telemetry records, {alerts_count} active hazard alerts.")

    conn.commit()
    conn.close()
    print("[SUCCESS] Weather database initialization complete!\n")

if __name__ == "__main__":
    initialize_database()
