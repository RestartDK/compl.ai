## Compl AI – Personal Trading Compliance Assistant

Compl AI is an AI‑powered personal trading compliance assistant that helps financial industry employees understand **what they can and cannot trade**—instantly, in plain language, and fully aligned with their firm’s real policies and regulatory obligations.

> **Tagline:** *“ChatGPT for compliance—but with firm‑specific brains and built‑in guardrails.”*  
> **Alt:** *“Your personal compliance agent. Ask it anything, and it knows what you’re allowed to do—based on your role, your accounts, and your firm’s real rules.”*

---

## Problem: Personal Trading Compliance Is Broken

Financial services firms (banks, asset managers, hedge funds, audit/consulting firms) impose strict **personal trading and independence rules** on their employees. In practice, this leads to friction for both employees and compliance teams:

- **Complex, fragmented rules**
  - Overlapping regimes: firm policies, SEC/FINRA/CFTC/MiFID rules, PCAOB/audit independence, internal information barriers.
  - Ambiguous definitions of “covered persons” that vary by role, seniority, and business line.

- **High operational burden on compliance**
  - Hundreds of daily emails like “Can I buy X stock?” or “Can my spouse trade Y ETF?”.
  - Manual checks across codes of ethics, restricted lists, blackout calendars, and employee profiles.
  - Slow, inconsistent responses and heavy reliance on individual policy experts.

- **Poor employee experience**
  - Covered persons struggle to know what they can trade, when blackout periods apply, or how family/household accounts are treated.
  - Some firms resort to **blanket bans** (e.g., no trading in client names at all) because encoding nuanced rules is too hard.

- **Limited transparency and learning**
  - Employees rarely see *why* a trade is blocked or allowed.
  - Compliance teams lack structured analytics on questions, edge cases, and policy friction points.

The result is a process that feels like **“email + PDF + wait 2 days”** instead of a modern, guided workflow.

---

## Solution: AI Trading Compliance Assistant

Compl AI is a **chat‑first personal trading compliance assistant** for employees subject to trading restrictions.

- **Natural language experience**
  - Employees ask questions like:
    - “Can I trade Tesla this week?”
    - “Can my wife sell BNY Mellon this month?”
    - “Am I allowed to hold stock in an audit client?”
  - The system responds with **clear yes/no answers**, timing constraints, and human‑readable reasoning.

- **Firm‑specific policy brain**
  - Ingests the firm’s personal trading policy, insider trading policy, codes of ethics, and independence rules.
  - Converts these PDFs into a **structured policy model** (roles, rule types, trade parameters) instead of just doing text search.

- **Role‑aware personalization**
  - Uses the employee’s profile (business unit, role level, licenses, MNPI access, independence category, location) to decide:
    - Whether they are a covered person.
    - Which policy segments and regulations apply.

- **Embedded pre‑clearance workflow**
  - For trades that require pre‑clearance, Compl AI:
    - Auto‑builds a pre‑clearance request from the conversation.
    - Checks rules (blackouts, restricted list, holding period, etc.).
    - Submits a structured request to compliance with full context.

- **Guardrails, auditability, and analytics**
  - Full audit log of all questions, decisions, and rule snapshots.
  - Configurable nudges and alerts (e.g., “Your blackout window begins in 3 days”).
  - Usage analytics for compliance to prove adoption and refine rules.

---

## How It’s Different

Most existing tools (e.g., traditional personal trading and compliance platforms) are designed **for compliance teams**, not for the day‑to‑day employee experience. Compl AI takes a different approach:

- **Employee‑first UX**
  - Chat‑based, instant answers instead of ticket forms and email threads.
  - Focused on helping covered persons confidently understand what they can do, not just catching them when they misstep.

- **Deep role and risk modeling**
  - Moves beyond a flat “covered person” flag to nuanced risk categories:
    - Investment banking deal team (M&A, ECM, DCM).
    - Sales & trading / markets roles with client order flow.
    - Research analysts and associates.
    - Audit engagement team and Big‑4 style independence categories.
    - Low‑risk general staff and technical roles with potential MNPI access.
  - Each category has **specific rule sets** (e.g., research analysts cannot trade covered stocks; audit covered persons cannot hold audit clients).

- **Policy‑as‑data, not PDF**
  - Policies from major institutions (e.g., JPM, Goldman Sachs, BNY Mellon, Brookfield, Barings) are treated as **schemas and rule graphs**:
    - `Person`, `RelatedPerson`, `Account`, `Issuer`, `Security`, `Engagement`, `Deal`, `PolicyRule`, `TradeProposal`.
  - This allows for deterministic evaluation instead of brittle prompt‑only answers.

