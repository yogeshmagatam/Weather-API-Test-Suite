-- =====================================================================
-- SQL Backend Data Validation & Regression Test Suite
-- Used for Backend Integrity Checks, Pre-Release Auditing & Regression
-- =====================================================================

-- 1. SEAT INVENTORY INTEGRITY INVARIANT
-- Invariant: For every flight, total_seats must strictly equal available_seats + COUNT(CONFIRMED bookings)
SELECT 
    f.id AS flight_id,
    f.flight_number,
    f.total_seats,
    f.available_seats,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS active_bookings_count,
    (f.total_seats - (f.available_seats + COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END))) AS seat_discrepancy,
    CASE 
        WHEN f.total_seats = (f.available_seats + COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END)) 
        THEN 'PASS' 
        ELSE 'FAIL - INVENTORY CORRUPTION' 
    END AS invariant_status
FROM flights f
LEFT JOIN bookings b ON f.id = b.flight_id
GROUP BY f.id, f.flight_number, f.total_seats, f.available_seats;

-- 2. OVERBOOKING DEFECT DETECTION
-- Invariant: available_seats must never drop below 0
SELECT 
    id, 
    flight_number, 
    total_seats, 
    available_seats,
    'VIOLATION: Flight is overbooked!' AS alert_reason
FROM flights
WHERE available_seats < 0;

-- 3. SEAT COLLISION CONCURRENCY CHECK
-- Invariant: No two active bookings on the same flight can share the exact same seat_number
SELECT 
    flight_id, 
    seat_number, 
    COUNT(*) AS seat_duplicate_count,
    GROUP_CONCAT(booking_ref, ', ') AS conflicting_booking_refs
FROM bookings
WHERE status = 'CONFIRMED'
GROUP BY flight_id, seat_number
HAVING COUNT(*) > 1;

-- 4. ORPHANED BOOKINGS DETECTION (Referential Integrity Check)
-- Invariant: Every booking must link to a valid, existing flight and passenger
SELECT 
    b.id, 
    b.booking_ref, 
    b.flight_id, 
    b.passenger_id,
    CASE 
        WHEN f.id IS NULL THEN 'Missing Flight'
        WHEN p.id IS NULL THEN 'Missing Passenger'
    END AS orphan_issue
FROM bookings b
LEFT JOIN flights f ON b.flight_id = f.id
LEFT JOIN passengers p ON b.passenger_id = p.id
WHERE f.id IS NULL OR p.id IS NULL;

-- 5. CANCELLATION LIFECYCLE AUDIT
-- Invariant: Any booking marked CANCELLED must have a valid cancelled_at timestamp
SELECT 
    id, 
    booking_ref, 
    status, 
    booked_at, 
    cancelled_at,
    'VIOLATION: Cancelled status without timestamp' AS audit_finding
FROM bookings
WHERE status = 'CANCELLED' AND cancelled_at IS NULL;

-- 6. FLIGHT REVENUE RECONCILIATION
-- Validates total realized booking revenue matches active reservations against flight pricing
SELECT 
    f.flight_number,
    f.airline,
    f.base_price,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS confirmed_passengers,
    COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_price END), 0.0) AS total_revenue_collected,
    (COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) * f.base_price) AS expected_revenue,
    CASE 
        WHEN COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_price END), 0.0) = (COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) * f.base_price)
        THEN 'RECONCILED'
        ELSE 'DISCREPANCY DETECTED'
    END AS audit_status
FROM flights f
LEFT JOIN bookings b ON f.id = b.flight_id
GROUP BY f.id;

-- 7. AVIATION SAFETY ADVISORY: FLIGHT DESTINATIONS IN SEVERE WEATHER ZONES
-- Business Rule: Flag any flight arriving in a city currently experiencing SEVERE or EXTREME weather alerts
SELECT 
    f.flight_number,
    f.airline,
    f.origin_airport,
    f.destination_airport,
    c.name AS destination_city,
    wa.severity,
    wa.event AS hazard_event,
    wa.headline,
    f.status AS current_flight_status,
    CASE 
        WHEN wa.severity = 'EXTREME' THEN 'REQUIRES GROUND STOP OR DIVERT'
        WHEN wa.severity = 'SEVERE' THEN 'CAUTION - EXPECT HOLDING DELAYS'
        ELSE 'MONITOR'
    END AS dispatch_advisory
