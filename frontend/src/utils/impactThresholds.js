/**
 * Configurable thresholds for filtering meaningful economic state changes.
 * Avoids highlighting minor floating-point fluctuations.
 */

export const IMPACT_THRESHOLDS = {
  BUSINESS_HEALTH: 0.02,        // Absolute health change >= 2%
  CITIZEN_SATISFACTION: 0.02,   // Absolute satisfaction change >= 2%
  EMPLOYED_COUNT: 1,            // Integer employed count change >= 1
  MACRO_METRIC: 0.005,          // Macro metric change >= 0.5%
};
