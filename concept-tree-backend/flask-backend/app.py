"""
Main Flask application for Concept Dependency Tree Backend
"""
from flask import Flask, jsonify
from flask_cors import CORS
from mongoengine import connect, disconnect
from routes import concept_routes, user_routes, parser_routes
import os
from dotenv import load_dotenv

load_dotenv()

# Initialize Flask
app = Flask(__name__)
CORS(app)

# Configuration
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/concept-tree')
app.config['MONGODB_SETTINGS'] = {
    'host': MONGO_URI
}

# Database initialization
def init_db():
    """Initialize database connection"""
    try:
        disconnect()
        connect('concept-tree', host=MONGO_URI)
        print("✓ Connected to MongoDB")
    except Exception as e:
        print(f"✗ Failed to connect to MongoDB: {e}")


# Register blueprints
app.register_blueprint(concept_routes)
app.register_blueprint(user_routes)
app.register_blueprint(parser_routes)


# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Concept Dependency Tree Backend',
        'version': '1.0.0'
    }), 200


# Root endpoint
@app.route('/', methods=['GET'])
def index():
    """API documentation"""
    return jsonify({
        'name': 'Concept Dependency Tree Backend',
        'version': '1.0.0',
        'endpoints': {
            'concepts': {
                'POST /api/concepts': 'Create a new concept',
                'GET /api/concepts': 'List all concepts',
                'GET /api/concepts/<concept_id>': 'Get concept details',
                'PUT /api/concepts/<concept_id>': 'Update concept',
                'DELETE /api/concepts/<concept_id>': 'Delete concept',
                'GET /api/concepts/<concept_id>/dependencies': 'Get dependency tree',
                'GET /api/concepts/<concept_id>/dependents': 'Get dependent concepts',
                'GET /api/concepts/category/<category>/tree': 'Get skills tree for category',
                'GET /api/concepts/category/<category>/all': 'Get all concepts in category',
            },
            'users': {
                'GET /api/users/<user_id>/skills': 'Get user progress',
                'POST /api/users/<user_id>/skills/complete': 'Mark concept completed',
                'POST /api/users/<user_id>/skills/start': 'Start working on concept',
                'GET /api/users/<user_id>/available-concepts': 'Get available concepts',
                'GET /api/users/<user_id>/blocked-concepts': 'Get blocked concepts',
                'GET /api/users/<user_id>/export': 'Export skill tree to JSON',
                'POST /api/users/<user_id>/import': 'Import skill tree from JSON',
            }
        }
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def server_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)
