/**
 * Demo / Sample Legal Audit Dataset for Bounty Workspace Phase B2
 * These are synthetic sample records for compliance audit demonstration purposes.
 */

export const SAMPLE_LEGAL_RECORDS = [
  {
    id: 'REC-2026-081',
    title: 'Fiscal Stimulus Allocation & Municipal Audit',
    documentType: 'Regulatory Audit Filing',
    jurisdiction: 'Federal Economic Commission (US-FED)',
    category: 'Public Expenditure & Infrastructure',
    riskLevel: 'MEDIUM',
    effectiveDate: '2026-03-15',
    defaultStatus: 'NEEDS_REVIEW',
    defaultNotes: '',
    isSample: true,
    clauses: [
      {
        section: 'Section 1.1 — Municipal Allocation',
        text: 'Authorization of $150,000 public treasury funds allocated towards municipal infrastructure expansion and transit modernization under Policy Schedule 4-B.'
      },
      {
        section: 'Section 1.2 — Audit Reconciliation Mandate',
        text: 'The recipient municipal authority must submit quarterly expenditure audit logs and contractor payroll verification records to the central treasury within 30 days of period close.'
      },
      {
        section: 'Section 2.1 — Compliance Thresholds',
        text: 'Failure to maintain a 75% local labor employment quota shall trigger an automatic review by the Federal Economic Commission.'
      }
    ]
  },
  {
    id: 'REC-2026-094',
    title: 'Central Reserve Monetary Policy & Liquidity Order',
    documentType: 'Monetary Policy Directive',
    jurisdiction: 'Central Reserve Board',
    category: 'Monetary Policy & Credit Risk',
    riskLevel: 'HIGH',
    effectiveDate: '2026-05-01',
    defaultStatus: 'VERIFIED',
    defaultNotes: 'Verified under Central Reserve Act §14. Interest rate adjustment aligns with inflation target metrics.',
    isSample: true,
    clauses: [
      {
        section: 'Directive 3-A — Baseline Rate Target',
        text: 'Adjustment of baseline interbank interest rate by +25 basis points to stabilize consumer price inflation and credit expansion.'
      },
      {
        section: 'Directive 3-B — Commercial Loan Reserve Ratio',
        text: 'Mandatory commercial bank reserve ratio set at 12.5% of total outstanding credit risk exposure.'
      }
    ]
  },
  {
    id: 'REC-2026-102',
    title: 'Corporate Tax Withholding & Game Posture Audit',
    documentType: 'Tax Compliance Examination',
    jurisdiction: 'State Revenue Bureau',
    category: 'Corporate Tax & Strategic Posture',
    riskLevel: 'HIGH',
    effectiveDate: '2026-06-10',
    defaultStatus: 'NEEDS_REVIEW',
    defaultNotes: '',
    isSample: true,
    clauses: [
      {
        section: 'Clause 4.1 — Strategic Tax Burden Audit',
        text: 'Examination of corporate revenue disclosures under non-cooperative competitive posture DEFECT. Assessed tax obligation calculated at 22.0% gross revenue.'
      },
      {
        section: 'Clause 4.2 — Penalty Assessment',
        text: 'Discrepancy in quarterly payroll tax compliance rate (82.4% vs 95.0% statutory threshold) incurs a 5.0% surcharge on late balances.'
      }
    ]
  },
  {
    id: 'REC-2026-118',
    title: 'Healthcare Emergency Subsidy Authorization Directive',
    documentType: 'Executive Policy Notice',
    jurisdiction: 'Department of Health & Welfare',
    category: 'Healthcare Spending & Public Satisfaction',
    riskLevel: 'LOW',
    effectiveDate: '2026-07-04',
    defaultStatus: 'DRAFT',
    defaultNotes: '',
    isSample: true,
    clauses: [
      {
        section: 'Article 1 — Emergency Health Allocation',
        text: 'Special allocation of $30,000 to regional healthcare centers to mitigate public satisfaction declines following seasonal economic downturn.'
      },
      {
        section: 'Article 2 — Performance Metric Verification',
        text: 'Recipient health networks must report monthly patient satisfaction indices and emergency care availability metrics.'
      }
    ]
  },
  {
    id: 'REC-2026-125',
    title: 'Industrial Retrenchment & Labor Displacement Filing',
    documentType: 'Labor Audit Examination',
    jurisdiction: 'Department of Labor & Employment',
    category: 'Workforce Adjustment & Subsidies',
    riskLevel: 'CRITICAL',
    effectiveDate: '2026-07-22',
    defaultStatus: 'REJECTED',
    defaultNotes: 'Rejected due to missing pre-displacement baseline employment metrics and insufficient severance documentation.',
    isSample: true,
    clauses: [
      {
        section: 'Section 5.1 — Workforce Reduction Notification',
        text: 'Formal notification of manufacturing workforce reduction (12 employees) following factory closure shock event in Sector 2.'
      },
      {
        section: 'Section 5.2 — Retraining Assistance Mandate',
        text: 'Authorization of retraining subsidies under Workforce Transition Act Section 12-C for affected displaced workers.'
      }
    ]
  }
];
