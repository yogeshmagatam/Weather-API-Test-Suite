from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, Header, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from api.database import get_db
from api.config import settings
from api.models import City, WeatherRecord, WeatherAlert
from api.schemas import (
    WeatherCurrentResponse,
    WeatherForecastResponse,
    WeatherAlertResponse,
    HistoricalWeatherResponse,
    HistoricalWeatherRecord,
    AirQualityResponse,
    WeatherStatsResponse,
    CityCreateRequest,
    CityResponse,
    WeatherObservationCreate,
    LocationInfo,
    ForecastDay,
    ErrorResponse
)

router = APIRouter(prefix="/weather", tags=["Weather Operations"])

def verify_api_key(x_api_key: Optional[str] = Header(None, alias="X-API-Key")) -> str:
    """Security Dependency: Validates X-API-Key header for telemetry ingestion."""
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"error": "UNAUTHORIZED", "message": "Missing required 'X-API-Key' header"}
        )
    if x_api_key not in settings.VALID_API_KEYS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"error": "FORBIDDEN", "message": "Invalid or expired API Key"}
        )
    return x_api_key

@router.get("/current", response_model=WeatherCurrentResponse, responses={
    400: {"model": ErrorResponse, "description": "Invalid query parameters"},
    404: {"model": ErrorResponse, "description": "City not found in registry"}
})
def get_current_weather(
    city: str = Query(..., min_length=1, max_length=100, description="City name (e.g. London, Tokyo)"),
    units: str = Query("metric", regex="^(metric|imperial)$", description="Unit system: metric (°C, km/h) or imperial (°F, mph)"),
    db: Session = Depends(get_db)
):
    """Retrieve the latest real-time weather telemetry for a target city."""
    city_clean = city.strip()
    if not city_clean:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "BAD_REQUEST", "message": "City parameter cannot be empty or whitespace"}
        )

    # Parameterized ORM lookup protecting against SQL injection
    city_record = db.query(City).filter(func.lower(City.name) == city_clean.lower()).first()
    if not city_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CITY_NOT_FOUND", "message": f"City '{city_clean}' was not found in the weather telemetry network."}
        )

    latest = db.query(WeatherRecord).filter(
        WeatherRecord.city_id == city_record.id
    ).order_by(WeatherRecord.recorded_at.desc()).first()

    if not latest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "NO_TELEMETRY", "message": f"No weather observations recorded for {city_record.name}."}
        )

    is_imperial = (units.lower() == "imperial")
    temp = latest.temp_f if is_imperial else latest.temp_c
    feels = round((latest.feels_like_c * 9/5 + 32) if is_imperial else latest.feels_like_c, 1)
    wind_speed = round((latest.wind_kph * 0.621371) if is_imperial else latest.wind_kph, 1)
    visibility = round((latest.visibility_km * 0.621371) if is_imperial else latest.visibility_km, 1)

    return WeatherCurrentResponse(
        location=LocationInfo(
            city=city_record.name,
            country=city_record.country,
            country_code=city_record.country_code,
            latitude=city_record.latitude,
            longitude=city_record.longitude,
            timezone=city_record.timezone
        ),
        temperature=round(temp, 1),
        unit="°F" if is_imperial else "°C",
        feels_like=feels,
        humidity_pct=latest.humidity,
        wind_speed=wind_speed,
        wind_unit="mph" if is_imperial else "km/h",
        wind_direction=latest.wind_direction,
        pressure_mb=latest.pressure_mb,
        visibility=visibility,
        visibility_unit="miles" if is_imperial else "km",
        condition=latest.condition,
        condition_code=latest.condition_code,
        uv_index=latest.uv_index,
        air_quality_index=latest.air_quality_index,
        observation_time=latest.recorded_at
    )

