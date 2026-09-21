import pytest
from fastapi.testclient import TestClient

@pytest.mark.flight
@pytest.mark.negative
class TestFlightBookingNegative:
    """Negative and boundary test scenarios for Flight search, Booking validation, and Concurrency collisions."""

    def test_search_flights_identical_origin_destination(self, client: TestClient):
        """Verify searching flights with origin == destination returns 400 Bad Request."""
        response = client.get("/api/v1/flights/search?origin=LHR&destination=LHR")
        assert response.status_code == 400
        data = response.json()
        assert data["error"] == "INVALID_ROUTE"

    def test_search_flights_invalid_iata_format(self, client: TestClient):
        """Verify invalid IATA code (e.g. 4 letters 'LHRA' or numbers '123') returns 400."""
        res1 = client.get("/api/v1/flights/search?origin=LHRA&destination=JFK")
        assert res1.status_code == 400
        assert res1.json()["error"] == "INVALID_IATA_CODE"

        res2 = client.get("/api/v1/flights/search?origin=123&destination=JFK")
        assert res2.status_code == 400

    def test_search_flights_unregistered_airport(self, client: TestClient):
        """Verify querying airport not registered in network returns 404."""
        response = client.get("/api/v1/flights/search?origin=ZZZ&destination=JFK")
        assert response.status_code == 404
        assert response.json()["error"] == "AIRPORT_NOT_FOUND"

    def test_search_flights_invalid_date_format(self, client: TestClient):
        """Verify date not adhering to YYYY-MM-DD returns 400."""
        response = client.get("/api/v1/flights/search?origin=LHR&destination=JFK&date=15-10-2026")
        assert response.status_code == 400
        assert response.json()["error"] == "INVALID_DATE_FORMAT"

    def test_create_booking_duplicate_seat_collision(self, client: TestClient):
        """Verify booking an already confirmed seat on the same flight triggers 409 Conflict."""
        # Flight 1, seat 12A is already booked in seed data by Alex Morgan
        collision_payload = {
            "flight_id": 1,
            "seat_number": "12A",
            "passenger": {
                "first_name": "Test",
                "last_name": "Colliding",
                "email": "colliding.passenger@testqa.com",
                "passport_number": "US112233445"
            }
        }
        response = client.post("/api/v1/bookings", json=collision_payload)
        assert response.status_code == 409
        data = response.json()
        assert data["error"] == "SEAT_ALREADY_RESERVED"
        assert "already reserved" in data["message"]

    def test_create_booking_nonexistent_flight(self, client: TestClient):
        """Verify booking for non-existent flight ID returns 404."""
        payload = {
            "flight_id": 99999,
            "seat_number": "10A",
            "passenger": {
                "first_name": "Ghost",
                "last_name": "Rider",
                "email": "ghost@qa.com",
                "passport_number": "GH999888111"
            }
        }
        response = client.post("/api/v1/bookings", json=payload)
        assert response.status_code == 404
        assert response.json()["error"] == "FLIGHT_NOT_FOUND"

    def test_create_booking_invalid_email_format(self, client: TestClient):
        """Verify Pydantic email validation rejects invalid email with 422."""
        payload = {
            "flight_id": 1,
            "seat_number": "10B",
            "passenger": {
                "first_name": "Bad",
                "last_name": "Email",
                "email": "this_is_not_an_email",
                "passport_number": "GB889900112"
            }
        }
        response = client.post("/api/v1/bookings", json=payload)
        assert response.status_code == 422

    def test_create_booking_invalid_seat_syntax(self, client: TestClient):
        """Verify seat number syntax validator (must be e.g. 14C) rejects malformed seat strings with 422."""
        payload = {
            "flight_id": 1,
            "seat_number": "NO_ROW_OR_AISLE",
            "passenger": {
                "first_name": "Bad",
                "last_name": "Seat",
                "email": "badseat@qa.com",
                "passport_number": "US778899001"
            }
        }
        response = client.post("/api/v1/bookings", json=payload)
        assert response.status_code == 422

    def test_get_booking_nonexistent_ref(self, client: TestClient):
        """Verify querying unknown booking ref returns 404."""
        response = client.get("/api/v1/bookings/BK-NONEXIST99")
        assert response.status_code == 404
        assert response.json()["error"] == "BOOKING_NOT_FOUND"

    def test_cancel_already_cancelled_booking(self, client: TestClient, sample_passenger_payload: dict):
        """Verify idempotency/guard: Cancelling a reservation twice returns 400 Bad Request."""
        # Create a fresh booking
        payload = sample_passenger_payload.copy()
        payload["seat_number"] = "25F"
        res = client.post("/api/v1/bookings", json=payload)
        ref = res.json()["booking_ref"]

        # Cancel 1st time -> Success 200
        c1 = client.delete(f"/api/v1/bookings/{ref}")
        assert c1.status_code == 200

        # Cancel 2nd time -> 400 Bad Request
        c2 = client.delete(f"/api/v1/bookings/{ref}")
        assert c2.status_code == 400
        assert c2.json()["error"] == "BOOKING_ALREADY_CANCELLED"

    def test_modify_seat_on_cancelled_booking(self, client: TestClient, sample_passenger_payload: dict):
        """Verify modifying seat on a cancelled reservation is prohibited with 400."""
        payload = sample_passenger_payload.copy()
        payload["seat_number"] = "28A"
        res = client.post("/api/v1/bookings", json=payload)
        ref = res.json()["booking_ref"]

        client.delete(f"/api/v1/bookings/{ref}")

        patch_res = client.patch(f"/api/v1/bookings/{ref}/seat", json={"new_seat_number": "28B"})
        assert patch_res.status_code == 400
        assert patch_res.json()["error"] == "CANNOT_MODIFY_CANCELLED_BOOKING"
