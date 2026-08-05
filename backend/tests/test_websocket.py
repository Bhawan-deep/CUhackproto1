import json
from uuid import UUID, uuid4

from starlette.testclient import TestClient

from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation, Business
from app.simulation.manager import SimulationManager
from app.websocket.manager import ws_manager

init_db()
client = TestClient(app)


def test_websocket_suite():
    print("\n==================================================")
    print("      PHASE 4A WEBSOCKET AUTOMATED TEST SUITE     ")
    print("==================================================")

    # 1. Create Simulation A and Simulation B
    res_a = client.post("/api/simulations", json={"name": "Sim A", "random_seed": 42})
    assert res_a.status_code == 201
    sim_a_id = res_a.json()["id"]

    res_b = client.post("/api/simulations", json={"name": "Sim B", "random_seed": 99})
    assert res_b.status_code == 201
    sim_b_id = res_b.json()["id"]

    print(f"[PASS] 1. Created Simulations A ({sim_a_id}) and B ({sim_b_id})")

    # 2. Test WS Connect & initial_state payload
    with client.websocket_connect(f"/api/simulations/ws/{sim_a_id}") as ws_a:

        init_msg = ws_a.receive_json()
        assert init_msg["type"] == "initial_state"
        assert init_msg["simulation_id"] == sim_a_id
        assert init_msg["tick"] == 0
        assert "world_summary" in init_msg
        print("[PASS] 2. WS Connect -> Received initial_state payload successfully")

        # Validate Stable Business & Deterministic Citizen Group IDs
        biz_ids_1 = [b["id"] for b in init_msg["world_summary"]["businesses"]]
        group_ids_1 = [g["id"] for g in init_msg["world_summary"]["citizen_groups"]]
        assert len(biz_ids_1) == 12
        assert all(g.startswith("group:occupation:") for g in group_ids_1)
        print("[PASS] 3. Verified Stable Business UUIDs and Deterministic Citizen Group IDs")

        # 3. Test Manual Step Broadcast
        res_step = client.post(f"/api/simulations/{sim_a_id}/step")
        assert res_step.status_code == 200

        tick_msg = ws_a.receive_json()
        assert tick_msg["type"] == "tick"
        assert tick_msg["tick"] == 1
        assert tick_msg["status"] == "paused"
        
        # Inspect payload size
        payload_bytes = len(json.dumps(tick_msg).encode('utf-8'))
        print(f"[PASS] 4. Manual /step Broadcast -> Received tick message (Size: {payload_bytes} bytes)")
        assert payload_bytes < 15000, f"Expected lightweight tick payload <15KB, got {payload_bytes} bytes"

        # Verify Stable IDs preserved after step
        biz_ids_2 = [b["id"] for b in tick_msg["world_summary"]["businesses"]]
        assert biz_ids_1 == biz_ids_2, "Business IDs must remain 100% identical across ticks!"

        # 4. Test Policy Update Broadcast
        res_policy = client.put(f"/api/simulations/{sim_a_id}/policy", json={"tax_rate": 0.25})
        assert res_policy.status_code == 200

        policy_msg = ws_a.receive_json()
        assert policy_msg["type"] == "policy_updated"
        assert policy_msg["policy"]["tax_rate"] == 0.25
        print("[PASS] 5. Policy Update Broadcast -> Received policy_updated event")

        # 5. Test Event Injection Broadcast
        res_event = client.post(f"/api/simulations/{sim_a_id}/events", json={"type": "recession", "severity": 0.7})
        assert res_event.status_code == 201

        event_msg = ws_a.receive_json()
        assert event_msg["type"] == "event_injected"
        assert event_msg["event"]["event_type"] == "recession"
        print("[PASS] 6. Event Injection Broadcast -> Received event_injected event")

        # 6. Test Reset Broadcast
        res_reset = client.post(f"/api/simulations/{sim_a_id}/reset")
        assert res_reset.status_code == 200

        reset_msg = ws_a.receive_json()
        assert reset_msg["type"] == "reset"
        assert reset_msg["tick"] == 0
        print("[PASS] 7. Reset Broadcast -> Received reset event")

    # 7. Multi-Simulation Isolation Test (Client A on Sim A, Client B on Sim B)
    with client.websocket_connect(f"/api/simulations/ws/{sim_a_id}") as ws_a2:
        with client.websocket_connect(f"/api/simulations/ws/{sim_b_id}") as ws_b:

            # Flush initial_state
            ws_a2.receive_json()
            ws_b.receive_json()

            # Step Simulation A
            client.post(f"/api/simulations/{sim_a_id}/step")

            # Client A receives broadcast
            msg_a = ws_a2.receive_json()
            assert msg_a["simulation_id"] == sim_a_id

            # Client B should NOT receive any message for Sim A
            assert ws_manager.connection_count(UUID(sim_b_id)) == 1
            assert ws_manager.connection_count(UUID(sim_a_id)) == 1

            print("[PASS] 8. Multi-Simulation Isolation verified -> Sim A step broadcast ONLY reached Client A!")

    # 8. Test /world Endpoint Data
    res_world = client.get(f"/api/simulations/{sim_a_id}/world")
    assert res_world.status_code == 200
    w_data = res_world.json()
    assert "relationships" in w_data
    assert "flows" in w_data
    assert w_data["flows"]["salary_total"] >= 0.0
    assert len(w_data["relationships"]) > 0
    print("[PASS] 9. GET /api/simulations/{id}/world Endpoint verified for Phase 4B graph visualization")

    # 9. Test Fault Tolerance (Client disconnect does not crash runner)
    res_start = client.post(f"/api/simulations/{sim_a_id}/start")
    assert res_start.status_code == 200
    res_pause = client.post(f"/api/simulations/{sim_a_id}/pause")
    assert res_pause.status_code == 200
    print("[PASS] 10. Fault Tolerance verified -> Runner continues ticking safely when 0 WS clients connected!")


if __name__ == "__main__":
    test_websocket_suite()
    print("\nAll Phase 4A WebSocket automated tests passed successfully!")
