import os
from pathlib import Path
from typing import Dict, List

class RulesLoader:
    """Load and manage compliance rules from files"""
    
    RULES_DIRECTORY = Path(__file__).parent.parent.parent / "compliance_rules"
    
    @classmethod
    def get_firm_rules(cls, firm: str) -> Dict[str, str]:
        """
        Get all rules for a firm
        Returns: {
            'raw_rules': full rule text,
            'file_path': path to the rules file,
            'exists': whether file exists
        }
        """
        firm_slug = firm.lower().replace(" ", "_").replace("&", "and")
        rules_file = cls.RULES_DIRECTORY / f"{firm_slug}_rules.md"
        
        result = {
            'firm': firm,
            'file_path': str(rules_file),
            'exists': rules_file.exists(),
            'raw_rules': '',
            'error': None
        }
        
        if rules_file.exists():
            try:
                with open(rules_file, 'r') as f:
                    result['raw_rules'] = f.read()
            except Exception as e:
                result['error'] = f"Could not read rules file: {e}"
                result['raw_rules'] = f"Error loading rules: {e}"
        else:
            result['error'] = f"Rules file not found for firm: {firm}"
            result['raw_rules'] = f"No rules file found. Expected: {rules_file}"
        
        return result
    
    @classmethod
    def list_available_rules(cls) -> List[str]:
        """List all available rule files"""
        if not cls.RULES_DIRECTORY.exists():
            return []
        
        rule_files = list(cls.RULES_DIRECTORY.glob("*_rules.md"))
        return [f.stem.replace("_rules", "").replace("_", " ").title() for f in rule_files]
    
    @classmethod
    def get_rule_summary(cls, firm: str) -> Dict:
        """Get a summary of rules for a firm"""
        rules_data = cls.get_firm_rules(firm)
        
        summary = {
            'firm': firm,
            'has_rules': rules_data['exists'],
            'file_path': rules_data['file_path']
        }
        
        if rules_data['exists'] and rules_data['raw_rules']:
            # Extract rule headers
            lines = rules_data['raw_rules'].split('\n')
            rules = []
            for line in lines:
                if line.startswith('## Rule '):
                    rules.append(line.replace('## ', '').strip())
            summary['rules'] = rules
        
        return summary
