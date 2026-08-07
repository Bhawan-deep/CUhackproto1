# 🏛 Agent Economy Simulator — Real-Time Economic Twin & Policy Lab

> **Current Project Stage: Phase 9 — Economic Nervous System (Fully Functional & Verified)**
>
> A standalone, real-time agent-based economic simulation platform and policy lab powered by FastAPI, PostgreSQL, WebSockets, React, and React Flow.

---

## 🌟 Key Features & Phase Breakdown

### 🧠 Phase 8 & 9: Agent Economy & Causal Explainability (Current Stage)
- **Autonomous Agent Decision Provider**: Independent agent decision layers for **Finance**, **Health**, **Infrastructure**, and **Central Bank**.
- **Game-Theory Business Dynamics**: Businesses execute strategic game moves (*Prisoner's Dilemma* payoffs: `COOPERATE` vs. `DEFECT` with Tit-for-Tat and Grim Trigger strategies).
- **Tax Compliance & Trust Modeling**: Citizen compliance reacts dynamically to tax burdens, government trust, and public satisfaction.
- **WHY DID THIS CHANGE? Entity Inspector**: Deep causal trace modal dissecting empirical deltas down to specific policy changes, agent actions, and market forces.
- **Causal Pulse Visual Propagation**: Real-time visual animation of policy and shock propagation along economic graph edges in React Flow.
- **Macro Metric Causal Decomposition**: Modal breaking down GDP, employment, satisfaction, and business health into primary causal drivers.
- **Live Event Feed**: Streamed audit feed of economic interventions, agent choices, and market reactions.

### 🔬 Phase 5–7: Intervention Lab, Time Machine & Parallel Universes
- **Intervention Lab**:
  - **Policy Lab**: Dynamic tax rate (0%–60%) and infrastructure spending ($0–$500k) sliders.
  - **Shock Lab**: Inject economic shocks (`Recession`, `Economic Boom`, `Flood`, `Factory Closure`, `Investment Stimulus`).
- **Historical Time Machine**: Per-tick PostgreSQL JSONB state snapshots with non-destructive historical replay scrubbing.
- **Parallel Universe Counterfactuals**: Fork baseline (Universe A) and variant (Universe B) futures from identical historical snapshot ticks to measure counterfactual impact side-by-side.

### ⚡ Phase 1–4: Core Engine & Interactive Economic World
- **Deterministic Engine**: Seed-based reproducibility guarantees identical outcomes for identical inputs.
- **Interactive Graph Visualization**: Custom React Flow rendering of Government, Central Bank, Business nodes, and aggregated Citizen Groups with live money flow edge animations.
- **Full Lifecycle Control**: `START`, `PAUSED`, `RESUME`, `STEP`, and `RESET`.
- **WebSocket Ticking**: Real-time tick streaming at up to 4 Hz.

---

## 🏗 System Architecture

```
React + Vite Frontend (React Flow + Vanilla CSS + Tailwind)
   │
   ├── REST API (Fetch Client)
   └── WebSockets (Real-Time Tick Streaming)
   │
 FastApi Backend (Uvicorn Async ASGI)
   │
   ├── SimulationManager & SimulationEngine (Mock Engine)
   ├── AgentDecisionProvider Architecture (Finance, Health, Infra, Bank)
   ├── CausalTraceBuilder & StateDeltaAnalyzer (Causal Explainability)
   └── SQLAlchemy 2.0 ORM -> PostgreSQL (Persistent Snapshots & History)
```

> **Design Constraint**: Zero Redis and Zero Docker dependencies. Entire platform runs locally using FastAPI & PostgreSQL.

---

## 🛠 Technical Stack

- **Frontend**: React 18, Vite, JavaScript, React Flow, Lucide React Icons, Vanilla CSS & Tailwind CSS.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, PostgreSQL (`psycopg` driver), `uvicorn`, `websockets`.

---

## 🚀 Local Quick Start Guide

### 1. Backend Setup (FastAPI & PostgreSQL)

```bash
cd backend

# Create & activate virtual environment
python -m venv .venv
# PowerShell (Windows):
.venv\Scripts\Activate.ps1
# Bash (Linux/macOS):
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
```

Make sure PostgreSQL is running locally and update `DATABASE_URL` in `.env` if needed:
```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/economy_sim
FRONTEND_ORIGIN=http://localhost:5173
```

Run the backend development server:
```bash
$env:PYTHONPATH='.'; .venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*Database tables are automatically created on server startup via `init_db()`.*

---

### 2. Frontend Setup (React & Vite)

```bash
cd frontend

# Install Node modules
npm install

# Run Vite dev server
npm run dev
```

---

## 🌐 Live Access Points

| Component | URL | Description |
| :--- | :--- | :--- |
| **Frontend Application** | [http://localhost:5173](http://localhost:5173) | Interactive Economic Twin Dashboard |
| **Backend API Root** | [http://127.0.0.1:8000](http://127.0.0.1:8000) | FastAPI Base Server |
| **FastAPI Swagger Docs** | [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs) | Interactive API Specification |
| **Health Check** | [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health) | System Health Endpoint |

---

## 🧪 Automated Test Suites & Regression Verification

Run the full suite of automated regression tests from the `backend/` directory:

```bash
cd backend

# Phase 9: Causal Explainability & Trace Builder
$env:PYTHONPATH='.'; .venv\Scripts\python.exe tests/test_causal_explainability.py

# Phase 8: Agent Economy Foundation & Game Theory
$env:PYTHONPATH='.'; .venv\Scripts\python.exe tests/test_agent_foundation.py

# Phase 7: Parallel Universe Counterfactual Experiments
$env:PYTHONPATH='.'; .venv\Scripts\python.exe tests/test_experiments.py

# Phase 6: Historical Time Machine & Snapshots
$env:PYTHONPATH='.'; .venv\Scripts\python.exe tests/test_timeline.py

# Phase 5: Intervention Lab & Impact Deltas
$env:PYTHONPATH='.'; .venv\Scripts\python.exe tests/test_phase5_interventions.py

# Phase 3: Lifecycle Controls (START / PAUSE / RESUME / STEP / RESET)
$env:PYTHONPATH='.'; .venv\Scripts\python.exe tests/test_lifecycle.py
```

---

## 📋 Primary API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status |
| `POST` | `/api/simulations` | Create a new economic simulation twin |
| `GET` | `/api/simulations/{id}/world` | Detailed world state formatted for React Flow |
| `POST` | `/api/simulations/{id}/start` | Start automatic runner |
| `POST` | `/api/simulations/{id}/pause` | Pause background runner |
| `POST` | `/api/simulations/{id}/step` | Advance exactly 1 tick manually |
| `PUT` | `/api/simulations/{id}/policy` | Update government policy (tax rate, infrastructure) |
| `POST` | `/api/simulations/{id}/events` | Inject economic shock event |
| `GET` | `/api/simulations/{id}/timeline` | Metadata timeline & intervention markers |
| `GET` | `/api/simulations/{id}/snapshots/{tick}` | Historical read-only snapshot |
| `POST` | `/api/experiments/simulations/{id}` | Fork Parallel Universe counterfactual experiment |
| `GET` | `/api/simulations/{id}/explain/{tick}` | Retrieve Phase 9 causal explanation trace |
| `GET` | `/api/simulations/{id}/explain/{tick}/entity/{entity_id}` | Entity-specific causal trace |
