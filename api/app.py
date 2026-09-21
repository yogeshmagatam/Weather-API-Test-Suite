import time
from datetime import datetime
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from api.config import settings
from api.database import SessionLocal, engine, Base
from api.models import ApiAuditLog
from api.routers import weather, flights, bookings, system

# Ensure database tables exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="""
## Weather & Flight-Booking Enterprise REST API

A mission-critical REST API platform interconnecting real-time meteorological observations with aviation flight scheduling, seat inventory management, and weather hazard dispatch advisories.

### Key Capabilities:
* **Meteorological Intelligence**: Real-time telemetry, 5-day projections, active hazard alerts, and weather station ingestion.
* **Commercial Flight Booking**: Multi-hub routing, atomic seat reservations, concurrency safety, and full cancellation lifecycle.
* **Aviation Weather Advisory**: Integrated flight safety routing evaluating destination weather alerts (CLEARED, CAUTION, DELAYED, GROUNDED).
* **Backend SQL Auditing**: Real-time request logging, latency SLAs, and relational data integrity.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Enable CORS for local testing and Web Portal access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Middleware: Real-time Request Timing & SQL Audit Logging
# -------------------------------------------------------------
@app.middleware("http")
async def audit_logging_middleware(request: Request, call_next):
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 2)

    # Attach response time header
    response.headers["X-Response-Time-Ms"] = str(duration_ms)

    # Log to SQLite audit table (exclude static docs/openapi to keep logs clean)
    path = request.url.path
    if not any(path.startswith(p) for p in ["/docs", "/redoc", "/openapi.json", "/favicon.ico"]):
        try:
            db = SessionLocal()
            client_ip = request.client.host if request.client else "127.0.0.1"
            query_str = f"?{request.url.query}" if request.url.query else ""
            log_entry = ApiAuditLog(
                client_ip=client_ip,
                http_method=request.method,
                endpoint=f"{path}{query_str}"[:255],
                status_code=response.status_code,
                response_time_ms=duration_ms,
                user_agent=request.headers.get("user-agent", "Unknown")[:255]
            )
            db.add(log_entry)
            db.commit()
            db.close()
        except Exception:
            # Audit log failures must never break the main API request
            pass

    return response

# -------------------------------------------------------------
# Standardized Error Handlers (RFC 7807 Compliance)
# -------------------------------------------------------------
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = []
    for err in exc.errors():
        field_loc = " -> ".join([str(loc) for loc in err.get("loc", []) if loc != "body"])
        details.append({
            "field": field_loc or "body",
            "message": err.get("msg", "Validation error")
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status_code": 422,
            "error": "UNPROCESSABLE_ENTITY",
            "message": "Input validation failed for request payload or parameters",
            "details": details,
            "timestamp": datetime.utcnow().isoformat()
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "status_code": exc.status_code,
                "error": exc.detail.get("error", "HTTP_ERROR"),
                "message": exc.detail.get("message", str(exc.detail)),
                "details": exc.detail.get("details", None),
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status_code": exc.status_code,
            "error": "HTTP_ERROR",
            "message": str(exc.detail),
            "timestamp": datetime.utcnow().isoformat()
        }
    )

# -------------------------------------------------------------
# Mount Routers
# -------------------------------------------------------------
app.include_router(weather.router, prefix=settings.API_V1_PREFIX)
app.include_router(flights.router, prefix=settings.API_V1_PREFIX)
app.include_router(bookings.router, prefix=settings.API_V1_PREFIX)
app.include_router(system.router, prefix=settings.API_V1_PREFIX)

@app.get("/health", tags=["System & Diagnostics"])
def root_health():
    """Root level health check probe."""
    return {"status": "UP", "service": settings.PROJECT_NAME, "version": settings.VERSION}
