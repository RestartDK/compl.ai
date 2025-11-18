#!/usr/bin/env python3
"""
Main entry point for the Compliance Chatbot Backend Server
Run with: python run.py
"""

import os
import sys
from dotenv import load_dotenv
from app import create_app

# Load environment variables from .env file
load_dotenv()

# Create Flask app
app = create_app()

if __name__ == '__main__':
    import socket
    port = int(os.getenv('PORT', 8000))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    # Get local machine IP
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)
    
    print(f"\n{'='*70}")
    print(f"🚀 Starting Compliance Chatbot Backend Server")
    print(f"{'='*70}")
    print(f"Environment: {'Development' if debug else 'Production'}")
    print(f"Local Access:    http://localhost:{port}")
    print(f"Network Access:  http://{local_ip}:{port}")
    print(f"Your Machine:    {hostname}")
    print(f"API Health:      http://{local_ip}:{port}/api/health")
    print(f"{'='*70}")
    print(f"✅ Server is accessible from your network!")
    print(f"Share this URL with teammates: http://{local_ip}:{port}")
    print(f"{'='*70}\n")
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=False  # Disable debug mode to avoid reloader issues
    )
