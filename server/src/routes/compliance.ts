import { Hono } from 'hono'
import { QueryParser } from '../services/query-parser'
import { RulesExecutor } from '../services/rules-executor'
import type { Employee, Security } from '../types/index.ts'

const app = new Hono()

const executor = new RulesExecutor()
const parser = new QueryParser()

interface ComplianceCheckRequest {
  firm_name?: string
  employee?: Record<string, unknown>
  firm_restricted_list?: unknown[]
  quick_reference?: Record<string, unknown>
  query?: string
  trade_date?: string
}

app.post('/check', async (c) => {
  try {
    const body = (await c.req.json()) as ComplianceCheckRequest
    const firmName = body.firm_name?.trim()
    const employee = body.employee
    const firmRestrictedList = body.firm_restricted_list
    const quickReference = body.quick_reference
    const query = body.query?.trim()

    if (!firmName || !query) {
      return c.json(
        {
          status: 'ERROR',
          code: 'INVALID_REQUEST',
          message: 'firm_name and query are required.',
        },
        400,
      )
    }

    if (!employee || typeof employee !== 'object') {
      return c.json(
        {
          status: 'ERROR',
          code: 'INVALID_REQUEST',
          message: 'employee object is required.',
        },
        400,
      )
    }

    if (!Array.isArray(firmRestrictedList)) {
      return c.json(
        {
          status: 'ERROR',
          code: 'INVALID_REQUEST',
          message: 'firm_restricted_list array is required.',
        },
        400,
      )
    }

    let parsedQuery
    try {
      const employeeId = typeof employee.id === 'string' ? employee.id : undefined
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

    const employeeId = typeof employee.id === 'string' ? employee.id : 'UNKNOWN'
    const employeeRole = typeof employee.role === 'string' ? employee.role : 'Employee'
    const employeeDivision = typeof employee.division === 'string' 
      ? employee.division 
      : (typeof employee.department === 'string' ? employee.department : 'General')

    const employeeData: Employee = {
      ...(employee as Record<string, unknown>),
      id: employeeId,
      role: employeeRole,
      division: employeeDivision,
      firm: firmName,
      covered_tickers: Array.isArray(employee.restricted_tickers)
        ? (employee.restricted_tickers as string[])
        : undefined,
      firm_restrictions: firmRestrictedList,
      quick_reference: quickReference,
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
      employeeData,
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
