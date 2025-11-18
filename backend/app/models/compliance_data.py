from dataclasses import dataclass
from datetime import datetime
from typing import Optional

@dataclass
class UserProfile:
    user_id: str
    name: str
    firm: str
    position: str
    is_covered_person: bool
    related_to_covered_person_id: Optional[str] = None

@dataclass
class TradeRequest:
    user_id: str
    ticker: str
    action: str  # 'buy' or 'sell'
    quantity: float
    date: datetime = None
    
    def __post_init__(self):
        if self.date is None:
            self.date = datetime.now()

@dataclass
class ComplianceDecision:
    decision: str  # 'APPROVED', 'HARD_NO', 'WAIT', 'NEEDS_APPROVAL', 'CONTACT_OFFICER'
    reason: str
    requires_action: Optional[str] = None
    conditions: list = None

class RestrictedSecurity:
    def __init__(self, ticker: str, firm: str, reason: str, effective_date: datetime, expiry_date: Optional[datetime] = None):
        self.ticker = ticker
        self.firm = firm
        self.reason = reason
        self.effective_date = effective_date
        self.expiry_date = expiry_date

class BlackoutPeriod:
    def __init__(self, firm: str, start_date: datetime, end_date: datetime, reason: str):
        self.firm = firm
        self.start_date = start_date
        self.end_date = end_date
        self.reason = reason
