-- Relational Database Schema for Weather API & Meteorological Telemetry
-- SQLite 3.x Compatible Schema with Foreign Key Constraints

PRAGMA foreign_keys = ON;

-- 1. Cities table: Reference data for global meteorological weather stations
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    latitude REAL NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude REAL NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    timezone VARCHAR(50) NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Weather Records table: Real-time and historical sensor telemetry
CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id INTEGER NOT NULL,
    temp_c REAL NOT NULL CHECK (temp_c BETWEEN -80.0 AND 65.0),
    temp_f REAL NOT NULL,
    feels_like_c REAL NOT NULL,
    humidity INTEGER NOT NULL CHECK (humidity BETWEEN 0 AND 100),
    wind_kph REAL NOT NULL CHECK (wind_kph >= 0.0 AND wind_kph <= 450.0),
    wind_direction VARCHAR(10) NOT NULL,
    pressure_mb REAL NOT NULL CHECK (pressure_mb BETWEEN 850.0 AND 1090.0),
    visibility_km REAL NOT NULL CHECK (visibility_km >= 0.0 AND visibility_km <= 100.0),
    condition VARCHAR(50) NOT NULL,
    condition_code INTEGER NOT NULL,
    uv_index REAL NOT NULL CHECK (uv_index >= 0.0 AND uv_index <= 20.0),
    air_quality_index INTEGER CHECK (air_quality_index BETWEEN 1 AND 500),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE
);

-- 3. Weather Alerts: Active meteorological warnings (typhoons, blizzards, heatwaves)
CREATE TABLE IF NOT EXISTS weather_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id INTEGER NOT NULL,
    event VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MODERATE', 'SEVERE', 'EXTREME')),
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    instructions TEXT,
    effective_from TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1)),
    FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE
);

-- 4. API Audit Logs: Tracks incoming HTTP requests, response latencies, and status codes
CREATE TABLE IF NOT EXISTS api_audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_ip VARCHAR(50),
    http_method VARCHAR(10) NOT NULL,
    endpoint VARCHAR(255) NOT NULL,
    status_code INTEGER NOT NULL,
    response_time_ms REAL NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance & query optimization
CREATE INDEX IF NOT EXISTS idx_weather_city ON weather_records (city_id);
CREATE INDEX IF NOT EXISTS idx_weather_recorded_at ON weather_records (recorded_at);
CREATE INDEX IF NOT EXISTS idx_alerts_active ON weather_alerts (is_active, city_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON api_audit_log (created_at);
CREATE INDEX IF NOT EXISTS idx_cities_name ON cities (name);
