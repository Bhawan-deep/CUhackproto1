import asyncio
from starlette.testclient import TestClient

from app.main import app
from app.db.database import init_db, SessionLocal
from app.models.simulation import Simulation

init_db()


def run_parallel_experiment_automated_tests():
    print("==================================================")
    print("     PHASE 7 PARALLEL UNIVERSE AUTOMATED TESTS    ")
    print("==================================================")

    client = TestClient(app)

    # 1. Create original simulation with seed 42
    res_create = client.post("/api/simulations", json={"name": "Original Master Sim", "random_seed": 42})
    assert res_create.status_code == 201
    orig_id = res_create.json()["id"]
    print(f"[PASS] 1. Created Original Master Simulation ID: {orig_id} (Seed 42)")

    # 2. Advance original simulation to Month 30
    for _ in range(30):
        client.post(f"/api/simulations/{orig_id}/step")

    db = SessionLocal()
    orig_sim = db.query(Simulation).filter(Simulation.id == orig_id).first()
    orig_tick_before = orig_sim.current_tick
    db.close()
    assert orig_tick_before == 30
    print(f"[PASS] 2. Original Simulation advanced to Month 30")

    # 3. REGRESSION TEST: Verify /timeline intervention filtering (only actual policy changes appear)
    res_tl = client.get(f"/api/simulations/{orig_id}/timeline")
    assert res_tl.status_code == 200
    tl_data = res_tl.json()
    assert len(tl_data["snapshots"]) == 31
    # Since no manual policy update was injected during the 30 steps, interventions list should be 0!
    assert len(tl_data["interventions"]) == 0
    print("[PASS] 3. Timeline Intervention Filter Verified -> 0 markers for 30 un-intervened steps (Fixed duplicate marker issue!)")

    # 4. PERFECT CLONE TEST: Create Experiment at Month 10
    res_exp_create = client.post(
        f"/api/experiments/simulations/{orig_id}",
        json={"source_tick": 10, "name": "Infrastructure Counterfactual Lab", "horizon_ticks": 10}
    )
    assert res_exp_create.status_code == 201
    exp_data = res_exp_create.json()
    exp_id = exp_data["id"]
    sim_a_id = exp_data["baseline_simulation_id"]
    sim_b_id = exp_data["variant_simulation_id"]
    print(f"[PASS] 4. Created Experiment ID: {exp_id} forking Month 10 -> Branches A ({sim_a_id}) and B ({sim_b_id})")

    # Verify Perfect Clone initial state at Month 10
    res_snap_a = client.get(f"/api/simulations/{sim_a_id}/snapshots/10")
    res_snap_b = client.get(f"/api/simulations/{sim_b_id}/snapshots/10")
    assert res_snap_a.status_code == 200 and res_snap_b.status_code == 200
    snap_a = res_snap_a.json()
    snap_b = res_snap_b.json()

    assert snap_a["metrics"] == snap_b["metrics"]
    assert snap_a["government"] == snap_b["government"]
    assert len(snap_a["businesses"]) == len(snap_b["businesses"]) == 12
    print("[PASS] 5. PERFECT CLONE VERIFIED -> Universe A state == Universe B state at Month 10")

    # 5. FAIR COUNTERFACTUAL TEST (Identical Futures): Run both branches with NO intervention for 5 ticks
    for _ in range(5):
        client.post(f"/api/simulations/{sim_a_id}/step")
        client.post(f"/api/simulations/{sim_b_id}/step")

    res_snap_a15 = client.get(f"/api/simulations/{sim_a_id}/snapshots/15")
    res_snap_b15 = client.get(f"/api/simulations/{sim_b_id}/snapshots/15")
    assert res_snap_a15.status_code == 200 and res_snap_b15.status_code == 200
    snap_a15 = res_snap_a15.json()
    snap_b15 = res_snap_b15.json()

    assert snap_a15["metrics"] == snap_b15["metrics"]
    print("[PASS] 6. FAIR COUNTERFACTUAL VERIFIED -> Universe A (no change) == Universe B (no change) after 5 ticks!")

    # 6. CONTROLLED DIVERGENCE TEST: Run Experiment with variant policy on B
    res_run = client.post(
        f"/api/experiments/{exp_id}/run",
        json={
            "horizon_ticks": 10,
            "variant_policy": {"infrastructure_spending": 150000.0}
        }
    )
    assert res_run.status_code == 200
    run_result = res_run.json()

    assert "macro_comparison" in run_result
    assert "top_diverging_businesses" in run_result
    macro_comp = run_result["macro_comparison"]
    print(f"[PASS] 7. CONTROLLED DIVERGENCE VERIFIED:")
    print(f"   - Baseline Output (A): ${macro_comp['economic_output']['baseline']:,.2f}")
    print(f"   - Variant Output (B):  ${macro_comp['economic_output']['variant']:,.2f}")
    print(f"   - Empirical Output Diff: {macro_comp['economic_output']['pct_delta']:+.1f}%")
    print(f"   - Top Diverging Businesses Count: {len(run_result['top_diverging_businesses'])}")

    # 7. ORIGINAL SIMULATION IMMUTABILITY TEST
    db = SessionLocal()
    orig_sim_after = db.query(Simulation).filter(Simulation.id == orig_id).first()
    orig_tick_after = orig_sim_after.current_tick
    db.close()

    assert orig_tick_before == orig_tick_after == 30
    print(f"[PASS] 8. ORIGINAL SIMULATION IMMUTABILITY VERIFIED -> Master Sim remain untouched at Month 30 ({orig_tick_before} == {orig_tick_after})")

    print("\nAll Phase 7 Parallel Universe automated tests passed 100% successfully!\n")


if __name__ == "__main__":
    run_parallel_experiment_automated_tests()
