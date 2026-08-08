# Agent Economy Simulator & Bounty Workspace

A deterministic macro-economic simulation platform paired with a legal audit and intelligence workspace. The platform models multi-entity economic interactions, behavioral decision dynamics, causal explainability, and legal document verification workflows.

---

## Short Project Description

The Agent Economy Simulator provides real-time modeling of artificial macro-economies through autonomous agents (citizens, businesses, banks, government). It features historical time replay, counterfactual branching, live causal tracing, and a standalone Bounty Workspace for legal record verification, multi-field search, review brief synthesis, and dossier packaging.

---

## What the Project Does

1. **Simulates Macro-Economic Systems**: Runs step-by-step monthly macroeconomic calculations tracking GDP, inflation, unemployment, market liquidity, corporate solvency, and citizen welfare.
2. **Models Autonomous Agent Behaviors**: Simulates decision loops for citizens (spending, saving, labor), firms (hiring, investment, tax compliance), commercial banks (credit risk), and central banks (monetary policy).
3. **Provides Causal Explainability**: Explains macro-economic metric shifts using causal delta paths ("WHY DID THIS CHANGE?").
4. **Enables Counterfactual Experimentation**: Supports Parallel Universe branching to test alternative economic policies against baseline trajectories.
5. **Hosts a Legal Bounty Workspace**: Offers an isolated legal intelligence console (`/bounties`) for verifying synthetic audit records, executing multi-field search queries, synthesizing 6-section review briefs, and exporting JSON/PDF dossiers.

---

## Main Problem / Idea

Economic policy decisions and regulatory compliance audits often suffer from unpredictable system-wide feedback loops and fragmented verification data. 

This project addresses these challenges by combining:
- A closed-loop macro-economic simulation engine that visualizes complex causal relationships between government policy and agent behavior.
- An editorial legal research workspace that streamlines compliance document auditing, verification tracking, and dossier packaging.

---

## Agent Economy Simulator

The core simulator models a closed macro-economy across sequential monthly ticks. It integrates real-time WebSocket state streaming, React Flow canvas visualization, policy controls, historical time travel, and counterfactual parallel branching.

