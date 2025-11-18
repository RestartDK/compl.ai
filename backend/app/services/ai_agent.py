import json
import os
from pathlib import Path
try:
    import google.generativeai as genai
except Exception as e:
    print(f"Warning: Could not import google.generativeai: {e}")
    genai = None

from app.services.employee_database import EmployeeDatabase

class AIComplianceAgent:
    """AI-powered compliance advisor using Google Gemini for fast, cost-effective decisions"""
    
    RULES_DIRECTORY = Path(__file__).parent.parent.parent / "compliance_rules"
    
    def __init__(self):
        self.employee_db = EmployeeDatabase()
        self.conversation_history = []
        
        if not genai:
            print("⚠️  Warning: google.generativeai library not available. AI agent will return mock responses.")
            self.client = None
            return
            
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            print("⚠️  Warning: GEMINI_API_KEY not set. AI agent will return mock responses.")
            self.client = None
        else:
            try:
                genai.configure(api_key=api_key)
                self.client = genai.GenerativeModel('gemini-2.5-flash')
            except Exception as e:
                print(f"⚠️  Warning: Failed to initialize Gemini client: {e}")
                self.client = None
    
    def load_firm_rules(self, firm: str) -> str:
        """Load compliance rules for a specific firm"""
        # Convert firm name to filename (e.g., "XYZ Capital" -> "xyz_capital_rules.md")
        firm_slug = firm.lower().replace(" ", "_").replace("&", "and")
        rules_file = self.RULES_DIRECTORY / f"{firm_slug}_rules.md"
        
        if rules_file.exists():
            try:
                with open(rules_file, 'r') as f:
                    return f.read()
            except Exception as e:
                print(f"Warning: Could not read rules file: {e}")
                return "No rules found for this firm."
        else:
            return f"No rules file found for {firm}. Expected: {rules_file}"
    
    def consult_for_trade(self, user_id: str, ticker: str, action: str, trade_date: str) -> dict:
        """Consult AI agent for edge case trade decisions with rule sourcing"""
        
        # Fetch real employee data
        employee = self.employee_db.get_employee(user_id)
        if not employee:
            return {
                "decision": "ERROR",
                "reason": f"Employee {user_id} not found in database",
                "requires_action": "Check employee ID and try again"
            }
        
        # Load firm-specific compliance rules
        firm_name = "Meridian Capital"  # Using real firm name
        firm_rules_text = self.load_firm_rules(firm_name)
        
        # Get employee tier and department
        tier = employee.get('tier', 'unknown')
        department = employee.get('department', 'unknown')
        name = employee.get('name', 'unknown')
        restricted_list = employee.get('restricted_securities', [])
        active_deals = employee.get('active_deals', [])
        coverage_list = employee.get('coverage_list', [])
        
        # Check if ticker is in restricted list
        ticker_restricted = ticker.upper() in [s.upper() for s in restricted_list]
        ticker_in_deals = ticker.upper() in [d.get('ticker', '').upper() for d in active_deals if d.get('ticker')]
        ticker_in_coverage = ticker.upper() in [c.get('ticker', '').upper() for c in coverage_list]
        
        context = f"""You are a compliance advisor at Meridian Capital Partners analyzing a trade request. 
Provide decisions with specific rule citations from the compliance manual.

EMPLOYEE PROFILE:
- Employee ID: {user_id}
- Name: {name}
- Title: {employee.get('title', 'Unknown')}
- Department: {department}
- Tier: {tier} ({self._get_tier_name(tier)})
- Years at Firm: {employee.get('years_at_firm', 'Unknown')}

TRADE REQUEST:
- Ticker: {ticker}
- Action: {action.upper()}
- Trade Date: {trade_date}

EMPLOYEE RESTRICTIONS:
- Restricted Securities Count: {len(restricted_list)}
- Active Deals Count: {len(active_deals)}
- Coverage List: {', '.join([c.get('ticker', 'N/A') for c in coverage_list]) if coverage_list else 'None'}
- Ticker in Restricted List: {ticker_restricted}
- Ticker in Active Deals: {ticker_in_deals}
- Ticker in Coverage: {ticker_in_coverage}

MERIDIAN CAPITAL COMPLIANCE RULES:
{firm_rules_text}

Based on the employee profile, tier, and compliance rules:

1. Identify the applicable rule sections
2. Determine if this trade is prohibited, requires pre-clearance, or is approved
3. Cite the specific rule number and section
4. Provide confidence level based on rule clarity

Respond ONLY with valid JSON (no markdown):
{{
    "decision": "PROHIBITED" or "REQUIRES_PRECLEARANCE" or "APPROVED",
    "confidence": 0.95,
    "tier": {tier},
    "applicable_rules": ["Rule 1.1: Active Deal Prohibition", "Rule 2.1: Coverage Prohibition"],
    "rule_sources": ["Section from the rules that directly applies"],
    "reason": "Detailed explanation citing specific rules",
    "conditions": [],
    "requires_action": "What user needs to do",
    "estimated_approval_time": "If preclearance, how long"
}}"""

        try:
            # If API key not configured, return mock response with rule references
            if not self.client:
                return self._get_mock_decision(employee, ticker, active_deals, coverage_list, restricted_list)
            
            # Call Google Gemini for analysis
            response = self.client.generate_content(context)
            response_text = response.text.strip()
            
            # DEBUG: Print raw response
            print(f"🔍 DEBUG - Raw Gemini response: {response_text[:500]}")
            
            # Remove markdown code fences if present (Gemini sometimes wraps JSON in ```json...```)
            if response_text.startswith('```'):
                response_text = response_text.split('```')[1]  # Get content between fences
                if response_text.startswith('json\n'):
                    response_text = response_text[5:]  # Remove "json\n" prefix
                response_text = response_text.strip()
            
            # Parse JSON response
            ai_decision = json.loads(response_text)
            
            return ai_decision
        
        except json.JSONDecodeError as e:
            # DEBUG: Print full response object
            print(f"🔍 DEBUG - Full response object: {response}")
            print(f"🔍 DEBUG - Response text (empty check): len={len(response_text)}, repr={repr(response_text)}")
            if hasattr(response, 'candidates'):
                print(f"🔍 DEBUG - Candidates: {response.candidates}")
            if hasattr(response, '_pb'):
                print(f"🔍 DEBUG - Content: {response._pb}")
            print(f"🔍 DEBUG - JSON parse error: {e}")
            
            # If AI response is not valid JSON, return a safe default
            return {
                "decision": "REQUIRES_REVIEW",
                "confidence": 0.5,
                "reason": f"Could not parse AI response. Error: {str(e)}. Escalating to compliance officer.",
                "requires_action": "Contact your compliance officer for manual review",
                "estimated_approval_time": "24 hours"
            }
        except Exception as e:
            return {
                "decision": "ERROR",
                "reason": f"AI service error: {str(e)}",
                "requires_action": "Contact support"
            }
    
    def _get_tier_name(self, tier: int) -> str:
        """Get human-readable tier name"""
        tier_names = {
            1: "Investment Banking (Most Restrictive)",
            2: "Research, Trading, Portfolio Management",
            3: "Compliance, Legal, Technology, Risk",
            4: "Administrative & Support (Minimal)"
        }
        return tier_names.get(tier, f"Tier {tier}")
    
    def _get_mock_decision(self, employee: dict, ticker: str, active_deals: list, coverage_list: list, restricted_list: list) -> dict:
        """Generate mock decision based on employee data"""
        tier = employee.get('tier')
        ticker_upper = ticker.upper()
        
        # Check active deals
        deal_tickers = [d.get('ticker', '').upper() for d in active_deals if d.get('ticker')]
        if ticker_upper in deal_tickers:
            return {
                "decision": "PROHIBITED",
                "confidence": 0.99,
                "reason": f"Ticker {ticker} is involved in an active deal you are working on.",
                "applicable_rules": ["Rule 1.1: Active Deal Prohibition"],
                "rule_sources": ["Cannot trade securities related to active deals"],
                "requires_action": "Cannot trade this security. Choose alternative investment.",
                "estimated_approval_time": "N/A - Absolute prohibition"
            }
        
        # Check coverage
        coverage_tickers = [c.get('ticker', '').upper() for c in coverage_list]
        if ticker_upper in coverage_tickers:
            return {
                "decision": "PROHIBITED",
                "confidence": 0.99,
                "reason": f"You cover {ticker} in your research. Absolute prohibition under FINRA 2241.",
                "applicable_rules": ["Rule 2.1: Research Analyst Coverage Prohibition (FINRA 2241)"],
                "rule_sources": ["Research analysts cannot trade covered securities"],
                "requires_action": "Cannot trade this security. Consider broad market ETFs instead.",
                "estimated_approval_time": "N/A - Absolute prohibition"
            }
        
        # Check restricted list
        if ticker_upper in [r.upper() for r in restricted_list]:
            return {
                "decision": "PROHIBITED",
                "confidence": 0.95,
                "reason": f"{ticker} is on your firm-wide restricted list.",
                "applicable_rules": ["Rule 1.2: Coverage Universe Prohibition"],
                "rule_sources": ["Security is in your coverage area or on restricted list"],
                "requires_action": "Cannot trade this security.",
                "estimated_approval_time": "N/A"
            }
        
        # Tier 1 - require preclearance for most things
        if tier == 1:
            return {
                "decision": "REQUIRES_PRECLEARANCE",
                "confidence": 0.85,
                "reason": f"Tier 1 Investment Banking requires pre-clearance for trades outside prohibited list.",
                "applicable_rules": ["Rule 1.4: Broad Market Index Funds", "Rule 1.5: Individual Stock Trading"],
                "rule_sources": ["Only broad index funds permitted with 90-day hold period"],
                "conditions": ["24-hour pre-clearance required", "90-day holding period", "Maximum $500K daily value"],
                "requires_action": "Submit pre-clearance request via compliance portal",
                "estimated_approval_time": "24 hours"
            }
        
        # Tier 2 - require preclearance
        if tier == 2:
            return {
                "decision": "REQUIRES_PRECLEARANCE",
                "confidence": 0.80,
                "reason": f"Tier 2 {employee.get('department', 'role')} requires pre-clearance for trades.",
                "applicable_rules": ["Rule 2.6: Tier 2 Pre-Clearance Requirement"],
                "rule_sources": ["All individual stock trades require pre-clearance"],
                "conditions": ["Provide business justification"],
                "requires_action": "Submit pre-clearance request",
                "estimated_approval_time": "24-48 hours"
            }
        
        # Default - approved
        return {
            "decision": "APPROVED",
            "confidence": 0.75,
            "reason": f"No restrictions identified for {ticker}.",
            "applicable_rules": ["Rule 4.1: Tier 4 Standard Restrictions"],
            "rule_sources": ["Basic insider trading rules apply"],
            "conditions": ["30-day holding period", "Report trade within 10 days"],
            "requires_action": "Execute trade and report within 10 days",
            "estimated_approval_time": "Immediate"
        }
    
    def reset_conversation(self):
        """Reset conversation history for a new session"""
        self.conversation_history = []
