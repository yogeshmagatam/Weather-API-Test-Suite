import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Path, status
from sqlalchemy.orm import Session
from api.database import get_db
from api.models import Flight, Passenger, Booking
from api.schemas import (
    BookingCreateRequest,
    BookingResponse,
    SeatUpdateRequest,
    BookingCancelResponse,
    FlightResponse,
    ErrorResponse
)

router = APIRouter(prefix="/bookings", tags=["Booking Operations"])

def generate_booking_ref() -> str:
    """Generate professional alphanumeric booking reference (e.g. BK-7F9A2B)."""
    uid = uuid.uuid4().hex[:6].upper()
    return f"BK-{uid}"

@router.post("", status_code=status.HTTP_201_CREATED, response_model=BookingResponse, responses={
    400: {"model": ErrorResponse, "description": "Flight sold out or invalid status"},
    404: {"model": ErrorResponse, "description": "Flight not found"},
    409: {"model": ErrorResponse, "description": "Seat already reserved on this flight"}
})
def create_booking(
    payload: BookingCreateRequest,
    db: Session = Depends(get_db)
):
    """Create a guaranteed commercial flight booking with atomic seat reservation."""
    # 1. Fetch flight
    flight = db.query(Flight).filter(Flight.id == payload.flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "FLIGHT_NOT_FOUND", "message": f"Flight ID {payload.flight_id} does not exist"}
        )

    # 2. Check flight operating status
    if flight.status in ("CANCELLED", "ARRIVED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "FLIGHT_NOT_BOOKABLE", "message": f"Cannot book flight with status '{flight.status}'"}
        )

    # 3. Check seat inventory availability
    if flight.available_seats <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "FLIGHT_SOLD_OUT", "message": f"Flight {flight.flight_number} has zero remaining seats"}
        )

    # 4. Check seat collision (409 Conflict)
    existing_seat = db.query(Booking).filter(
        Booking.flight_id == flight.id,
        Booking.seat_number == payload.seat_number,
        Booking.status == "CONFIRMED"
    ).first()

    if existing_seat:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "SEAT_ALREADY_RESERVED",
                "message": f"Seat '{payload.seat_number}' is already reserved on flight {flight.flight_number}"
            }
        )

    # 5. Upsert passenger record
    passenger = db.query(Passenger).filter(
        (Passenger.passport_number == payload.passenger.passport_number) |
        (Passenger.email == payload.passenger.email)
    ).first()

    if not passenger:
        passenger = Passenger(
            first_name=payload.passenger.first_name.strip(),
            last_name=payload.passenger.last_name.strip(),
            email=payload.passenger.email.strip().lower(),
            passport_number=payload.passenger.passport_number.strip().upper(),
            phone=payload.passenger.phone.strip() if payload.passenger.phone else None
        )
        db.add(passenger)
        db.flush()
    else:
        # Update existing passenger fields
        passenger.first_name = payload.passenger.first_name.strip()
        passenger.last_name = payload.passenger.last_name.strip()
        if payload.passenger.phone:
            passenger.phone = payload.passenger.phone.strip()

    # 6. Generate booking reference & save
    booking_ref = generate_booking_ref()
    new_booking = Booking(
        booking_ref=booking_ref,
        flight_id=flight.id,
        passenger_id=passenger.id,
        seat_number=payload.seat_number,
        status="CONFIRMED",
        total_price=flight.base_price,
        booked_at=datetime.utcnow()
    )
    db.add(new_booking)

    # 7. Atomic decrement of seat inventory
    flight.available_seats -= 1

    db.commit()
    db.refresh(new_booking)
    db.refresh(flight)

    return BookingResponse(
        booking_ref=new_booking.booking_ref,
        flight=FlightResponse(
            id=flight.id,
            flight_number=flight.flight_number,
            airline=flight.airline,
            origin_airport=flight.origin_airport,
            destination_airport=flight.destination_airport,
            departure_time=flight.departure_time,
            arrival_time=flight.arrival_time,
            base_price=flight.base_price,
            total_seats=flight.total_seats,
            available_seats=flight.available_seats,
            status=flight.status
        ),
        passenger_name=f"{passenger.first_name} {passenger.last_name}",
        passenger_email=passenger.email,
        passport_number=passenger.passport_number,
        seat_number=new_booking.seat_number,
        status=new_booking.status,
        total_price=new_booking.total_price,
        booked_at=new_booking.booked_at,
        cancelled_at=new_booking.cancelled_at
    )