```
+-----------------------------------------------------------------------+
|                       AGENT ECONOMY SIMULATOR                         |
+-----------------------------------------------------------------------+
|                                                                       |
|  +--------------------+     +------------------+     +-------------+  |
|  |     POLICY LAB     |     |   SHOCK LAB      |     | TIME TRAVEL |  |
|  | Subsidies & Rates  |     | Supply/Demand    |     | Replay Ticks|  |
|  +---------+----------+     +--------+---------+     +------+------+  |
|            |                         |                      |         |
|            v                         v                      v         |
|  +-----------------------------------------------------------------+  |
|  |                    SIMULATION ENGINE (FastAPI)                  |  |
|  |   - Citizen Utility & Labor    - Business Tax & Solvency        |  |
|  |   - Bank Credit & Liquidity    - Causal Trace Generator         |  |
|  +-----------------------------------+-----------------------------+  |
|                                      |                                |
|                                      v                                |
|  +-----------------------------------------------------------------+  |
|  |                 REACT DASHBOARD & REACT FLOW CANVAS             |  |
|  |   - Entity Inspector           - Live Event Feed                |  |
|  |   - Causal Pulse Overlay       - Macro Metric Graphs            |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Economic Entities

- **Citizens**: Manage personal income, consumption choices, labor supply, healthcare, and tax obligations.
- **Businesses**: Execute hiring decisions, production scheduling, pricing strategies, capital investment, and tax compliance (Cooperate vs Defect posture).
- **Commercial Banks**: Manage liquidity reserves, loan interest spreads, credit availability, and default risks.
- **Central Bank**: Sets baseline interest rates, reserve ratios, and monetary policy directives to control inflation.
- **Government**: Administers fiscal stimulus, infrastructure grants, tax policies, and healthcare subsidies.

---

## Core Simulator Features

- **Interactive Economic Canvas**: Visual node graph built with React Flow representing financial and resource flows between economic entities.
- **Policy & Shock Labs**: Trigger fiscal stimulus, monetary rate shifts, labor shocks, or supply disruptions in real time.
- **Time Machine**: Capture snapshot states at any tick and replay historical simulation steps.
- **Parallel Universe**: Branch the simulation at any historical point to compare alternative policy decisions side by side.
- **Causal Explainability**: Trace root causes for economic metric changes through structured delta paths.

---

## Phase 1–9 Overview

| Phase | Module Name | Core Capabilities |
| :--- | :--- | :--- |
| **Phases 1–4** | Architecture & Engine | FastAPI backend, React frontend, deterministic engine, WebSocket streaming, React Flow canvas |
| **Phase 5** | Policy & Shock Lab | Real-time policy adjustments, economic shock injection, impact tracking |
| **Phase 6** | Time Machine | Tick snapshot storage, historical state replay, past snapshot restoration |
| **Phase 7** | Parallel Universe | Counterfactual scenario branching, baseline vs alternative policy comparison |
| **Phase 8** | Agent Intelligence | Multi-entity decision loops, prisoner's dilemma compliance, credit risk models |
| **Phase 9** | Economic Nervous System | "WHY DID THIS CHANGE?" engine, Causal Pulse, Entity Inspector, Live Event Feed |

---

## Economic Nervous System

Phase 9 introduces the Economic Nervous System, which exposes the underlying causal chains behind simulation events:

- **"WHY DID THIS CHANGE?"**: Computes exact delta contributions explaining metric shifts (e.g. why GDP decreased between Tick 5 and Tick 10).
- **Entity Inspector**: Displays agent-specific state attributes, balance sheets, and historical decision paths.
- **Causal Pulse**: Visual overlay illuminating active policy propagation paths across the node graph.
- **Live Event Feed**: Real-time log of systemic events, policy activations, and economic shocks.

---

## Bounty Workspace

Accessible at `/bounties`, the Bounty Workspace is a standalone legal intelligence and review desk. It operates completely decoupled from the simulation engine, providing document verification, search, review brief synthesis, and dossier export capabilities.

```
+-----------------------------------------------------------------------+
|                    BOUNTY WORKSPACE (/bounties)                       |
+-----------------------------------------------------------------------+
|                                                                       |
|   01 FIND              02 VERIFY            03 ANALYZE    04 PACKAGE  |
|  Search & Filter  ->  Status & Notes  ->  Review Brief -> Export      |
|                                                                       |
|  +---------------------+  +----------------------------------------+  |
|  | SEARCH & FILTER     |  | LEGAL RECORD VIEWER                    |  |
|  | - Keyword Search    |  | - Document Metadata Rail               |  |
|  | - Type / Risk       |  | - Verbatim Statutory Clauses           |  |
|  | - Status Filter     |  | - Status Dropdown & Reviewer Notes     |  |
|  +---------------------+  +----------------------------------------+  |
|                                                                       |
|  +-----------------------------------------------------------------+  |
|  | REVIEW BRIEF MODAL & EXPORT (JSON Download / Print PDF)         |  |
|  +-----------------------------------------------------------------+  |
|                                                                       |
+-----------------------------------------------------------------------+
```

---

## Bounty Features

The Bounty Workspace implements five feature areas:

1. **Legal Record Verification**: Assign verification statuses (`DRAFT`, `NEEDS_REVIEW`, `VERIFIED`, `REJECTED`) and record reviewer notes with `localStorage` persistence (`bounty_legal_records_v1`).
2. **Search and Filtering**: Instant client-side search across record IDs, titles, types, jurisdictions, categories, risk levels, clauses, and reviewer notes using composed `AND` filter logic.
3. **Legal Review Brief**: Deterministic synthesis of 6-section executive review briefs (Record Overview, Document Clauses, Review Status, Review Flags, Review Checklist, Reviewer Observations).
4. **Dossier Export**: Client-side JSON package download (`${record.id}-review-dossier.json`) and print-ready PDF document formatting.
5. **Evaluator Experience / Polish**: 4-step workflow stepper, workspace status indicators, keyboard accessibility (Escape to close modals), and visual design consistency.

---

## FIND -> VERIFY -> ANALYZE -> PACKAGE Workflow

1. **01 FIND**: Search legal records using keywords or filter by document type, jurisdiction, category, verification status, and risk level.
2. **02 VERIFY**: Select a record, inspect document clauses, update verification status (`DRAFT`, `NEEDS_REVIEW`, `VERIFIED`, `REJECTED`), and save reviewer notes.
3. **03 ANALYZE**: Click `GENERATE REVIEW BRIEF` to review the synthesized 6-section legal research brief and factual review flags.
4. **04 PACKAGE**: Click `DOWNLOAD JSON` to save the machine-readable archive or `SAVE AS PDF` for a print-ready document.

---

## Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.2.0
- **Styling**: TailwindCSS 3.4.1, PostCSS 8.4.38, Autoprefixer 10.4.19
- **Diagramming & Graphs**: @xyflow/react 12.11.2
- **Icons**: Lucide React 0.344.0

### Backend
- **Framework**: FastAPI 0.100.0+
- **Server**: Uvicorn 0.22.0+
- **ORM & Database**: SQLAlchemy 2.0.0+, Psycopg 3.1.0+ (PostgreSQL driver)
- **Validation**: Pydantic 2.0.0+, Pydantic Settings 2.0.0+
- **Environment Management**: Python Dotenv 1.0.0+

---

## Project Structure

```
cuhackathon/
├── backend/
│   ├── app/
│   │   ├── api/             # REST endpoints & WebSocket routers
│   │   ├── core/            # App configuration (config.py)
│   │   ├── db/              # SQLAlchemy session & database setup
│   │   ├── explainability/  # Causal trace engine & event generators
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic data validation schemas
│   │   ├── services/        # Business logic & simulation state managers
│   │   ├── simulation/      # Core economic simulation engine
│   │   └── main.py          # FastAPI application entry point
│   ├── tests/               # Backend test suites (test_causal_explainability.py)
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components & bounty components
│   │   │   └── bounty/      # Isolated bounty workspace components
│   │   ├── data/            # Sample legal audit records dataset
│   │   ├── pages/           # Dashboard.jsx & BountyWorkspace.jsx
│   │   ├── utils/           # Bounty storage & dossier export helpers
│   │   ├── App.jsx          # Top-level application router
│   │   └── main.jsx         # React application entry point
│   ├── package.json         # Node.js dependencies
│   ├── vite.config.js       # Vite configuration
│   └── vercel.json          # Vercel deployment rewrite rules
└── README.md
```

---

## How to Run Locally

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Start the Backend Server

```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
$env:PYTHONPATH="."
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend server runs at `http://127.0.0.1:8000`.

