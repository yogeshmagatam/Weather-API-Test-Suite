import pytest
import sqlite3
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from api.app import app
from api.database import SessionLocal, get_raw_sqlite_connection
from api.config import settings
from scripts.init_db import initialize_database

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure weather database is freshly initialized before test session."""
    initialize_database()

@pytest.fixture(scope="function")
def client() -> TestClient:
    """FastAPI TestClient fixture for dispatching HTTP requests."""
    with TestClient(app) as test_client:
        yield test_client

@pytest.fixture(scope="function")
def db_session():
    """Provides a transactional SQLAlchemy database session."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def raw_db():
    """Provides a raw sqlite3 connection with Row factory for low-level SQL validation."""
    conn = get_raw_sqlite_connection()
    try:
        yield conn
    finally:
        conn.close()

@pytest.fixture
def valid_api_headers() -> dict:
    """Authorized API Key headers."""
    return {"X-API-Key": settings.VALID_API_KEYS[0]}

@pytest.fixture
def invalid_api_headers() -> dict:
    """Unauthorized / invalid API Key headers."""
    return {"X-API-Key": "unauthorized_token_xyz_999"}

@pytest.fixture
def sample_weather_observation() -> dict:
    """Generates valid payload for weather station telemetry ingestion."""
    return {
        "city_name": "London",
        "temp_c": 19.4,
        "humidity": 68,
        "wind_kph": 16.2,
        "wind_direction": "WSW",
        "pressure_mb": 1012.8,
        "visibility_km": 10.0,
        "condition": "Scattered Clouds",
        "condition_code": 1003,
        "uv_index": 3.8,
        "air_quality_index": 29
    }

@pytest.fixture
def sample_city_payload() -> dict:
    """Generates valid payload for registering a new weather monitoring station city."""
    return {
        "name": "Reykjavik",
        "country": "Iceland",
        "country_code": "IS",
        "latitude": 64.1466,
        "longitude": -21.9426,
        "timezone": "Atlantic/Reykjavik"
    }
