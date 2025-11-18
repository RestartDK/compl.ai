<!-- e8944c29-c7a6-44b0-ab8d-3a5f7b6284ea e5a360e4-ba45-45cb-bc37-8941a90516ff -->
# Iterative Policy-as-Code System in Bun with Daytona

## High-Level Approach

- **Goal**: Build a Bun backend that turns firm policies (input text) into validated Python compliance rules via an iterative LLM + Daytona loop, stores them as JSON, and executes them for trade checks.
- **Architecture**: Follow the proposed `server/` layout with clear separation between API layer (`api/`), orchestration (`services/`), type definitions (`types/`), utilities (`utils/`), and on-disk rule storage (`rules/dynamic/`).
- **Tech stack**: Use Bun for the server runtime, `@anthropic-ai/sdk` for Claude, `@daytonaio/sdk` for sandboxes, and a Python interpreter reachable via subprocess for rule execution.

## Feature Inputs & Outputs

### 1) Policy Ingestion & Rule Generation

- **HTTP Endpoint**: `POST /api/policies/ingest`
- **Input (request JSON body)**:
- `firm_name: string` — Human-readable firm identifier, e.g. `"JPMorgan"`.
- `policy_text: string` — Full policy text already extracted from PDF.
- **Processing (internal)**:
- Builds a `GenerationContext` and calls `IterativePipeline.processPolicy(policyText, firmName)`.
- `IterativePipeline` uses `LLMGenerator` → `DaytonaValidator` → `RulesStorage`.
- **Output (HTTP JSON response)**:
- `status: "SUCCESS" | "ERROR"` (for success path we return `"SUCCESS"`).
- `firm_name: string` — Echo of the firm name.
- `rules_deployed: number` — Count of validated rules saved to disk.
- `total_iterations: number` — Total LLM validation iterations across all rules.
- `rules: Array<{ rule_name: string; description: string; attempts: number; validated: boolean | undefined }>` — Summary per rule for UI/observability.

- **Rules JSON file (`rules/dynamic/{firm_name}_rules.json`)**:
- Matches the `RulesData` interface:
- `firm_name: string`
- `policy_version: string` — e.g. `"2025-11"`.
- `last_updated: string` — ISO timestamp.
- `generated_by_llm: true`
- `total_iterations: number`
- `rules: Rule[]` — Full rule objects including Python code and validation history.

### 2) Compliance Check (Employee Query)

- **HTTP Endpoint**: `POST /api/compliance/check`
- **Input (request JSON body)**:
- `firm_name: string` — Firm identifier to choose which rules JSON to load.
- `employee_id: string` — Logical ID for the employee (used now only to build a mock `Employee`).
- `ticker: string` — Security ticker, e.g. `"TSLA"`.
- **Processing (internal)**:
- Builds an `Employee` object (mock for now) from `employee_id` + `firm_name`.
- Builds a `Security` object (mock for now) from `ticker`.
- Calls `RulesExecutor.checkCompliance(firmName, employee, security, tradeDate)` where `tradeDate` is today’s date string.
- **Output (HTTP JSON response)**: matches `ComplianceResult`:
- `allowed: boolean` — Overall decision after applying all rules.
- `reasons: string[]` — Human-readable reasons from rules that blocked the trade.
- `policy_refs: string[]` — Policy references (e.g. `"Section 3.2.1"`) from triggered rules.
- `rules_checked: string[]` — Names of rules that ran for this query.

### 3) Core Internal Types (Summarized)

- **`Rule`**:
- `rule_id: string`
- `rule_name: string`
- `description: string`
- `policy_reference: string`
- `python_code: string`
- `applies_to_roles: string[]`
- `active: boolean`
- `generation_attempt: number` — Last attempt index.
- `validation_history: ValidationAttempt[]`
- **`ValidationAttempt`**:
- `attempt_number: number`
- `passed: boolean`
- `error?: string`
- `test_output?: string`
- `feedback_to_llm?: string`
- `timestamp: string`
- **`RulesData`**:
- `firm_name: string`
- `policy_version: string`
- `last_updated: string`
- `generated_by_llm: true`
- `total_iterations: number`
- `rules: Rule[]`
- **`GenerationContext`**:
- `policy_text: string`
- `firm_name: string`
- `previous_attempt?: { code: string; error: string; test_results: string }`
- **`Employee`**:
- `id: string`
- `role: string`
- `division: string`
- `firm: string`
- `covered_tickers?: string[]`
- **`Security`**:
- `ticker: string`
- `earnings_date?: string`
- `market_cap?: number`
- **`ComplianceResult`**:
- `allowed: boolean`
- `reasons: string[]`
- `policy_refs: string[]`
- `rules_checked: string[]`