### 2. Start the Frontend Server

```bash
cd frontend
npm install
npm run dev
```

The frontend application runs at `http://localhost:5173`.

---

## Environment Variables

### Backend Configuration (`backend/.env`)

```ini
# Application Name
PROJECT_NAME=Agent Economy Simulator

# PostgreSQL Connection URL
# Local SQLite default or Neon PostgreSQL connection URL
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/economy_sim

# Allowed CORS Origin for Frontend
FRONTEND_ORIGIN=http://localhost:5173

# Engine Tick Interval (seconds)
SIMULATION_TICK_INTERVAL=1.0

# Simulation Engine Type
SIMULATION_ENGINE=mock
```

---

## Deployment Architecture

The application supports production deployment across managed cloud platforms:

- **Database**: Neon Serverless PostgreSQL (`postgresql+psycopg://...`).
- **Backend**: Render web service executing Uvicorn (`python -m uvicorn app.main:app`).
- **Frontend**: Vercel static site hosting with `vercel.json` SPA rewrite rules routing `/` and `/bounties` to `index.html`.

---

## Testing and Verification

### 1. Frontend Production Build

```bash
cd frontend
npm run build
```

*Result*: Clean compilation (`✓ built in 5.42s`, 0 errors).

### 2. Backend Causal Explainability Regression Suite

```bash
cd backend
$env:PYTHONPATH='.'
.venv\Scripts\python.exe tests/test_causal_explainability.py
```

*Result*: **100% PASS** (All 8 unit tests A–H and 18-month demo scenario passed).

---

## Demo Flow

1. **Main Simulator Dashboard (`/`)**:
   - Inspect macro metrics (GDP, Inflation, Solvency).
   - Trigger policy changes in Policy Lab or economic shocks in Shock Lab.
   - Click any node in React Flow canvas to view the **Entity Inspector**.
   - Click **WHY DID THIS CHANGE?** to trace causal deltas.
   - Use **Time Machine** to replay historical ticks or **Parallel Universe** to branch scenarios.

2. **Bounty Workspace (`/bounties`)**:
   - Click **BOUNTY WORKSPACE** in the top navigation bar.
   - Click **OPEN CONSOLE** to enter the legal investigation workspace.
   - Search for `stimulus` or filter by Risk Level = `MEDIUM`.
   - Select record `REC-2026-081`.
   - Change verification status to `VERIFIED`, enter reviewer notes, and click `SAVE REVIEW`.
   - Click `GENERATE REVIEW BRIEF` to review the synthesized 6-section brief.
   - Click `DOWNLOAD JSON` to save the JSON dossier or `SAVE AS PDF` for print-ready formatting.
   - Click `RETURN TO SIMULATOR` to navigate back to the main simulator.

---

## Current Project Status

- **Phase 1–9 Core Simulator**: **COMPLETE** (Engine, WebSockets, Policy Lab, Time Machine, Parallel Universe, Agent Intelligence, Economic Nervous System).
- **Phase B1–B6 Bounty Workspace**: **COMPLETE** (Verification, Search/Filter, Review Brief, Dossier Export, Evaluator Polish).
- **Automated Test Suites**: **100% PASSing**.
- **Production Build**: **0 Errors**.

---

## Important Notes

> **SYNTHETIC DEMONSTRATION RECORD — NOT LEGAL ADVICE**
> 
> The legal audit records contained within the Bounty Workspace (`REC-2026-081`, `REC-2026-094`, etc.) are synthetic sample demonstration records created for audit workflow testing. They do not constitute real-world legal advice, statutory rulings, or legal representation.