@router.get("/{booking_ref}", response_model=BookingResponse, responses={
    404: {"model": ErrorResponse, "description": "Booking reference not found"}
})
def get_booking(
    booking_ref: str = Path(..., description="Booking reference code (e.g. BK-A7X921)"),
    db: Session = Depends(get_db)
):
    """Retrieve complete reservation details by booking reference code."""
    booking = db.query(Booking).filter(Booking.booking_ref == booking_ref.strip().upper()).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "BOOKING_NOT_FOUND", "message": f"Reservation with reference '{booking_ref}' was not found"}
        )

    flight = booking.flight
    passenger = booking.passenger

    return BookingResponse(
        booking_ref=booking.booking_ref,
        flight=FlightResponse(
            id=flight.id,
            flight_number=flight.flight_number,
            airline=flight.airline,
            origin_airport=flight.origin_airport,
            destination_airport=flight.destination_airport,
            departure_time=flight.departure_time,
            arrival_time=flight.arrival_time,
            base_price=flight.base_price,
            total_seats=flight.total_seats,
            available_seats=flight.available_seats,
            status=flight.status
        ),
        passenger_name=f"{passenger.first_name} {passenger.last_name}",
        passenger_email=passenger.email,
        passport_number=passenger.passport_number,
        seat_number=booking.seat_number,
        status=booking.status,
        total_price=booking.total_price,
        booked_at=booking.booked_at,
        cancelled_at=booking.cancelled_at
    )

@router.patch("/{booking_ref}/seat", response_model=BookingResponse, responses={
    400: {"model": ErrorResponse, "description": "Cannot modify cancelled booking"},
    404: {"model": ErrorResponse, "description": "Booking not found"},
    409: {"model": ErrorResponse, "description": "Seat already reserved"}
})
def update_booking_seat(
    booking_ref: str = Path(..., description="Booking reference"),
    payload: SeatUpdateRequest = ...,
    db: Session = Depends(get_db)
):
    """Modify seat assignment on an active confirmed flight reservation."""
    booking = db.query(Booking).filter(Booking.booking_ref == booking_ref.strip().upper()).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "BOOKING_NOT_FOUND", "message": f"Booking '{booking_ref}' not found"}
        )

    if booking.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "CANNOT_MODIFY_CANCELLED_BOOKING", "message": "Cannot modify seat on a cancelled booking"}
        )

    if booking.seat_number == payload.new_seat_number:
        # No change needed
        pass
    else:
        # Check collision on new seat
        collision = db.query(Booking).filter(
            Booking.flight_id == booking.flight_id,
            Booking.seat_number == payload.new_seat_number,
            Booking.status == "CONFIRMED"
        ).first()

        if collision:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={
                    "error": "SEAT_ALREADY_RESERVED",
                    "message": f"Requested seat '{payload.new_seat_number}' is already reserved by another passenger"
                }
            )
        booking.seat_number = payload.new_seat_number
        db.commit()
        db.refresh(booking)

    flight = booking.flight
    passenger = booking.passenger

    return BookingResponse(
        booking_ref=booking.booking_ref,
        flight=FlightResponse(
            id=flight.id,
            flight_number=flight.flight_number,
            airline=flight.airline,
            origin_airport=flight.origin_airport,
            destination_airport=flight.destination_airport,
            departure_time=flight.departure_time,
            arrival_time=flight.arrival_time,
            base_price=flight.base_price,
            total_seats=flight.total_seats,
            available_seats=flight.available_seats,
            status=flight.status
        ),
        passenger_name=f"{passenger.first_name} {passenger.last_name}",
        passenger_email=passenger.email,
        passport_number=passenger.passport_number,
        seat_number=booking.seat_number,
        status=booking.status,
        total_price=booking.total_price,
        booked_at=booking.booked_at,
        cancelled_at=booking.cancelled_at
    )

@router.delete("/{booking_ref}", response_model=BookingCancelResponse, responses={
    400: {"model": ErrorResponse, "description": "Booking already cancelled"},
    404: {"model": ErrorResponse, "description": "Booking reference not found"}
})
def cancel_booking(
    booking_ref: str = Path(..., description="Booking reference code"),
    db: Session = Depends(get_db)
):
    """Cancel a booking, release seat back to inventory, and issue full refund."""
    booking = db.query(Booking).filter(Booking.booking_ref == booking_ref.strip().upper()).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "BOOKING_NOT_FOUND", "message": f"Booking reference '{booking_ref}' was not found"}
        )

    if booking.status == "CANCELLED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "BOOKING_ALREADY_CANCELLED", "message": f"Booking '{booking_ref}' is already in CANCELLED status"}
        )

    # Transition status
    booking.status = "CANCELLED"
    booking.cancelled_at = datetime.utcnow()

    # Restore available seat in flight inventory
    flight = booking.flight
    if flight and flight.available_seats < flight.total_seats:
        flight.available_seats += 1

    db.commit()
    db.refresh(booking)

    return BookingCancelResponse(
        message="Flight reservation successfully cancelled",
        booking_ref=booking.booking_ref,
        status="CANCELLED",
        cancelled_at=booking.cancelled_at,
        refund_amount=booking.total_price
    )
