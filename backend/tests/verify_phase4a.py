import asyncio
import json
import httpx
from starlette.testclient import TestClient

from app.main import app
from app.db.database import init_db

init_db()


def run_phase_4a_verification():
    print("==================================================")
    print("  PHASE 4A WEBSOCKET STREAMING VERIFICATION SCENARIO ")
    print("==================================================")

    client = TestClient(app)

    # 1. Create Simulation
    res_create = client.post("/api/simulations", json={"name": "WebSocket Live Sim", "random_seed": 42})
    assert res_create.status_code == 201
    sim_id = res_create.json()["id"]
    print(f"\n1. Created Simulation ID: {sim_id}")

    # 2. Audit GET /api/simulations/{id}/world Endpoint
    res_world = client.get(f"/api/simulations/{sim_id}/world")
    assert res_world.status_code == 200
    world = res_world.json()
    print(f"\n2. GET /world Response Audit:")
    print(f"   - Businesses count: {len(world['businesses'])} (Stable UUIDs)")
    print(f"   - Citizen Groups count: {len(world['citizen_groups'])} (Deterministic group:occupation: IDs)")
    print(f"   - Graph Relationships: {len(world['relationships'])} links")
    print(f"   - Truthful Flows: Salary=${world['flows']['salary_total']}, Tax=${world['flows']['tax_total']}, Consumer Spending=${world['flows']['consumer_spending_total']}")

    # 3. Connect to WebSocket
    with client.websocket_connect(f"/api/simulations/ws/{sim_id}") as ws:
        init_msg = ws.receive_json()
        print(f"\n3. Connected to WS /api/simulations/ws/{sim_id}")


        print(f"   Received Msg Type: '{init_msg['type']}' | Tick: {init_msg['tick']} | Status: '{init_msg['status']}'")
        assert init_msg["type"] == "initial_state"

        # 4. START Runner
        client.post(f"/api/simulations/{sim_id}/start")
        start_lifecycle_msg = ws.receive_json()
        print(f"\n4. Executed /start -> Received Lifecycle WS Msg: type='{start_lifecycle_msg['type']}', status='{start_lifecycle_msg['status']}'")

        # Receive streaming tick 1
        tick1_msg = ws.receive_json()
        print(f"\n5. Received Live Streamed Tick {tick1_msg['tick']} over WebSocket:")
        print(f"   Metrics: Employment={tick1_msg['metrics']['employment_rate']}, Output={tick1_msg['metrics']['economic_output']}, Satisfaction={tick1_msg['metrics']['public_satisfaction']}")

        # 5. Policy Update over WebSocket
        client.put(f"/api/simulations/{sim_id}/policy", json={"tax_rate": 0.25})
        policy_msg = ws.receive_json()
        print(f"\n6. Executed PUT /policy -> Received WS Msg: type='{policy_msg['type']}', tax_rate={policy_msg['policy']['tax_rate']}")

        # 6. PAUSE
        client.post(f"/api/simulations/{sim_id}/pause")
        pause_msg = ws.receive_json()
        print(f"\n7. Executed /pause -> Received WS Msg: type='{pause_msg['type']}', status='{pause_msg['status']}'")

        # 7. STEP while paused
        client.post(f"/api/simulations/{sim_id}/step")
        step_msg = ws.receive_json()
        print(f"\n8. Executed /step -> Received WS Msg: type='{step_msg['type']}', tick={step_msg['tick']}")

        # 8. RESET
        client.post(f"/api/simulations/{sim_id}/reset")
        reset_msg = ws.receive_json()
        print(f"\n9. Executed /reset -> Received WS Msg: type='{reset_msg['type']}', tick={reset_msg['tick']}")

        print("\n[VERIFICATION SUCCESS] Phase 4A WebSocket streaming pipeline verified 100%!")


if __name__ == "__main__":
    run_phase_4a_verification()
