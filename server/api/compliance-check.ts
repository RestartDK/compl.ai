import { RulesExecutor } from "../services/rules-executor.ts";
import type { Employee, Security } from "../types/index.ts";

const executor = new RulesExecutor();

interface ComplianceCheckRequest {
  firm_name?: string;
  employee_id?: string;
  ticker?: string;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as ComplianceCheckRequest;
    const firmName = body.firm_name?.trim();
    const employeeId = body.employee_id?.trim();
    const ticker = body.ticker?.trim()?.toUpperCase();

    if (!firmName || !employeeId || !ticker) {
      return Response.json(
        {
          status: "ERROR",
          message: "firm_name, employee_id, and ticker are required.",
        },
        { status: 400 },
      );
    }

    const employee: Employee = {
      id: employeeId,
      role: "Analyst",
      division: "Research",
      firm: firmName,
      covered_tickers: ["TSLA", "AAPL", ticker],
    };

    const security: Security = {
      ticker,
      earnings_date: new Date().toISOString().slice(0, 10),
      market_cap: 1_000_000_000,
    };

    const tradeDate = new Date().toISOString().slice(0, 10);
    const result = await executor.checkCompliance(
      firmName,
      employee,
      security,
      tradeDate,
    );

    return Response.json(result);
  } catch (error) {
    console.error("Compliance check failed:", error);
    return Response.json(
      {
        status: "ERROR",
        message: "Failed to perform compliance check.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}

