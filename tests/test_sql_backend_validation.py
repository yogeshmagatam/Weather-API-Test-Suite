import sqlite3
import pytest
from fastapi.testclient import TestClient

@pytest.mark.sql_validation
class TestSqlBackendValidation:
    """Direct SQL database assertions validating backend data invariants, ACID consistency, and audit integrity."""

    def test_sql_seat_inventory_invariant_after_api_booking(
        self, client: TestClient, raw_db: sqlite3.Connection, sample_passenger_payload: dict
    ):
        """SQL Invariant: total_seats = available_seats + COUNT(active bookings).

        Validates that an API reservation atomically updates the database row and maintains invariant.
        """
        flight_id = 4  # EK-001 (DXB -> LHR)
        cursor = raw_db.cursor()

        # 1. Capture initial DB state
        cursor.execute("SELECT total_seats, available_seats FROM flights WHERE id = ?", (flight_id,))
        row = cursor.fetchone()
        init_total, init_avail = row["total_seats"], row["available_seats"]

        # 2. Dispatch API call
        payload = sample_passenger_payload.copy()
        payload["flight_id"] = flight_id
        payload["seat_number"] = "21A"
        api_res = client.post("/api/v1/bookings", json=payload)
        assert api_res.status_code == 201
        booking_ref = api_res.json()["booking_ref"]

        # 3. Direct SQL Verification of DB state
        cursor.execute("SELECT total_seats, available_seats FROM flights WHERE id = ?", (flight_id,))
        updated_row = cursor.fetchone()
        new_avail = updated_row["available_seats"]

        assert new_avail == init_avail - 1, f"Expected available seats to decrement from {init_avail} to {init_avail - 1}"

        # 4. Invariant Assertion across the entire flight record
        cursor.execute("""
            SELECT 
                f.total_seats,
                f.available_seats,
                COUNT(b.id) AS active_confirmed
            FROM flights f
            LEFT JOIN bookings b ON f.id = b.flight_id AND b.status = 'CONFIRMED'
            WHERE f.id = ?
            GROUP BY f.id, f.total_seats, f.available_seats
        """, (flight_id,))
        inv_row = cursor.fetchone()
        assert inv_row["total_seats"] == inv_row["available_seats"] + inv_row["active_confirmed"], (
            f"Seat invariant violated! Total: {inv_row['total_seats']}, "
            f"Available: {inv_row['available_seats']}, Active: {inv_row['active_confirmed']}"
        )

    def test_sql_seat_restoration_on_api_cancellation(
        self, client: TestClient, raw_db: sqlite3.Connection, sample_passenger_payload: dict
    ):
        """SQL Invariant: Cancelling via API restores available seat in DB and sets cancelled_at timestamp."""
        flight_id = 5  # SQ-308
        cursor = raw_db.cursor()

        cursor.execute("SELECT available_seats FROM flights WHERE id = ?", (flight_id,))
        baseline_avail = cursor.fetchone()["available_seats"]

        # Book seat
        payload = sample_passenger_payload.copy()
        payload["flight_id"] = flight_id
        payload["seat_number"] = "33K"
        res = client.post("/api/v1/bookings", json=payload)
        booking_ref = res.json()["booking_ref"]

        cursor.execute("SELECT available_seats FROM flights WHERE id = ?", (flight_id,))
        assert cursor.fetchone()["available_seats"] == baseline_avail - 1

        # Cancel reservation via API
        cancel_res = client.delete(f"/api/v1/bookings/{booking_ref}")
        assert cancel_res.status_code == 200

        # Direct SQL Verification
        cursor.execute("SELECT available_seats FROM flights WHERE id = ?", (flight_id,))
        restored_avail = cursor.fetchone()["available_seats"]
        assert restored_avail == baseline_avail, "Available seats count must be fully restored after cancellation"

        cursor.execute("SELECT status, cancelled_at FROM bookings WHERE booking_ref = ?", (booking_ref,))
        booking_db = cursor.fetchone()
        assert booking_db["status"] == "CANCELLED"
        assert booking_db["cancelled_at"] is not None

    def test_sql_no_overbooked_flights_in_database(self, raw_db: sqlite3.Connection):
        """SQL Invariant: No flight in the database should ever have available_seats < 0."""
        cursor = raw_db.cursor()
        cursor.execute("SELECT id, flight_number, available_seats FROM flights WHERE available_seats < 0")
        overbooked = cursor.fetchall()
        assert len(overbooked) == 0, f"Overbooked flights detected: {[dict(f) for f in overbooked]}"

    def test_sql_no_duplicate_active_seats_in_database(self, raw_db: sqlite3.Connection):
        """SQL Invariant: No two confirmed reservations may share the same flight_id and seat_number."""
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT flight_id, seat_number, COUNT(*) as cnt
            FROM bookings
            WHERE status = 'CONFIRMED'
            GROUP BY flight_id, seat_number
            HAVING COUNT(*) > 1
        """)
        collisions = cursor.fetchall()
        assert len(collisions) == 0, f"Duplicate active seat reservations detected: {[dict(c) for c in collisions]}"

    def test_sql_referential_integrity_no_orphaned_records(self, raw_db: sqlite3.Connection):
        """SQL Invariant: All bookings must reference a valid flight and passenger."""
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT b.id, b.booking_ref
            FROM bookings b
            LEFT JOIN flights f ON b.flight_id = f.id
            LEFT JOIN passengers p ON b.passenger_id = p.id
            WHERE f.id IS NULL OR p.id IS NULL
        """)
        orphans = cursor.fetchall()
        assert len(orphans) == 0, f"Orphaned bookings found in database: {[dict(o) for o in orphans]}"

    def test_sql_audit_log_captures_api_traffic(self, client: TestClient, raw_db: sqlite3.Connection):
        """SQL Invariant: Incoming API calls are captured in the api_audit_log with status and latency."""
        cursor = raw_db.cursor()

        # Dispatch test call
        client.get("/api/v1/weather/current?city=Frankfurt")

        # Query audit log
        cursor.execute("""
            SELECT endpoint, http_method, status_code, response_time_ms
            FROM api_audit_log
            WHERE endpoint LIKE '%Frankfurt%'
            ORDER BY id DESC LIMIT 1
        """)
        log = cursor.fetchone()
        assert log is not None, "API call was not logged in api_audit_log table"
        assert log["http_method"] == "GET"
        assert log["status_code"] == 200
        assert log["response_time_ms"] >= 0.0

    def test_sql_revenue_reconciliation(self, raw_db: sqlite3.Connection):
        """SQL Invariant: Sum of confirmed booking total_price must reconcile with base_price * confirmed count."""
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT 
                f.flight_number,
                f.base_price,
                COUNT(b.id) AS confirmed_count,
                COALESCE(SUM(b.total_price), 0.0) AS actual_revenue,
                (COUNT(b.id) * f.base_price) AS expected_revenue
            FROM flights f
            LEFT JOIN bookings b ON f.id = b.flight_id AND b.status = 'CONFIRMED'
            GROUP BY f.id, f.flight_number, f.base_price
        """)
        rows = cursor.fetchall()
        for r in rows:
            assert abs(r["actual_revenue"] - r["expected_revenue"]) < 0.01, (
                f"Revenue mismatch for flight {r['flight_number']}: "
                f"Actual {r['actual_revenue']} != Expected {r['expected_revenue']}"
            )
