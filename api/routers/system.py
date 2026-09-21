import time
import os
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from api.database import get_db, get_raw_sqlite_connection, Base, engine
from api.config import settings
from api.models import City, Flight, Booking, ApiAuditLog
from api.schemas import HealthResponse, SystemMetricsResponse

router = APIRouter(prefix="/system", tags=["System & Diagnostics"])

START_TIME = time.time()

@router.get("/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """System health verification and database connectivity probe."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        db_ok = False

    return HealthResponse(
        status="UP" if db_ok else "DEGRADED",
        version=settings.VERSION,
        database_connected=db_ok,
        timestamp=datetime.utcnow()
    )

@router.get("/metrics", response_model=SystemMetricsResponse)
def get_system_metrics(db: Session = Depends(get_db)):
    """Telemetry metrics covering API usage, database scale, and response latencies."""
    total_reqs = db.query(ApiAuditLog).count()
    avg_latency = db.query(func_avg(ApiAuditLog.response_time_ms)).scalar() or 0.0

    total_cities = db.query(City).count()
    total_flights = db.query(Flight).count()
    total_active_bookings = db.query(Booking).filter(Booking.status == "CONFIRMED").count()

    db_size = 0
    if settings.DB_PATH.exists():
        db_size = os.path.getsize(settings.DB_PATH)

    uptime = round(time.time() - START_TIME, 1)

    return SystemMetricsResponse(
        total_api_requests=total_reqs,
        avg_response_time_ms=round(float(avg_latency), 2),
        total_cities_monitored=total_cities,
        total_flights_active=total_flights,
        total_active_bookings=total_active_bookings,
        database_size_bytes=db_size,
        uptime_seconds=uptime
    )

def func_avg(col):
    from sqlalchemy import func
    return func.avg(col)

@router.post("/execute-sql", response_model=Dict[str, Any])
def execute_readonly_sql(
    payload: Dict[str, str] = Body(..., example={"query": "SELECT * FROM flights LIMIT 5"})
):
    """Execute read-only SQL validation queries for QA auditing and data checks."""
    query_str = payload.get("query", "").strip()
    if not query_str:
        raise HTTPException(status_code=400, detail="Query string cannot be empty")

    forbidden_keywords = ["DROP", "DELETE", "UPDATE", "INSERT", "ALTER", "TRUNCATE", "REPLACE"]
    first_word = query_str.split()[0].upper() if query_str.split() else ""
    if first_word in forbidden_keywords:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Modification keyword '{first_word}' is forbidden in QA query console"
        )

    try:
        conn = get_raw_sqlite_connection()
        cursor = conn.cursor()
        cursor.execute(query_str)
        rows = cursor.fetchall()
        columns = [desc[0] for desc in cursor.description] if cursor.description else []
        data = [dict(zip(columns, row)) for row in rows]
        conn.close()

        return {
            "status": "SUCCESS",
            "columns": columns,
            "row_count": len(data),
            "rows": data
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "SQL_SYNTAX_ERROR", "message": str(e)}
        )

@router.post("/reset-db")
def reset_database():
    """Reset database to initial baseline schema and seed dataset."""
    try:
        from scripts.init_db import initialize_database
        initialize_database()
        return {"status": "SUCCESS", "message": "Database reset to clean baseline seed data"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset database: {str(e)}")
