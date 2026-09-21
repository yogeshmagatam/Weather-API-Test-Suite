from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

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
# Weather Request & Response Schemas
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

class HistoricalWeatherRecord(BaseModel):
    id: int
    temp_c: float
    temp_f: float
    humidity: int
    wind_kph: float
    pressure_mb: float
    condition: str
    air_quality_index: Optional[int]
    recorded_at: datetime

class HistoricalWeatherResponse(BaseModel):
    location: LocationInfo
    total_records: int
    records: List[HistoricalWeatherRecord]

class AirQualityResponse(BaseModel):
    location: LocationInfo
    aqi: int
    category: str
    health_advisory: str
    recorded_at: datetime

class CityCreateRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, example="Reykjavik")
    country: str = Field(..., min_length=2, max_length=100, example="Iceland")
    country_code: str = Field(..., min_length=2, max_length=3, example="IS")
    latitude: float = Field(..., ge=-90.0, le=90.0, example=64.1466)
    longitude: float = Field(..., ge=-180.0, le=180.0, example=-21.9426)
    timezone: str = Field(..., min_length=2, max_length=50, example="Atlantic/Reykjavik")

class CityResponse(BaseModel):
    id: int
    name: str
    country: str
    country_code: str
    latitude: float
    longitude: float
    timezone: str
    created_at: datetime

class WeatherStatsResponse(BaseModel):
    city: str
    country: str
    min_temp_c: float
    max_temp_c: float
    avg_temp_c: float
    avg_humidity_pct: float
    avg_wind_kph: float
    total_observations_analyzed: int

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
    database_size_bytes: int
    uptime_seconds: float