## Step 1: Project & Server Skeleton (Bun-optimized)

- **Create server entrypoint**: Add `server/index.ts` that uses `Bun.serve()` with a `routes` map so that `"/api/policies/ingest"` and `"/api/compliance/check"` each define `POST` handlers delegating to `server/api/policy-ingest.ts` and `server/api/compliance-check.ts`, following the pattern in the Bun HTTP server docs ([Bun HTTP server docs](https://bun.com/docs/runtime/http/server)).
- **Routing strategy**: Prefer Bun’s built-in router (with `routes` and per-method handlers) over a manual `fetch` switch, and optionally add a `fetch` fallback that returns 404 for unknown paths, mirroring the examples in the Bun docs.
- **Env handling**: Rely on Bun’s automatic `.env` loading (no `dotenv`), validating that `ANTHROPIC_API_KEY` and `DAYTONA_API_KEY` are present at startup.
- **Dependencies**: Ensure `@anthropic-ai/sdk` and `@daytonaio/sdk` are installed and TypeScript is configured to compile the new `server/` tree.

## Step 2: Types Module

- **Define core interfaces**: Create `server/types/index.ts` with the provided `Rule`, `ValidationAttempt`, `RulesData`, `GenerationContext`, `Employee`, `Security`, and `ComplianceResult` interfaces.
- **Shared validation types**: Add a `ValidationResult` interface (or export from `daytona-validator`) to describe the outcome of rule validation, used across `IterativePipeline` and `DaytonaValidator`.
- **Type alignment**: Make sure fields used in services (e.g., `validation_history`, `generation_attempt`) match the interfaces exactly, and use these types consistently in all service signatures.

## Step 3: LLM Generator Service

- **Create `LLMGenerator`**: Implement `server/services/llm-generator.ts` with a class that constructs an `Anthropic` client using `process.env.ANTHROPIC_API_KEY`.
- **Initial generation**: Implement `generateRules(context: GenerationContext): Promise<Rule[]>` using the provided `buildInitialPrompt`, adapting the model name to a configurable constant or env variable (e.g., `CLAUDE_MODEL` defaulting to `claude-3-7-sonnet-latest`).
- **Regeneration**: Implement `regenerateRule(context: GenerationContext): Promise<Rule[]>` that requires `previous_attempt`, uses `buildRegenerationPrompt`, and parses the response the same way as initial generation.
- **Prompt builders**: Port and slightly refine `buildInitialPrompt` and `buildRegenerationPrompt` from the spec, ensuring they clearly state allowed imports, return schema, and strict output format.
- **Parser**: Implement `parseRulesFromResponse(response: string): Rule[]` that:
- Splits on `---RULE START---` / `---RULE END---`.
- Extracts `RULE_ID`, `RULE_NAME`, `DESCRIPTION`, `POLICY_REF`, `APPLIES_TO` via regex.
- Pulls the Python block between ```python fences and trims it.
- Converts `APPLIES_TO` into a `string[]` (empty if `ALL`), initializes `active: true`, `generation_attempt: 1`, and `validation_history: []`.
- Skips malformed blocks with console warnings.

## Step 4: Daytona Validator Service (Docs-aligned)

- **Create `DaytonaValidator`**: Implement `server/services/daytona-validator.ts` that constructs a `Daytona` client with `DAYTONA_API_KEY`, following the client initialization patterns in the Daytona docs ([Daytona docs](https://www.daytona.io/docs/en/)).
- **Security checks**: Add `checkSecurity(code: string)` to scan for dangerous patterns (e.g., `import os`, `subprocess`, `open(`, `exec(`, `eval(`, `__import__`) and return a `{ safe, reason }` object.
- **Sandbox lifecycle**: Use Daytona’s recommended sandbox lifecycle: `const sandbox = await daytona.create({ language: 'python' })`, run validation steps through `sandbox.process.codeRun(...)`, and always `await sandbox.delete()` in a `finally` block, matching the resource cleanup guidance in the docs.
- **Syntax validation**: Implement `checkSyntax(sandbox, rule)` by running a small Python snippet in the Daytona sandbox that uses `ast.parse()` against the rule’s source and prints either `SYNTAX_VALID` or a `SYNTAX_ERROR` with details.
- **Runtime tests**: Implement `runTests(sandbox, rule)` that:
- Injects the rule’s Python function into a test harness.
- Constructs mock `employee`, `security`, and `date` values.
- Calls the rule function and verifies that the result is a dict containing a boolean `allowed` key.
- Differentiates between runtime crashes (`RUNTIME_ERROR:` prefix) and logical test failures.
- **Public API**: Implement `validateRule(rule: Rule): Promise<ValidationResult>` to orchestrate security, syntax, and runtime checks, returning structured flags (`syntax_error`, `runtime_error`, `test_failure`, `security_issue`, `error`, `test_output`), and always cleaning up the Daytona sandbox.

## Step 5: Rules Storage Layer

- **Directory setup**: Implement `RulesStorage` in `server/services/rules-storage.ts` that ensures `rules/dynamic` exists under `process.cwd()` (e.g., `rules/dynamic/{firm_name}_rules.json`).
- **Bun-friendly IO**: Prefer Bun APIs (`Bun.write`, `Bun.file(filepath).text()`) instead of Node `fs` where convenient, wrapped in async helper methods.
- **Save rules**: Implement `saveRules(firmName, rules, totalIterations): Promise<RulesData>` that constructs a `RulesData` object (including `policy_version`, `last_updated`, `generated_by_llm`, `total_iterations`), serializes it to pretty JSON, writes it to disk, and caches it in a `Map` keyed by `firmName`.
- **Load rules**: Implement `loadRules(firmName): Promise<RulesData | null>` that checks the in-memory cache, falls back to reading the JSON file if present, parses it, updates the cache, and returns the data or `null` if missing.

## Step 6: Python Bridge Utility

- **Create `python-bridge.ts`**: Implement `server/utils/python-bridge.ts` as a small utility that wraps `child_process.spawn` for executing Python snippets with JSON input and output.
- **Configuration**: Allow the Python executable name to be configured via env (e.g., `PYTHON_BIN` defaulting to `python`), to align with local environments.
- **Execution API**: Expose a function like `runPythonCode(code: string, input: any): Promise<string>` that:
- Spawns the Python process (`spawn(PYTHON_BIN, ['-c', code])`).
- Writes `JSON.stringify(input)` to stdin.
- Collects stdout/stderr, rejects on non-zero exit codes, and resolves with stdout for the caller to parse.
- **Error handling**: Include timeouts or max-output safeguards if needed later, but keep the initial version simple and robust.

## Step 7: Rules Executor Service

- **Create `RulesExecutor`**: Implement `server/services/rules-executor.ts` that composes `RulesStorage` and the Python bridge.
- **Compliance check flow**: Implement `checkCompliance(firmName, employee, security, date): Promise<ComplianceResult>` that:
- Loads rules for the firm; if none, returns an `allowed: true` default result.
- Initializes a `ComplianceResult` object with `allowed: true`, and empty `reasons`, `policy_refs`, `rules_checked` arrays.
- Iterates over active rules, skipping those whose `applies_to_roles` do not cover the employee’s role if the list is non-empty.
- For each applicable rule, calls `executeRule(...)` and merges the outcome (setting `allowed: false` and pushing reasons and policy refs when a rule blocks the trade).
- **Rule execution**: Implement `executeRule(pythonCode, functionName, employee, security, date)` to:
- Build a Python script that appends JSON stdin reading, binds `employee`, `security`, and `date`, calls the function, and prints the result as JSON.
- Delegate to `python-bridge` and then parse the returned JSON into `{ allowed: boolean; reason?: string }`.
- Throw or log descriptive errors when execution or JSON parsing fails while still allowing other rules to run.

## Step 8: Iterative Pipeline Orchestrator

- **Create `IterativePipeline`**: Implement `server/services/iterative-pipeline.ts` that wires `LLMGenerator`, `DaytonaValidator`, and `RulesStorage` together.
- **processPolicy**: Implement `processPolicy(policyText, firmName): Promise<RulesData>` that:
- Logs start and policy length for observability.
- Calls `llmGenerator.generateRules` once to get an initial `Rule[]`.
- For each rule, calls `validateAndRefineRule` and either collects the validated rule or logs and skips if validation fails after max attempts.
- Tracks `totalIterations` across all rules and calls `rulesStorage.saveRules` with the validated subset.
- **Validation loop**: Implement `validateAndRefineRule(initialRule, policyText, firmName)` as in the spec:
- Maintains `currentRule` and `attempt` count up to `maxIterationsPerRule` (e.g., 5).
- On each iteration, calls `daytonaValidator.validateRule`, records a `ValidationAttempt` inside `currentRule.validation_history`, and updates `generation_attempt`.
- If validation passes, returns `{ validated: true, rule: currentRule, iterations: attempt }`.
- If it fails and attempts remain, constructs detailed feedback via `createFeedbackForLLM`, logs it, and calls `llmGenerator.regenerateRule` with `GenerationContext.previous_attempt` filled from the failure; then uses the first regenerated rule while preserving `rule_id` and `validation_history`.
- If max attempts are reached or regeneration fails, returns `{ validated: false, rule: currentRule, iterations: attempt }`.
- **Feedback builder**: Implement `createFeedbackForLLM(validationResult)` that maps flags (`syntax_error`, `runtime_error`, `test_failure`, `security_issue`) into clear natural-language guidance embedded in the regeneration prompt.

## Step 9: API Handlers

- **Policy ingest endpoint**: Implement `server/api/policy-ingest.ts` with a `POST` handler (`export async function POST(request: Request)`) that:
- Parses JSON body, validating `policy_text` and `firm_name`.
- Instantiates `IterativePipeline` and calls `processPolicy`.
- Returns a JSON response including `firm_name`, `rules_deployed`, `total_iterations`, and a per-rule summary (`rule_name`, `description`, `attempts`, `validated`).
- Uses appropriate HTTP status codes and includes safe error messages on failure.
- **Compliance check endpoint**: Implement `server/api/compliance-check.ts` with a `POST` handler that:
- Parses JSON body for `employee_id`, `ticker`, and `firm_name`.
- Constructs placeholder `employee` and `security` objects (to be later replaced with DB/API lookups) using the shared `Employee` and `Security` interfaces.
- Creates a `RulesExecutor`, calls `checkCompliance`, and returns a `ComplianceResult` JSON.
- Handles errors similarly to the ingest endpoint.
- **Wire into `Bun.serve`**: In `server/index.ts`, import these handler functions and map them directly into the `routes` configuration, using Bun’s per-method handlers as in the official REST API example ([Bun HTTP server docs](https://bun.com/docs/runtime/http/server)).

## Step 10: Testing & Iteration

- **Manual tests**: Use the provided `curl` examples (or REST client) to:
- Ingest a simple sample policy for a test firm (e.g., "Employees cannot trade within 5 days of earnings announcements...").
- Then call the compliance check endpoint for a sample employee and ticker.
- **Logging & observability**: Keep the console logs in `IterativePipeline` and `DaytonaValidator` to observe iterations, validation failures, and regeneration attempts during early development.
- **Error hardening**: Once the core loop works, add additional guardrails (e.g., stricter response validation from Claude, better error messages in API responses) as needed.
- **Future enhancements**: Optionally add `bun test` suites for parsing logic and rule execution, and later integrate the existing `index.ts` experimentation script with the new system if useful.

### To-dos

- [ ] Create Bun server entrypoint in server/index.ts with routing for the two API endpoints and validate environment configuration.
- [ ] Implement server/types/index.ts with all core interfaces and shared validation result types.
- [ ] Create LLMGenerator service for initial and regenerated rule creation plus parsing from Claude responses.
- [ ] Create DaytonaValidator with security, syntax, and runtime checks plus RulesStorage using Bun-friendly file IO.
- [ ] Create Python bridge utility and RulesExecutor service to run stored rules via Python subprocesses.
- [ ] Implement IterativePipeline orchestrator and both API handlers, then verify end-to-end with sample policies and curl tests.