@router.get("/forecast", response_model=WeatherForecastResponse, responses={
    400: {"model": ErrorResponse, "description": "Invalid parameters"},
    404: {"model": ErrorResponse, "description": "City not found"}
})
def get_weather_forecast(
    city: str = Query(..., min_length=1, description="City name"),
    days: int = Query(5, description="Forecast projection range in days (1 to 7)"),
    units: str = Query("metric", regex="^(metric|imperial)$"),
    db: Session = Depends(get_db)
):
    """Retrieve multi-day forecast projections for meteorological analysis."""
    if days < 1 or days > 7:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "INVALID_DAYS_RANGE", "message": "Forecast days parameter must be between 1 and 7"}
        )

    city_clean = city.strip()
    city_record = db.query(City).filter(func.lower(City.name) == city_clean.lower()).first()
    if not city_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CITY_NOT_FOUND", "message": f"City '{city_clean}' not found."}
        )

    latest = db.query(WeatherRecord).filter(
        WeatherRecord.city_id == city_record.id
    ).order_by(WeatherRecord.recorded_at.desc()).first()

    base_temp = latest.temp_c if latest else 20.0
    is_imperial = (units.lower() == "imperial")

    forecast_days: List[ForecastDay] = []
    base_date = datetime.utcnow().date()

    condition_cycles = [
        ("Sunny", 1000, 10),
        ("Partly Cloudy", 1003, 20),
        ("Scattered Showers", 1063, 60),
        ("Clear Sky", 1000, 5),
        ("Moderate Rain", 1189, 75),
        ("Overcast", 1006, 30),
        ("Breezy", 1003, 15)
    ]

    for i in range(days):
        forecast_date = base_date + timedelta(days=i + 1)
        temp_delta = ((i * 3) % 7) - 3.0
        day_temp = base_temp + temp_delta
        cond_name, cond_code, rain_pct = condition_cycles[i % len(condition_cycles)]

        max_t = day_temp + 4.0
        min_t = day_temp - 4.5
        wind = round(12.0 + (i * 2.5), 1)

        if is_imperial:
            max_t = max_t * 9/5 + 32
            min_t = min_t * 9/5 + 32
            day_temp = day_temp * 9/5 + 32
            wind = wind * 0.621371

        forecast_days.append(ForecastDay(
            date=forecast_date.isoformat(),
            max_temp=round(max_t, 1),
            min_temp=round(min_t, 1),
            avg_temp=round(day_temp, 1),
            condition=cond_name,
            condition_code=cond_code,
            chance_of_rain_pct=rain_pct,
            max_wind_speed=round(wind, 1),
            uv_index=round(4.0 + (i * 0.5) % 4, 1)
        ))

    return WeatherForecastResponse(
        location=LocationInfo(
            city=city_record.name,
            country=city_record.country,
            country_code=city_record.country_code,
            latitude=city_record.latitude,
            longitude=city_record.longitude,
            timezone=city_record.timezone
        ),
        unit="°F" if is_imperial else "°C",
        forecast_days=days,
        forecast=forecast_days
    )

@router.get("/alerts", response_model=List[WeatherAlertResponse])
def get_weather_alerts(
    city: Optional[str] = Query(None, description="Filter by city name"),
    severity: Optional[str] = Query(None, regex="^(LOW|MODERATE|SEVERE|EXTREME)$", description="Filter by severity level"),
    db: Session = Depends(get_db)
):
    """Retrieve active meteorological hazards and severe weather alerts."""
    query = db.query(WeatherAlert).join(City).filter(WeatherAlert.is_active == 1)

    if city:
        city_clean = city.strip()
        query = query.filter(func.lower(City.name) == city_clean.lower())

    if severity:
        query = query.filter(WeatherAlert.severity == severity.upper())

    alerts = query.all()
    results = []
    for a in alerts:
        results.append(WeatherAlertResponse(
            id=a.id,
            city=a.city.name,
            event=a.event,
            severity=a.severity,
            headline=a.headline,
            description=a.description,
            instructions=a.instructions,
            effective_from=a.effective_from,
            expires_at=a.expires_at,
            is_active=bool(a.is_active)
        ))
    return results

