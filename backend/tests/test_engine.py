import json
import uuid
from app.simulation.metrics import calculate_gini, calculate_economic_metrics

from app.simulation.mock_engine import MockSimulationEngine, serialize_rng_state, deserialize_rng_state


def test_gini_coefficient_calculation():
    # 1. Empty & single item
    assert calculate_gini([]) == 0.0
    assert calculate_gini([500.0]) == 0.0

    # 2. Perfect equality
    assert calculate_gini([100.0, 100.0, 100.0, 100.0]) == 0.0

    # 3. High inequality
    unequal = [0.0] * 99 + [10000.0]
    gini_high = calculate_gini(unequal)
    assert gini_high > 0.90, f"Expected high Gini > 0.90, got {gini_high}"

    # 4. Moderate inequality
    moderate = [10.0, 20.0, 30.0, 40.0, 50.0]
    gini_mod = calculate_gini(moderate)
    assert 0.20 < gini_mod < 0.40, f"Expected moderate Gini, got {gini_mod}"


def test_deterministic_seed_initialization():
    sim_id = uuid.uuid4()
    
    # Engine 1 with seed 42
    engine1 = MockSimulationEngine()
    engine1.initialize(sim_id, seed=42)
    
    # Engine 2 with seed 42
    engine2 = MockSimulationEngine()
    engine2.initialize(sim_id, seed=42)

    # Engine 3 with seed 999
    engine3 = MockSimulationEngine()
    engine3.initialize(sim_id, seed=999)

    # Same seed should produce identical initial metrics
    m1 = engine1.get_metrics()
    m2 = engine2.get_metrics()
    m3 = engine3.get_metrics()

    assert m1.model_dump() == m2.model_dump(), "Same seed must produce identical metrics"
    assert m1.economic_output != m3.economic_output or m1.inequality != m3.inequality, "Different seeds should produce different outputs"


def test_manual_step_and_metric_bounds():
    sim_id = uuid.uuid4()
    engine = MockSimulationEngine()
    engine.initialize(sim_id, seed=42)

    assert engine.tick == 0

    res = engine.step()
    assert res.tick == 1
    assert engine.tick == 1

    metrics = res.metrics
    assert 0.0 <= metrics.employment_rate <= 1.0
    assert metrics.economic_output >= 0.0
    assert 0.0 <= metrics.inequality <= 1.0
    assert 0.0 <= metrics.public_satisfaction <= 1.0
    assert 0.0 <= metrics.business_health <= 1.0


def test_policy_update_and_event_injection():
    sim_id = uuid.uuid4()
    engine = MockSimulationEngine()
    engine.initialize(sim_id, seed=42)

    # Update policy
    new_pol = engine.update_policy({"tax_rate": 0.25, "infrastructure_spending": 75000.0})
    assert new_pol.tax_rate == 0.25
    assert new_pol.infrastructure_spending == 75000.0

    # Inject event
    event_state = engine.inject_event(event_type="recession", severity=0.7)
    assert event_state.event_type == "recession"
    assert len(engine.active_events) == 1

    res = engine.step()
    assert res.tick == 1
    assert len(res.active_events) >= 0


def test_deterministic_database_json_roundtrip():
    """
    CRITICAL TEST: Verifies that engine state exported to JSON (as stored in PostgreSQL JSONB Snapshot),
    serialized to a string, deserialized, and imported into a new engine produces 100% EQUIVALENT
    deterministic continuation on subsequent steps.
    """
    sim_id = uuid.uuid4()

    # 1. Initialize Engine A and run 5 ticks
    engine_a = MockSimulationEngine()
    engine_a.initialize(sim_id, seed=42)
    for _ in range(5):
        engine_a.step()

    # 2. Export state from Engine A
    state_a = engine_a.export_state()

    # 3. Simulate PostgreSQL JSONB serialization round-trip
    json_str = json.dumps(state_a)
    state_b_json = json.loads(json_str)

    # 4. Create Engine B and import deserialized state
    engine_b = MockSimulationEngine()
    engine_b.import_state(state_b_json)

    assert engine_a.tick == engine_b.tick == 5
    assert engine_a.get_metrics().model_dump() == engine_b.get_metrics().model_dump()

    # 5. Step both Engine A and Engine B once
    res_a = engine_a.step()
    res_b = engine_b.step()

    # 6. Verify outputs are 100% equivalent
    assert res_a.tick == res_b.tick == 6
    assert res_a.metrics.model_dump() == res_b.metrics.model_dump()
    assert res_a.summary.model_dump() == res_b.summary.model_dump()
    assert engine_a.export_state() == engine_b.export_state()
    print("[PASS] Deterministic database JSON round-trip continuation verified!")


if __name__ == "__main__":
    test_gini_coefficient_calculation()
    test_deterministic_seed_initialization()
    test_manual_step_and_metric_bounds()
    test_policy_update_and_event_injection()
    test_deterministic_database_json_roundtrip()
    print("All engine tests passed successfully!")
