# Compliance Chatbot Backend API

A Flask-based backend server for a compliance chatbot that validates trades against firm rules, restricted lists, and blackout periods using AI-powered decision-making.

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- pip
- Anthropic API key (get it from https://console.anthropic.com/)

### Setup

1. **Clone and navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Run the setup script:**
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

3. **Configure environment variables:**
   ```bash
   # Edit .env and add your Anthropic API key
   ANTHROPIC_API_KEY=your_key_here
   ```

4. **Start the server:**
   ```bash
   python run.py
   ```

The server will start at `http://localhost:5000`

## 📡 API Endpoints

### Health Check
```
GET /api/health
```

### Check Trade Compliance
```
POST /api/check-trade

Request body:
{
    "user_id": "user123",
    "ticker": "AAPL",
    "action": "buy",
    "quantity": 100,
    "date": "2025-02-10"  // optional, defaults to now
}

Response:
{
    "decision": "APPROVED|HARD_NO|WAIT|NEEDS_APPROVAL|CONTACT_OFFICER",
    "reason": "Explanation of the decision",
    "user_profile": {
        "user_id": "user123",
        "name": "John Doe",
        "position": "Portfolio Manager",
        "firm": "XYZ Capital"
    }
}
```

### Get User Profile
```
GET /api/user/<user_id>

Response:
{
    "user_id": "user123",
    "name": "John Doe",
    "firm": "XYZ Capital",
    "position": "Portfolio Manager",
    "is_covered_person": true,
    "related_to_covered_person_id": null
}
```

## 🔄 Compliance Decision Flow

1. **Restricted List Check** → If ticker is restricted → `HARD_NO`
2. **Pre-Approved Check** → If permitted and not in blackout → `APPROVED`
3. **Blackout Check** → If permitted but in blackout → `WAIT`
4. **AI Evaluation** → For edge cases → `NEEDS_APPROVAL`, `CONTACT_OFFICER`, or `APPROVED_WITH_CONDITIONS`

## 📦 Project Structure

```
backend/
├── app/
│   ├── __init__.py           # Flask app factory
│   ├── models/
│   │   └── compliance_data.py # Data models
│   ├── routes/
│   │   └── compliance.py      # API endpoints
│   └── services/
│       ├── compliance_service.py # Business logic
│       └── ai_agent.py        # AI integration
├── .env                       # Environment variables
├── requirements.txt           # Python dependencies
├── run.py                     # Entry point
└── setup.sh                   # Setup script
```

## 🧪 Test the API

### Using curl:

```bash
# Health check
curl http://localhost:5000/api/health

# Get user profile
curl http://localhost:5000/api/user/user123

# Check a trade
curl -X POST http://localhost:5000/api/check-trade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "AAPL",
    "action": "buy",
    "quantity": 100
  }'

# Test with a restricted ticker
curl -X POST http://localhost:5000/api/check-trade \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "ticker": "TECH",
    "action": "buy",
    "quantity": 50
  }'
```

### Using Python:

```python
import requests
import json

BASE_URL = "http://localhost:5000"

# Check a trade
response = requests.post(
    f"{BASE_URL}/api/check-trade",
    json={
        "user_id": "user123",
        "ticker": "MSFT",
        "action": "buy",
        "quantity": 200
    }
)

print(json.dumps(response.json(), indent=2))
```

## 🔐 Mock Data

The server comes with mock data for testing:

### Users
- `user123`: John Doe, Portfolio Manager at XYZ Capital (Covered Person)
- `user456`: Jane Smith, Trading Analyst at ABC Investments (Related to covered person)

### Restricted Securities (XYZ Capital)
- `TECH`: Pending acquisition due diligence (expires 2025-03-31)
- `PHARMA`: Inside information embargo (indefinite)

### Permitted Securities
- XYZ Capital: AAPL, MSFT, GOOGL
- ABC Investments: SPY, QQQ, IVV

### Blackout Periods (XYZ Capital)
- 2025-02-01 to 2025-02-14: Earnings announcement blackout

## 🔧 Configuration

Edit `.env` file to customize:

```bash
FLASK_ENV=development      # Set to 'production' for production
PORT=5000                  # Server port
ANTHROPIC_API_KEY=xxx      # Your Anthropic API key
```

## 🧠 AI Integration

The system uses Claude (Anthropic) for complex compliance decisions. When a trade doesn't fall into clear categories (restricted, permitted, or blackout), the AI agent evaluates it based on:

- User's position and firm
- Covered person status
- Firm-specific rules
- Trade details (ticker, action, date)

## 📊 Decision Categories

| Decision | Meaning | Example |
|----------|---------|---------|
| `APPROVED` | Trade is cleared | Pre-approved ticker, no blackout |
| `HARD_NO` | Trade is prohibited | Ticker on restricted list |
| `WAIT` | Trade is allowed later | Pre-approved but in blackout period |
| `NEEDS_APPROVAL` | Requires manual review | Edge case requiring compliance officer |
| `CONTACT_OFFICER` | Complex case | Multiple conflicting rules |
| `APPROVED_WITH_CONDITIONS` | Yes, but with constraints | Trade approved but with restrictions |

## 🚨 Troubleshooting

### "ANTHROPIC_API_KEY not set"
- Add your API key to `.env` file
- Get it from https://console.anthropic.com/

### "Port 5000 already in use"
- Change PORT in `.env` file
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

### Dependencies not installing
- Ensure you're in the virtual environment: `source venv/bin/activate`
- Try: `pip install --upgrade pip setuptools wheel`

## 📝 License

MIT License - Feel free to use and modify for your project.

## 🤝 Support

For issues or questions, check:
1. The mock data in `app/services/compliance_service.py`
2. API response errors and their descriptions
3. Flask debug logs (visible when `FLASK_ENV=development`)