@router.get("/historical", response_model=HistoricalWeatherResponse, responses={
    404: {"model": ErrorResponse, "description": "City not found"}
})
def get_historical_weather(
    city: str = Query(..., min_length=1, description="City name"),
    db: Session = Depends(get_db)
):
    """Retrieve historical meteorological telemetry logs for a target city."""
    city_record = db.query(City).filter(func.lower(City.name) == city.strip().lower()).first()
    if not city_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "CITY_NOT_FOUND", "message": f"City '{city}' not found in registry."}
        )

    records = db.query(WeatherRecord).filter(
        WeatherRecord.city_id == city_record.id
    ).order_by(WeatherRecord.recorded_at.desc()).all()

    record_items = [
        HistoricalWeatherRecord(
            id=r.id,
            temp_c=r.temp_c,
            temp_f=r.temp_f,
            humidity=r.humidity,
            wind_kph=r.wind_kph,
            pressure_mb=r.pressure_mb,
            condition=r.condition,
            air_quality_index=r.air_quality_index,
            recorded_at=r.recorded_at
        )
        for r in records
    ]

    return HistoricalWeatherResponse(
        location=LocationInfo(
            city=city_record.name,
            country=city_record.country,
            country_code=city_record.country_code,
            latitude=city_record.latitude,
            longitude=city_record.longitude,
            timezone=city_record.timezone
        ),
        total_records=len(record_items),
        records=record_items
    )

@router.get("/air-quality", response_model=AirQualityResponse, responses={
    404: {"model": ErrorResponse, "description": "City or AQI telemetry not found"}
})
def get_air_quality(
    city: str = Query(..., min_length=1, description="City name"),
    db: Session = Depends(get_db)
):
    """Retrieve real-time Air Quality Index (AQI) and health advisory."""
    city_record = db.query(City).filter(func.lower(City.name) == city.strip().lower()).first()
    if not city_record:
        raise HTTPException(status_code=404, detail={"error": "CITY_NOT_FOUND", "message": f"City '{city}' not found."})

    latest = db.query(WeatherRecord).filter(WeatherRecord.city_id == city_record.id).order_by(WeatherRecord.recorded_at.desc()).first()
    if not latest or latest.air_quality_index is None:
        raise HTTPException(status_code=404, detail={"error": "NO_AQI_DATA", "message": f"No AQI telemetry available for {city}."})

    aqi = latest.air_quality_index
    if aqi <= 50:
        cat = "Good"
        adv = "Air quality is satisfactory, and air pollution poses little or no risk."
    elif aqi <= 100:
        cat = "Moderate"
        adv = "Air quality is acceptable. Unusually sensitive individuals should consider limiting prolonged outdoor exertion."
    elif aqi <= 150:
        cat = "Unhealthy for Sensitive Groups"
        adv = "Members of sensitive groups may experience health effects. General public is less likely to be affected."
    elif aqi <= 200:
        cat = "Unhealthy"
        adv = "Everyone may begin to experience health effects. Wear N95 filtration masks for outdoor activities."
    else:
        cat = "Hazardous"
        adv = "Health warning of emergency conditions. The entire population is more likely to be affected."

    return AirQualityResponse(
        location=LocationInfo(
            city=city_record.name,
            country=city_record.country,
            country_code=city_record.country_code,
            latitude=city_record.latitude,
            longitude=city_record.longitude,
            timezone=city_record.timezone
        ),
        aqi=aqi,
        category=cat,
        health_advisory=adv,
        recorded_at=latest.recorded_at
    )

@router.get("/stats", response_model=WeatherStatsResponse, responses={
    404: {"model": ErrorResponse, "description": "City not found"}
})
def get_weather_stats(
    city: str = Query(..., min_length=1, description="City name"),
    db: Session = Depends(get_db)
):
    """Calculate aggregated statistical meteorological extremes for a target city."""
    city_record = db.query(City).filter(func.lower(City.name) == city.strip().lower()).first()
    if not city_record:
        raise HTTPException(status_code=404, detail={"error": "CITY_NOT_FOUND", "message": f"City '{city}' not found."})

    stats = db.query(
        func.min(WeatherRecord.temp_c),
        func.max(WeatherRecord.temp_c),
        func.avg(WeatherRecord.temp_c),
        func.avg(WeatherRecord.humidity),
        func.avg(WeatherRecord.wind_kph),
        func.count(WeatherRecord.id)
    ).filter(WeatherRecord.city_id == city_record.id).first()

    if not stats or stats[5] == 0:
        raise HTTPException(status_code=404, detail={"error": "NO_TELEMETRY", "message": f"No telemetry records for {city}."})

    return WeatherStatsResponse(
        city=city_record.name,
        country=city_record.country,
        min_temp_c=round(stats[0], 1),
        max_temp_c=round(stats[1], 1),
        avg_temp_c=round(stats[2], 1),
        avg_humidity_pct=round(stats[3], 1),
        avg_wind_kph=round(stats[4], 1),
        total_observations_analyzed=stats[5]
    )

