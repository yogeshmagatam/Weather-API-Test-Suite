-- =====================================================================
-- SQL Backend Data Validation & Regression Test Suite (Weather Domain)
-- Used for Meteorological Integrity Checks, Pre-Release Auditing & Regression
-- =====================================================================

-- 1. SENSOR PHYSICAL BOUNDS ANOMALY DETECTION
-- Invariant: Physical bounds for meteorological sensors (Temperature, Humidity, Wind, Pressure)
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

-- 2. REFERENTIAL INTEGRITY & ORPHANED TELEMETRY DETECTION
-- Invariant: Every weather record and alert must link to an existing registered city
SELECT 
    w.id AS record_id,
    w.city_id,
    'Orphaned Weather Record' AS integrity_issue
FROM weather_records w
LEFT JOIN cities c ON w.city_id = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 
    a.id AS alert_id,
    a.city_id,
    'Orphaned Weather Alert' AS integrity_issue
FROM weather_alerts a
LEFT JOIN cities c ON a.city_id = c.id
WHERE c.id IS NULL;

-- 3. ACTIVE ALERTS EXPIRATION AUDIT
-- Invariant: Alerts past expires_at should not be active
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

-- 4. EXTREME & SEVERE METEOROLOGICAL HAZARDS SUMMARY
-- Highlights active high-impact events
SELECT 
    c.name AS city_name,
    c.country,
    wa.event AS hazard_event,
    wa.severity,
    wa.headline,
    wa.effective_from,
    wa.expires_at
FROM weather_alerts wa
JOIN cities c ON wa.city_id = c.id
WHERE wa.is_active = 1 AND wa.severity IN ('EXTREME', 'SEVERE');

-- 5. AIR QUALITY INDEX (AQI) POLLUTION CATEGORIZATION
-- Categorizes telemetry by WHO / EPA standards
SELECT 
    c.name AS city_name,
    w.air_quality_index AS aqi_value,
    CASE 
        WHEN w.air_quality_index <= 50 THEN 'Good (0-50)'
        WHEN w.air_quality_index <= 100 THEN 'Moderate (51-100)'
        WHEN w.air_quality_index <= 150 THEN 'Unhealthy for Sensitive Groups (101-150)'
        WHEN w.air_quality_index <= 200 THEN 'Unhealthy (151-200)'
        ELSE 'Hazardous (>200)'
    END AS aqi_category,
    w.recorded_at
FROM weather_records w
JOIN cities c ON w.city_id = c.id
ORDER BY w.air_quality_index DESC;

-- 6. TIMESTAMP CHRONOLOGY & FUTURE DATED ANOMALY CHECK
-- Invariant: Recorded timestamps must not be in the future
SELECT 
    w.id,
    c.name AS city_name,
    w.recorded_at,
    datetime('now') AS system_utc,
    'FUTURE DATED RECORD' AS issue
FROM weather_records w
JOIN cities c ON w.city_id = c.id
WHERE w.recorded_at > datetime('now', '+5 minutes');

-- 7. API AUDIT LOG LATENCY SLA AUDIT
-- Analyzes API response times by endpoint
SELECT 
    endpoint,
    http_method,
    COUNT(*) AS total_requests,
    ROUND(AVG(response_time_ms), 2) AS avg_latency_ms,
    ROUND(MIN(response_time_ms), 2) AS min_latency_ms,
    ROUND(MAX(response_time_ms), 2) AS max_latency_ms,
    CASE 
        WHEN AVG(response_time_ms) <= 100 THEN 'EXCELLENT (<100ms)'
        WHEN AVG(response_time_ms) <= 250 THEN 'MEETS SLA (<250ms)'
        ELSE 'BREACHES SLA (>250ms)'
    END AS sla_compliance
FROM api_audit_log
GROUP BY endpoint, http_method;

-- 8. API ERROR DEFECT RATE MONITORING
-- Invariant: Categorizes 2xx vs 4xx vs 5xx calls
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

-- 9. METEOROLOGICAL STATIONS SUMMARY & LATEST OBSERVATIONS
-- Aggregates station telemetry
SELECT 
    c.id AS station_id,
    c.name AS station_name,
    c.country,
    c.latitude,
    c.longitude,
    COUNT(w.id) AS total_observations_logged,
    MAX(w.recorded_at) AS latest_observation_time
FROM cities c
LEFT JOIN weather_records w ON c.id = w.city_id
GROUP BY c.id;
