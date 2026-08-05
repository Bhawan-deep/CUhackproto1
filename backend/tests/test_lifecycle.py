import asyncio
from uuid import uuid4
import httpx
from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation, SimulationStatus, Snapshot
from app.services.simulation_service import SimulationService

init_db()


async def test_lifecycle_suite():
    print("\n==================================================")
    print("      PHASE 3 LIFECYCLE AUTOMATED TEST SUITE")
    print("==================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # 1. Create Simulation (Status: CREATED)
        res_create = await client.post("/api/simulations", json={"name": "Lifecycle Test Sim", "random_seed": 42})
        assert res_create.status_code == 201
        sim_id = res_create.json()["id"]
        assert res_create.json()["status"] == "created"
        assert res_create.json()["current_tick"] == 0
        print("[PASS] 1. Create Simulation -> Status: CREATED, Tick: 0")

        # 2. START & Automatic Ticking
        res_start = await client.post(f"/api/simulations/{sim_id}/start")
        assert res_start.status_code == 200
        assert res_start.json()["status"] == "running"
        print("[PASS] 2. POST /start -> Status: RUNNING")

        # Non-blocking async sleep yielding to background runner loop
        await asyncio.sleep(2.5)

        res_runtime = await client.get(f"/api/simulations/{sim_id}/runtime")
        assert res_runtime.status_code == 200
        tick_after_auto = res_runtime.json()["current_tick"]
        assert tick_after_auto >= 2, f"Expected tick >= 2 after 2.5s auto-ticking, got {tick_after_auto}"
        print(f"[PASS] 3. Automatic ticking verified -> Current Tick: {tick_after_auto}")

        # 3. Duplicate START Idempotency
        res_dup_start = await client.post(f"/api/simulations/{sim_id}/start")
        assert res_dup_start.status_code == 200
        assert res_dup_start.json()["status"] == "running"
        assert "already running" in res_dup_start.json()["message"]
        print("[PASS] 4. Duplicate START returned safe idempotent response without doubling runners")

        # 4. STEP while RUNNING -> Must return HTTP 409 Conflict
        res_step_running = await client.post(f"/api/simulations/{sim_id}/step")
        assert res_step_running.status_code == 409
        assert "Pause the simulation before manually stepping" in res_step_running.json()["detail"]
        print("[PASS] 5. STEP while RUNNING rejected with HTTP 409 Conflict as required")

        # 5. PAUSE Freezes Ticks
        res_pause = await client.post(f"/api/simulations/{sim_id}/pause")
        assert res_pause.status_code == 200
        assert res_pause.json()["status"] == "paused"
        paused_tick = res_pause.json()["current_tick"]

        await asyncio.sleep(2.5)

        res_runtime_paused = await client.get(f"/api/simulations/{sim_id}/runtime")
        assert res_runtime_paused.json()["current_tick"] == paused_tick
        print(f"[PASS] 6. PAUSE verified -> Tick frozen at {paused_tick} after 2.5s wait")

        # 6. Manual STEP while PAUSED -> Increments tick by exactly 1
        res_step_paused = await client.post(f"/api/simulations/{sim_id}/step")
        assert res_step_paused.status_code == 200
        assert res_step_paused.json()["tick"] == paused_tick + 1
        print(f"[PASS] 7. Manual STEP while PAUSED -> Advanced tick from {paused_tick} to {paused_tick + 1}")

        # 7. RESUME Automatic Ticking
        res_resume = await client.post(f"/api/simulations/{sim_id}/resume")
        assert res_resume.status_code == 200
        assert res_resume.json()["status"] == "running"
        print("[PASS] 8. POST /resume -> Status: RUNNING")

        await asyncio.sleep(2.0)
        await client.post(f"/api/simulations/{sim_id}/pause")

        # 8. RESET to Deterministic Tick 0
        res_reset = await client.post(f"/api/simulations/{sim_id}/reset")
        assert res_reset.status_code == 200
        assert res_reset.json()["status"] == "created"
        assert res_reset.json()["current_tick"] == 0

        db = SessionLocal()
        try:
            sim_db = db.query(Simulation).filter(Simulation.id == sim_id).first()
            assert sim_db.current_tick == 0
            assert sim_db.status == SimulationStatus.CREATED

            snapshots = db.query(Snapshot).filter(Snapshot.simulation_id == sim_id).all()
            assert len(snapshots) == 1
            assert snapshots[0].tick == 0
            print("[PASS] 9. RESET verified -> Status: CREATED, Tick: 0, Snapshots reset to Tick 0")

            # 9. Deterministic Reset Match
            res_create_ref = await client.post("/api/simulations", json={"name": "Reference Sim", "random_seed": 42})
            ref_id = res_create_ref.json()["id"]
            
            # Step both simulations once
            res_ref_step = await client.post(f"/api/simulations/{ref_id}/step")
            res_reset_step = await client.post(f"/api/simulations/{sim_id}/step")

            assert res_ref_step.json()["metrics"] == res_reset_step.json()["metrics"]
            print("[PASS] 10. Deterministic Reset Match verified -> Reset state produces identical metrics as new seed 42 simulation")

            # 10. Server Restart Stale RUNNING Recovery
            sim_stale = Simulation(name="Stale Sim", random_seed=42, status=SimulationStatus.RUNNING, current_tick=10)
            db.add(sim_stale)
            db.commit()

            count = SimulationService.normalize_stale_running_simulations(db)
            assert count >= 1
            db.refresh(sim_stale)
            assert sim_stale.status == SimulationStatus.PAUSED
            print(f"[PASS] 11. Stale RUNNING recovery on startup verified -> Normalized {count} stale record(s) to PAUSED")

        finally:
            db.close()


if __name__ == "__main__":
    asyncio.run(test_lifecycle_suite())
    print("\nAll Phase 3 lifecycle automated tests passed successfully!")
