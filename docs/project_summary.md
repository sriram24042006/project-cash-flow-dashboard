# Project Summary: Cash Flow Forecasting Dashboard

## 1. Prototype Structure

This prototype is a full-stack web application designed to forecast and manage 60-day forward-looking liquidity. The architecture is cleanly divided into a distinct backend API and a modern React frontend.

**Directory Layout:**
- `/backend`: Node.js + Express API server acting as the core brain. It manages data routing, algorithmic aggregation, and interfaces with the SQLite database.
- `/frontend`: Vite + React single-page application built with a floating glassmorphism UI language, powered by Tailwind CSS and Recharts.
- `/docs`: Technical documentation and testing artifacts for the review panel.
- `/tests`: Automated backend verification scripts ensuring API integrity.

---

## 2. Schema Design Definitions

The backend relies on a lightweight, locally instantiated SQLite database (`cash_flow.db`). To streamline the prototype, 5 core tables were utilized:
1. `project_cash_flow_forecasting`
2. `payments`
3. `customers`
4. `inventory`
5. `contracts`

**Universal Core Schema:**
All tables share the same core field structure to allow seamless aggregation by the workflow stage management engine.

| Field | Type | Description |
| :--- | :--- | :--- |
| `id` | INTEGER | Primary Key (Autoincrement) |
| `Projects` | TEXT | Identifier connecting related billing/milestones |
| `monthly` | TEXT | YYYY-MM tracking string |
| `inflows` | REAL | The monetary amount (can represent an outflow based on the table) |
| `status` | TEXT | e.g., 'active', 'completed', 'archived' |
| `created_at` | DATETIME | Timestamp of creation |
| `updated_at` | DATETIME | Timestamp of last modification |

---

## 3. Quick Start Instruction Guide

Follow these steps to spin up the local development environments.

### Prerequisites
- Node.js (v16+)
- npm

### Starting the Backend
1. Open a new terminal window.
2. Navigate into the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies (if not already done):
   ```bash
   npm install
   ```
4. Start the server. (The SQLite database will auto-initialize on the first run).
   ```bash
   node server.js
   ```
   *The server will run on `http://localhost:5000`.*

### Starting the Frontend
1. Open a second terminal window.
2. Navigate into the frontend directory:
   ```bash
   cd frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The UI will typically be available at `http://localhost:5173`.*

### Running Automated Tests
To run the automated backend verification suite:
1. Ensure the backend server is actively running.
2. Open a terminal and navigate to the tests folder:
   ```bash
   cd tests
   ```
3. Execute the node script:
   ```bash
   node backendVerification.js
   ```
