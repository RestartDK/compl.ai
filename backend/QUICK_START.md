# 🚀 Quick Start Guide - Compliance Chatbot Backend

## Server is Running! ✅

Your backend server is now running locally on **http://localhost:8000**

## 📋 Quick Commands

### Check if server is running:
```bash
curl http://localhost:8000/api/health
```

### Run all API tests:
```bash
bash test_api.sh
```

## 🔑 Next Steps

### 1. **Add Your Anthropic API Key** (Optional but recommended)
The server currently runs in **demo mode** without the AI agent. To enable full AI capabilities:

1. Get your free API key from: https://console.anthropic.com/
2. Edit `.env` file:
   ```bash
   ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
   ```
3. Restart the server (it will auto-reload)

### 2. **Test with cURL**

#### Check trade with permitted ticker (APPROVED):
```bash
curl -X POST http://localhost:8000/api/check-trade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "AAPL",
    "action": "buy",
    "quantity": 100
  }'
```

#### Check trade with restricted ticker (HARD_NO):
```bash
curl -X POST http://localhost:8000/api/check-trade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "TECH",
    "action": "buy",
    "quantity": 50
  }'
```

#### Check during blackout period (WAIT):
```bash
curl -X POST http://localhost:8000/api/check-trade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "MSFT",
    "action": "buy",
    "quantity": 200,
    "date": "2025-11-22"
  }'
```

### 3. **Test with Python**

```python
import requests
import json

BASE_URL = "http://localhost:8000"

# Check a trade
response = requests.post(
    f"{BASE_URL}/api/check-trade",
    json={
        "user_id": "user123",
        "ticker": "GOOGL",
        "action": "buy",
        "quantity": 150
    }
)

print(json.dumps(response.json(), indent=2))
```

## 📊 API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/user/<user_id>` | Get user profile |
| POST | `/api/check-trade` | Check if trade is compliant |

## 🧪 Test Data Available

### Users
- **user123**: John Doe, Portfolio Manager at XYZ Capital (Covered Person)
- **user456**: Jane Smith, Trading Analyst at ABC Investments

### Restricted Securities (XYZ Capital)
- **TECH**: Restricted until 2025-12-31
- **PHARMA**: Indefinitely restricted

### Permitted Securities
- **XYZ Capital**: AAPL, MSFT, GOOGL
- **ABC Investments**: SPY, QQQ, IVV

### Blackout Periods
- **XYZ Capital**: 2025-11-20 to 2025-11-25

## 🔌 Integration with Frontend

Connect your frontend to the backend like this:

```javascript
// JavaScript/React example
async function checkTrade(userId, ticker, action, quantity) {
  const response = await fetch('http://localhost:8000/api/check-trade', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      ticker: ticker,
      action: action,
      quantity: quantity
    })
  });
  
  return response.json();
}

// Usage
const result = await checkTrade('user123', 'AAPL', 'buy', 100);
console.log(result.decision); // "APPROVED"
```

## ⚙️ Configuration

Edit `.env` to customize:

```bash
# Server port
PORT=8000

# Flask environment
FLASK_ENV=development

# Anthropic API (optional)
ANTHROPIC_API_KEY=your_key_here
```

## 🛑 Stopping the Server

The server is running in the background. To stop it:

```bash
lsof -ti:8000 | xargs kill -9
```

Or restart it:

```bash
lsof -ti:8000 | xargs kill -9; sleep 1
sh -c 'cd /Users/yiranyang/Desktop/daytona-hackathon/backend && ./venv/bin/python run.py'
```

## 📚 Decision Types

| Decision | Meaning |
|----------|---------|
| **APPROVED** | ✅ Trade is cleared immediately |
| **HARD_NO** | ❌ Trade is prohibited by compliance rules |
| **WAIT** | ⏸️ Trade is allowed but blocked during blackout period |
| **NEEDS_APPROVAL** | 📋 Requires manual compliance review |
| **CONTACT_OFFICER** | 👤 Complex case - talk to compliance officer |

## 🚀 Deploy to Production

When ready to deploy:

1. Set `FLASK_ENV=production` in `.env`
2. Use a production WSGI server like Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:8000 'app:create_app()'
   ```

## 📝 Troubleshooting

**Port 8000 already in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Need to add more test data?**
Edit: `app/services/compliance_service.py`

**AI agent returning mock responses?**
1. Get API key from https://console.anthropic.com/
2. Add to `.env` file
3. Restart server

## 🎯 Next Goals

- [ ] Connect to frontend application
- [ ] Add database for persistent storage (PostgreSQL/MongoDB)
- [ ] Implement user authentication
- [ ] Add compliance audit logging
- [ ] Create admin dashboard for rule management
- [ ] Deploy to cloud (AWS/GCP/Azure)

## 📞 Support

Check the main README.md for more detailed documentation:
```bash
cat README.md
```

Good luck! 🎉
