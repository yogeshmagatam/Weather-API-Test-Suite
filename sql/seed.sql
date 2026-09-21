-- Seed Data for Weather & Flight-Booking System

-- 1. Insert Reference Cities
INSERT OR REPLACE INTO cities (id, name, country, country_code, latitude, longitude, timezone) VALUES
(1, 'London', 'United Kingdom', 'GB', 51.5074, -0.1278, 'Europe/London'),
(2, 'New York', 'United States', 'US', 40.7128, -74.0060, 'America/New_York'),
(3, 'Tokyo', 'Japan', 'JP', 35.6762, 139.6503, 'Asia/Tokyo'),
(4, 'Paris', 'France', 'FR', 48.8566, 2.3522, 'Europe/Paris'),
(5, 'Dubai', 'United Arab Emirates', 'AE', 25.2048, 55.2708, 'Asia/Dubai'),
(6, 'Singapore', 'Singapore', 'SG', 1.3521, 103.8198, 'Asia/Singapore'),
(7, 'Sydney', 'Australia', 'AU', -33.8688, 151.2093, 'Australia/Sydney'),
(8, 'Frankfurt', 'Germany', 'DE', 50.1109, 8.6821, 'Europe/Berlin');

-- 2. Insert Weather Records (Current and Recent Telemetry)
DELETE FROM weather_records;
INSERT INTO weather_records (id, city_id, temp_c, temp_f, feels_like_c, humidity, wind_kph, wind_direction, pressure_mb, visibility_km, condition, condition_code, uv_index, air_quality_index, recorded_at) VALUES
(1, 1, 16.5, 61.7, 15.8, 72, 18.5, 'SW', 1014.2, 10.0, 'Partly Cloudy', 1003, 3.2, 28, datetime('now', '-10 minutes')),
(2, 1, 15.8, 60.4, 15.0, 75, 20.0, 'SW', 1013.8, 9.5, 'Overcast', 1006, 2.8, 30, datetime('now', '-1 hour')),
(3, 2, 22.0, 71.6, 21.5, 55, 12.0, 'NW', 1018.5, 10.0, 'Sunny', 1000, 6.5, 42, datetime('now', '-15 minutes')),
(4, 3, 27.5, 81.5, 30.2, 88, 45.0, 'E', 992.0, 4.0, 'Severe Tropical Storm', 1276, 1.0, 15, datetime('now', '-5 minutes')),
(5, 4, 19.0, 66.2, 18.5, 60, 10.5, 'W', 1016.0, 10.0, 'Clear', 1000, 4.5, 35, datetime('now', '-20 minutes')),
(6, 5, 38.5, 101.3, 44.0, 40, 15.0, 'NE', 1008.0, 8.0, 'Extreme Heat', 1000, 9.8, 85, datetime('now', '-12 minutes')),
(7, 6, 31.0, 87.8, 37.0, 82, 8.0, 'S', 1010.5, 7.0, 'Thunderstorms', 1087, 5.0, 40, datetime('now', '-8 minutes')),
(8, 7, 18.0, 64.4, 17.5, 65, 22.0, 'SE', 1021.0, 10.0, 'Mild Breezy', 1003, 4.0, 20, datetime('now', '-25 minutes')),
(9, 8, 17.2, 63.0, 16.5, 68, 14.0, 'WNW', 1015.5, 10.0, 'Scattered Clouds', 1003, 3.5, 32, datetime('now', '-18 minutes'));

-- 3. Insert Active Severe Weather Alerts
DELETE FROM weather_alerts;
INSERT INTO weather_alerts (id, city_id, event, severity, headline, description, instructions, effective_from, expires_at, is_active) VALUES
(1, 3, 'Typhoon Warning (Category 3)', 'EXTREME', 'Super Typhoon Shanshan Approaching Greater Tokyo Area', 
 'Sustained winds exceeding 120 km/h with heavy torrential rainfall. High risk of localized flooding and severe flight disruptions.', 
 'Aviation operations suspended for visual approach. Passengers advised to check with carriers.', 
 datetime('now', '-2 hours'), datetime('now', '+24 hours'), 1),
(2, 5, 'Excessive Heat Advisory', 'SEVERE', 'Dangerous Heat Index Exceeding 48°C', 
 'High humidity combined with surface temperatures reaching 43°C creating dangerous heat exhaustion conditions.', 
 'Limit outdoor tarmac activities. Hydration mandatory for airport ground crew.', 
 datetime('now', '-1 hour'), datetime('now', '+18 hours'), 1);

-- 4. Insert International Airports
INSERT OR REPLACE INTO airports (code, name, city_id, country, latitude, longitude, timezone) VALUES
('LHR', 'London Heathrow Airport', 1, 'United Kingdom', 51.4700, -0.4543, 'Europe/London'),
('JFK', 'John F. Kennedy International Airport', 2, 'United States', 40.6413, -73.7781, 'America/New_York'),
('HND', 'Tokyo Haneda Airport', 3, 'Japan', 35.5494, 139.7798, 'Asia/Tokyo'),
('CDG', 'Charles de Gaulle Airport', 4, 'France', 49.0097, 2.5479, 'Europe/Paris'),
('DXB', 'Dubai International Airport', 5, 'United Arab Emirates', 25.2532, 55.3657, 'Asia/Dubai'),
('SIN', 'Singapore Changi Airport', 6, 'Singapore', 1.3644, 103.9915, 'Asia/Singapore'),
('SYD', 'Sydney Kingsford Smith Airport', 7, 'Australia', -33.9399, 151.1753, 'Australia/Sydney'),
('FRA', 'Frankfurt Airport', 8, 'Germany', 50.0379, 8.5622, 'Europe/Berlin');

