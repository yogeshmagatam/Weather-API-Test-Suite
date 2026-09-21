#!/usr/bin/env python3
"""Database Initialization & Seed Script.

Creates SQLite database tables using sql/schema.sql and seeds realistic baseline
records using sql/seed.sql idempotently.
"""

import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "weather_flight.db"
SCHEMA_PATH = BASE_DIR / "sql" / "schema.sql"
SEED_PATH = BASE_DIR / "sql" / "seed.sql"

def initialize_database():
    print(f"[*] Initializing database at: {DB_PATH}")

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA foreign_keys = OFF;")

    # Drop existing tables cleanly if resetting
    tables = [
        "api_audit_log", "bookings", "passengers", "flights", 
        "airports", "weather_alerts", "weather_records", "cities"
    ]
    for table in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {table};")

    cursor.execute("PRAGMA foreign_keys = ON;")

    # Execute Schema
    print(f"[*] Executing schema DDL from: {SCHEMA_PATH.name}")
    with open(SCHEMA_PATH, "r", encoding="utf-8") as f:
        schema_sql = f.read()
        cursor.executescript(schema_sql)
    print(f"[+] Schema created successfully.")

    # Execute Seed
    print(f"[*] Seeding data from: {SEED_PATH.name}")
    with open(SEED_PATH, "r", encoding="utf-8") as f:
        seed_sql = f.read()
        cursor.executescript(seed_sql)
    print(f"[+] Seed data inserted successfully.")

    # Quick Verification
    cursor.execute("SELECT COUNT(*) FROM cities;")
    cities_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM flights;")
    flights_count = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM bookings WHERE status = 'CONFIRMED';")
    bookings_count = cursor.fetchone()[0]

    print(f"[+] Verification: {cities_count} cities, {flights_count} flights, {bookings_count} confirmed bookings.")

    conn.commit()
    conn.close()
    print("[SUCCESS] Database initialization complete!\n")

if __name__ == "__main__":
    initialize_database()
