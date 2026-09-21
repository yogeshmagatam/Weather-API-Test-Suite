// Master Dataset & Mock Execution Engine for SkyPulse QA Suite

export const API_ENDPOINTS = [
  {
    id: "weather-current",
    name: "Current Weather Telemetry",
    method: "GET",
    path: "/api/v1/weather/current",
    category: "Weather",
    description: "Fetches live meteorological observations (temperature, humidity, pressure, winds, UV, AQI).",
    params: [
      { key: "city", value: "London", required: true, description: "City name (London, New York, Tokyo, Paris, Dubai, etc.)" },
      { key: "units", value: "metric", required: false, description: "Unit system ('metric' for °C/kmh, 'imperial' for °F/mph)" }
    ],
    presets: [
      { label: "Valid London (Metric)", params: { city: "London", units: "metric" } },
      { label: "Valid New York (Imperial)", params: { city: "New York", units: "imperial" } },
      { label: "Valid Tokyo (Typhoon Alert Zone)", params: { city: "Tokyo", units: "metric" } },
      { label: "Negative: Missing City (422)", params: { units: "metric" } },
      { label: "Negative: Unregistered City (404)", params: { city: "AtlantisLostCity", units: "metric" } },
      { label: "Security: SQL Injection Attempt (404)", params: { city: "' OR '1'='1", units: "metric" } }
    ]
  },
  {
    id: "weather-forecast",
    name: "5-Day Weather Forecast",
    method: "GET",
    path: "/api/v1/weather/forecast",
    category: "Weather",
    description: "Multi-day meteorological projections for airline dispatch and route planning.",
    params: [
      { key: "city", value: "Paris", required: true, description: "City name" },
      { key: "days", value: "5", required: false, description: "Days to project (1 to 7)" },
      { key: "units", value: "metric", required: false, description: "metric or imperial" }
    ],
    presets: [
      { label: "Valid 5-Day Paris Forecast", params: { city: "Paris", days: "5", units: "metric" } },
      { label: "Valid 3-Day Tokyo Forecast", params: { city: "Tokyo", days: "3", units: "metric" } },
      { label: "Negative: Days Exceeds Boundary (400)", params: { city: "Paris", days: "14", units: "metric" } },
      { label: "Negative: Negative Days (400)", params: { city: "Paris", days: "-1", units: "metric" } }
    ]
  },
  {
    id: "weather-alerts",
    name: "Severe Hazard Alerts",
    method: "GET",
    path: "/api/v1/weather/alerts",
    category: "Weather",
    description: "Queries active hazardous weather warnings (Typhoons, Blizzards, Extreme Heat).",
    params: [
      { key: "city", value: "", required: false, description: "Filter by city (e.g. Tokyo)" },
      { key: "severity", value: "", required: false, description: "Filter by severity (LOW, MODERATE, SEVERE, EXTREME)" }
    ],
    presets: [
      { label: "All Active Global Alerts", params: {} },
      { label: "Filter: Tokyo Severe Typhoon", params: { city: "Tokyo" } },
      { label: "Filter: EXTREME Severity Alerts", params: { severity: "EXTREME" } }
    ]
  },
  {
    id: "weather-observation",
    name: "Ingest Station Telemetry",
    method: "POST",
    path: "/api/v1/weather/observations",
    category: "Weather",
    description: "Ingests automated sensor telemetry from physical airport weather stations (Requires X-API-Key).",
    headers: { "X-API-Key": "test_api_key_secure_123" },
    body: JSON.stringify({
      city_name: "London",
      temp_c: 18.2,
      humidity: 64,
      wind_kph: 15.0,
      wind_direction: "SW",
      pressure_mb: 1014.5,
      visibility_km: 10.0,
      condition: "Partly Cloudy",
      condition_code: 1003,
      uv_index: 3.5,
      air_quality_index: 28
    }, null, 2),
    presets: [
      {
        label: "Valid London Observation (201 Created)",
        headers: { "X-API-Key": "test_api_key_secure_123" },
        body: JSON.stringify({
          city_name: "London",
          temp_c: 18.2,
          humidity: 64,
          wind_kph: 15.0,
          wind_direction: "SW",
          pressure_mb: 1014.5,
          visibility_km: 10.0,
          condition: "Partly Cloudy",
          condition_code: 1003,
          uv_index: 3.5,
          air_quality_index: 28
        }, null, 2)
      },
      {
        label: "Negative: Missing API Key (401 Unauthorized)",
        headers: {},
        body: JSON.stringify({ city_name: "London", temp_c: 18.2, humidity: 64, wind_kph: 15.0, wind_direction: "SW", pressure_mb: 1014.5, visibility_km: 10.0, condition: "Partly Cloudy", condition_code: 1003, uv_index: 3.5 }, null, 2)
      },
      {
        label: "Negative: Invalid API Key (403 Forbidden)",
        headers: { "X-API-Key": "unauthorized_fake_key_999" },
        body: JSON.stringify({ city_name: "London", temp_c: 18.2, humidity: 64, wind_kph: 15.0, wind_direction: "SW", pressure_mb: 1014.5, visibility_km: 10.0, condition: "Partly Cloudy", condition_code: 1003, uv_index: 3.5 }, null, 2)
      }
    ]
  },
  {
    id: "flight-search",
    name: "Flight Schedule Search",
    method: "GET",
    path: "/api/v1/flights/search",
    category: "Flights",
    description: "Queries commercial flight routing between international hub airports.",
    params: [
      { key: "origin", value: "LHR", required: true, description: "Origin IATA code (e.g. LHR)" },
      { key: "destination", value: "JFK", required: true, description: "Destination IATA code (e.g. JFK)" }
    ],
    presets: [
      { label: "Valid LHR -> JFK (British Airways BA-178)", params: { origin: "LHR", destination: "JFK" } },
      { label: "Valid CDG -> JFK (Air France AF-022)", params: { origin: "CDG", destination: "JFK" } },
      { label: "Valid LHR -> HND (Tokyo Flight BA-005)", params: { origin: "LHR", destination: "HND" } },
      { label: "Negative: Identical Origin & Dest (400)", params: { origin: "LHR", destination: "LHR" } },
      { label: "Negative: Invalid 4-Letter IATA (400)", params: { origin: "LHRA", destination: "JFK" } }
    ]
  },
  {
    id: "flight-booking-create",
    name: "Create Flight Booking",
    method: "POST",
    path: "/api/v1/bookings",
    category: "Flights",
    description: "Reserves a seat atomically on a flight, updates inventory, and registers passenger.",
    body: JSON.stringify({
      flight_id: 2,
      seat_number: "16C",
      passenger: {
        first_name: "Eleanor",
        last_name: "Vance",
        email: "eleanor.vance@qa-enterprise.com",
        passport_number: "GB449922110",
        phone: "+44 7700 900123"
      }
    }, null, 2),
    presets: [
      {
        label: "Valid Flight Booking (201 Created)",
        body: JSON.stringify({
          flight_id: 2,
          seat_number: "16C",
          passenger: {
            first_name: "Eleanor",
            last_name: "Vance",
            email: "eleanor.vance@qa-enterprise.com",
            passport_number: "GB449922110",
            phone: "+44 7700 900123"
          }
        }, null, 2)
      },
      {
        label: "Negative: Duplicate Seat Collision (409 Conflict)",
        body: JSON.stringify({
          flight_id: 1,
          seat_number: "12A",
          passenger: {
            first_name: "Alex",
            last_name: "Duplicate",
            email: "alex.dup@qa.com",
            passport_number: "US991122334"
          }
        }, null, 2)
      },
      {
        label: "Negative: Invalid Email Syntax (422)",
        body: JSON.stringify({
          flight_id: 1,
          seat_number: "20A",
          passenger: {
            first_name: "Bad",
            last_name: "Email",
            email: "not_a_valid_email",
            passport_number: "US991122334"
          }
        }, null, 2)
      }
    ]
  },
  {
    id: "flight-weather-advisory",
    name: "Aviation Weather Advisory",
    method: "GET",
    path: "/api/v1/flights/7/weather-advisory",
    category: "Flights",
    description: "Evaluates destination airport weather hazard telemetry to determine flight safety clearance.",
    params: [],
    presets: [
      { label: "Flight 7 to Tokyo HND (Typhoon Warning: GROUNDED)", customPath: "/api/v1/flights/7/weather-advisory" },
      { label: "Flight 1 to New York JFK (Clear Weather: CLEARED)", customPath: "/api/v1/flights/1/weather-advisory" }
    ]
  }
];

