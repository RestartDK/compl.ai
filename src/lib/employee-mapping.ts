export const EMPLOYEE_MAPPING: Record<string, Record<string, string>> = {
  "Goldman Sacks": {
    "Financial Advisor": "EMP_GS_001",
    Trader: "EMP_GS_002",
  },
  "Morgan Stanley": {
    "Financial Advisor": "EMP_MS_001",
  },
};

export const DEFAULT_EMPLOYEE_ID = "EMP_GS_001";

export function getEmployeeId(firm: string, position: string): string {
  return EMPLOYEE_MAPPING[firm]?.[position] ?? DEFAULT_EMPLOYEE_ID;
}

