import datetime
from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text, CheckConstraint
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
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    weather_records = relationship("WeatherRecord", back_populates="city", cascade="all, delete-orphan")
    alerts = relationship("WeatherAlert", back_populates="city", cascade="all, delete-orphan")


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
    city_id = Column(Integer, ForeignKey("cities.id", ondelete="CASCADE"), nullable=False, index=True)
    event = Column(String(100), nullable=False)
    severity = Column(String(20), nullable=False)  # LOW, MODERATE, SEVERE, EXTREME
    headline = Column(Text, nullable=False)
    description = Column(Text, nullable=False)
    instructions = Column(Text, nullable=True)
    effective_from = Column(DateTime, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    is_active = Column(Integer, default=1, index=True)

    city = relationship("City", back_populates="alerts")


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
