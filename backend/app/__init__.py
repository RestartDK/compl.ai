from flask import Flask, request, abort
from flask_cors import CORS
from app.routes.compliance import compliance_bp
import os

def create_app():
    """Application factory for Flask app"""
    app = Flask(__name__)
    
    # Enable CORS for all routes
    CORS(app)

    # Optional API token protection. If API_TOKEN is set in the environment,
    # require clients to send Authorization: Bearer <token> for non-health endpoints.
    api_token = os.getenv('API_TOKEN')
    app.config['API_TOKEN'] = api_token

    @app.before_request
    def require_api_token():
        if not app.config.get('API_TOKEN'):
            return
        # Allow public health checks
        if request.path == '/' or request.path.startswith('/api/health'):
            return
        auth = request.headers.get('Authorization', '')
        token = None
        if auth.startswith('Bearer '):
            token = auth.split(' ', 1)[1]
        elif auth:
            token = auth
        if token != app.config['API_TOKEN']:
            abort(401, description='Unauthorized')
    
    # Register blueprints
    app.register_blueprint(compliance_bp)
    
    # Root health check
    @app.route('/', methods=['GET'])
    def root():
        return {
            'service': 'Compliance Chatbot Backend',
            'version': '1.0.0',
            'endpoints': {
                'health': '/api/health',
                'check_trade': '/api/check-trade',
                'user_profile': '/api/user/<user_id>'
            }
        }
    
    return app