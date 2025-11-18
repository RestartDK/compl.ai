#!/bin/bash

# Test script for Policy-as-Code Server
# Make sure the server is running before executing this script

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "🧪 Testing Policy-as-Code Server"
echo "================================="
echo ""

# Test 1: Policy Ingestion
echo "📝 Test 1: Policy Ingestion"
echo "---------------------------"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/policies/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "firm_name": "TestFirm",
    "policy_text": "Employees cannot trade within 5 days of earnings announcements. Analysts must obtain pre-approval for trades in covered securities."
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Wait a bit for processing
echo "⏳ Waiting 5 seconds for rule generation..."
sleep 5
echo ""

# Test 2: Compliance Check
echo "✅ Test 2: Compliance Check"
echo "---------------------------"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/compliance/check" \
  -H "Content-Type: application/json" \
  -d '{
    "firm_name": "TestFirm",
    "employee_id": "test-emp-001",
    "ticker": "TSLA"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 3: Invalid Request (missing fields)
echo "❌ Test 3: Invalid Request (Error Handling)"
echo "---------------------------------------------"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/policies/ingest" \
  -H "Content-Type: application/json" \
  -d '{
    "firm_name": "TestFirm"
  }')

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "✅ Tests completed!"
echo ""
echo "💡 Tip: Install 'jq' for prettier JSON output: brew install jq"

