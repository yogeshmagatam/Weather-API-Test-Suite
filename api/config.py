import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BASE_DIR / "weather_flight.db"

class Settings:
    PROJECT_NAME: str = "Weather & Flight-Booking API Test Suite"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH}")
    DB_PATH: Path = DEFAULT_DB_PATH
    
    # Security
    API_KEY_HEADER: str = "X-API-Key"
    VALID_API_KEYS: list[str] = [
        os.getenv("WEATHER_API_KEY", "test_api_key_secure_123"),
        "qa_automation_token_secret_456"
    ]
    
    # Rate Limiting
    RATE_LIMIT_ENABLED: bool = os.getenv("RATE_LIMIT_ENABLED", "false").lower() in ("true", "1")
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = int(os.getenv("RATE_LIMIT_RPM", "120"))
    
    # External Weather Proxy (optional live fallback)
    OPENWEATHER_API_KEY: str = os.getenv("OPENWEATHER_API_KEY", "")

settings = Settings()
