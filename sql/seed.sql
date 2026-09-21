-- Seed Data for Weather API & Meteorological Telemetry Suite

-- 1. Insert Reference Meteorological Station Cities
INSERT OR REPLACE INTO cities (id, name, country, country_code, latitude, longitude, timezone, is_active) VALUES
(1, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 'Europe/London', 1),
(2, 'New York', 'United States', 'US', 40.7128, -74.0060, 'America/New_York', 1),
(3, 'Tokyo', 'Japan', 'JP', 35.6762, 139.6503, 'Asia/Tokyo', 1),
(4, 'Paris', 'France', 'FR', 48.8566, 2.3522, 'Europe/Paris', 1),
(5, 'Dubai', 'United Arab Emirates', 'AE', 25.2048, 55.2708, 'Asia/Dubai', 1),
(6, 'Singapore', 'Singapore', 'SG', 1.3521, 103.8198, 'Asia/Singapore', 1),
(7, 'Sydney', 'Australia', 'AU', -33.8688, 151.2093, 'Australia/Sydney', 1),
(8, 'Frankfurt', 'Germany', 'DE', 50.1109, 8.6821, 'Europe/Berlin', 1),
(9, 'Mumbai', 'India', 'IN', 19.0760, 72.8777, 'Asia/Kolkata', 1),
(10, 'Toronto', 'Canada', 'CA', 43.6532, -79.3832, 'America/Toronto', 1);

-- 2. Insert Weather Records (Current and Multi-Hour Telemetry)
DELETE FROM weather_records;
INSERT INTO weather_records (id, city_id, temp_c, temp_f, feels_like_c, humidity, wind_kph, wind_direction, pressure_mb, visibility_km, condition, condition_code, uv_index, air_quality_index, recorded_at) VALUES
(1, 1, 16.5, 61.7, 15.8, 72, 18.5, 'SW', 1014.2, 10.0, 'Partly Cloudy', 1003, 3.2, 28, datetime('now', '-5 minutes')),
(2, 1, 15.8, 60.4, 15.0, 75, 20.0, 'SW', 1013.8, 9.5, 'Overcast', 1006, 2.8, 30, datetime('now', '-1 hour')),
(3, 2, 22.0, 71.6, 21.5, 55, 12.0, 'NW', 1018.5, 10.0, 'Sunny', 1000, 6.5, 42, datetime('now', '-10 minutes')),
(4, 2, 20.5, 68.9, 20.0, 58, 14.0, 'NW', 1018.0, 10.0, 'Clear', 1000, 5.0, 45, datetime('now', '-2 hours')),
(5, 3, 27.5, 81.5, 30.2, 88, 55.0, 'E', 992.0, 4.0, 'Severe Tropical Storm', 1276, 1.0, 15, datetime('now', '-8 minutes')),
(6, 4, 19.0, 66.2, 18.5, 60, 10.5, 'W', 1016.0, 10.0, 'Clear', 1000, 4.5, 35, datetime('now', '-15 minutes')),
(7, 5, 38.5, 101.3, 44.0, 40, 15.0, 'NE', 1008.0, 8.0, 'Extreme Heat', 1000, 9.8, 85, datetime('now', '-12 minutes')),
(8, 6, 31.0, 87.8, 37.0, 82, 8.0, 'S', 1010.5, 7.0, 'Thunderstorms', 1087, 5.0, 40, datetime('now', '-6 minutes')),
(9, 7, 18.0, 64.4, 17.5, 65, 22.0, 'SE', 1021.0, 10.0, 'Mild Breezy', 1003, 4.0, 20, datetime('now', '-20 minutes')),
(10, 8, 17.2, 63.0, 16.5, 68, 14.0, 'WNW', 1015.5, 10.0, 'Scattered Clouds', 1003, 3.5, 32, datetime('now', '-14 minutes')),
(11, 9, 32.0, 89.6, 38.0, 78, 11.0, 'SW', 1007.0, 5.0, 'Haze & Humid', 1135, 7.0, 155, datetime('now', '-4 minutes')),
(12, 10, 14.0, 57.2, 13.0, 62, 18.0, 'N', 1019.0, 10.0, 'Breezy & Cool', 1003, 3.0, 22, datetime('now', '-18 minutes'));

-- 3. Insert Active Severe Weather Alerts
DELETE FROM weather_alerts;
INSERT INTO weather_alerts (id, city_id, event, severity, headline, description, instructions, effective_from, expires_at, is_active) VALUES
(1, 3, 'Typhoon Warning (Category 3)', 'EXTREME', 'Super Typhoon Shanshan Approaching Greater Tokyo Area', 
 'Sustained winds exceeding 120 km/h with heavy torrential rainfall. High risk of localized flooding and coastal surges.', 
 'Remain indoors. Secure loose objects. Avoid coastal and riverfront areas.', 
 datetime('now', '-2 hours'), datetime('now', '+24 hours'), 1),
(2, 5, 'Excessive Heat Advisory', 'SEVERE', 'Dangerous Heat Index Exceeding 48°C', 
 'High humidity combined with surface temperatures reaching 43°C creating dangerous heat exhaustion conditions.', 
 'Limit direct sunlight exposure between 11:00 and 16:00. Hydration mandatory.', 
 datetime('now', '-1 hour'), datetime('now', '+18 hours'), 1),
(3, 9, 'Air Quality Health Alert (Unhealthy)', 'MODERATE', 'Elevated Particulate Matter (PM2.5) Detected', 
 'Surface stagnation has led to AQI exceeding 150 across central monitoring stations.', 
 'Sensitive groups and individuals with respiratory conditions should wear N95 filtration masks outdoors.', 
 datetime('now', '-3 hours'), datetime('now', '+12 hours'), 1);

-- 4. Insert Baseline API Audit Logs
DELETE FROM api_audit_log;
INSERT INTO api_audit_log (id, client_ip, http_method, endpoint, status_code, response_time_ms, user_agent) VALUES
(1, '127.0.0.1', 'GET', '/api/v1/weather/current?city=London', 200, 18.4, 'PostmanRuntime/7.42.0'),
(2, '127.0.0.1', 'GET', '/api/v1/weather/forecast?city=Paris&days=5', 200, 24.6, 'PostmanRuntime/7.42.0'),
(3, '127.0.0.1', 'GET', '/api/v1/weather/alerts?city=Tokyo', 200, 15.2, 'PostmanRuntime/7.42.0'),
(4, '127.0.0.1', 'POST', '/api/v1/weather/observations', 201, 38.5, 'PostmanRuntime/7.42.0'),
(5, '127.0.0.1', 'GET', '/api/v1/weather/current?city=NonExistentCity', 404, 12.2, 'python-requests/2.32.5');