@router.get("/cities", response_model=List[CityResponse])
def list_weather_station_cities(db: Session = Depends(get_db)):
    """Retrieve catalog of all registered meteorological monitoring station cities."""
    cities = db.query(City).filter(City.is_active == 1).order_by(City.name.asc()).all()
    return [
        CityResponse(
            id=c.id,
            name=c.name,
            country=c.country,
            country_code=c.country_code,
            latitude=c.latitude,
            longitude=c.longitude,
            timezone=c.timezone,
            created_at=c.created_at
        )
        for c in cities
    ]

@router.post("/cities", status_code=status.HTTP_201_CREATED, response_model=CityResponse, responses={
    409: {"model": ErrorResponse, "description": "City station already registered"}
})
def register_weather_city(
    payload: CityCreateRequest,
    db: Session = Depends(get_db)
):
    """Register a new physical weather station location in the network."""
    existing = db.query(City).filter(func.lower(City.name) == payload.name.strip().lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"error": "CITY_ALREADY_EXISTS", "message": f"Station '{payload.name}' is already registered."}
        )

    new_city = City(
        name=payload.name.strip(),
        country=payload.country.strip(),
        country_code=payload.country_code.strip().upper(),
        latitude=payload.latitude,
        longitude=payload.longitude,
        timezone=payload.timezone.strip(),
        is_active=1
    )
    db.add(new_city)
    db.commit()
    db.refresh(new_city)

    return CityResponse(
        id=new_city.id,
        name=new_city.name,
        country=new_city.country,
        country_code=new_city.country_code,
        latitude=new_city.latitude,
        longitude=new_city.longitude,
        timezone=new_city.timezone,
        created_at=new_city.created_at
    )

@router.post("/observations", status_code=status.HTTP_201_CREATED, response_model=dict, responses={
    401: {"model": ErrorResponse, "description": "Missing API Key"},
    403: {"model": ErrorResponse, "description": "Invalid API Key"},
    404: {"model": ErrorResponse, "description": "Target city station not recognized"}
})
def ingest_weather_observation(
    observation: WeatherObservationCreate,
    api_key: str = Depends(verify_api_key),
    db: Session = Depends(get_db)
):
    """Ingest new sensor telemetry from automated weather stations (requires API Key)."""
    city_record = db.query(City).filter(func.lower(City.name) == observation.city_name.strip().lower()).first()
    if not city_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"error": "UNKNOWN_STATION", "message": f"City station '{observation.city_name}' does not exist in registry."}
        )

    temp_f = round(observation.temp_c * 9/5 + 32, 2)
    feels_c = observation.temp_c - 0.5

    new_record = WeatherRecord(
        city_id=city_record.id,
        temp_c=observation.temp_c,
        temp_f=temp_f,
        feels_like_c=feels_c,
        humidity=observation.humidity,
        wind_kph=observation.wind_kph,
        wind_direction=observation.wind_direction.upper(),
        pressure_mb=observation.pressure_mb,
        visibility_km=observation.visibility_km,
        condition=observation.condition,
        condition_code=observation.condition_code,
        uv_index=observation.uv_index,
        air_quality_index=observation.air_quality_index,
        recorded_at=datetime.utcnow()
    )
    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return {
        "status": "SUCCESS",
        "message": f"Observation ingested successfully for station {city_record.name}",
        "record_id": new_record.id,
        "recorded_at": new_record.recorded_at.isoformat()
    }
