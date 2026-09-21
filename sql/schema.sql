-- Relational Database Schema for Weather & Flight-Booking System
-- SQLite 3.x Compatible Schema with Foreign Key Constraints

PRAGMA foreign_keys = ON;

-- 1. Cities table: Reference data for weather stations & flight destinations
CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    country VARCHAR(100) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    latitude REAL NOT NULL CHECK (latitude BETWEEN -90.0 AND 90.0),
    longitude REAL NOT NULL CHECK (longitude BETWEEN -180.0 AND 180.0),
    timezone VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Weather Records table: Current and historical meteorological telemetry
CREATE TABLE IF NOT EXISTS weather_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    city_id INTEGER NOT NULL,
    temp_c REAL NOT NULL,
    temp_f REAL NOT NULL,
    feels_like_c REAL NOT NULL,
    humidity INTEGER NOT NULL CHECK (humidity BETWEEN 0 AND 100),
    wind_kph REAL NOT NULL CHECK (wind_kph >= 0.0),
    wind_direction VARCHAR(10) NOT NULL,
    pressure_mb REAL NOT NULL,
    visibility_km REAL NOT NULL CHECK (visibility_km >= 0.0),
    condition VARCHAR(50) NOT NULL,
    condition_code INTEGER NOT NULL,
    uv_index REAL NOT NULL CHECK (uv_index >= 0.0),
    air_quality_index INTEGER CHECK (air_quality_index BETWEEN 1 AND 500),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE CASCADE
);

-- 3. Weather Alerts: Meteorological warnings (typhoons, blizzards, storms)
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

-- 4. Airports: International flight hubs
CREATE TABLE IF NOT EXISTS airports (
    code VARCHAR(3) PRIMARY KEY, -- IATA Code (e.g. LHR, JFK)
    name VARCHAR(150) NOT NULL,
    city_id INTEGER NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    timezone VARCHAR(50) NOT NULL,
    FOREIGN KEY (city_id) REFERENCES cities (id) ON DELETE RESTRICT
);

-- 5. Flights: Scheduled commercial flights
CREATE TABLE IF NOT EXISTS flights (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    flight_number VARCHAR(10) NOT NULL UNIQUE,
    airline VARCHAR(100) NOT NULL,
    origin_airport VARCHAR(3) NOT NULL,
    destination_airport VARCHAR(3) NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    base_price REAL NOT NULL CHECK (base_price > 0.0),
    total_seats INTEGER NOT NULL CHECK (total_seats > 0),
    available_seats INTEGER NOT NULL CHECK (available_seats >= 0 AND available_seats <= total_seats),
    status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ON_TIME', 'DELAYED', 'CANCELLED', 'BOARDING', 'ARRIVED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (origin_airport) REFERENCES airports (code),
    FOREIGN KEY (destination_airport) REFERENCES airports (code)
);

-- 6. Passengers: Customer records
CREATE TABLE IF NOT EXISTS passengers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    passport_number VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(30),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Bookings: Flight reservations
CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    booking_ref VARCHAR(12) NOT NULL UNIQUE, -- e.g. BK-7F9A2B
    flight_id INTEGER NOT NULL,
    passenger_id INTEGER NOT NULL,
    seat_number VARCHAR(5) NOT NULL,
    status VARCHAR(20) DEFAULT 'CONFIRMED' CHECK (status IN ('CONFIRMED', 'CANCELLED', 'CHECKED_IN')),
    total_price REAL NOT NULL CHECK (total_price > 0.0),
    booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP NULL,
    FOREIGN KEY (flight_id) REFERENCES flights (id) ON DELETE RESTRICT,
    FOREIGN KEY (passenger_id) REFERENCES passengers (id) ON DELETE RESTRICT,
    UNIQUE(flight_id, seat_number, status) -- Prevent duplicate active seats on same flight
);

-- 8. API Audit Logs: Tracks incoming HTTP requests, response latencies, and status codes
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

-- Indexes for high-performance lookups
CREATE INDEX IF NOT EXISTS idx_weather_city ON weather_records (city_id);
CREATE INDEX IF NOT EXISTS idx_weather_recorded_at ON weather_records (recorded_at);
CREATE INDEX IF NOT EXISTS idx_flights_route ON flights (origin_airport, destination_airport);
CREATE INDEX IF NOT EXISTS idx_flights_departure ON flights (departure_time);
CREATE INDEX IF NOT EXISTS idx_bookings_ref ON bookings (booking_ref);
CREATE INDEX IF NOT EXISTS idx_bookings_flight ON bookings (flight_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON api_audit_log (created_at);
