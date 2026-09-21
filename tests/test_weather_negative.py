import pytest
from fastapi.testclient import TestClient

@pytest.mark.weather
@pytest.mark.negative
class TestWeatherNegative:
    """Negative, boundary, and security test scenarios for Weather API error handling and input validation."""

    def test_current_weather_missing_city_parameter(self, client: TestClient):
        """Verify requesting current weather without mandatory 'city' parameter returns 422."""
        response = client.get("/api/v1/weather/current")
        assert response.status_code == 422
        data = response.json()
        assert data["error"] == "UNPROCESSABLE_ENTITY"
        assert any("city" in str(d) for d in data.get("details", []))

    def test_current_weather_empty_city_parameter(self, client: TestClient):
        """Verify empty string for 'city' parameter is rejected."""
        response = client.get("/api/v1/weather/current?city=")
        assert response.status_code in (400, 422)

    def test_current_weather_whitespace_city(self, client: TestClient):
        """Verify city with only whitespace returns 400 Bad Request."""
        response = client.get("/api/v1/weather/current?city=%20%20%20")
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "BAD_REQUEST"

    def test_current_weather_nonexistent_city(self, client: TestClient):
        """Verify requesting weather for unmonitored location returns 404 Not Found."""
        response = client.get("/api/v1/weather/current?city=AtlantisLostCity")
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "CITY_NOT_FOUND"

    def test_current_weather_invalid_units_parameter(self, client: TestClient):
        """Verify unsupported units (e.g. 'kelvin', 'rankine') returns validation error."""
        response = client.get("/api/v1/weather/current?city=London&units=kelvin")
        assert response.status_code == 422

    def test_forecast_negative_days_parameter(self, client: TestClient):
        """Verify negative forecast days returns 400 Bad Request."""
        response = client.get("/api/v1/weather/forecast?city=Paris&days=-3")
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "INVALID_DAYS_RANGE"

    def test_forecast_exceeding_max_days_parameter(self, client: TestClient):
        """Verify forecast days beyond upper boundary (>7 days) returns 400 Bad Request."""
        response = client.get("/api/v1/weather/forecast?city=Paris&days=14")
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "INVALID_DAYS_RANGE"

    def test_forecast_nonexistent_city(self, client: TestClient):
        """Verify forecast for non-existent city returns 404 Not Found."""
        response = client.get("/api/v1/weather/forecast?city=GothamCity")
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "CITY_NOT_FOUND"

    def test_historical_nonexistent_city(self, client: TestClient):
        """Verify historical query for non-existent city returns 404 Not Found."""
        response = client.get("/api/v1/weather/historical?city=Metropolis")
        assert response.status_code == 404
        assert response.json()["error"] == "CITY_NOT_FOUND"

    def test_air_quality_nonexistent_city(self, client: TestClient):
        """Verify AQI lookup for unregistered city returns 404 Not Found."""
        response = client.get("/api/v1/weather/air-quality?city=UnregisteredAQICity")
        assert response.status_code == 404
        assert response.json()["error"] == "CITY_NOT_FOUND"

    def test_stats_nonexistent_city(self, client: TestClient):
        """Verify statistical metrics for unknown city returns 404 Not Found."""
        response = client.get("/api/v1/weather/stats?city=UnknownStationCity")
        assert response.status_code == 404
        assert response.json()["error"] == "CITY_NOT_FOUND"

    def test_observation_missing_api_key(self, client: TestClient, sample_weather_observation: dict):
        """Verify observation ingestion without X-API-Key header returns 401 Unauthorized."""
        response = client.post("/api/v1/weather/observations", json=sample_weather_observation)
        assert response.status_code == 401
        data = response.json()
        assert data["error"] == "UNAUTHORIZED"

    def test_observation_invalid_api_key(
        self, client: TestClient, invalid_api_headers: dict, sample_weather_observation: dict
    ):
        """Verify observation ingestion with invalid X-API-Key returns 403 Forbidden."""
        response = client.post(
            "/api/v1/weather/observations",
            json=sample_weather_observation,
            headers=invalid_api_headers
        )
        assert response.status_code == 403
        data = response.json()
        assert data["error"] == "FORBIDDEN"

    def test_observation_malformed_types(self, client: TestClient, valid_api_headers: dict):
        """Verify type safety: submitting string for temperature field returns 422."""
        bad_payload = {
            "city_name": "London",
            "temp_c": "NOT_A_FLOAT",
            "humidity": 65,
            "wind_kph": 10.0,
            "wind_direction": "N",
            "pressure_mb": 1013.0,
            "visibility_km": 10.0,
            "condition": "Cloudy",
            "condition_code": 1003,
            "uv_index": 2.0
        }
        response = client.post("/api/v1/weather/observations", json=bad_payload, headers=valid_api_headers)
        assert response.status_code == 422
        data = response.json()
        assert data["error"] == "UNPROCESSABLE_ENTITY"

    def test_observation_humidity_exceeds_physical_limit(self, client: TestClient, valid_api_headers: dict):
        """Verify boundary condition: humidity > 100% returns 422."""
        payload = {
            "city_name": "London",
            "temp_c": 20.0,
            "humidity": 140,  # Invalid
            "wind_kph": 10.0,
            "wind_direction": "N",
            "pressure_mb": 1013.0,
            "visibility_km": 10.0,
            "condition": "Cloudy",
            "condition_code": 1003,
            "uv_index": 2.0
        }
        response = client.post("/api/v1/weather/observations", json=payload, headers=valid_api_headers)
        assert response.status_code == 422

    def test_observation_negative_wind_speed(self, client: TestClient, valid_api_headers: dict):
        """Verify boundary condition: negative wind speed is rejected with 422."""
        payload = {
            "city_name": "London",
            "temp_c": 18.0,
            "humidity": 50,
            "wind_kph": -15.0,  # Invalid
            "wind_direction": "N",
            "pressure_mb": 1013.0,
            "visibility_km": 10.0,
            "condition": "Cloudy",
            "condition_code": 1003,
            "uv_index": 2.0
        }
        response = client.post("/api/v1/weather/observations", json=payload, headers=valid_api_headers)
        assert response.status_code == 422

    def test_observation_unregistered_station_city(
        self, client: TestClient, valid_api_headers: dict, sample_weather_observation: dict
    ):
        """Verify station ingestion for unregistered city station returns 404."""
        obs = sample_weather_observation.copy()
        obs["city_name"] = "UnregisteredStation999"
        response = client.post("/api/v1/weather/observations", json=obs, headers=valid_api_headers)
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "UNKNOWN_STATION"

    def test_register_city_duplicate_conflict(self, client: TestClient):
        """Verify registering an already existing station city returns 409 Conflict."""
        duplicate_payload = {
            "name": "London",  # Already exists in seed
            "country": "United Kingdom",
            "country_code": "GB",
            "latitude": 51.5074,
            "longitude": -0.1278,
            "timezone": "Europe/London"
        }
        response = client.post("/api/v1/weather/cities", json=duplicate_payload)
        assert response.status_code == 409
        assert response.json()["error"] == "CITY_ALREADY_EXISTS"

    @pytest.mark.security
    @pytest.mark.parametrize("sqli_payload", [
        "' OR '1'='1",
        "London' UNION SELECT 1,2,3,4,5,6,7--",
        "'; DROP TABLE cities; --",
        "admin'--",
    ])
    def test_sql_injection_resilience_in_city_query(self, client: TestClient, sqli_payload: str):
        """Verify application sanitizes against SQL injection and returns 404 safely instead of executing SQL."""
        response = client.get(f"/api/v1/weather/current?city={sqli_payload}")
        assert response.status_code == 404
        data = response.json()
        assert data["error"] == "CITY_NOT_FOUND"
