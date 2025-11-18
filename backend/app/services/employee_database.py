import json
from datetime import datetime
from pathlib import Path

class EmployeeDatabase:
    """Meridian Capital Partners employee database"""
    
    def __init__(self):
        # Try both possible paths
        current_path = Path(__file__).parent.parent.parent / "data" / "meridian_employees.json"
        if not current_path.exists():
            current_path = Path(__file__).parent.parent.parent / "data" / "meridian_employees.json"
        
        self.db_path = current_path
        self.data = self._load_employee_data()
    
    def _load_employee_data(self):
        """Load employee data from JSON file"""
        if self.db_path.exists():
            try:
                with open(self.db_path, 'r') as f:
                    return json.load(f)
            except Exception as e:
                print(f"Warning: Could not load employee database: {e}")
                return {"employees": []}
        return {"employees": []}
    
    def get_employee(self, employee_id: str) -> dict:
        """Get employee by ID"""
        for emp in self.data.get('employees', []):
            if emp.get('employee_id') == employee_id:
                return emp
        return None
    
    def get_employee_by_name(self, name: str) -> dict:
        """Get employee by full name"""
        for emp in self.data.get('employees', []):
            if emp.get('name', '').lower() == name.lower():
                return emp
        return None
    
    def list_employees_by_tier(self, tier: int) -> list:
        """List all employees in a specific tier"""
        return [emp for emp in self.data.get('employees', []) if emp.get('tier') == tier]
    
    def list_all_employees(self) -> list:
        """List all employees"""
        return self.data.get('employees', [])
    
    def get_restricted_securities(self, employee_id: str) -> list:
        """Get all restricted securities for an employee"""
        emp = self.get_employee(employee_id)
        if emp:
            return emp.get('restricted_securities', [])
        return []
    
    def get_coverage_universe(self, employee_id: str) -> str:
        """Get coverage universe for research/banking employees"""
        emp = self.get_employee(employee_id)
        if emp:
            return emp.get('coverage_universe', '')
        return ''
    
    def get_active_deals(self, employee_id: str) -> list:
        """Get active deals for an employee"""
        emp = self.get_employee(employee_id)
        if emp:
            return emp.get('active_deals', [])
        return []
    
    def get_coverage_list(self, employee_id: str) -> list:
        """Get research coverage list"""
        emp = self.get_employee(employee_id)
        if emp:
            return emp.get('coverage_list', [])
        return []
    
    def get_family_members(self, employee_id: str) -> list:
        """Get family member information"""
        emp = self.get_employee(employee_id)
        if emp:
            return emp.get('family_members', [])
        return []
    
    def get_current_holdings(self, employee_id: str) -> list:
        """Get current holdings"""
        emp = self.get_employee(employee_id)
        if emp:
            return emp.get('current_holdings', [])
        return []
    
    def has_family_conflict(self, employee_id: str, ticker: str) -> dict:
        """Check if employee has family member conflict"""
        emp = self.get_employee(employee_id)
        if not emp:
            return {'has_conflict': False}
        
        for family_member in emp.get('family_members', []):
            employer = family_member.get('employer', '').upper()
            # Simple check: if family member employer matches company
            if ticker.upper() in employer or employer in ticker.upper():
                return {
                    'has_conflict': True,
                    'family_member': family_member,
                    'relationship': family_member.get('relationship')
                }
        
        return {'has_conflict': False}
    
    def search_employees(self, query: str) -> list:
        """Search employees by name or ID"""
        query_lower = query.lower()
        results = []
        for emp in self.data.get('employees', []):
            if query_lower in emp.get('name', '').lower() or query_lower in emp.get('employee_id', '').lower():
                results.append(emp)
        return results
    
    def get_tier_description(self, tier: int) -> str:
        """Get human-readable tier description"""
        tier_map = {
            1: "Investment Banking (Most Restrictive)",
            2: "Research, Trading, Portfolio Management (High)",
            3: "Compliance, Legal, Technology, Risk (Moderate)",
            4: "Administrative & Support (Minimal)"
        }
        return tier_map.get(tier, "Unknown Tier")
    
    def get_employee_restrictions_summary(self, employee_id: str) -> dict:
        """Get a summary of all restrictions for an employee"""
        emp = self.get_employee(employee_id)
        if not emp:
            return None
        
        return {
            'employee_id': emp.get('employee_id'),
            'name': emp.get('name'),
            'title': emp.get('title'),
            'tier': emp.get('tier'),
            'tier_description': self.get_tier_description(emp.get('tier')),
            'department': emp.get('department'),
            'restricted_securities_count': len(emp.get('restricted_securities', [])),
            'active_deals_count': len(emp.get('active_deals', [])),
            'coverage_universe': emp.get('coverage_universe', 'N/A'),
            'notes': emp.get('notes', '')
        }