- **Explainable decisions**
  - Every answer includes **why**:
    - Which rule fired.
    - Which attributes and trade parameters mattered (role, issuer status, blackout window, holding period, position size, household coverage).
  - Compliance can review, override, and iterate on rule logic.

- **End‑to‑end traceability**
  - Audit logs capture:
    - Question, parsed trade proposal, rule snapshot, and decision.
    - User identity and timestamps.
    - Escalations and overrides.
  - Supports both regulatory expectations and internal audit/compliance reviews.

- **POC‑ready for high‑value verticals**
  - The initial model is tuned for:
    - **Front‑office banking** (M&A / ECM / DCM / markets).
    - **Audit and consulting firms** (Big‑4 style independence rules).
  - These are the environments where personal trading and independence risks are highest and policies most complex.

---

## How It Works

### 1. Data & Policy Ingestion

- **Source documents**
  - Personal trading policies, insider trading policies, and codes of ethics from banks, asset managers, hedge funds, and audit firms.
  - Regulatory frameworks: SEC/FINRA/CFTC, MiFID II, PCAOB/audit independence, information barrier frameworks.
  - Public examples (for POC/demo):
    - Brookfield – Personal Trading Policy.
    - BNY Mellon – Personal Securities Trading Policy.
    - J.P. Morgan Investment Management – Insider Trading Policy.
    - Goldman Sachs Asset Management – Insider Trading Policy.
    - Barings LLC – Insider Trading Policy.
    - Big‑4 style independence and covered person taxonomies.

- **Normalization into a schema**
  - Convert free‑text documents into a structured JSON model (example: `PersonalTradingPolicy`) with:
    - `firm`, `document_title`, `url`.
    - `covered_person_definition` and role groupings.
    - `roles` with `role_name` and `rule_requirements`.
    - `rule_types` representing generic policy patterns (e.g., blackout, restricted list, pre‑clearance, holding period).
  - This forms the **policy brain** used by the rules engine.

### 2. Employee & Context Modeling

The system models the real‑world actors and relationships that policies care about:

- **Person (Employee profile)**
  - Attributes like:
    - `employment_type`, `business_unit`, `job_family`, `role_level`.
    - `location_country`, `regulatory_licenses`.
    - `mnpi_access_flag` and `mnpi_access_type` (deal team, research, trading flows, issuer financials, audit workpapers).
    - `independence_sensitive_flag` (for audit).
    - `restricted_role_category` (e.g., `IBD_DEAL_TEAM`, `RESEARCH_ANALYST`, `TRADER`, `AUDIT_ENGAGEMENT_TEAM`, `GENERAL_STAFF`).

- **RelatedPerson (Household and controlled entities)**
  - Captures spouses, dependents, household members, and entities the employee controls.
  - Handles rules that extend to **immediate family** and controlled accounts.

- **Account (Brokerage/financial accounts)**
  - Owner type (employee vs related person vs entity).
  - Discretion type (employee discretion, advisor discretion, blind trust).
  - Pre‑clear/attestation status and data feed availability.

- **Issuer & Security**
  - Issuer‑level flags:
    - Audit client, advisory/bank client, on restricted/watch/grey list, under inside‑information/deal flag.
  - Security‑level details:
    - Type (stock, bond, option, ETF, fund, derivative, crypto).
    - Ticker/ISIN/CUSIP.
    - Diversification and liquidity buckets (for PAD / independence).

- **Engagement / Deal**
  - For audit/consulting firms:
    - Audit client engagements, risk categories, team members, and office codes.
  - For banks:
    - Deals (M&A, IPO, bond issue, restructuring), statuses, blackout windows, and deal teams.

### 3. Trade Proposal & NLP Router

When an employee interacts with Compl AI:

1. **Input**  
   The employee asks a question in natural language, e.g.:
   - “Can I trade Tesla this week?”
   - “Can my spouse buy shares in a company we audit?”

2. **Parsing & structuring**  
   An NLP layer extracts:
   - **Intent** (pre‑clearance check vs general policy query vs edge case).
   - **Trade parameters**:
     - Ticker/issuer.
     - Side: buy / sell / short / options.
     - Timeframe: “today”, “this week”, “after earnings”, etc.
     - Rough size or notional if mentioned.

3. **TradeProposal object**  
   Build a `TradeProposal` that ties together:
   - Employee and account.
   - Security/issuer and client/audit status.
   - Derived metrics:
     - `holding_period_since_last_trade`.
     - `daily_volume_percent` (trade size vs ADV).
     - `position_concentration` (post‑trade exposure).

### 4. Rules Engine Evaluation

