import { Hono } from 'hono'
import { IterativePipeline } from '../services/iterative-pipeline'

const app = new Hono()

const pipeline = new IterativePipeline()

interface PolicyIngestRequest {
  firm_name?: string
  policy_text?: string
}

app.post('/ingest', async (c) => {
  try {
    const body = (await c.req.json()) as PolicyIngestRequest
    const firmName = body.firm_name?.trim()
    const policyText = body.policy_text?.trim()

    if (!firmName || !policyText) {
      return c.json(
        {
          status: 'ERROR',
          message: 'firm_name and policy_text are required.',
        },
        400,
      )
    }

    const rulesData = await pipeline.processPolicy(policyText, firmName)

    return c.json({
      status: 'SUCCESS',
      firm_name: firmName,
      rules_deployed: rulesData.rules.length,
      total_iterations: rulesData.total_iterations,
      rules: rulesData.rules.map((rule) => ({
        rule_name: rule.rule_name,
        description: rule.description,
        attempts: rule.generation_attempt,
        validated: rule.validation_history[rule.validation_history.length - 1]?.passed ?? false,
      })),
    })
  } catch (error) {
    console.error('Policy ingest failed:', error)
    return c.json(
      {
        status: 'ERROR',
        message: 'Failed to ingest policy.',
        details: error instanceof Error ? error.message : String(error),
      },
      500,
    )
  }
})

export default app