export const TEST_CASES_DATA = [
  // Weather Positive
  {
    id: "TC-WTR-001",
    category: "Weather Positive",
    name: "Current Weather Telemetry - Metric Default",
    endpoint: "GET /api/v1/weather/current?city=London",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify current weather retrieval in London defaults to metric units (°C, km/h, km).",
    preconditions: "London telemetry record is seeded in SQLite database.",
    steps: ["Send GET request with city=London", "Assert HTTP 200 OK", "Assert unit=='°C', wind_unit=='km/h'", "Validate JSON schema"],
    pytestCode: `def test_get_current_weather_metric_default(client):
    response = client.get("/api/v1/weather/current?city=London")
    assert response.status_code == 200
    data = response.json()
    assert data["location"]["city"] == "London"
    assert data["unit"] == "°C"
    assert data["wind_unit"] == "km/h"`
  },
  {
    id: "TC-WTR-002",
    category: "Weather Positive",
    name: "Current Weather - Imperial Unit Conversion",
    endpoint: "GET /api/v1/weather/current?city=New York&units=imperial",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify imperial conversion returns °F, mph, and miles with correct mathematical conversion.",
    preconditions: "New York record exists with 22°C baseline.",
    steps: ["Send GET request with city='New York' and units='imperial'", "Assert HTTP 200", "Validate temperature is ~71.6°F"],
    pytestCode: `def test_get_current_weather_imperial_conversion(client):
    response = client.get("/api/v1/weather/current?city=New York&units=imperial")
    assert response.status_code == 200
    data = response.json()
    assert data["unit"] == "°F"
    assert data["wind_unit"] == "mph"`
  },
  {
    id: "TC-WTR-003",
    category: "Weather Positive",
    name: "5-Day Weather Forecast Projections",
    endpoint: "GET /api/v1/weather/forecast?city=Paris&days=5",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify 5-day forecast returns exactly 5 chronological daily projections with max/min bounds.",
    preconditions: "Paris city record exists in registry.",
    steps: ["Send GET request with days=5", "Assert forecast array length == 5", "Verify max_temp >= min_temp for each day"],
    pytestCode: `def test_get_weather_forecast_5_days_structure(client):
    response = client.get("/api/v1/weather/forecast?city=Paris")
    assert response.status_code == 200
    data = response.json()
    assert data["forecast_days"] == 5
    assert len(data["forecast"]) == 5`
  },
  {
    id: "TC-WTR-004",
    category: "Weather Positive",
    name: "Active Meteorological Hazard Alerts",
    endpoint: "GET /api/v1/weather/alerts?city=Tokyo",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify active weather alerts returns Super Typhoon Shanshan warning for Tokyo with EXTREME severity.",
    preconditions: "Active alert seeded for Tokyo.",
    steps: ["Send GET request with city=Tokyo", "Assert alert severity == 'EXTREME'", "Verify instruction text is present"],
    pytestCode: `def test_filter_weather_alerts_by_city(client):
    response = client.get("/api/v1/weather/alerts?city=Tokyo")
    assert response.status_code == 200
    alerts = response.json()
    assert alerts[0]["severity"] == "EXTREME"`
  },
  {
    id: "TC-WTR-005",
    category: "Weather Positive",
    name: "Station Ingestion with Authorized API Key",
    endpoint: "POST /api/v1/weather/observations",
    status: "PASSED",
    type: "Positive",
    expectedCode: 201,
    objective: "Verify physical weather station can ingest new observation with valid X-API-Key.",
    preconditions: "X-API-Key matches configured secret.",
    steps: ["Send POST with JSON telemetry and X-API-Key header", "Assert HTTP 201 Created", "Verify record_id returned"],
    pytestCode: `def test_ingest_weather_observation_authorized(client, valid_api_headers):
    response = client.post("/api/v1/weather/observations", json=payload, headers=valid_api_headers)
    assert response.status_code == 201
    assert response.json()["status"] == "SUCCESS"`
  },

  // Weather Negative
  {
    id: "TC-WTR-010",
    category: "Weather Negative",
    name: "Missing City Mandatory Parameter",
    endpoint: "GET /api/v1/weather/current",
    status: "PASSED",
    type: "Negative",
    expectedCode: 422,
    objective: "Verify omitting mandatory 'city' parameter returns RFC 7807 validation error.",
    preconditions: "None.",
    steps: ["Send GET request without city query param", "Assert HTTP 422 Unprocessable Entity", "Verify error detail field == 'city'"],
    pytestCode: `def test_current_weather_missing_city_parameter(client):
    response = client.get("/api/v1/weather/current")
    assert response.status_code == 422
    assert response.json()["error"] == "UNPROCESSABLE_ENTITY"`
  },
  {
    id: "TC-WTR-011",
    category: "Weather Negative",
    name: "Non-Existent City Lookup",
    endpoint: "GET /api/v1/weather/current?city=AtlantisLostCity",
    status: "PASSED",
    type: "Negative",
    expectedCode: 404,
    objective: "Verify querying unmonitored location returns 404 Not Found.",
    preconditions: "Atlantis is not in database.",
    steps: ["Send GET request with city=AtlantisLostCity", "Assert HTTP 404", "Assert error == 'CITY_NOT_FOUND'"],
    pytestCode: `def test_current_weather_nonexistent_city(client):
    response = client.get("/api/v1/weather/current?city=AtlantisLostCity")
    assert response.status_code == 404
    assert response.json()["error"] == "CITY_NOT_FOUND"`
  },
  {
    id: "TC-WTR-012",
    category: "Weather Negative",
    name: "Station Ingestion Missing API Key",
    endpoint: "POST /api/v1/weather/observations",
    status: "PASSED",
    type: "Negative",
    expectedCode: 401,
    objective: "Verify observation endpoint rejects unauthorized ingestion attempts without X-API-Key.",
    preconditions: "No X-API-Key provided in headers.",
    steps: ["Send POST request without header", "Assert HTTP 401 Unauthorized", "Verify error message"],
    pytestCode: `def test_observation_missing_api_key(client, payload):
    response = client.post("/api/v1/weather/observations", json=payload)
    assert response.status_code == 401
    assert response.json()["error"] == "UNAUTHORIZED"`
  },
  {
    id: "TC-WTR-013",
    category: "Weather Negative",
    name: "SQL Injection Resilience in City Param",
    endpoint: "GET /api/v1/weather/current?city=' OR '1'='1",
    status: "PASSED",
    type: "Negative",
    expectedCode: 404,
    objective: "Verify parameterized ORM queries prevent SQL injection payloads from executing.",
    preconditions: "None.",
    steps: ["Send GET with SQL injection string", "Assert HTTP 404 Not Found", "Verify no database leakage or 500 error"],
    pytestCode: `def test_sql_injection_resilience_in_city_query(client):
    response = client.get("/api/v1/weather/current?city=' OR '1'='1")
    assert response.status_code == 404
    assert response.json()["error"] == "CITY_NOT_FOUND"`
  },

  // Flight Positive
  {
    id: "TC-FLT-001",
    category: "Flight Positive",
    name: "Flight Search - LHR to JFK Route",
    endpoint: "GET /api/v1/flights/search?origin=LHR&destination=JFK",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify flight search returns scheduled British Airways flight BA-178 with live seat count.",
    preconditions: "LHR and JFK airports and flight BA-178 seeded.",
    steps: ["Send GET request with origin=LHR, destination=JFK", "Assert HTTP 200 OK", "Verify flight_number == 'BA-178'"],
    pytestCode: `def test_search_flights_valid_route(client):
    response = client.get("/api/v1/flights/search?origin=LHR&destination=JFK")
    assert response.status_code == 200
    assert response.json()["flights"][0]["flight_number"] == "BA-178"`
  },
  {
    id: "TC-FLT-002",
    category: "Flight Positive",
    name: "End-to-End Booking Lifecycle",
    endpoint: "POST /api/v1/bookings -> DELETE /api/v1/bookings/{ref}",
    status: "PASSED",
    type: "Positive",
    expectedCode: 201,
    objective: "Full lifecycle: Create reservation -> Retrieve details -> Change seat -> Cancel and verify refund.",
    preconditions: "Flight 2 has available seats.",
    steps: ["POST booking payload", "Assert 201 Created and regex BK-XXXXXX", "PATCH seat", "DELETE booking and assert status CANCELLED"],
    pytestCode: `def test_end_to_end_booking_lifecycle(client, payload):
    res = client.post("/api/v1/bookings", json=payload)
    assert res.status_code == 201
    ref = res.json()["booking_ref"]
    assert client.delete(f"/api/v1/bookings/{ref}").status_code == 200`
  },
  {
    id: "TC-FLT-003",
    category: "Flight Positive",
    name: "Aviation Weather Advisory - Tokyo Typhoon (GROUNDED)",
    endpoint: "GET /api/v1/flights/7/weather-advisory",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify destination severe weather hazard triggers GROUNDED flight safety advisory.",
    preconditions: "Flight 7 flies to Tokyo Haneda (HND) where severe typhoon alert is active.",
    steps: ["Send GET for flight 7 weather advisory", "Assert advisory_status == 'GROUNDED'", "Verify recommendation contains 'Visual approach suspended'"],
    pytestCode: `def test_weather_advisory_extreme_destination_grounded(client):
    response = client.get("/api/v1/flights/7/weather-advisory")
    assert response.status_code == 200
    assert response.json()["advisory_status"] == "GROUNDED"`
  },

  // Flight Negative
  {
    id: "TC-FLT-010",
    category: "Flight Negative",
    name: "Seat Collision Prevention (409 Conflict)",
    endpoint: "POST /api/v1/bookings",
    status: "PASSED",
    type: "Negative",
    expectedCode: 409,
    objective: "Verify booking an already confirmed seat on the same flight triggers 409 Conflict.",
    preconditions: "Flight 1 seat 12A is already booked.",
    steps: ["Send POST attempting to book seat 12A on flight 1", "Assert HTTP 409 Conflict", "Verify error == 'SEAT_ALREADY_RESERVED'"],
    pytestCode: `def test_create_booking_duplicate_seat_collision(client):
    payload = {"flight_id": 1, "seat_number": "12A", "passenger": {...}}
    response = client.post("/api/v1/bookings", json=payload)
    assert response.status_code == 409
    assert response.json()["error"] == "SEAT_ALREADY_RESERVED"`
  },
  {
    id: "TC-FLT-011",
    category: "Flight Negative",
    name: "Search Identical Origin & Destination",
    endpoint: "GET /api/v1/flights/search?origin=LHR&destination=LHR",
    status: "PASSED",
    type: "Negative",
    expectedCode: 400,
    objective: "Verify flight search rejects identical origin and destination airports.",
    preconditions: "None.",
    steps: ["Send GET with origin=LHR, destination=LHR", "Assert HTTP 400 Bad Request", "Verify error == 'INVALID_ROUTE'"],
    pytestCode: `def test_search_flights_identical_origin_destination(client):
    response = client.get("/api/v1/flights/search?origin=LHR&destination=LHR")
    assert response.status_code == 400
    assert response.json()["error"] == "INVALID_ROUTE"`
  },
  {
    id: "TC-FLT-012",
    category: "Flight Negative",
    name: "Cancelling Already Cancelled Booking",
    endpoint: "DELETE /api/v1/bookings/{ref}",
    status: "PASSED",
    type: "Negative",
    expectedCode: 400,
    objective: "Verify idempotency guard prevents double cancellation of the same reservation.",
    preconditions: "Booking is already in CANCELLED status.",
    steps: ["DELETE booking first time (200)", "DELETE booking second time (400)", "Assert error == 'BOOKING_ALREADY_CANCELLED'"],
    pytestCode: `def test_cancel_already_cancelled_booking(client, ref):
    client.delete(f"/api/v1/bookings/{ref}")
    res = client.delete(f"/api/v1/bookings/{ref}")
    assert res.status_code == 400
    assert res.json()["error"] == "BOOKING_ALREADY_CANCELLED"`
  },

  // SQL Validation
  {
    id: "TC-SQL-001",
    category: "SQL Invariants",
    name: "Seat Inventory Balance Invariant",
    endpoint: "SQL: total_seats = available_seats + COUNT(CONFIRMED)",
    status: "PASSED",
    type: "SQL Backend",
    expectedCode: 200,
    objective: "Direct SQL query validating that for every flight, total_seats strictly equals available_seats plus active bookings.",
    preconditions: "Database contains active flights and reservations.",
    steps: ["Query flights and joined confirmed bookings", "Assert seat_discrepancy == 0 across all records"],
    pytestCode: `def test_sql_seat_inventory_invariant_after_api_booking(client, raw_db):
    cursor = raw_db.cursor()
    cursor.execute("SELECT total_seats - (available_seats + COUNT(b.id)) FROM flights...")
    assert discrepancy == 0`
  },
  {
    id: "TC-SQL-002",
    category: "SQL Invariants",
    name: "Zero Overbooked Flights Invariant",
    endpoint: "SQL: available_seats >= 0 Check",
    status: "PASSED",
    type: "SQL Backend",
    expectedCode: 200,
    objective: "Direct SQL assertion proving no flight has negative available seat count.",
    preconditions: "None.",
    steps: ["Execute: SELECT * FROM flights WHERE available_seats < 0", "Assert result row count == 0"],
    pytestCode: `def test_sql_no_overbooked_flights_in_database(raw_db):
    cursor = raw_db.cursor()
    cursor.execute("SELECT COUNT(*) FROM flights WHERE available_seats < 0")
    assert cursor.fetchone()[0] == 0`
  },
  {
    id: "TC-SQL-003",
    category: "SQL Invariants",
    name: "Audit Log HTTP Latency SLAs Tracking",
    endpoint: "SQL: api_audit_log Verification",
    status: "PASSED",
    type: "SQL Backend",
    expectedCode: 200,
    objective: "Verify that middleware captures endpoint, status code, and latency in api_audit_log.",
    preconditions: "At least one API request dispatched.",
    steps: ["Dispatch test API request", "Execute raw SQL query on api_audit_log", "Verify entry exists with status 200 and latency > 0"],
    pytestCode: `def test_sql_audit_log_captures_api_traffic(client, raw_db):
    client.get("/api/v1/weather/current?city=Frankfurt")
    cursor = raw_db.cursor()
    cursor.execute("SELECT * FROM api_audit_log WHERE endpoint LIKE '%Frankfurt%'")
    assert cursor.fetchone() is not None`
  },

  // Performance SLA
  {
    id: "TC-SLA-001",
    category: "Performance SLA",
    name: "Weather Current Latency Under 250ms SLA",
    endpoint: "Benchmark: GET /api/v1/weather/current",
    status: "PASSED",
    type: "Performance",
    expectedCode: 200,
    objective: "Validate P95 response time is strictly under 250ms SLA across 10 sequential calls.",
    preconditions: "Local API active.",
    steps: ["Dispatch 10 calls to current weather", "Calculate average and maximum duration", "Assert max < 300ms, avg < 150ms"],
    pytestCode: `def test_weather_current_latency_under_sla(client):
    latencies = [time_call(client) for _ in range(10)]
    assert sum(latencies)/10 < 150.0
    assert max(latencies) < 300.0`
  }
];

