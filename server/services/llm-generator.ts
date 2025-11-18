import Anthropic from "@anthropic-ai/sdk";
import type { GenerationContext, Rule } from "../types/index.ts";

const DEFAULT_MODEL = process.env.CLAUDE_MODEL ?? "claude-3-7-sonnet-latest";

function assertEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export class LLMGenerator {
  private client: Anthropic;
  private model: string;

  constructor(model: string = DEFAULT_MODEL) {
    const apiKey = assertEnvVar("ANTHROPIC_API_KEY");
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async generateRules(context: GenerationContext): Promise<Rule[]> {
    const prompt = buildInitialPrompt(context);
    const response = await this.sendPrompt(prompt);
    return parseRulesFromResponse(response);
  }

  async regenerateRule(context: GenerationContext): Promise<Rule[]> {
    if (!context.previous_attempt) {
      throw new Error("previous_attempt is required when regenerating a rule");
    }
    const prompt = buildRegenerationPrompt(context);
    const response = await this.sendPrompt(prompt);
    return parseRulesFromResponse(response);
  }

  private async sendPrompt(prompt: string): Promise<string> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      temperature: 0,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const blocks = message.content ?? [];
    const textBlock = blocks.find(
      (block) => block.type === "text",
    ) as { text: string } | undefined;
    if (!textBlock || !textBlock.text) {
      throw new Error("Anthropic response did not contain text content");
    }
    return textBlock.text.trim();
  }
}

function buildInitialPrompt(context: GenerationContext): string {
  return [
    "You are an expert compliance engineer. Convert the provided policy text into executable Python compliance rules.",
    "Rules must follow this exact template:",
    "---RULE START---",
    "RULE_ID: <machine_id>",
    "RULE_NAME: <human readable>",
    "DESCRIPTION: <concise explanation>",
    "POLICY_REF: <policy section reference>",
    "APPLIES_TO: <comma separated roles or ALL>",
    "```python",
    "def rule(employee, security, trade_date):",
    "    \"\"\"Explain what the rule enforces.\"\"\"",
    "    # logic that returns {\"allowed\": bool, \"reason\": str | None, \"policy_ref\": str | None}",
    "```",
    "---RULE END---",
    "",
    "Constraints:",
    "- Only use Python stdlib.",
    "- Do NOT import os, subprocess, pathlib, sys, or perform IO.",
    "- Return a dict with boolean `allowed`, optional `reason`, and optional `policy_ref`.",
    "",
    `Firm: ${context.firm_name}`,
    "Policy text:",
    context.policy_text,
  ].join("\n");
}

function buildRegenerationPrompt(context: GenerationContext): string {
  const previous = context.previous_attempt!;
  return [
    "You are refining an existing compliance rule based on validator feedback.",
    "Original policy text and firm context remain the same.",
    "Revise the rule while keeping the same intent.",
    "",
    "Previous attempt code:",
    "```python",
    previous.code.trim(),
    "```",
    "",
    "Validator error details:",
    previous.error,
    "",
    "Test results / runtime output:",
    previous.test_results,
    "",
    "Return ONLY properly formatted rules using the previously defined schema. Do not include commentary.",
    "",
    `Firm: ${context.firm_name}`,
    "Policy text:",
    context.policy_text,
  ].join("\n");
}

export function parseRulesFromResponse(response: string): Rule[] {
  const rules: Rule[] = [];
  const segments = response.split("---RULE START---").slice(1);

  for (const segment of segments) {
    const [body] = segment.split("---RULE END---");
    if (!body) {
      continue;
    }

    const ruleId = matchField(body, "RULE_ID");
    const ruleName = matchField(body, "RULE_NAME");
    const description = matchField(body, "DESCRIPTION");
    const policyReference = matchField(body, "POLICY_REF");
    const appliesTo = matchField(body, "APPLIES_TO");
    const pythonCode = matchPythonBlock(body);

    if (!ruleId || !ruleName || !description || !policyReference || !pythonCode) {
      console.warn("Skipping malformed rule block:", body);
      continue;
    }

    const appliesToRoles =
      appliesTo?.trim().toUpperCase() === "ALL"
        ? []
        : appliesTo
            .split(",")
            .map((role) => role.trim())
            .filter(Boolean);

    rules.push({
      rule_id: ruleId,
      rule_name: ruleName,
      description,
      policy_reference: policyReference,
      python_code: pythonCode,
      applies_to_roles: appliesToRoles,
      active: true,
      generation_attempt: 1,
      validation_history: [],
    });
  }

  return rules;
}

function matchField(body: string, field: string): string {
  const regex = new RegExp(`${field}:\\s*(.+)`);
  const match = body.match(regex);
  return match && match[1] !== undefined ? match[1].trim() : "";
}

function matchPythonBlock(body: string): string | null {
  const regex = /```python([\s\S]*?)```/;
  const match = body.match(regex);
  return match && match[1] !== undefined ? match[1].trim() : null;
}
