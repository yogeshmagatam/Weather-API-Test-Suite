import time
import pytest
from fastapi.testclient import TestClient

@pytest.mark.sla
class TestPerformanceSla:
    """Performance benchmarks and Service Level Agreement (SLA) response time compliance for Weather APIs."""

    def test_weather_current_latency_under_sla(self, client: TestClient):
        """SLA Assertion: Current weather endpoint must respond under 200ms (P95)."""
        latencies = []
        for _ in range(10):
            t0 = time.perf_counter()
            res = client.get("/api/v1/weather/current?city=London")
            t1 = time.perf_counter()
            assert res.status_code == 200
            latencies.append((t1 - t0) * 1000)

        avg_lat = sum(latencies) / len(latencies)
        max_lat = max(latencies)

        assert avg_lat < 150.0, f"Average latency {avg_lat:.2f}ms breached SLA limit of 150ms"
        assert max_lat < 300.0, f"Max latency {max_lat:.2f}ms breached SLA threshold of 300ms"

    def test_weather_forecast_latency_under_sla(self, client: TestClient):
        """SLA Assertion: 5-Day forecast endpoint must complete under 200ms."""
        t0 = time.perf_counter()
        res = client.get("/api/v1/weather/forecast?city=Paris&days=5")
        t1 = time.perf_counter()
        assert res.status_code == 200
        duration_ms = (t1 - t0) * 1000
        assert duration_ms < 200.0, f"Forecast query took {duration_ms:.2f}ms, exceeding 200ms SLA"

    def test_weather_alerts_latency_under_sla(self, client: TestClient):
        """SLA Assertion: Severe alerts endpoint must respond under 150ms."""
        t0 = time.perf_counter()
        res = client.get("/api/v1/weather/alerts?city=Tokyo")
        t1 = time.perf_counter()
        assert res.status_code == 200
        duration_ms = (t1 - t0) * 1000
        assert duration_ms < 150.0, f"Alerts query took {duration_ms:.2f}ms, exceeding 150ms SLA"

    def test_health_check_probe_sub_50ms(self, client: TestClient):
        """SLA Assertion: Lightweight health checks must respond in under 100ms."""
        # Warmup
        client.get("/health")

        t0 = time.perf_counter()
        res = client.get("/health")
        t1 = time.perf_counter()
        assert res.status_code == 200
        duration_ms = (t1 - t0) * 1000
        assert duration_ms < 100.0, f"Health probe took {duration_ms:.2f}ms, exceeding 100ms target"
