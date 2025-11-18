#!/usr/bin/env zsh
set -euo pipefail

# start_server.sh
# - Creates .env from .env.example if missing
# - Starts the Flask server (run.py) in background
# Usage:
#   ./start_localtunnel.sh

cd "$(dirname "$0")"

# Ensure .env exists
if [ -f .env ]; then
  echo "Using existing .env"
else
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Edit .env to set API_TOKEN if desired."
  else
    cat > .env <<EOF
PORT=8000
API_TOKEN=
EOF
    echo "Created .env. Edit .env to set API_TOKEN if desired."
  fi
fi

# Export env vars from .env for this script
set -o allexport
. ./.env
set +o allexport

PORT=${PORT:-8000}

# Start Flask server
echo "Starting Flask server on port ${PORT}..."
nohup python3 run.py > server.log 2>&1 &
SERVER_PID=$!
echo "Flask server started (PID ${SERVER_PID}), logs: server.log"

echo "To stop the server: kill ${SERVER_PID}"
