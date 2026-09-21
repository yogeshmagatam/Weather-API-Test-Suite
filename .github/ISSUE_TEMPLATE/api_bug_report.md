---
name: "API Defect / Bug Report"
about: "Report a reproducible defect in the Weather or Flight-Booking API"
title: "[BUG] <Concise defect summary>"
labels: ["bug", "api-defect", "needs-triage"]
assignees: ""
---

### Defect Summary
<!-- Provide a clear and concise description of what the bug is. -->

### Target Endpoint & HTTP Method
- **Method**: `[GET / POST / PATCH / DELETE]`
- **Endpoint**: `/api/v1/...`
- **Environment**: `[Local Dev / Staging / CI]`

### Steps to Reproduce
1. Dispatch request with parameters/body:
```bash
curl -X GET "http://localhost:8000/api/v1/..." \
  -H "Accept: application/json"
```
2. Observe HTTP response status code and JSON body.

### Expected Behavior
- **Expected Status Code**: e.g., `200 OK` or `422 Unprocessable Entity`
- **Expected JSON Schema / Response**:

### Actual Behavior
- **Actual Status Code**: e.g., `500 Internal Server Error`
- **Actual JSON Response**:
```json
{
  "error": "..."
}
```

### SQL Invariant Impact
<!-- Did this defect violate any database constraints (e.g. seat inventory discrepancy, duplicate seat, orphaned row)? -->
- [ ] Yes (Describe: )
- [ ] No / Purely HTTP Layer

### Severity & Priority
- **Severity**: `[Blocker / Critical / Major / Minor]`
- **Priority**: `[P0 / P1 / P2 / P3]`
