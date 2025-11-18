#!/usr/bin/env python3
"""
Client library for Compliance Chatbot Backend API
Usage: python client.py
"""

import requests
import json
from typing import Dict, Any, Optional
from datetime import datetime

class ComplianceClient:
    """Python client for the Compliance Chatbot Backend"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json'
        })
    
    def health_check(self) -> Dict[str, Any]:
        """Check if server is healthy"""
        response = self.session.get(f"{self.base_url}/api/health")
        response.raise_for_status()
        return response.json()
    
    def get_user(self, user_id: str) -> Dict[str, Any]:
        """Get user profile"""
        response = self.session.get(f"{self.base_url}/api/user/{user_id}")
        response.raise_for_status()
        return response.json()
    
    def check_trade(
        self,
        user_id: str,
        ticker: str,
        action: str,
        quantity: float,
        date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Check if a trade is compliant
        
        Args:
            user_id: User identifier
            ticker: Stock ticker symbol
            action: 'buy' or 'sell'
            quantity: Number of shares
            date: Optional date in ISO format (YYYY-MM-DD)
        
        Returns:
            Decision object with compliance status
        """
        payload = {
            'user_id': user_id,
            'ticker': ticker.upper(),
            'action': action.lower(),
            'quantity': quantity
        }
        
        if date:
            payload['date'] = date
        
        response = self.session.post(
            f"{self.base_url}/api/check-trade",
            json=payload
        )
        response.raise_for_status()
        return response.json()


def main():
    """Example usage of the compliance client"""
    
    # Initialize client
    client = ComplianceClient()
    
    print("=" * 60)
    print("🚀 Compliance Chatbot Client - Demo")
    print("=" * 60)
    print()
    
    # Test 1: Health check
    try:
        health = client.health_check()
        print("✅ Server Health:")
        print(f"   Status: {health['status']}")
        print(f"   Service: {health['service']}")
        print()
    except Exception as e:
        print(f"❌ Server not available: {e}")
        print("   Make sure to run: python run.py")
        return
    
    # Test 2: Get user profile
    print("📋 User Profile:")
    user = client.get_user("user123")
    print(f"   Name: {user['name']}")
    print(f"   Firm: {user['firm']}")
    print(f"   Position: {user['position']}")
    print(f"   Covered Person: {user['is_covered_person']}")
    print()
    
    # Test 3: Check approved trade
    print("✅ Test: Approved Trade (AAPL)")
    result = client.check_trade(
        user_id="user123",
        ticker="AAPL",
        action="buy",
        quantity=100
    )
    print(f"   Decision: {result['decision']}")
    print(f"   Reason: {result['reason']}")
    print()
    
    # Test 4: Check restricted trade
    print("❌ Test: Restricted Trade (TECH)")
    result = client.check_trade(
        user_id="user123",
        ticker="TECH",
        action="buy",
        quantity=50
    )
    print(f"   Decision: {result['decision']}")
    print(f"   Reason: {result['reason']}")
    if 'details' in result:
        print(f"   Details: {result['details']}")
    print()
    
    # Test 5: Check trade in blackout
    print("⏸️  Test: Trade in Blackout Period (MSFT)")
    result = client.check_trade(
        user_id="user123",
        ticker="MSFT",
        action="buy",
        quantity=200,
        date="2025-11-22"  # During blackout period
    )
    print(f"   Decision: {result['decision']}")
    print(f"   Reason: {result['reason']}")
    if 'blackout_end_date' in result:
        print(f"   Blackout Ends: {result['blackout_end_date']}")
    print()
    
    # Test 6: Edge case - unknown ticker
    print("🤔 Test: Edge Case (Unknown Ticker)")
    result = client.check_trade(
        user_id="user123",
        ticker="UNKNOWN",
        action="sell",
        quantity=100
    )
    print(f"   Decision: {result['decision']}")
    print(f"   Reason: {result['reason']}")
    if 'requires_action' in result:
        print(f"   Action Required: {result['requires_action']}")
    print()
    
    # Test 7: Different user
    print("👤 Test: Different User (user456)")
    user = client.get_user("user456")
    print(f"   Name: {user['name']}")
    print(f"   Firm: {user['firm']}")
    
    result = client.check_trade(
        user_id="user456",
        ticker="SPY",
        action="buy",
        quantity=500
    )
    print(f"   Decision for SPY: {result['decision']}")
    print()
    
    print("=" * 60)
    print("✅ Demo completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
