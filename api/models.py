import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, CheckConstraint, UniqueConstraint
)
from sqlalchemy.orm import relationship
from api.database import Base

class City(Base):
    __tablename__ = "cities"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    country = Column(String(100), nullable=False)
    country_code = Column(String(3), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone = Column(String(50), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    weather_records = relationship("WeatherRecord", back_populates="city", cascade="all, delete-orphan")
    alerts = relationship("WeatherAlert", back_populates="city", cascade="all, delete-orphan")
    airports = relationship("Airport", back_populates="city")


class WeatherRecord(Base):
    __tablename__ = "weather_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    temp_c = Column(Float, nullable=False)
    temp_f = Column(Float, nullable=False)
    feels_like_c = Column(Float, nullable=False)
    humidity = Column(Integer, nullable=False)
    wind_kph = Column(Float, nullable=False)
    wind_direction = Column(String(10), nullable=False)
    pressure_mb = Column(Float, nullable=False)
    visibility_km = Column(Float, nullable=False)
    condition = Column(String(50), nullable=False)
    condition_code = Column(Integer, nullable=False)
    uv_index = Column(Float, nullable=False)
    air_quality_index = Column(Integer, nullable=True)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    city = relationship("City", back_populates="weather_records")


class WeatherAlert(Base):
    __tablename__ = "weather_alerts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False)
    event = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # LOW, MODERATE, SEVERE, EXTREME
    headline = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    effective_from = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Integer, default=1)

    city = relationship("City", back_populates="alerts")


class Airport(Base):
    __tablename__ = "airports"

    code = Column(String(3), primary_key=True, index=True)  # IATA
    name = Column(String(150), nullable=False)
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="RESTRICT"), nullable=False)
    country = Column(String(100), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timezone = Column(String(50), nullable=False)

    city = relationship("City", back_populates="airports")
    departing_flights = relationship("Flight", foreign_keys="Flight.origin_airport", back_populates="origin")
    arriving_flights = relationship("Flight", foreign_keys="Flight.destination_airport", back_populates="destination")


class Flight(Base):
    __tablename__ = "flights"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    flight_number = Column(String(10), unique=True, nullable=False, index=True)
    airline = Column(String(100), nullable=False)
    origin_airport = Column(String(3), ForeignKey("airports.code"), nullable=False)
    destination_airport = Column(String(3), ForeignKey("airports.code"), nullable=False)
    departure_time = Column(DateTime, nullable=False, index=True)
    arrival_time = Column(DateTime, nullable=False)
    base_price = Column(Float, nullable=False)
    total_seats = Column(Integer, nullable=False)
    available_seats = Column(Integer, nullable=False)
    status = Column(String(20), default="SCHEDULED")  # SCHEDULED, ON_TIME, DELAYED, CANCELLED, BOARDING, ARRIVED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    origin = relationship("Airport", foreign_keys=[origin_airport], back_populates="departing_flights")
    destination = relationship("Airport", foreign_keys=[destination_airport], back_populates="arriving_flights")
    bookings = relationship("Booking", back_populates="flight")


class Passenger(Base):
    __tablename__ = "passengers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    passport_number = Column(String(20), unique=True, nullable=False)
    phone = Column(String(30), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    bookings = relationship("Booking", back_populates="passenger")


class Booking(Base):
    __tablename__ = "bookings"
    __table_args__ = (
        UniqueConstraint("flight_id", "seat_number", "status", name="uq_flight_seat_active"),
    )

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_ref = Column(String(12), unique=True, nullable=False, index=True)
    flight_id = Column(Integer, ForeignKey("flights.id", ondelete="RESTRICT"), nullable=False, index=True)
    passenger_id = Column(Integer, ForeignKey("passengers.id", ondelete="RESTRICT"), nullable=False)
    seat_number = Column(String(5), nullable=False)
    status = Column(String(20), default="CONFIRMED")  # CONFIRMED, CANCELLED, CHECKED_IN
    total_price = Column(Float, nullable=False)
    booked_at = Column(DateTime, default=datetime.datetime.utcnow)
    cancelled_at = Column(DateTime, nullable=True)

    flight = relationship("Flight", back_populates="bookings")
    passenger = relationship("Passenger", back_populates="bookings")


class ApiAuditLog(Base):
    __tablename__ = "api_audit_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    client_ip = Column(String(50), nullable=True)
    http_method = Column(String(10), nullable=False)
    endpoint = Column(String(255), nullable=False)
    status_code = Column(Integer, nullable=False)
    response_time_ms = Column(Float, nullable=False)
    user_agent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
