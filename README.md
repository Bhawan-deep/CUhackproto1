# Agent Economy Simulator — Real-Time Agent-Based City/Economic Simulation Platform

Phase 1 foundation for a real-time agent-based city/economic policy simulation platform.

## Architecture

```
React (Vite + Tailwind CSS)
   │
   ├── REST API (Fetch Client)
   └── WebSocket (Phase 2+)
   │
   ▼
FastAPI Backend
   │
   ├───────────────┐
   ▼               ▼
SimulationManager PostgreSQL (SQLAlchemy 2.x ORM)
   │
   ▼
SimulationEngine Interface (Phase 2)
   ├── MockSimulationEngine (Dev)
   └── ExternalSimulationEngineAdapter (ML Engine)
```

> **Design Constraint**: Zero Redis and Zero Docker dependencies for Phase 1 hackathon development.

---

## Technical Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, Lucide React Icons.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, SQLAlchemy 2.0, PostgreSQL (`psycopg` driver), `uvicorn`.

---

## Backend Setup & Execution

### 1. Create Virtual Environment
```bash
cd backend
python -m venv .venv
```

Activate the virtual environment:
- **Windows (PowerShell)**: `.venv\Scripts\Activate.ps1`
- **Windows (CMD)**: `.venv\Scripts\activate.bat`
- **Linux/macOS**: `source .venv/bin/activate`

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `DATABASE_URL` if your local PostgreSQL credentials differ from the default (`postgresql+psycopg://postgres:postgres@localhost:5432/economy_sim`).

### 4. Create PostgreSQL Database
Make sure PostgreSQL service is running on your machine, then create the database:
```sql
CREATE DATABASE economy_sim;
```

### 5. Run FastAPI Backend Server
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
Database tables will automatically be created on server startup via `init_db()`.

---

## Frontend Setup & Execution

### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `VITE_API_URL` is set to `http://localhost:8000`.

### 3. Run Vite Development Server
```bash
npm run dev
```

---

## Access Points & Documentation

- **Frontend Application**: [http://localhost:5173](http://localhost:5173)
- **Backend API Root**: [http://localhost:8000](http://localhost:8000)
- **FastAPI Interactive Docs (Swagger UI)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **FastAPI OpenAPI Schema**: [http://localhost:8000/openapi.json](http://localhost:8000/openapi.json)

---

## API Endpoints Summary

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint returning `{ "status": "ok", "service": "simulation-api" }` |
| `POST` | `/api/simulations` | Create a new simulation instance (`name`, `random_seed`) |
| `GET` | `/api/simulations` | Retrieve list of all simulation records |
| `GET` | `/api/simulations/{id}` | Retrieve details of a specific simulation by UUID |
