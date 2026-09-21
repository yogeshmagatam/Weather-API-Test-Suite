from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field, EmailStr, field_validator
import re

# ==========================================
# Common & Standard Error Schemas (RFC 7807)
# ==========================================
class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str

class ErrorResponse(BaseModel):
    status_code: int = Field(..., example=400)
    error: str = Field(..., example="BAD_REQUEST")
    message: str = Field(..., example="Invalid city parameter provided")
    details: Optional[List[ErrorDetail]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

# ==========================================
# Weather Schemas
# ==========================================
class WeatherObservationCreate(BaseModel):
    city_name: str = Field(..., min_length=2, max_length=100, example="London")
    temp_c: float = Field(..., ge=-80.0, le=65.0, example=18.5)
    humidity: int = Field(..., ge=0, le=100, example=65)
    wind_kph: float = Field(..., ge=0.0, le=450.0, example=15.0)
    wind_direction: str = Field(..., min_length=1, max_length=5, example="SW")
    pressure_mb: float = Field(..., ge=850.0, le=1090.0, example=1013.25)
    visibility_km: float = Field(..., ge=0.0, le=100.0, example=10.0)
    condition: str = Field(..., min_length=2, max_length=50, example="Partly Cloudy")
    condition_code: int = Field(..., example=1003)
    uv_index: float = Field(..., ge=0.0, le=20.0, example=4.5)
    air_quality_index: Optional[int] = Field(None, ge=1, le=500, example=35)

class LocationInfo(BaseModel):
    city: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    timezone: str

class WeatherCurrentResponse(BaseModel):
    location: LocationInfo
    temperature: float
    unit: str
    feels_like: float
    humidity_pct: int
    wind_speed: float
    wind_unit: str
    wind_direction: str
    pressure_mb: float
    visibility: float
    visibility_unit: str
    condition: str
    condition_code: int
    uv_index: float
    air_quality_index: Optional[int]
    observation_time: datetime

class ForecastDay(BaseModel):
    date: str
    max_temp: float
    min_temp: float
    avg_temp: float
    condition: str
    condition_code: int
    chance_of_rain_pct: int
    max_wind_speed: float
    uv_index: float

class WeatherForecastResponse(BaseModel):
    location: LocationInfo
    unit: str
    forecast_days: int
    forecast: List[ForecastDay]

class WeatherAlertResponse(BaseModel):
    id: int
    city: str
    event: str
    severity: str
    headline: str
    description: str
    instructions: Optional[str]
    effective_from: datetime
    expires_at: datetime
    is_active: bool

# ==========================================
# Flight & Airport Schemas
# ==========================================
class AirportResponse(BaseModel):
    code: str
    name: str
    city: str
    country: str
    latitude: float
    longitude: float
    timezone: str

class FlightResponse(BaseModel):
    id: int
    flight_number: str
    airline: str
    origin_airport: str
    destination_airport: str
    departure_time: datetime
    arrival_time: datetime
    base_price: float
    total_seats: int
    available_seats: int
    status: str

class FlightSearchResponse(BaseModel):
    total_matches: int
    origin: str
    destination: str
    date: Optional[str]
    flights: List[FlightResponse]

class WeatherAdvisoryResponse(BaseModel):
    flight_id: int
    flight_number: str
    airline: str
    origin: str
    destination: str
    destination_city: str
    advisory_status: str  # CLEARED, CAUTION, DELAYED, GROUNDED
    dispatch_code: str
    current_destination_temp_c: float
    condition: str
    active_alerts_count: int
    alerts: List[Dict[str, Any]]
    recommendation: str

# ==========================================
# Booking & Passenger Schemas
# ==========================================
class PassengerCreate(BaseModel):
    first_name: str = Field(..., min_length=2, max_length=50, example="Alex")
    last_name: str = Field(..., min_length=2, max_length=50, example="Morgan")
    email: EmailStr = Field(..., example="alex.morgan@testqa.com")
    passport_number: str = Field(..., min_length=5, max_length=20, example="GB882910471")
    phone: Optional[str] = Field(None, example="+44 7700 900077")

    @field_validator("passport_number")
    @classmethod
    def validate_passport(cls, v: str) -> str:
        if not re.match(r"^[A-Z0-9]{5,20}$", v.upper()):
            raise ValueError("Passport number must contain only alphanumeric characters (5-20 characters)")
        return v.upper()

class BookingCreateRequest(BaseModel):
    flight_id: int = Field(..., gt=0, example=1)
    seat_number: str = Field(..., example="14C")
    passenger: PassengerCreate

    @field_validator("seat_number")
    @classmethod
    def validate_seat(cls, v: str) -> str:
        clean = v.strip().upper()
        if not re.match(r"^[0-9]{1,2}[A-K]$", clean):
            raise ValueError("Seat number must match format e.g. 14C, 02A, 31F")
        return clean

class BookingResponse(BaseModel):
    booking_ref: str
    flight: FlightResponse
    passenger_name: str
    passenger_email: str
    passport_number: str
    seat_number: str
    status: str
    total_price: float
    booked_at: datetime
    cancelled_at: Optional[datetime] = None

class SeatUpdateRequest(BaseModel):
    new_seat_number: str = Field(..., example="16F")

    @field_validator("new_seat_number")
    @classmethod
    def validate_seat(cls, v: str) -> str:
        clean = v.strip().upper()
        if not re.match(r"^[0-9]{1,2}[A-K]$", clean):
            raise ValueError("Seat number must match format e.g. 14C, 02A, 31F")
        return clean

class BookingCancelResponse(BaseModel):
    message: str
    booking_ref: str
    status: str
    cancelled_at: datetime
    refund_amount: float

# ==========================================
# System & Monitoring Schemas
# ==========================================
class HealthResponse(BaseModel):
    status: str
    version: str
    database_connected: bool
    timestamp: datetime

class SystemMetricsResponse(BaseModel):
    total_api_requests: int
    avg_response_time_ms: float
    total_cities_monitored: int
    total_flights_active: int
    total_active_bookings: int
    database_size_bytes: int
    uptime_seconds: float