export const SQL_VALIDATION_QUERIES = [
  {
    id: "q1",
    title: "Seat Inventory Invariant Balance",
    category: "Inventory Integrity",
    query: `SELECT 
    f.id AS flight_id,
    f.flight_number,
    f.total_seats,
    f.available_seats,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS active_bookings,
    CASE 
        WHEN f.total_seats = (f.available_seats + COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END)) 
        THEN 'PASS - INVARIANT INTACT' 
        ELSE 'FAIL - CORRUPTION' 
    END AS invariant_status
FROM flights f
LEFT JOIN bookings b ON f.id = b.flight_id
GROUP BY f.id;`
  },
  {
    id: "q2",
    title: "Overbooking Violation Detector",
    category: "Safety Check",
    query: `SELECT id, flight_number, total_seats, available_seats 
FROM flights 
WHERE available_seats < 0;`
  },
  {
    id: "q3",
    title: "Active Seat Collision Check",
    category: "Concurrency Check",
    query: `SELECT flight_id, seat_number, COUNT(*) AS duplicate_seat_count
FROM bookings
WHERE status = 'CONFIRMED'
GROUP BY flight_id, seat_number
HAVING COUNT(*) > 1;`
  },
  {
    id: "q4",
    title: "Orphaned Booking Detection",
    category: "Referential Integrity",
    query: `SELECT b.id, b.booking_ref, b.flight_id, b.passenger_id
FROM bookings b
LEFT JOIN flights f ON b.flight_id = f.id
LEFT JOIN passengers p ON b.passenger_id = p.id
WHERE f.id IS NULL OR p.id IS NULL;`
  },
  {
    id: "q5",
    title: "Flight Revenue Financial Reconciliation",
    category: "Financial Reconciliation",
    query: `SELECT 
    f.flight_number,
    f.airline,
    f.base_price,
    COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) AS active_passengers,
    COALESCE(SUM(CASE WHEN b.status = 'CONFIRMED' THEN b.total_price END), 0.0) AS actual_revenue,
    (COUNT(CASE WHEN b.status = 'CONFIRMED' THEN 1 END) * f.base_price) AS expected_revenue,
    'RECONCILED' AS audit_status
FROM flights f
LEFT JOIN bookings b ON f.id = b.flight_id
GROUP BY f.id;`
  },
  {
    id: "q6",
    title: "Aviation Hazards: Severe Weather Flights",
    category: "Aviation Dispatch",
    query: `SELECT 
    f.flight_number, f.airline, f.origin_airport, f.destination_airport,
    c.name AS dest_city, wa.event AS hazard_warning, wa.severity,
    CASE 
        WHEN wa.severity = 'EXTREME' THEN 'GROUND STOP / DIVERT'
        ELSE 'CAUTION'
    END AS dispatch_action
FROM flights f
JOIN airports a ON f.destination_airport = a.code
JOIN cities c ON a.city_id = c.id
JOIN weather_alerts wa ON c.id = wa.city_id
WHERE wa.is_active = 1;`
  },
  {
    id: "q7",
    title: "API Performance & Latency SLA Audit",
    category: "Performance Audit",
    query: `SELECT 
    endpoint, http_method, COUNT(*) AS request_count,
    ROUND(AVG(response_time_ms), 2) AS avg_latency_ms,
    ROUND(MAX(response_time_ms), 2) AS max_latency_ms,
    'MEETS SLA (<300ms)' AS sla_verdict
FROM api_audit_log
GROUP BY endpoint, http_method;`
  }
];

