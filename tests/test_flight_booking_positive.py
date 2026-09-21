import pytest
from fastapi.testclient import TestClient

@pytest.mark.flight
@pytest.mark.positive
class TestFlightBookingPositive:
    """Positive test scenarios validating Flight search, Booking lifecycle, and Weather Advisory integration."""

    def test_search_flights_valid_route(self, client: TestClient):
        """Verify searching flights from London Heathrow (LHR) to New York (JFK)."""
        response = client.get("/api/v1/flights/search?origin=LHR&destination=JFK")
        assert response.status_code == 200
        data = response.json()

        assert data["origin"] == "LHR"
        assert data["destination"] == "JFK"
        assert data["total_matches"] >= 1
        flight = data["flights"][0]
        assert flight["flight_number"] == "BA-178"
        assert flight["airline"] == "British Airways"
        assert flight["base_price"] > 0
        assert flight["available_seats"] > 0

    def test_get_flight_by_id(self, client: TestClient):
        """Verify retrieving single flight schedule by ID."""
        response = client.get("/api/v1/flights/1")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == 1
        assert data["flight_number"] == "BA-178"
        assert data["origin_airport"] == "LHR"
        assert data["destination_airport"] == "JFK"

    def test_weather_advisory_extreme_destination_grounded(self, client: TestClient):
        """Verify destination weather integration: Flight BA-005 to HND (Tokyo) facing typhoon returns GROUNDED."""
        response = client.get("/api/v1/flights/7/weather-advisory")
        assert response.status_code == 200
        data = response.json()

        assert data["flight_id"] == 7
        assert data["destination"] == "HND"
        assert data["destination_city"] == "Tokyo"
        assert data["advisory_status"] == "GROUNDED"
        assert "Typhoon" in data["alerts"][0]["event"]
        assert "Visual approach suspended" in data["recommendation"]

    def test_weather_advisory_normal_destination_cleared(self, client: TestClient):
        """Verify flight to JFK with clear weather receives CLEARED advisory status."""
        response = client.get("/api/v1/flights/1/weather-advisory")
        assert response.status_code == 200
        data = response.json()

        assert data["flight_id"] == 1
        assert data["destination"] == "JFK"
        assert data["advisory_status"] == "CLEARED"
        assert data["dispatch_code"] == "DISPATCH-CLR-01"

    def test_end_to_end_booking_lifecycle(self, client: TestClient, sample_passenger_payload: dict):
        """Full lifecycle: Create booking -> Retrieve by Ref -> Modify Seat -> Cancel Booking."""
        # 1. Create booking
        create_res = client.post("/api/v1/bookings", json=sample_passenger_payload)
        assert create_res.status_code == 201
        booking_data = create_res.json()

        booking_ref = booking_data["booking_ref"]
        assert booking_ref.startswith("BK-")
        assert booking_data["seat_number"] == sample_passenger_payload["seat_number"]
        assert booking_data["status"] == "CONFIRMED"
        assert booking_data["passenger_name"] == "Daniel Craig"

        # 2. Retrieve booking by reference
        get_res = client.get(f"/api/v1/bookings/{booking_ref}")
        assert get_res.status_code == 200
        retrieved = get_res.json()
        assert retrieved["booking_ref"] == booking_ref
        assert retrieved["passenger_email"] == "daniel.craig@mi6-qa.gov.uk"

        # 3. Modify seat assignment
        patch_res = client.patch(f"/api/v1/bookings/{booking_ref}/seat", json={"new_seat_number": "22C"})
        assert patch_res.status_code == 200
        updated = patch_res.json()
        assert updated["seat_number"] == "22C"

        # 4. Cancel booking
        cancel_res = client.delete(f"/api/v1/bookings/{booking_ref}")
        assert cancel_res.status_code == 200
        cancelled = cancel_res.json()
        assert cancelled["status"] == "CANCELLED"
        assert cancelled["refund_amount"] > 0
        assert "cancelled_at" in cancelled
