# Cash Flow Forecasting Dashboard - Test Tracker

**Date:** June 16, 2026
**Environment:** Local Development (SQLite, Node.js, React + Vite)

| Test ID | System Module | Scenario Description | Expected Outcome | Actual Outcome | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC01** | Global Server | Perform basic GET /health check on the backend API. | Server returns HTTP 200 with { status: "ok" } payload. | Server returned HTTP 200. | [x] PASS |
| **TC02** | Projects | POST to /project_cash_flow_forecasting with missing required fields (empty monthly). | API rejects request with HTTP 400 and validation error. | Rejected with HTTP 400. | [x] PASS |
| **TC03** | Projects | POST to /project_cash_flow_forecasting with complete valid payload. | Project is created successfully; API returns HTTP 201 with project ID. | Created successfully with HTTP 201. | [x] PASS |
| **TC04** | Projects | GET /project_cash_flow_forecasting/:id/detail with a valid, existing project ID. | Returns HTTP 200 with complete project object and nested audit_logs array. | Returned detailed object with HTTP 200. | [x] PASS |
| **TC05** | Projects | GET /project_cash_flow_forecasting/:id/detail with a non-existent ID (e.g., 999999). | Graceful degradation, returning HTTP 404 Project Not Found. | Returned HTTP 404 safely. | [x] PASS |
| **TC06** | Projects | PUT /project_cash_flow_forecasting/:id with valid fields to update an existing project. | Project updates successfully; API returns HTTP 200. | Updated successfully with HTTP 200. | [x] PASS |
| **TC07** | Projects | PUT /project_cash_flow_forecasting/:id with an invalid/non-existent ID. | API rejects update and returns HTTP 404 Project Not Found. | Returned HTTP 404. | [x] PASS |
| **TC08** | Projects | PATCH /project_cash_flow_forecasting/:id/status to change project status to 'completed'. | Status updates successfully; API returns HTTP 200. | Patched successfully with HTTP 200. | [x] PASS |
| **TC09** | Projects | GET /project_cash_flow_forecasting without pagination parameters. | Returns full list of projects in an array structure (HTTP 200). | Returned full array with HTTP 200. | [x] PASS |
| **TC10** | Projects | GET /project_cash_flow_forecasting?limit=1&page=1 testing pagination. | Returns exactly 1 project object and accurate pagination metadata. | Returned length 1 with metadata. | [x] PASS |
| **TC11** | Projects | GET /project_cash_flow_forecasting?status=completed testing status filters. | Returns only projects matching the "completed" status. | Filtered successfully. | [x] PASS |
| **TC12** | Projects | GET /project_cash_flow_forecasting?search=Alpha testing text search filtering. | Returns projects containing the search string "Alpha". | Search matched successfully. | [x] PASS |
| **TC13** | Payments | POST to /payments with missing "inflows" field. | API rejects payment creation with HTTP 400. | Rejected with HTTP 400. | [x] PASS |
| **TC14** | Payments | POST to /payments with valid large amount ($150,000) to trigger future alerts. | Payment is recorded; API returns HTTP 201. | Recorded successfully with HTTP 201. | [x] PASS |
| **TC15** | Payments | GET /payments to fetch the complete chronological list of recorded outflows. | Returns HTTP 200 with array of payment objects ordered by date. | Returned payments list. | [x] PASS |
| **TC16** | Dashboard | GET /dashboard/summary to fetch raw KPI summary totals. | Returns HTTP 200 with totalProjects, activeProjects, etc., as numeric values. | KPI data returned accurately. | [x] PASS |
| **TC17** | Forecasting | GET /reports/summary to invoke the Forecasting Engine. | Aggregates data safely; returns totals and timeSeries array (HTTP 200). | Aggregated successfully. | [x] PASS |
| **TC18** | Forecasting | Validate dynamic Alerts generation in /reports/summary (Budget Ceilings). | Engine detects $150k outflow and attaches a budget_ceiling alert to the payload. | Alert triggered properly. | [x] PASS |
| **TC19** | Projects | DELETE /project_cash_flow_forecasting/:id to test deletion routing. | Returns appropriate HTTP response (200/404 or method not allowed 405). | Response handled properly. | [x] PASS |
| **TC20** | Global | POST payload testing with a completely empty JSON object {}. | Server catches empty object and responds with HTTP 400. | Rejected successfully. | [x] PASS |
| **TC21** | Global | Inject malformed JSON (SyntaxError) payload missing braces. | Global error middleware intercepts before crash, returning HTTP 400. | Intercepted safely (No crash). | [x] PASS |
| **TC22** | Audit Logs | Validate that recent project modifications (TC06/TC08) appended to audit_logs. | GET /detail includes "status changed" or "payment added" in the history. | Audit logs correctly appended. | [x] PASS |
| **TC23** | Routing | Validate base GET by ID route directly (without /detail). | Returns correct single record or 404 if invalid. | Routed correctly. | [x] PASS |
| **TC24** | Routing | Request an unknown API path like /api/unknown_route_999. | Express router catches it and returns HTTP 404 gracefully. | Gracefully returned 404. | [x] PASS |