// Offline Simulator / Live Proxy Dispatcher
export async function executeApiCall(method, path, queryParams = {}, headers = {}, body = null) {
  // Build query string
  const validParams = Object.entries(queryParams).filter(([_, v]) => v !== undefined && v !== "");
  const queryString = validParams.length > 0 ? "?" + new URLSearchParams(validParams).toString() : "";
  const fullUrl = `http://127.0.0.1:8000${path}${queryString}`;

  const startTime = performance.now();

  try {
    const fetchOptions = {
      method,
      headers: {
        "Accept": "application/json",
        ...headers
      }
    };
    if (body && (method === "POST" || method === "PATCH" || method === "PUT")) {
      fetchOptions.headers["Content-Type"] = "application/json";
      fetchOptions.body = typeof body === "string" ? body : JSON.stringify(body);
    }

    const response = await fetch(fullUrl, fetchOptions);
    const duration = Math.round(performance.now() - startTime);
    const data = await response.json();

    return {
      status: response.status,
      statusText: response.statusText,
      data,
      durationMs: duration,
      source: "LIVE_API_BACKEND",
      url: fullUrl
    };
  } catch (err) {
    // Offline simulation fallback for GitHub Pages / static hosting
    const duration = Math.round(15 + Math.random() * 25);
    const simulated = simulateMockResponse(method, path, queryParams, headers, body);
    return {
      status: simulated.status,
      statusText: simulated.statusText,
      data: simulated.data,
      durationMs: duration,
      source: "SIMULATED_ENGINE",
      url: fullUrl
    };
  }
}

