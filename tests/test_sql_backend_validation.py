import sqlite3
import pytest
from fastapi.testclient import TestClient

@pytest.mark.sql_validation
class TestSqlBackendValidation:
    """Direct SQL database assertions validating meteorological data invariants, ACID persistence, and audit integrity."""

    def test_sql_sensor_physical_bounds_invariant(self, raw_db: sqlite3.Connection):
        """SQL Invariant: Meteorological sensor physical bounds.

        Temperature must be between -80°C and 65°C, humidity 0-100%, wind 0-450 km/h, pressure 850-1090 hPa.
        """
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT id, temp_c, humidity, wind_kph, pressure_mb
            FROM weather_records
            WHERE (temp_c < -80.0 OR temp_c > 65.0)
               OR (humidity < 0 OR humidity > 100)
               OR (wind_kph < 0.0 OR wind_kph > 450.0)
               OR (pressure_mb < 850.0 OR pressure_mb > 1090.0)
        """)
        anomalies = cursor.fetchall()
        assert len(anomalies) == 0, f"Sensor physical boundary violations detected: {[dict(a) for a in anomalies]}"

    def test_sql_referential_integrity_no_orphaned_records(self, raw_db: sqlite3.Connection):
        """SQL Invariant: Referential Integrity.

        All weather_records and weather_alerts must link to an existing city station.
        """
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT w.id FROM weather_records w
            LEFT JOIN cities c ON w.city_id = c.id
            WHERE c.id IS NULL
        """)
        orphaned_records = cursor.fetchall()
        assert len(orphaned_records) == 0, f"Orphaned weather records found: {len(orphaned_records)}"

        cursor.execute("""
            SELECT a.id FROM weather_alerts a
            LEFT JOIN cities c ON a.city_id = c.id
            WHERE c.id IS NULL
        """)
        orphaned_alerts = cursor.fetchall()
        assert len(orphaned_alerts) == 0, f"Orphaned weather alerts found: {len(orphaned_alerts)}"

    def test_sql_station_observation_ingestion_persistence(
        self, client: TestClient, raw_db: sqlite3.Connection, valid_api_headers: dict, sample_weather_observation: dict
    ):
        """SQL Invariant: API ingestion atomically creates database row with correct foreign keys."""
        cursor = raw_db.cursor()

        # Ingest via API
        response = client.post(
            "/api/v1/weather/observations",
            json=sample_weather_observation,
            headers=valid_api_headers
        )
        assert response.status_code == 201
        record_id = response.json()["record_id"]

        # Verify directly in SQLite
        cursor.execute("""
            SELECT w.id, w.temp_c, w.humidity, w.wind_kph, c.name AS city_name
            FROM weather_records w
            JOIN cities c ON w.city_id = c.id
            WHERE w.id = ?
        """, (record_id,))
        row = cursor.fetchone()
        assert row is not None, f"Observation record {record_id} was not persisted in database"
        assert row["city_name"] == sample_weather_observation["city_name"]
        assert abs(row["temp_c"] - sample_weather_observation["temp_c"]) < 0.01
        assert row["humidity"] == sample_weather_observation["humidity"]

    def test_sql_air_quality_index_bounds(self, raw_db: sqlite3.Connection):
        """SQL Invariant: Air Quality Index (AQI) values must be between 1 and 500."""
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT id, air_quality_index
            FROM weather_records
            WHERE air_quality_index IS NOT NULL
              AND (air_quality_index < 1 OR air_quality_index > 500)
        """)
        invalid_aqi = cursor.fetchall()
        assert len(invalid_aqi) == 0, f"Out of bounds AQI values found: {[dict(a) for a in invalid_aqi]}"

    def test_sql_active_alerts_expiration_integrity(self, raw_db: sqlite3.Connection):
        """SQL Invariant: Active alerts must have expiration timestamp strictly in the future."""
        cursor = raw_db.cursor()
        cursor.execute("""
            SELECT id, event, expires_at
            FROM weather_alerts
            WHERE is_active = 1 AND expires_at < datetime('now')
        """)
        expired_active = cursor.fetchall()
        assert len(expired_active) == 0, f"Expired alerts still marked active: {[dict(a) for a in expired_active]}"

    def test_sql_audit_log_captures_api_traffic(self, client: TestClient, raw_db: sqlite3.Connection):
        """SQL Invariant: Incoming API calls are recorded in api_audit_log with status code and latency."""
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

    def test_sql_weather_statistical_aggregation_consistency(
        self, client: TestClient, raw_db: sqlite3.Connection
    ):
        """SQL Invariant: API statistical aggregates match direct database SQL aggregate calculations."""
        cursor = raw_db.cursor()

        # Fetch SQL aggregation directly
        cursor.execute("""
            SELECT 
                ROUND(MIN(temp_c), 1) as min_t,
                ROUND(MAX(temp_c), 1) as max_t,
                ROUND(AVG(temp_c), 1) as avg_t
            FROM weather_records
            WHERE city_id = 1
        """)
        sql_stats = cursor.fetchone()

        # Fetch API stats
        api_res = client.get("/api/v1/weather/stats?city=London")
        assert api_res.status_code == 200
        api_stats = api_res.json()

        assert abs(api_stats["min_temp_c"] - sql_stats["min_t"]) < 0.2
        assert abs(api_stats["max_temp_c"] - sql_stats["max_t"]) < 0.2
        assert abs(api_stats["avg_temp_c"] - sql_stats["avg_t"]) < 0.2
