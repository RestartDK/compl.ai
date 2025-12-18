import { Hono } from 'hono'
import { QueryParser } from '../services/query-parser.ts'
import { RulesExecutor } from '../services/rules-executor.ts'
import { getEmployeeById, getFirmRestrictions } from '../services/demo-data.ts'
import type { Employee, Security } from '../types/index.ts'

const app = new Hono()

const executor = new RulesExecutor()
const parser = new QueryParser()

interface ComplianceCheckRequest {
  firm_name?: string
  employee_id?: string
  query?: string
  trade_date?: string
}

app.post('/check', async (c) => {
  try {
    const body = (await c.req.json()) as ComplianceCheckRequest
    const firmName = body.firm_name?.trim()
    const employeeId = body.employee_id?.trim()
    const query = body.query?.trim()

    if (!firmName || !employeeId || !query) {
      return c.json(
        {
          status: 'ERROR',
          code: 'INVALID_REQUEST',
          message: 'firm_name, employee_id, and query are required.',
        },
        400,
      )
    }

    let parsedQuery
    try {
      parsedQuery = await parser.parseQuery(query, { firmName, employeeId })
    } catch (error) {
      return c.json(
        {
          status: 'ERROR',
          code: 'PARSE_ERROR',
          message: 'Unable to interpret the natural language query.',
          details: error instanceof Error ? error.message : String(error),
        },
        400,
      )
    }

    const employeeRecord = await getEmployeeById(employeeId)
    if (!employeeRecord) {
      return c.json(
        {
          status: 'ERROR',
          code: 'EMPLOYEE_NOT_FOUND',
          message: `Employee ${employeeId} was not found in demo_data_simple.json.`,
        },
        404,
      )
    }

    const { firm_restricted_list, quick_reference } =
      await getFirmRestrictions()

    const employee: Employee = {
      ...(employeeRecord as Record<string, unknown>),
      id: employeeRecord.id,
      role:
        (typeof employeeRecord.role === 'string'
          ? employeeRecord.role
          : undefined) ?? 'Employee',
      division:
        (typeof employeeRecord.division === 'string'
          ? employeeRecord.division
          : undefined) ??
        (typeof (employeeRecord as Record<string, unknown>).department ===
        'string'
          ? String((employeeRecord as Record<string, unknown>).department)
          : 'General'),
      firm: firmName,
      covered_tickers: Array.isArray(
        (employeeRecord as Record<string, unknown>).restricted_tickers,
      )
        ? ((employeeRecord as Record<string, unknown>)
            .restricted_tickers as string[])
        : undefined,
      firm_restrictions: firm_restricted_list,
      quick_reference,
    } as Employee

    const security: Security = {
      ticker: parsedQuery.ticker,
      requested_action: parsedQuery.action,
      parsed_query: parsedQuery,
    } as Security

    const tradeDate =
      body.trade_date ??
      parsedQuery.trade_date ??
      new Date().toISOString().slice(0, 10)

    const result = await executor.checkCompliance(
      firmName,
      employee,
      security,
      tradeDate,
    )

    return c.json({
      status: 'SUCCESS',
      firm_name: firmName,
      employee_id: employeeId,
      parsed_query: {
        ticker: parsedQuery.ticker,
        action: parsedQuery.action,
        trade_date: tradeDate,
      },
      compliance: result,
    })
  } catch (error) {
    console.error('Compliance check failed:', error)
    return c.json(
      {
        status: 'ERROR',
        code: 'UNEXPECTED_ERROR',
        message: 'Failed to perform compliance check.',
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
})

export default app