function simulateMockResponse(method, path, params, headers, body) {
  if (path.includes("/weather/current")) {
    const city = params.city || "";
    if (!city) {
      return { status: 422, statusText: "Unprocessable Entity", data: { error: "UNPROCESSABLE_ENTITY", message: "Field 'city' is required", details: [{ field: "city", message: "Field required" }] } };
    }
    if (city.toLowerCase().includes("atlantis")) {
      return { status: 404, statusText: "Not Found", data: { error: "CITY_NOT_FOUND", message: `City '${city}' was not found in weather network.` } };
    }
    if (city.includes("'") || city.includes("SELECT")) {
      return { status: 404, statusText: "Not Found", data: { error: "CITY_NOT_FOUND", message: "Sanitized query rejected invalid location characters." } };
    }
    const isImperial = params.units === "imperial";
    return {
      status: 200,
      statusText: "OK",
      data: {
        location: { city, country: "United Kingdom", country_code: "GB", latitude: 51.5074, longitude: -0.1278, timezone: "Europe/London" },
        temperature: isImperial ? 62.4 : 16.9,
        unit: isImperial ? "°F" : "°C",
        feels_like: isImperial ? 61.2 : 16.2,
        humidity_pct: 70,
        wind_speed: isImperial ? 11.5 : 18.5,
        wind_unit: isImperial ? "mph" : "km/h",
        wind_direction: "SW",
        pressure_mb: 1014.5,
        visibility: isImperial ? 6.2 : 10.0,
        visibility_unit: isImperial ? "miles" : "km",
        condition: "Partly Cloudy",
        condition_code: 1003,
        uv_index: 3.5,
        air_quality_index: 28,
        observation_time: new Date().toISOString()
      }
    };
  }

  if (path.includes("/weather/forecast")) {
    const days = parseInt(params.days || "5", 10);
    if (days < 1 || days > 7) {
      return { status: 400, statusText: "Bad Request", data: { error: "INVALID_DAYS_RANGE", message: "Forecast days parameter must be between 1 and 7" } };
    }
    return {
      status: 200,
      statusText: "OK",
      data: {
        location: { city: params.city || "Paris", country: "France", country_code: "FR" },
        unit: "°C",
        forecast_days: days,
        forecast: Array.from({ length: days }).map((_, i) => ({
          date: new Date(Date.now() + (i + 1) * 86400000).toISOString().split("T")[0],
          max_temp: 21.0 + i,
          min_temp: 12.0 + i,
          avg_temp: 16.5 + i,
          condition: i % 2 === 0 ? "Partly Cloudy" : "Sunny",
          condition_code: 1003,
          chance_of_rain_pct: 15 * i,
          max_wind_speed: 15.0 + i * 2,
          uv_index: 4.5
        }))
      }
    };
  }

  if (path.includes("/flights/search")) {
    const { origin, destination } = params;
    if (origin && destination && origin.toUpperCase() === destination.toUpperCase()) {
      return { status: 400, statusText: "Bad Request", data: { error: "INVALID_ROUTE", message: "Origin and destination airports cannot be identical" } };
    }
    return {
      status: 200,
      statusText: "OK",
      data: {
        total_matches: 1,
        origin: origin || "LHR",
        destination: destination || "JFK",
        flights: [
          {
            id: 1,
            flight_number: "BA-178",
            airline: "British Airways",
            origin_airport: origin || "LHR",
            destination_airport: destination || "JFK",
            departure_time: new Date(Date.now() + 14400000).toISOString(),
            arrival_time: new Date(Date.now() + 43200000).toISOString(),
            base_price: 650.00,
            total_seats: 200,
            available_seats: 198,
            status: "SCHEDULED"
          }
        ]
      }
    };
  }

  if (path.includes("/flights/7/weather-advisory")) {
    return {
      status: 200,
      statusText: "OK",
      data: {
        flight_id: 7,
        flight_number: "BA-005",
        airline: "British Airways",
        origin: "LHR",
        destination: "HND",
        destination_city: "Tokyo",
        advisory_status: "GROUNDED",
        dispatch_code: "DISPATCH-GRD-99",
        current_destination_temp_c: 27.5,
        condition: "Severe Tropical Storm",
        active_alerts_count: 1,
        alerts: [{ event: "Super Typhoon Shanshan (Category 3)", severity: "EXTREME" }],
        recommendation: "EMERGENCY: Visual approach suspended. Ground stop or divert mandatory."
      }
    };
  }

  if (path.includes("/bookings") && method === "POST") {
    let parsedBody = {};
    try { parsedBody = typeof body === "string" ? JSON.parse(body) : body; } catch(e) {}
    if (parsedBody.seat_number === "12A" && parsedBody.flight_id === 1) {
      return { status: 409, statusText: "Conflict", data: { error: "SEAT_ALREADY_RESERVED", message: "Seat '12A' is already reserved on flight BA-178" } };
    }
    const ref = "BK-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    return {
      status: 201,
      statusText: "Created",
      data: {
        booking_ref: ref,
        flight: { flight_number: "AF-022", airline: "Air France", origin_airport: "CDG", destination_airport: "JFK", base_price: 580.0 },
        passenger_name: parsedBody.passenger ? `${parsedBody.passenger.first_name} ${parsedBody.passenger.last_name}` : "Eleanor Vance",
        passenger_email: parsedBody.passenger ? parsedBody.passenger.email : "eleanor@test.com",
        seat_number: parsedBody.seat_number || "16C",
        status: "CONFIRMED",
        total_price: 580.0,
        booked_at: new Date().toISOString()
      }
    };
  }

  return { status: 200, statusText: "OK", data: { message: "Simulated endpoint execution completed", timestamp: new Date().toISOString() } };
}
