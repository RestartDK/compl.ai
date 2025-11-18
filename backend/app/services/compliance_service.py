from datetime import datetime
from typing import Optional, Dict, List
from app.models.compliance_data import UserProfile, RestrictedSecurity, BlackoutPeriod

class ComplianceDataService:
    """Mock data service - replace with real database queries in production"""
    
    def __init__(self):
        # Mock user database
        self.users = {
            'user123': UserProfile(
                user_id='user123',
                name='John Doe',
                firm='XYZ Capital',
                position='Portfolio Manager',
                is_covered_person=True
            ),
            'user456': UserProfile(
                user_id='user456',
                name='Jane Smith',
                firm='ABC Investments',
                position='Trading Analyst',
                is_covered_person=False,
                related_to_covered_person_id='user123'
            )
        }
        
        # Mock restricted securities
        self.restricted_securities = {
            'XYZ Capital': [
                RestrictedSecurity(
                    ticker='TECH',
                    firm='XYZ Capital',
                    reason='Pending acquisition due diligence',
                    effective_date=datetime(2025, 11, 1),
                    expiry_date=datetime(2025, 12, 31)
                ),
                RestrictedSecurity(
                    ticker='PHARMA',
                    firm='XYZ Capital',
                    reason='Inside information embargo',
                    effective_date=datetime(2025, 11, 15),
                    expiry_date=None  # Indefinite
                )
            ],
            'ABC Investments': []
        }
        
        # Mock permitted securities
        self.permitted_securities = {
            'XYZ Capital': ['AAPL', 'MSFT', 'GOOGL'],
            'ABC Investments': ['SPY', 'QQQ', 'IVV']
        }
        
        # Mock blackout periods
        self.blackout_periods = {
            'XYZ Capital': [
                BlackoutPeriod(
                    firm='XYZ Capital',
                    start_date=datetime(2025, 11, 20),
                    end_date=datetime(2025, 11, 25),
                    reason='Earnings announcement blackout'
                )
            ],
            'ABC Investments': []
        }
        
        # Mock firm rules
        self.firm_rules = {
            'XYZ Capital': {
                'holding_period_days': 30,
                'pre_clearance_required': True,
                'reporting_threshold': 10000,
                'max_daily_trade_value': 500000
            },
            'ABC Investments': {
                'holding_period_days': 0,
                'pre_clearance_required': False,
                'reporting_threshold': 50000,
                'max_daily_trade_value': 1000000
            }
        }
    
    def get_user_profile(self, user_id: str) -> Optional[UserProfile]:
        """Fetch user profile from database"""
        return self.users.get(user_id)
    
    def is_restricted(self, ticker: str, firm: str, date: datetime) -> Dict:
        """Check if ticker is on restricted list for the firm"""
        if firm not in self.restricted_securities:
            return {'is_restricted': False, 'reason': None}
        
        for restricted in self.restricted_securities[firm]:
            if restricted.ticker == ticker:
                # Check if restriction is active on the given date
                if restricted.effective_date <= date:
                    if restricted.expiry_date is None or date <= restricted.expiry_date:
                        return {
                            'is_restricted': True,
                            'reason': restricted.reason,
                            'expiry_date': restricted.expiry_date
                        }
        
        return {'is_restricted': False, 'reason': None}
    
    def is_permitted(self, ticker: str, firm: str) -> bool:
        """Check if ticker is on pre-approved/permitted list"""
        if firm not in self.permitted_securities:
            return False
        return ticker in self.permitted_securities[firm]
    
    def is_blackout_period(self, firm: str, date: datetime) -> Dict:
        """Check if current date falls within a blackout period"""
        if firm not in self.blackout_periods:
            return {'is_blackout': False, 'reason': None, 'end_date': None}
        
        for blackout in self.blackout_periods[firm]:
            if blackout.start_date <= date <= blackout.end_date:
                return {
                    'is_blackout': True,
                    'reason': blackout.reason,
                    'end_date': blackout.end_date
                }
        
        return {'is_blackout': False, 'reason': None, 'end_date': None}
    
    def get_firm_rules(self, firm: str) -> Dict:
        """Fetch firm-specific compliance rules"""
        return self.firm_rules.get(firm, {
            'holding_period_days': 30,
            'pre_clearance_required': True,
            'reporting_threshold': 10000,
            'max_daily_trade_value': 500000
        })