The core evaluation step uses **deterministic rules** built from the policy schema:

- **Role‑based scoping**
  - Identify which rule sets apply based on:
    - Role category (e.g., research analyst, trader, audit engagement team, general staff).
    - MNPI access group (deal team, order flow, issuer reporting, technical systems).
    - Regulatory category (e.g., PCAOB covered person, MiFID II PAD subject).

- **Issuer & security classification**
  - Determine whether the security is:
    - An audit client / advisory client / bank client.
    - On a restricted, watch, or grey list.
    - Related to the employee’s own firm or affiliates.

- **Policy constraints**
  - Apply patterns such as:
    - No trading in audit clients for covered persons (independence).
    - No trading in deal issuers during blackout (e.g., Reg M).
    - Research analysts cannot trade stocks they cover, or only with strict holding periods.
    - Minimum holding periods for certain roles.
    - Limits on trade size vs average daily volume and portfolio concentration.
    - Prohibitions on short‑selling and derivatives for employer, client, or audit client securities.

- **Household and entities**
  - Extend rules to immediate family members and controlled entities where required by policy.

The result is one of:

- **PROHIBITED**
- **PRE‑CLEAR REQUIRED**
- **PERMITTED WITH LIMITS**
- **PERMITTED**

Each decision includes a **full explanation trail**.

### 5. Response, Pre‑Clearance, and Escalation

- **Employee‑facing answer**
  - The assistant gives a concise, plain‑English response, such as:
    - “You are in a blackout window (Q4 earnings). You cannot trade TSLA until Nov 30.”
    - “Trade permitted, but pre‑clearance is required for your role. I’ve prepared a pre‑clearance request for compliance.”

- **Pre‑clearance workflow**
  - Automatically fills a pre‑clearance form using:
    - Employee identity and role.
    - Account and security details.
    - Relevant rule hits and calculated parameters.
  - Routes to compliance with a structured record for faster review and decision.

- **Escalation**
  - If the system detects incomplete or ambiguous data (e.g., unknown household account, unclear control over an entity, missing engagement mapping), it flags the case and prompts:
    - Additional questions to the user, and/or
    - Escalation to compliance for manual review.

### 6. Admin, Audit, and Analytics

- **Compliance admin layer (conceptual POC)**
  - Configure and version rules (e.g., “No trades 5 days before earnings,” “Block all audit clients for Categories 1–4 covered persons”).
  - Simulate the impact of rule changes across different role profiles.
  - View history of requests, overrides, and systemic pain points.

- **Auditability**
  - Log every interaction:
    - Question and parsed `TradeProposal`.
    - Policy rule snapshot and decision path.
    - User identity and timestamps.
    - Escalations and final outcomes.

- **Usage analytics and nudges**
  - Track:
    - Volume and type of employee questions.
    - Approved vs rejected trades.
    - Hotspots by issuer, role, or desk.
  - Provide configurable nudges:
    - “Your blackout window begins in 3 days.”
    - “New policy affects your household accounts—please confirm details.”

---

## Technical Sketch (Hackathon POC)

While this repository is backend‑heavy, the intended architecture for the full POC is:

- **Frontend**
  - Vite‑based single‑page app with a chat‑style interface for employees.

- **Backend**
  - TypeScript service exposing:
    - Policy ingestion and normalization.
    - Rules engine evaluation endpoints (e.g., `/api/compliance-check`).
    - Storage and retrieval of user profiles, issuers, engagements, and audit logs.

- **External integrations (optional for POC)**
  - Perplexity / web search for SEC filings and public M&A data.
  - Voice layer (e.g., ElevenLabs) for spoken answers.

The goal for the hackathon is to achieve a **90%‑prepared** problem/solution and data model before live coding, so that most of the weekend can be spent building and iterating on the actual employee experience and rules engine.

---

## Team

Compl AI is built by a cross‑functional team combining **engineering**, **AI**, and **real‑world compliance** experience:

- **Kirill (Gertsdev)** – Former financial advisor turned full‑stack engineer with an AI focus (agents, chatbots); 3rd place at ETR Global Hackathon.
- **Amber (Amberabbaskhan12)** – Trade surveillance and compliance background (stocks, equities, penny stocks); deep domain input on covered persons and rules.
- **Yiran** – Investment bank software engineer with backend and cloud experience (AWS); previous hackathon experience on ML‑driven products.
- **Daniel** – Senior CS student with full‑stack and AI agents experience (healthcare, agencies, code‑understanding agents).

Together, the team is focused on building **“ChatGPT for compliance”**—but with the firm‑specific rules, guardrails, and auditability required in real financial institutions.


