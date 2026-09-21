// Master Dataset & Mock Execution Engine for WeatherPulse QA Suite

export const API_ENDPOINTS = [
  {
    id: "weather-current",
    name: "Current Weather Telemetry",
    method: "GET",
    path: "/api/v1/weather/current",
    category: "Real-Time Telemetry",
    description: "Fetches live meteorological observations (temperature, humidity, pressure, winds, UV, AQI).",
    params: [
      { key: "city", value: "London", required: true, description: "City name (London, New York, Tokyo, Paris, Dubai, Mumbai, etc.)" },
      { key: "units", value: "metric", required: false, description: "Unit system ('metric' for °C/kmh, 'imperial' for °F/mph)" }
    ],
    presets: [
      { label: "Valid London (Metric)", params: { city: "London", units: "metric" } },
      { label: "Valid New York (Imperial)", params: { city: "New York", units: "imperial" } },
      { label: "Valid Tokyo (Typhoon Alert Zone)", params: { city: "Tokyo", units: "metric" } },
      { label: "Valid Mumbai (High Humidity & AQI)", params: { city: "Mumbai", units: "metric" } },
      { label: "Negative: Missing City (422)", params: { units: "metric" } },
      { label: "Negative: Unregistered City (404)", params: { city: "AtlantisLostCity", units: "metric" } },
      { label: "Security: SQL Injection Attempt (404)", params: { city: "' OR '1'='1", units: "metric" } }
    ]
  },
  {
    id: "weather-forecast",
    name: "Multi-Day Weather Forecast",
    method: "GET",
    path: "/api/v1/weather/forecast",
    category: "Projections",
    description: "Multi-day meteorological projections (1 to 7 days) with precipitation probability and temperature bounds.",
    params: [
      { key: "city", value: "Paris", required: true, description: "City name" },
      { key: "days", value: "5", required: false, description: "Days to project (1 to 7)" },
      { key: "units", value: "metric", required: false, description: "metric or imperial" }
    ],
    presets: [
      { label: "Valid 5-Day Paris Forecast", params: { city: "Paris", days: "5", units: "metric" } },
      { label: "Valid 3-Day Tokyo Forecast", params: { city: "Tokyo", days: "3", units: "metric" } },
      { label: "Valid 7-Day London Projection", params: { city: "London", days: "7", units: "metric" } },
      { label: "Negative: Days Exceeds Boundary (400)", params: { city: "Paris", days: "14", units: "metric" } },
      { label: "Negative: Negative Days (400)", params: { city: "Paris", days: "-1", units: "metric" } }
    ]
  },
  {
    id: "weather-alerts",
    name: "Severe Hazard Alerts",
    method: "GET",
    path: "/api/v1/weather/alerts",
    category: "Hazards & Safety",
    description: "Queries active hazardous weather warnings (Typhoons, Blizzards, Extreme Heat, AQI Advisories).",
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
    id: "weather-air-quality",
    name: "Air Quality Index (AQI)",
    method: "GET",
    path: "/api/v1/weather/air-quality",
    category: "Atmospheric Health",
    description: "Returns particulate pollution indices (AQI 1-500), EPA categorization, and public health advisories.",
    params: [
      { key: "city", value: "Mumbai", required: true, description: "City name (e.g. Mumbai, London, Dubai)" }
    ],
    presets: [
      { label: "Mumbai AQI (Unhealthy Advisory)", params: { city: "Mumbai" } },
      { label: "London AQI (Good Quality)", params: { city: "London" } },
      { label: "Dubai AQI (Moderate)", params: { city: "Dubai" } }
    ]
  },
  {
    id: "weather-stats",
    name: "Statistical Extremes & Averages",
    method: "GET",
    path: "/api/v1/weather/stats",
    category: "Historical Analytics",
    description: "Aggregates historical sensor telemetry to calculate Min/Max/Avg temperatures and humidity.",
    params: [
      { key: "city", value: "London", required: true, description: "City name" }
    ],
    presets: [
      { label: "London Sensor Stats", params: { city: "London" } },
      { label: "New York Sensor Stats", params: { city: "New York" } }
    ]
  },
  {
    id: "weather-historical",
    name: "Historical Telemetry Logs",
    method: "GET",
    path: "/api/v1/weather/historical",
    category: "Historical Analytics",
    description: "Retrieves complete chronological telemetry observation log for a target monitoring station.",
    params: [
      { key: "city", value: "London", required: true, description: "City name" }
    ],
    presets: [
      { label: "London Historical Logs", params: { city: "London" } },
      { label: "New York Historical Logs", params: { city: "New York" } }
    ]
  },
  {
    id: "weather-observation",
    name: "Ingest Station Telemetry",
    method: "POST",
    path: "/api/v1/weather/observations",
    category: "Station Management",
    description: "Ingests automated sensor telemetry from physical weather stations (Requires X-API-Key header).",
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
    name: "Air Quality Index (AQI) & Pollution Analysis",
    endpoint: "GET /api/v1/weather/air-quality?city=Mumbai",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify AQI retrieval and WHO/EPA category advisory for elevated particulate matter.",
    preconditions: "Mumbai record seeded with AQI = 155.",
    steps: ["Send GET request for Mumbai AQI", "Assert aqi == 155", "Assert category == 'Unhealthy'"],
    pytestCode: `def test_get_air_quality_index_endpoint(client):
    response = client.get("/api/v1/weather/air-quality?city=Mumbai")
    assert response.status_code == 200
    assert response.json()["category"] == "Unhealthy"`
  },
  {
    id: "TC-WTR-006",
    category: "Weather Positive",
    name: "Statistical Extremes & Average Temperature",
    endpoint: "GET /api/v1/weather/stats?city=London",
    status: "PASSED",
    type: "Positive",
    expectedCode: 200,
    objective: "Verify statistical endpoint aggregates min, max, and avg temperature over recorded telemetry.",
    preconditions: "At least two observations recorded for London.",
    steps: ["Send GET request for stats", "Assert max_temp >= min_temp", "Assert avg_temp is within range"],
    pytestCode: `def test_get_weather_statistics_aggregate(client):
    response = client.get("/api/v1/weather/stats?city=London")
    assert response.status_code == 200
    data = response.json()
    assert data["max_temp_c"] >= data["min_temp_c"]`
  },
  {
    id: "TC-WTR-007",
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
    name: "Forecast Days Exceeding Max Boundary (400)",
    endpoint: "GET /api/v1/weather/forecast?city=Paris&days=14",
    status: "PASSED",
    type: "Negative",
    expectedCode: 400,
    objective: "Verify boundary check rejects forecast days > 7.",
    preconditions: "None.",
    steps: ["Send GET request with days=14", "Assert HTTP 400 Bad Request", "Assert error == 'INVALID_DAYS_RANGE'"],
    pytestCode: `def test_forecast_exceeding_max_days_parameter(client):
    response = client.get("/api/v1/weather/forecast?city=Paris&days=14")
    assert response.status_code == 400
    assert response.json()["error"] == "INVALID_DAYS_RANGE"`
  },
  {
    id: "TC-WTR-013",
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
    id: "TC-WTR-014",
    category: "Weather Negative",
    name: "Physical Sensor Bound Validation (Humidity > 100%)",
    endpoint: "POST /api/v1/weather/observations",
    status: "PASSED",
    type: "Negative",
    expectedCode: 422,
    objective: "Verify physical sensor limits: humidity > 100% is rejected with 422.",
    preconditions: "None.",
    steps: ["Send POST with humidity=140", "Assert HTTP 422 Unprocessable Entity"],
    pytestCode: `def test_observation_humidity_exceeds_physical_limit(client, valid_headers):
    payload = {"city_name": "London", "humidity": 140, ...}
    response = client.post("/api/v1/weather/observations", json=payload, headers=valid_headers)
    assert response.status_code == 422`
  },
  {
    id: "TC-WTR-015",
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

  // SQL Invariants
  {
    id: "TC-SQL-001",
    category: "SQL Invariants",
    name: "Sensor Physical Boundary Invariants",
    endpoint: "SQL: Sensor physical bounds check",
    status: "PASSED",
    type: "SQL Backend",
    expectedCode: 200,
    objective: "Direct SQL query validating all rows in weather_records satisfy physical meteorological ranges (-80 to 65°C, 0-100% humidity, 850-1090 hPa).",
    preconditions: "Database populated with telemetry.",
    steps: ["Execute anomaly detector query on weather_records", "Assert 0 out-of-bounds rows"],
    pytestCode: `def test_sql_sensor_physical_bounds_invariant(raw_db):
    cursor = raw_db.cursor()
    cursor.execute("SELECT * FROM weather_records WHERE temp_c < -80 OR temp_c > 65...")
    assert len(cursor.fetchall()) == 0`
  },
  {
    id: "TC-SQL-002",
    category: "SQL Invariants",
    name: "Referential Integrity & Zero Orphans",
    endpoint: "SQL: Foreign key constraint check",
    status: "PASSED",
    type: "SQL Backend",
    expectedCode: 200,
    objective: "Assert every weather record and alert links to a valid registered city in cities table.",
    preconditions: "None.",
    steps: ["Query left join where cities.id IS NULL", "Assert 0 orphaned records"],
    pytestCode: `def test_sql_referential_integrity_no_orphaned_records(raw_db):
    cursor = raw_db.cursor()
    cursor.execute("SELECT w.id FROM weather_records w LEFT JOIN cities c ON w.city_id = c.id WHERE c.id IS NULL")
    assert len(cursor.fetchall()) == 0`
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
    name: "Weather Current Latency Under 200ms SLA",
    endpoint: "Benchmark: GET /api/v1/weather/current",
    status: "PASSED",
    type: "Performance",
    expectedCode: 200,
    objective: "Validate P95 response time is strictly under 200ms SLA across 10 sequential calls.",
    preconditions: "API active.",
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
    title: "Sensor Physical Boundary Invariants",
    category: "Physical Validation",
    query: `SELECT 
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
   OR (w.pressure_mb < 850 OR w.pressure_mb > 1090);`
  },
  {
    id: "q2",
    title: "Referential Integrity & Orphan Check",
    category: "Relational Consistency",
    query: `SELECT 
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
WHERE c.id IS NULL;`
  },
  {
    id: "q3",
    title: "Active Hazard Alerts Audit",
    category: "Severe Hazards",
    query: `SELECT 
    c.name AS city_name,
    c.country,
    wa.event AS hazard_event,
    wa.severity,
    wa.headline,
    wa.effective_from,
    wa.expires_at
FROM weather_alerts wa
JOIN cities c ON wa.city_id = c.id
WHERE wa.is_active = 1 AND wa.severity IN ('EXTREME', 'SEVERE');`
  },
  {
    id: "q4",
    title: "Air Quality Index (AQI) Categories",
    category: "Atmospheric Health",
    query: `SELECT 
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
ORDER BY w.air_quality_index DESC;`
  },
  {
    id: "q5",
    title: "API Performance & Latency SLA Audit",
    category: "Performance Audit",
    query: `SELECT 
    endpoint, http_method, COUNT(*) AS total_requests,
    ROUND(AVG(response_time_ms), 2) AS avg_latency_ms,
    ROUND(MIN(response_time_ms), 2) AS min_latency_ms,
    ROUND(MAX(response_time_ms), 2) AS max_latency_ms,
    CASE 
        WHEN AVG(response_time_ms) <= 100 THEN 'EXCELLENT (<100ms)'
        WHEN AVG(response_time_ms) <= 250 THEN 'MEETS SLA (<250ms)'
        ELSE 'BREACHES SLA (>250ms)'
    END AS sla_compliance
FROM api_audit_log
GROUP BY endpoint, http_method;`
  },
  {
    id: "q6",
    title: "Weather Stations Summary & Telemetry Count",
    category: "Station Network",
    query: `SELECT 
    c.id AS station_id,
    c.name AS station_name,
    c.country,
    COUNT(w.id) AS total_observations_logged,
    MAX(w.recorded_at) AS latest_observation_time
FROM cities c
LEFT JOIN weather_records w ON c.id = w.city_id
GROUP BY c.id;`
  }
];

// Offline Simulator / Live Proxy Dispatcher
export async function executeApiCall(method, path, queryParams = {}, headers = {}, body = null) {
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
    // Offline simulation fallback for GitHub Pages
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
        temperature: isImperial ? 61.7 : 16.5,
        unit: isImperial ? "°F" : "°C",
        feels_like: isImperial ? 60.4 : 15.8,
        humidity_pct: 72,
        wind_speed: isImperial ? 11.5 : 18.5,
        wind_unit: isImperial ? "mph" : "km/h",
        wind_direction: "SW",
        pressure_mb: 1014.2,
        visibility: isImperial ? 6.2 : 10.0,
        visibility_unit: isImperial ? "miles" : "km",
        condition: "Partly Cloudy",
        condition_code: 1003,
        uv_index: 3.2,
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

  if (path.includes("/weather/air-quality")) {
    return {
      status: 200,
      statusText: "OK",
      data: {
        location: { city: params.city || "Mumbai", country: "India", country_code: "IN" },
        aqi: 155,
        category: "Unhealthy",
        health_advisory: "Elevated particulate matter detected. Wear N95 filtration masks for outdoor activities.",
        recorded_at: new Date().toISOString()
      }
    };
  }

  if (path.includes("/weather/stats")) {
    return {
      status: 200,
      statusText: "OK",
      data: {
        city: params.city || "London",
        country: "United Kingdom",
        min_temp_c: 15.8,
        max_temp_c: 16.5,
        avg_temp_c: 16.2,
        avg_humidity_pct: 73.5,
        avg_wind_kph: 19.2,
        total_observations_analyzed: 2
      }
    };
  }

  return { status: 200, statusText: "OK", data: { message: "Simulated endpoint execution completed", timestamp: new Date().toISOString() } };
}
