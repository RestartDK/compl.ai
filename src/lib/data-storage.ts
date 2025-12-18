// localStorage key for storing the demo data JSON
const STORAGE_KEY = 'compliance_demo_data';

export interface DemoData {
  demo_employees?: Array<{
    id: string;
    name?: string;
    role?: string;
    firm?: string;
    division?: string;
    [key: string]: unknown;
  }>;
  firm_restricted_list?: Array<Record<string, unknown>>;
  quick_reference?: Record<string, unknown>;
}

// Default demo data (will be seeded from demo_data_simple.json)
const DEFAULT_DEMO_DATA: DemoData = {
  demo_employees: [
    {
      id: "EMP_GS_001",
      name: "John Doe",
      role: "Financial Advisor",
      firm: "Goldman Sacks",
      division: "Wealth Management",
      location_country: "US",
      mnpi_access_flag: false,
      restricted_tickers: []
    },
    {
      id: "EMP_GS_002",
      name: "Jane Smith",
      role: "Trader",
      firm: "Goldman Sacks",
      division: "Global Markets",
      location_country: "US",
      mnpi_access_flag: true,
      restricted_tickers: ["AAPL", "GS", "MS"]
    },
    {
      id: "EMP_MS_001",
      name: "Bob Brown",
      role: "Financial Advisor",
      firm: "Morgan Stanley",
      division: "Wealth Management",
      location_country: "UK",
      mnpi_access_flag: false,
      restricted_tickers: []
    }
  ],
  firm_restricted_list: [
    {
      ticker: "GS",
      restriction_type: "FIRM_STOCK",
      reason: "Employee cannot trade own firm stock without pre-clearance"
    },
    {
      ticker: "MS",
      restriction_type: "COMPETITOR",
      reason: "Competitor restriction"
    }
  ],
  quick_reference: {
    blackout_periods: ["EARNINGS_Q1", "EARNINGS_Q2"]
  }
};

export function getStoredData(): DemoData | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    return JSON.parse(stored) as DemoData;
  } catch {
    return null;
  }
}

export function setStoredData(data: DemoData): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save data to localStorage:', error);
    throw error;
  }
}

export function seedDefaultData(): void {
  if (typeof window === 'undefined') return;
  
  const existing = getStoredData();
  if (existing) return; // Already seeded
  
  setStoredData(DEFAULT_DEMO_DATA);
}

export function resetToDefault(): void {
  setStoredData(DEFAULT_DEMO_DATA);
}

export function findEmployeeByFirmAndRole(
  firm: string,
  role: string
): DemoData['demo_employees'][0] | null {
  const data = getStoredData();
  if (!data?.demo_employees) return null;
  
  const normalizedFirm = firm.trim().toLowerCase();
  const normalizedRole = role.trim().toLowerCase();
  
  return data.demo_employees.find(
    (emp) =>
      emp.firm?.toLowerCase() === normalizedFirm &&
      emp.role?.toLowerCase() === normalizedRole
  ) || null;
}

export function getFirmRestrictions(): {
  firm_restricted_list: Array<Record<string, unknown>>;
  quick_reference?: Record<string, unknown>;
} {
  const data = getStoredData();
  return {
    firm_restricted_list: data?.firm_restricted_list || [],
    quick_reference: data?.quick_reference,
  };
}

export function getInitialCompanyAndPosition(): { company: string; position: string } {
  const data = getStoredData();
  const firstEmployee = data?.demo_employees?.[0];
  
  return {
    company: firstEmployee?.firm || 'Goldman Sacks',
    position: firstEmployee?.role || 'Financial Advisor',
  };
}