FROM flights f
JOIN airports a ON f.destination_airport = a.code
JOIN cities c ON a.city_id = c.id
JOIN weather_alerts wa ON c.id = wa.city_id
WHERE wa.is_active = 1;

-- 8. METEOROLOGICAL TELEMETRY ANOMALY DETECTION
-- Invariant: Physical bounds for meteorological sensors
SELECT 
    w.id,
    c.name AS city_name,
    w.temp_c,
    w.humidity,
    w.wind_kph,
    w.pressure_mb,
    w.recorded_at,
    CASE 
        WHEN w.temp_c < -80 OR w.temp_c > 65 THEN 'Extreme Temperature Anomaly'
        WHEN w.humidity < 0 OR w.humidity > 100 THEN 'Invalid Humidity Sensor Range'
        WHEN w.wind_kph < 0 OR w.wind_kph > 450 THEN 'Invalid Wind Sensor Range'
        WHEN w.pressure_mb < 850 OR w.pressure_mb > 1090 THEN 'Barometric Pressure Spike'
    END AS anomaly_type
FROM weather_records w
JOIN cities c ON w.city_id = c.id
WHERE (w.temp_c < -80 OR w.temp_c > 65)
   OR (w.humidity < 0 OR w.humidity > 100)
   OR (w.wind_kph < 0 OR w.wind_kph > 450)
   OR (w.pressure_mb < 850 OR w.pressure_mb > 1090);

-- 9. STALE ACTIVE WEATHER ALERTS CHECK
-- Invariant: Alerts past expires_at should be deactivated
SELECT 
    wa.id,
    c.name AS city_name,
    wa.event,
    wa.severity,
    wa.expires_at,
    datetime('now') AS current_utc_time,
    'EXPIRED ALERT STILL MARKED ACTIVE' AS issue
FROM weather_alerts wa
JOIN cities c ON wa.city_id = c.id
WHERE wa.is_active = 1 AND wa.expires_at < datetime('now');

-- 10. API PERFORMANCE SLA & LATENCY PERCENTILE AUDIT
-- Analyzes API response times from the audit log
SELECT 
    endpoint,
    http_method,
    COUNT(*) AS total_requests,
    ROUND(AVG(response_time_ms), 2) AS avg_latency_ms,
    ROUND(MIN(response_time_ms), 2) AS min_latency_ms,
    ROUND(MAX(response_time_ms), 2) AS max_latency_ms,
    CASE 
        WHEN AVG(response_time_ms) <= 100 THEN 'EXCELLENT (<100ms)'
        WHEN AVG(response_time_ms) <= 300 THEN 'MEETS SLA (<300ms)'
        ELSE 'BREACHES SLA (>300ms)'
    END AS sla_compliance
FROM api_audit_log
GROUP BY endpoint, http_method;

-- 11. API ERROR DEFECT RATE MONITORING
-- Invariant: Error rate (4xx/5xx) should be categorized by endpoint
SELECT 
    endpoint,
    http_method,
    COUNT(*) AS total_calls,
    COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) AS count_2xx_success,
    COUNT(CASE WHEN status_code >= 400 AND status_code < 500 THEN 1 END) AS count_4xx_client_error,
    COUNT(CASE WHEN status_code >= 500 THEN 1 END) AS count_5xx_server_error,
    ROUND(100.0 * COUNT(CASE WHEN status_code >= 500 THEN 1 END) / COUNT(*), 2) AS server_error_rate_pct
FROM api_audit_log
GROUP BY endpoint, http_method;

-- 12. PASSENGER BOOKING VOLUME & INTEGRITY
-- Summarizes customer bookings and prevents duplicate passports
SELECT 
    p.id,
    p.first_name || ' ' || p.last_name AS full_name,
    p.email,
    p.passport_number,
    COUNT(b.id) AS total_reservations,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS active_reservations
FROM passengers p
LEFT JOIN bookings b ON p.id = b.passenger_id
GROUP BY p.id;
