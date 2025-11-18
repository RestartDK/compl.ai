from flask import Blueprint, request, jsonify
from datetime import datetime
from app.services.ai_agent import AIComplianceAgent
from app.services.employee_database import EmployeeDatabase

compliance_bp = Blueprint('compliance', __name__, url_prefix='/api')

# Initialize services
employee_db = EmployeeDatabase()
ai_agent = None  # Initialize on first use to avoid issues at startup

def get_ai_agent():
    global ai_agent
    if ai_agent is None:
        ai_agent = AIComplianceAgent()
    return ai_agent

@compliance_bp.route('/check-trade', methods=['POST'])
def check_trade():
    """
    Main endpoint to check if a trade is compliant using real Meridian Capital employee data
    
    Request body:
    {
        "employee_id": "MCP003",  # Real Meridian employee ID
        "ticker": "AAPL",
        "action": "buy",
        "date": "2025-11-18T14:30:00",  # REQUIRED: ISO format with date and time
        "quantity": 100  # Optional
    }
    
    Example employees for testing:
    - MCP001: Sarah Chen (Tier 1, Technology IB)
    - MCP003: Jennifer Martinez (Tier 2, Research Analyst - Tech)
    - MCP002: Marcus Thompson (Tier 1, Healthcare IB)
    - MCP004: David Kumar (Tier 2, Trader)
    - MCP006: Rachel Winters (Tier 3, CCO)
    - MCP007: Kevin Okonkwo (Tier 3, Legal)
    """
    try:
        data = request.json
        
        # Validate required fields
        required_fields = ['employee_id', 'ticker', 'action', 'date']
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            return jsonify({
                'error': 'Missing required fields',
                'missing': missing_fields,
                'hint': 'Date/time is required for compliance checks. Format: ISO 8601 (YYYY-MM-DDTHH:MM:SS)',
                'example': {
                    'employee_id': 'MCP003',
                    'ticker': 'AAPL',
                    'action': 'buy',
                    'date': '2025-11-18T14:30:00',
                    'quantity': 100
                }
            }), 400
        
        employee_id = data['employee_id']
        ticker = data['ticker'].upper()
        action = data['action'].lower()
        quantity = data.get('quantity', 1)
        
        # Parse date - REQUIRED for compliance checks
        try:
            trade_date = datetime.fromisoformat(data['date'])
        except (ValueError, TypeError):
            return jsonify({
                'error': 'Invalid date format',
                'expected': 'ISO 8601 format (YYYY-MM-DDTHH:MM:SS or YYYY-MM-DD)',
                'example': '2025-11-18T14:30:00',
                'received': data.get('date')
            }), 400
        
        # Validate action
        if action not in ['buy', 'sell']:
            return jsonify({'error': 'Action must be "buy" or "sell"'}), 400
        
        # Step 1: Fetch employee from Meridian database
        employee = employee_db.get_employee(employee_id)
        if not employee:
            return jsonify({
                'error': f'Employee {employee_id} not found',
                'hint': 'Use valid Meridian Capital employee IDs (MCP001-MCP015)'
            }), 404
        
        # Step 2: Consult AI agent with real employee data and rules
        ai_decision = get_ai_agent().consult_for_trade(
            user_id=employee_id,
            ticker=ticker,
            action=action,
            trade_date=trade_date.isoformat()
        )
        
        # Add employee profile to response
        ai_decision['employee'] = {
            'employee_id': employee.get('employee_id'),
            'name': employee.get('name'),
            'title': employee.get('title'),
            'tier': employee.get('tier'),
            'department': employee.get('department'),
            'email': employee.get('email')
        }
        
        ai_decision['request'] = {
            'ticker': ticker,
            'action': action,
            'date': trade_date.isoformat(),
            'quantity': quantity
        }
        
        return jsonify(ai_decision), 200
    
    except Exception as e:
        return jsonify({'error': str(e), 'type': type(e).__name__}), 500

@compliance_bp.route('/employee/<employee_id>', methods=['GET'])
def get_employee_profile(employee_id):
    """Get Meridian employee profile and restrictions"""
    try:
        employee = employee_db.get_employee(employee_id)
        if not employee:
            return jsonify({'error': f'Employee {employee_id} not found'}), 404
        
        summary = employee_db.get_employee_restrictions_summary(employee_id)
        
        return jsonify({
            'profile': {
                'employee_id': employee.get('employee_id'),
                'name': employee.get('name'),
                'title': employee.get('title'),
                'email': employee.get('email'),
                'department': employee.get('department'),
                'office': employee.get('office'),
                'hire_date': employee.get('hire_date'),
                'years_at_firm': employee.get('years_at_firm')
            },
            'restrictions': summary,
            'restricted_securities': employee.get('restricted_securities', []),
            'active_deals': employee.get('active_deals', []),
            'coverage_list': employee.get('coverage_list', []),
            'notes': employee.get('notes', '')
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@compliance_bp.route('/employees', methods=['GET'])
def list_employees():
    """List all Meridian Capital employees"""
    try:
        tier = request.args.get('tier')
        
        if tier:
            try:
                tier = int(tier)
                employees = employee_db.list_employees_by_tier(tier)
            except ValueError:
                return jsonify({'error': 'Tier must be an integer (1-4)'}), 400
        else:
            employees = employee_db.list_all_employees()
        
        return jsonify({
            'count': len(employees),
            'employees': [
                {
                    'employee_id': e.get('employee_id'),
                    'name': e.get('name'),
                    'title': e.get('title'),
                    'tier': e.get('tier'),
                    'department': e.get('department'),
                    'restricted_securities_count': len(e.get('restricted_securities', []))
                }
                for e in employees
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@compliance_bp.route('/search/employees', methods=['GET'])
def search_employees():
    """Search employees by name or ID"""
    try:
        query = request.args.get('q')
        if not query:
            return jsonify({'error': 'Query parameter "q" is required'}), 400
        
        results = employee_db.search_employees(query)
        
        return jsonify({
            'query': query,
            'count': len(results),
            'results': [
                {
                    'employee_id': e.get('employee_id'),
                    'name': e.get('name'),
                    'title': e.get('title'),
                    'department': e.get('department')
                }
                for e in results
            ]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@compliance_bp.route('/rules/meridian', methods=['GET'])
def get_meridian_rules():
    """Get Meridian Capital compliance rules"""
    try:
        ai_service = get_ai_agent()
        rules_file = ai_service.RULES_DIRECTORY / "meridian_capital_rules.md"
        
        if not rules_file.exists():
            return jsonify({'error': 'Rules file not found'}), 404
        
        with open(rules_file, 'r') as f:
            rules_content = f.read()
        
        return jsonify({
            'firm': 'Meridian Capital',
            'file_path': str(rules_file),
            'content': rules_content
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@compliance_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        employee_count = len(employee_db.list_all_employees())
        return jsonify({
            'status': 'healthy',
            'service': 'meridian-compliance-api',
            'timestamp': datetime.now().isoformat(),
            'employees_loaded': employee_count,
            'firm': 'Meridian Capital Partners'
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500
