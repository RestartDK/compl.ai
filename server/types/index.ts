export interface ValidationAttempt {
  attempt_number: number;
  passed: boolean;
  error?: string;
  test_output?: string;
  feedback_to_llm?: string;
  timestamp: string;
}

export interface Rule {
  rule_id: string;
  rule_name: string;
  description: string;
  policy_reference: string;
  python_code: string;
  applies_to_roles: string[];
  active: boolean;
  generation_attempt: number;
  validation_history: ValidationAttempt[];
}

export interface RulesData {
  firm_name: string;
  policy_version: string;
  last_updated: string;
  generated_by_llm: true;
  total_iterations: number;
  rules: Rule[];
}

export interface PreviousAttemptContext {
  code: string;
  error: string;
  test_results: string;
}

export interface GenerationContext {
  policy_text: string;
  firm_name: string;
  previous_attempt?: PreviousAttemptContext;
}

export interface Employee {
  id: string;
  role: string;
  division: string;
  firm: string;
  covered_tickers?: string[];
}

export interface Security {
  ticker: string;
  earnings_date?: string;
  market_cap?: number;
}

export interface ComplianceResult {
  allowed: boolean;
  reasons: string[];
  policy_refs: string[];
  rules_checked: string[];
}

export interface ValidationResult {
  passed: boolean;
  syntax_error?: string;
  runtime_error?: string;
  test_failure?: string;
  security_issue?: string;
  error?: string;
  test_output?: string;
}

