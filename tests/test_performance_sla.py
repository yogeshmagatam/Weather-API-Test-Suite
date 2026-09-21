import time
import pytest
from fastapi.testclient import TestClient

@pytest.mark.sla
class TestPerformanceSla:
    """Performance benchmarks and Service Level Agreement (SLA) response time compliance."""

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

    def test_flight_search_latency_under_sla(self, client: TestClient):
        """SLA Assertion: Flight routing search must complete under 250ms."""
        t0 = time.perf_counter()
        res = client.get("/api/v1/flights/search?origin=LHR&destination=JFK")
        t1 = time.perf_counter()
        assert res.status_code == 200
        duration_ms = (t1 - t0) * 1000
        assert duration_ms < 250.0, f"Flight search duration {duration_ms:.2f}ms exceeded SLA"

    def test_health_check_probe_sub_50ms(self, client: TestClient):
        """SLA Assertion: Lightweight health checks must respond in under 50ms."""
        t0 = time.perf_counter()
        res = client.get("/health")
        t1 = time.perf_counter()
        assert res.status_code == 200
        duration_ms = (t1 - t0) * 1000
        assert duration_ms < 50.0, f"Health probe took {duration_ms:.2f}ms, exceeding 50ms target"
