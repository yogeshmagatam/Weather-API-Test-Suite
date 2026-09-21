import re
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Path, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from api.database import get_db
from api.models import Flight, Airport, City, WeatherRecord, WeatherAlert
from api.schemas import (
    FlightResponse,
    FlightSearchResponse,
    WeatherAdvisoryResponse,
    ErrorResponse
)

router = APIRouter(prefix="/flights", tags=["Flight Operations"])

def validate_iata(code: str, param_name: str) -> str:
    """Validates 3-letter IATA airport code."""
    clean = code.strip().upper()
    if not re.match(r"^[A-Z]{3}$", clean):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_IATA_CODE", "message": f"{param_name} must be a valid 3-letter uppercase IATA code (e.g. LHR, JFK)"}
        )
    return clean

@router.get("/search", response_model=FlightSearchResponse, responses={
    400: {"model": ErrorResponse, "description": "Invalid route or IATA code"}
})
def search_flights(
    origin: str = Query(..., description="Origin airport 3-letter IATA code (e.g. LHR)"),
    destination: str = Query(..., description="Destination airport 3-letter IATA code (e.g. JFK)"),
    date: Optional[str] = Query(None, description="Departure date in YYYY-MM-DD format"),
    db: Session = Depends(get_db)
):
    """Search for scheduled commercial flights between hub airports."""
    origin_code = validate_iata(origin, "Origin airport")
    dest_code = validate_iata(destination, "Destination airport")

    if origin_code == dest_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_ROUTE", "message": "Origin and destination airports cannot be identical"}
        )

    # Verify airports exist
    origin_ap = db.query(Airport).filter(Airport.code == origin_code).first()
    dest_ap = db.query(Airport).filter(Airport.code == dest_code).first()
    if not origin_ap or not dest_ap:
        missing = origin_code if not origin_ap else dest_code
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "AIRPORT_NOT_FOUND", "message": f"Airport code '{missing}' is not registered in network."}
        )

    query = db.query(Flight).filter(
        Flight.origin_airport == origin_code,
        Flight.destination_airport == dest_code
    )

    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(Flight.departure_time) == target_date)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "INVALID_DATE_FORMAT", "message": "Date must be formatted as YYYY-MM-DD"}
            )

    flights = query.order_by(Flight.departure_time.asc()).all()

    flight_items = [
        FlightResponse(
            id=f.id,
            flight_number=f.flight_number,
            airline=f.airline,
            origin_airport=f.origin_airport,
            destination_airport=f.destination_airport,
            departure_time=f.departure_time,
            arrival_time=f.arrival_time,
            base_price=f.base_price,
            total_seats=f.total_seats,
            available_seats=f.available_seats,
            status=f.status
        )
        for f in flights
    ]

    return FlightSearchResponse(
        total_matches=len(flight_items),
        origin=origin_code,
        destination=dest_code,
        date=date,
        flights=flight_items
    )

@router.get("/{flight_id}", response_model=FlightResponse, responses={
    404: {"model": ErrorResponse, "description": "Flight not found"}
})
def get_flight_details(
    flight_id: int = Path(..., gt=0, description="Unique flight identifier"),
    db: Session = Depends(get_db)
):
    """Retrieve detailed schedule and real-time seat availability for a single flight."""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "FLIGHT_NOT_FOUND", "message": f"Flight with ID {flight_id} was not found"}
        )

    return FlightResponse(
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
    )

@router.get("/{flight_id}/weather-advisory", response_model=WeatherAdvisoryResponse, responses={
    404: {"model": ErrorResponse, "description": "Flight or airport telemetry not found"}
})
def get_flight_weather_advisory(
    flight_id: int = Path(..., gt=0, description="Flight ID to evaluate"),
    db: Session = Depends(get_db)
):
    """Evaluate destination meteorological hazards to generate aviation dispatch advisory."""
    flight = db.query(Flight).filter(Flight.id == flight_id).first()
    if not flight:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "FLIGHT_NOT_FOUND", "message": f"Flight ID {flight_id} not found."}
        )

    dest_airport = db.query(Airport).filter(Airport.code == flight.destination_airport).first()
    dest_city = db.query(City).filter(City.id == dest_airport.city_id).first()

    latest_weather = db.query(WeatherRecord).filter(
        WeatherRecord.city_id == dest_city.id
    ).order_by(WeatherRecord.recorded_at.desc()).first()

    active_alerts = db.query(WeatherAlert).filter(
        WeatherAlert.city_id == dest_city.id,
        WeatherAlert.is_active == 1
    ).all()

    # Aviation Advisory Evaluation Logic
    status_advisory = "CLEARED"
    dispatch_code = "DISPATCH-CLR-01"
    recommendation = "Standard flight dispatch authorized. Destination visibility and winds within normal operational limits."

    extreme_alerts = [a for a in active_alerts if a.severity == "EXTREME"]
    severe_alerts = [a for a in active_alerts if a.severity == "SEVERE"]

    if extreme_alerts:
        status_advisory = "GROUNDED"
        dispatch_code = "DISPATCH-GRD-99"
        recommendation = f"EMERGENCY: {extreme_alerts[0].event}. Visual approach suspended. Ground stop or divert mandatory."
    elif severe_alerts:
        status_advisory = "DELAYED"
        dispatch_code = "DISPATCH-DLY-40"
        recommendation = f"CAUTION: {severe_alerts[0].event}. Holding patterns in effect. Uplift contingency divert fuel."
    elif latest_weather and latest_weather.wind_kph > 40.0:
        status_advisory = "CAUTION"
        dispatch_code = "DISPATCH-CAU-15"
        recommendation = f"High crosswinds ({latest_weather.wind_kph} km/h) reported at {dest_airport.name}. Pre-brief go-around procedures."

    alert_dicts = [
        {
            "id": a.id,
            "event": a.event,
            "severity": a.severity,
            "headline": a.headline,
            "instructions": a.instructions
        }
        for a in active_alerts
    ]

    return WeatherAdvisoryResponse(
        flight_id=flight.id,
        flight_number=flight.flight_number,
        airline=flight.airline,
        origin=flight.origin_airport,
        destination=flight.destination_airport,
        destination_city=dest_city.name,
        advisory_status=status_advisory,
        dispatch_code=dispatch_code,
        current_destination_temp_c=latest_weather.temp_c if latest_weather else 20.0,
        condition=latest_weather.condition if latest_weather else "Clear",
        active_alerts_count=len(active_alerts),
        alerts=alert_dicts,
        recommendation=recommendation
    )
