#!/bin/bash
# Setup script for Compliance Chatbot Backend

echo "=================================================="
echo "🔧 Setting up Compliance Chatbot Backend"
echo "=================================================="

# Check Python version
echo "✓ Checking Python installation..."
python3 --version

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "✓ Creating virtual environment..."
    python3 -m venv venv
else
    echo "✓ Virtual environment already exists"
fi

# Activate virtual environment
echo "✓ Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "✓ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "✓ Installing dependencies..."
pip install -r requirements.txt

echo ""
echo "=================================================="
echo "✅ Setup complete!"
echo "=================================================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your ANTHROPIC_API_KEY"
echo "2. Run: python run.py"
echo ""
