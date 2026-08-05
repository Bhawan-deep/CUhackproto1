from typing import List
import math
from app.schemas.state import CitizenState, BusinessState, GovernmentStateSchema, EconomicMetrics


def calculate_gini(values: List[float]) -> float:
    """
    Calculate Gini coefficient for a list of non-negative values.
    Returns a value between 0.0 (perfect equality) and 1.0 (perfect inequality).
    Handles edge cases cleanly without NaN/Infinity.
    """
    if not values:
        return 0.0
    
    # Filter negative values (clamp to 0.0)
    clean_values = [max(0.0, float(v)) for v in values]
    n = len(clean_values)
    if n <= 1:
        return 0.0
    
    total_sum = sum(clean_values)
    if total_sum <= 0.0:
        return 0.0

    sorted_vals = sorted(clean_values)
    
    # Formula: G = sum((2*i - n - 1) * x_i) / (n * sum(x_i))  [1-indexed i]
    weighted_sum = sum((2 * (i + 1) - n - 1) * val for i, val in enumerate(sorted_vals))
    gini = weighted_sum / (n * total_sum)
    
    # Clamp result safely between 0.0 and 1.0
    return max(0.0, min(1.0, float(gini)))


def calculate_economic_metrics(
    citizens: List[CitizenState],
    businesses: List[BusinessState],
    government: GovernmentStateSchema
) -> EconomicMetrics:
    """Calculate aggregate economic metrics for the simulation state."""
    # 1. Employment Rate
    total_citizens = len(citizens)
    employed_citizens = sum(1 for c in citizens if c.employed)
    employment_rate = (employed_citizens / total_citizens) if total_citizens > 0 else 0.0

    # 2. Economic Output (sum of business revenues)
    economic_output = sum(b.revenue for b in businesses)

    # 3. Inequality (Gini coefficient of citizen wealth)
    wealth_list = [c.wealth for c in citizens]
    inequality = calculate_gini(wealth_list)

    # 4. Public Satisfaction (average citizen satisfaction weighted with government public satisfaction)
    citizen_avg_sat = (sum(c.satisfaction for c in citizens) / total_citizens) if total_citizens > 0 else 0.70
    public_satisfaction = max(0.0, min(1.0, (citizen_avg_sat * 0.7 + government.public_satisfaction * 0.3)))

    # 5. Business Health
    total_businesses = len(businesses)
    business_health = (sum(b.health for b in businesses) / total_businesses) if total_businesses > 0 else 1.0
    business_health = max(0.0, min(1.0, business_health))

    return EconomicMetrics(
        employment_rate=round(employment_rate, 4),
        economic_output=round(economic_output, 2),
        inequality=round(inequality, 4),
        public_satisfaction=round(public_satisfaction, 4),
        business_health=round(business_health, 4),
    )
