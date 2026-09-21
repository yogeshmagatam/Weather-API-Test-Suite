import pytest
from fastapi.testclient import TestClient

@pytest.mark.weather
@pytest.mark.positive
class TestWeatherPositive:
    """Positive test scenarios validating Weather API functionality, unit conversion, and schema integrity."""

    def test_get_current_weather_metric_default(self, client: TestClient):
        """Verify fetching current weather in London defaults to metric units (°C, km/h)."""
        response = client.get("/api/v1/weather/current?city=London")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()

        assert data["location"]["city"] == "London"
        assert data["location"]["country"] == "United Kingdom"
        assert data["location"]["country_code"] == "GB"
        assert data["unit"] == "°C"
        assert data["wind_unit"] == "km/h"
        assert data["visibility_unit"] == "km"
        assert isinstance(data["temperature"], (int, float))
        assert 0 <= data["humidity_pct"] <= 100
        assert data["pressure_mb"] > 800
        assert "observation_time" in data

    def test_get_current_weather_imperial_conversion(self, client: TestClient):
        """Verify fetching current weather with imperial units returns °F, mph, and miles."""
        response = client.get("/api/v1/weather/current?city=New York&units=imperial")
        assert response.status_code == 200
        data = response.json()

        assert data["location"]["city"] == "New York"
        assert data["unit"] == "°F"
        assert data["wind_unit"] == "mph"
        assert data["visibility_unit"] == "miles"
        # 22°C converts to ~71.6°F
        assert data["temperature"] > 50.0

    @pytest.mark.parametrize("city_name,expected_code", [
        ("London", "GB"),
        ("New York", "US"),
        ("Tokyo", "JP"),
        ("Paris", "FR"),
        ("Dubai", "AE"),
        ("Singapore", "SG"),
        ("Sydney", "AU"),
        ("Frankfurt", "DE"),
    ])
    def test_get_current_weather_all_supported_cities(self, client: TestClient, city_name: str, expected_code: str):
        """Parametrized verification of all international hub cities in the registry."""
        response = client.get(f"/api/v1/weather/current?city={city_name}")
        assert response.status_code == 200
        data = response.json()
        assert data["location"]["city"] == city_name
        assert data["location"]["country_code"] == expected_code
        assert data["condition"] is not None

    def test_get_weather_forecast_5_days_structure(self, client: TestClient):
        """Verify default 5-day forecast structure, sequence, and temperature bounds."""
        response = client.get("/api/v1/weather/forecast?city=Paris")
        assert response.status_code == 200
        data = response.json()

        assert data["location"]["city"] == "Paris"
        assert data["forecast_days"] == 5
        forecast_list = data["forecast"]
        assert len(forecast_list) == 5

        # Check each forecast day
        dates = [day["date"] for day in forecast_list]
        assert len(set(dates)) == 5, "Forecast dates must be distinct"
        assert sorted(dates) == dates, "Forecast dates must be chronological"

        for day in forecast_list:
            assert day["max_temp"] >= day["min_temp"]
            assert 0 <= day["chance_of_rain_pct"] <= 100
            assert day["max_wind_speed"] >= 0

    def test_get_weather_forecast_custom_days_range(self, client: TestClient):
        """Verify requesting custom day count (3 days) returns exactly 3 days."""
        response = client.get("/api/v1/weather/forecast?city=Tokyo&days=3")
        assert response.status_code == 200
        data = response.json()
        assert data["forecast_days"] == 3
        assert len(data["forecast"]) == 3

    def test_get_active_weather_alerts(self, client: TestClient):
        """Verify retrieval of active meteorological hazard alerts."""
        response = client.get("/api/v1/weather/alerts")
        assert response.status_code == 200
        alerts = response.json()
        assert isinstance(alerts, list)
        assert len(alerts) >= 2, "Expected at least 2 active alerts from seed data"

        severities = {a["severity"] for a in alerts}
        assert "EXTREME" in severities or "SEVERE" in severities

    def test_filter_weather_alerts_by_city(self, client: TestClient):
        """Verify alert filtering by city returns Tokyo's severe typhoon warning."""
        response = client.get("/api/v1/weather/alerts?city=Tokyo")
        assert response.status_code == 200
        alerts = response.json()
        assert len(alerts) >= 1
        tokyo_alert = alerts[0]
        assert tokyo_alert["city"] == "Tokyo"
        assert tokyo_alert["severity"] == "EXTREME"
        assert "Typhoon" in tokyo_alert["event"]

    def test_ingest_weather_observation_authorized(
        self, client: TestClient, valid_api_headers: dict, sample_weather_observation: dict
    ):
        """Verify station telemetry ingestion with valid X-API-Key returns 201 Created."""
        response = client.post(
            "/api/v1/weather/observations",
            json=sample_weather_observation,
            headers=valid_api_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["status"] == "SUCCESS"
        assert "record_id" in data
        assert isinstance(data["record_id"], int)

    def test_response_headers_timing_and_content_type(self, client: TestClient):
        """Verify standard security and performance headers are present on responses."""
        response = client.get("/api/v1/weather/current?city=London")
        assert response.status_code == 200
        assert "application/json" in response.headers.get("content-type", "")
        assert "x-response-time-ms" in response.headers
        timing = float(response.headers["x-response-time-ms"])
        assert timing >= 0.0, "Response time must be non-negative"
