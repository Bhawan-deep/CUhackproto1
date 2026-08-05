import asyncio
from uuid import uuid4
import httpx

from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation, Citizen, Business, GovernmentState, Snapshot, SimulationEvent

init_db()


async def run_phase_3_manual_verification():
    print("==================================================")
    print("   PHASE 3 LIFECYCLE MANUAL INTEGRATION SCENARIO  ")
    print("==================================================")

    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:

        # 1. Create "Runner Demo Economy" seed 42
        res_create = await client.post("/api/simulations", json={"name": "Runner Demo Economy", "random_seed": 42})
        assert res_create.status_code == 201
        sim_data = res_create.json()
        sim_id = sim_data["id"]
        print(f"\n1. Created Simulation ID: {sim_id}")
        print(f"   Tick: {sim_data['current_tick']} | Status: {sim_data['status']} (Expected: CREATED)")

        # 2. START runner
        res_start = await client.post(f"/api/simulations/{sim_id}/start")
        assert res_start.status_code == 200
        print(f"\n2. Executed /start -> Response: {res_start.json()['message']} | Status: {res_start.json()['status']}")

        # 3. Observe automatic ticking over 3.2 seconds
        print("   Observing automatic background ticking...")
        await asyncio.sleep(3.2)
        res_runtime = await client.get(f"/api/simulations/{sim_id}/runtime")
        auto_tick = res_runtime.json()["current_tick"]
        print(f"   Current Tick after ~3s: {auto_tick} (Automatic background runner active!)")
        assert auto_tick >= 3

        # 4. PAUSE runner
        res_pause = await client.post(f"/api/simulations/{sim_id}/pause")
        assert res_pause.status_code == 200
        paused_tick = res_pause.json()["current_tick"]
        print(f"\n3. Executed /pause -> Status: {res_pause.json()['status']} | Paused Tick: {paused_tick}")

        print("   Waiting 2.5 seconds to verify tick freezing...")
        await asyncio.sleep(2.5)
        res_runtime_freeze = await client.get(f"/api/simulations/{sim_id}/runtime")
        assert res_runtime_freeze.json()["current_tick"] == paused_tick
        print(f"   Verified: Current Tick remains {res_runtime_freeze.json()['current_tick']} (Ticks frozen!)")

        # 5. STEP while PAUSED
        res_step = await client.post(f"/api/simulations/{sim_id}/step")
        assert res_step.status_code == 200
        stepped_tick = res_step.json()["tick"]
        print(f"\n4. Executed /step while PAUSED -> Advanced to Tick: {stepped_tick} (Exactly +1)")
        assert stepped_tick == paused_tick + 1

        # 6. RESUME runner
        res_resume = await client.post(f"/api/simulations/{sim_id}/resume")
        assert res_resume.status_code == 200
        print(f"\n5. Executed /resume -> Status: {res_resume.json()['status']}")

        # 7. Inject Event: Recession severity 0.7 while RUNNING
        res_event = await client.post(f"/api/simulations/{sim_id}/events", json={"type": "recession", "severity": 0.7})
        assert res_event.status_code == 201
        print(f"\n6. Injected Event: Type={res_event.json()['event_type']}, Severity={res_event.json()['severity']} (Runner processing event)")

        await asyncio.sleep(2.0)

        # 8. PAUSE & RESET
        await client.post(f"/api/simulations/{sim_id}/pause")
        res_reset = await client.post(f"/api/simulations/{sim_id}/reset")
        assert res_reset.status_code == 200
        print(f"\n7. Executed /reset -> Status: {res_reset.json()['status']} | Tick: {res_reset.json()['current_tick']}")

        # 9. Verify PostgreSQL Database State After Reset
        db = SessionLocal()
        try:
            sim_db = db.query(Simulation).filter(Simulation.id == sim_id).first()
            citizens_count = db.query(Citizen).filter(Citizen.simulation_id == sim_id).count()
            businesses_count = db.query(Business).filter(Business.simulation_id == sim_id).count()
            gov_count = db.query(GovernmentState).filter(GovernmentState.simulation_id == sim_id).count()
            snapshots = db.query(Snapshot).filter(Snapshot.simulation_id == sim_id).all()
            events_count = db.query(SimulationEvent).filter(SimulationEvent.simulation_id == sim_id).count()

            print("\n8. PostgreSQL Post-Reset Audit:")
            print(f"   - Simulation Status: {sim_db.status.value}")
            print(f"   - Simulation current_tick: {sim_db.current_tick}")
            print(f"   - Citizens count: {citizens_count} (Expected: 100)")
            print(f"   - Businesses count: {businesses_count} (Expected: 12)")
            print(f"   - Events count: {events_count} (Expected: 0)")
            print(f"   - Snapshots count: {len(snapshots)} (Expected: 1 - Tick 0)")

            assert sim_db.status.value == "created"
            assert sim_db.current_tick == 0
            assert citizens_count == 100
            assert businesses_count == 12
            assert events_count == 0
            assert len(snapshots) == 1 and snapshots[0].tick == 0
            print("\n[VERIFICATION SUCCESS] Phase 3 lifecycle scenario verified against PostgreSQL!")

        finally:
            db.close()


if __name__ == "__main__":
    asyncio.run(run_phase_3_manual_verification())
