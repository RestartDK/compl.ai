#!/bin/bash
# Test script for Compliance Chatbot Backend API

BASE_URL="http://localhost:8000"

echo "=================================================="
echo "🧪 Compliance Chatbot Backend API Test Suite"
echo "=================================================="
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "GET /api/health"
curl -s "$BASE_URL/api/health" | python3 -m json.tool
echo ""

# Test 2: Get User Profile
echo "Test 2: Get User Profile"
echo "GET /api/user/user123"
curl -s "$BASE_URL/api/user/user123" | python3 -m json.tool
echo ""

# Test 3: Approved Trade (Permitted + Not in Blackout)
echo "Test 3: Approved Trade (AAPL - Pre-approved, not in blackout)"
echo "POST /api/check-trade"
curl -s -X POST "$BASE_URL/api/check-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "AAPL",
    "action": "buy",
    "quantity": 100
  }' | python3 -m json.tool
echo ""

# Test 4: Hard No (Restricted)
echo "Test 4: Hard No (TECH - On restricted list)"
echo "POST /api/check-trade"
curl -s -X POST "$BASE_URL/api/check-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "TECH",
    "action": "buy",
    "quantity": 50
  }' | python3 -m json.tool
echo ""

# Test 5: Wait (Permitted but in Blackout)
echo "Test 5: Wait (MSFT - Pre-approved but in blackout period)"
echo "POST /api/check-trade"
curl -s -X POST "$BASE_URL/api/check-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "MSFT",
    "action": "buy",
    "quantity": 200,
    "date": "2025-11-22"
  }' | python3 -m json.tool
echo ""

# Test 6: Edge Case (Unknown ticker for user123)
echo "Test 6: Edge Case (UNKNOWN - Not on any list)"
echo "POST /api/check-trade"
curl -s -X POST "$BASE_URL/api/check-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "UNKNOWN",
    "action": "sell",
    "quantity": 75
  }' | python3 -m json.tool
echo ""

# Test 7: Different User
echo "Test 7: Different User (user456 - different firm)"
echo "GET /api/user/user456"
curl -s "$BASE_URL/api/user/user456" | python3 -m json.tool
echo ""

echo "Test 8: Check Trade for Different User"
curl -s -X POST "$BASE_URL/api/check-trade" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user456",
    "ticker": "SPY",
    "action": "buy",
    "quantity": 500
  }' | python3 -m json.tool
echo ""

echo "=================================================="
echo "✅ All tests completed!"
echo "=================================================="