-- 5. Insert Scheduled Flights
DELETE FROM flights;
INSERT INTO flights (id, flight_number, airline, origin_airport, destination_airport, departure_time, arrival_time, base_price, total_seats, available_seats, status) VALUES
(1, 'BA-178', 'British Airways', 'LHR', 'JFK', datetime('now', '+4 hours'), datetime('now', '+12 hours'), 650.00, 200, 198, 'SCHEDULED'),
(2, 'AF-022', 'Air France', 'CDG', 'JFK', datetime('now', '+6 hours'), datetime('now', '+14 hours'), 580.00, 180, 180, 'SCHEDULED'),
(3, 'JL-043', 'Japan Airlines', 'HND', 'LHR', datetime('now', '+2 hours'), datetime('now', '+16 hours'), 920.00, 240, 239, 'DELAYED'),
(4, 'EK-001', 'Emirates', 'DXB', 'LHR', datetime('now', '+8 hours'), datetime('now', '+15 hours'), 740.00, 300, 299, 'ON_TIME'),
(5, 'SQ-308', 'Singapore Airlines', 'SIN', 'LHR', datetime('now', '+10 hours'), datetime('now', '+23 hours'), 850.00, 260, 260, 'SCHEDULED'),
(6, 'LH-400', 'Lufthansa', 'FRA', 'JFK', datetime('now', '+5 hours'), datetime('now', '+14 hours'), 610.00, 220, 220, 'SCHEDULED'),
(7, 'BA-005', 'British Airways', 'LHR', 'HND', datetime('now', '+3 hours'), datetime('now', '+17 hours'), 980.00, 250, 248, 'DELAYED'),
(8, 'QF-001', 'Qantas', 'SYD', 'LHR', datetime('now', '+14 hours'), datetime('now', '+36 hours'), 1250.00, 280, 280, 'SCHEDULED');

-- 6. Insert Baseline Passengers
INSERT OR REPLACE INTO passengers (id, first_name, last_name, email, passport_number, phone) VALUES
(1, 'Alex', 'Morgan', 'alex.morgan@testqa.com', 'GB882910471', '+44 7700 900077'),
(2, 'Sarah', 'Connor', 'sarah.connor@cyberdyne.org', 'US991204855', '+1 555 019 2831'),
(3, 'Kenji', 'Sato', 'kenji.sato@nippon-tech.jp', 'JP440192837', '+81 90 1234 5678'),
(4, 'Emma', 'Watson', 'emma.watson@qa-automation.co.uk', 'GB771239841', '+44 7700 900888');

-- 7. Insert Baseline Bookings (maintaining exact seat inventory consistency)
-- BA-178 has 200 total, 2 bookings -> 198 available
DELETE FROM bookings;
INSERT INTO bookings (id, booking_ref, flight_id, passenger_id, seat_number, status, total_price, booked_at) VALUES
(1, 'BK-A7X921', 1, 1, '12A', 'CONFIRMED', 650.00, datetime('now', '-2 days')),
(2, 'BK-B8Y342', 1, 2, '12B', 'CONFIRMED', 650.00, datetime('now', '-1 day')),
-- JL-043 has 240 total, 1 booking -> 239 available
(3, 'BK-C9Z563', 3, 3, '04K', 'CONFIRMED', 920.00, datetime('now', '-3 days')),
-- EK-001 has 300 total, 1 booking -> 299 available
(4, 'BK-D1W784', 4, 4, '15F', 'CONFIRMED', 740.00, datetime('now', '-12 hours')),
-- BA-005 has 250 total, 2 bookings -> 248 available
(5, 'BK-E2V895', 7, 1, '08C', 'CONFIRMED', 980.00, datetime('now', '-6 hours')),
(6, 'BK-F3U906', 7, 2, '08D', 'CONFIRMED', 980.00, datetime('now', '-5 hours'));

-- 8. Insert Initial API Audit Logs
DELETE FROM api_audit_log;
INSERT INTO api_audit_log (id, client_ip, http_method, endpoint, status_code, response_time_ms, user_agent) VALUES
(1, '127.0.0.1', 'GET', '/api/v1/weather/current?city=London', 200, 18.4, 'PostmanRuntime/7.42.0'),
(2, '127.0.0.1', 'GET', '/api/v1/flights/search?origin=LHR&destination=JFK', 200, 32.1, 'PostmanRuntime/7.42.0'),
(3, '127.0.0.1', 'POST', '/api/v1/bookings', 201, 45.8, 'PostmanRuntime/7.42.0'),
(4, '127.0.0.1', 'GET', '/api/v1/weather/current?city=NonExistentCity', 404, 12.2, 'python-requests/2.32.5');
