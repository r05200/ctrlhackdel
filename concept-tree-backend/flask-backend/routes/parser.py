"""
API routes for AI-powered concept parsing and tree generation
"""
from flask import Blueprint, request, jsonify
from services.parser_service import ConceptParserService, ConceptRefineService
import os

parser_routes = Blueprint('parser', __name__, url_prefix='/api/parser')


@parser_routes.before_request
def check_gemini_api_key():
    """Check if Gemini API key is configured"""
    if 'Health' not in request.method:  # Allow health check without key
        gemini_key = os.getenv('GEMINI_API_KEY')
        if not gemini_key:
            return jsonify({
                'error': 'Gemini API not configured',
                'message': 'Set GEMINI_API_KEY environment variable to use AI parsing'
            }), 503


@parser_routes.route('/parse', methods=['POST'])
def parse_concepts_from_text():
    """
    Parse text input and automatically create concept tree with dependencies
    
    Request body:
    {
      "text": "Table of contents or concept description",
      "category": "Optional category name"
    }
    """
    try:
        data = request.get_json()
        
        if not data or not data.get('text'):
            return jsonify({'error': 'text field required'}), 400
        
        text = data.get('text')
        category = data.get('category', '')
        
        # Parse and create concepts
        result = ConceptParserService.parse_and_create_concepts(text, category)
        
        return jsonify({
            'status': 'success',
            'data': result
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'Parsing failed: {str(e)}'}), 500


@parser_routes.route('/validate/<category>', methods=['GET'])
def validate_concept_tree(category):
    """
    Validate a concept tree and suggest fixes
    
    Also applies automatic fixes like difficulty level adjustments
    """
    try:
        result = ConceptRefineService.validate_and_fix_tree(category)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@parser_routes.route('/examples', methods=['GET'])
def get_parser_examples():
    """Get examples of text that can be parsed"""
    
    examples = {
        "calculus_toc": """
        1. Limits and Continuity
        2. Derivatives and Differentiation Rules
        3. Applications of Derivatives
        4. Integration and the Fundamental Theorem
        5. Integration Techniques
        6. Applications of Integration
        7. Differential Equations
        8. Sequences and Series
        """,
        
        "linear_algebra_outline": """
        Linear Algebra Fundamentals:
        - Basic Vectors and Operations
        - Matrix Operations and Properties
        - Determinants and Matrix Inverses
        - Systems of Linear Equations
        - Vector Spaces and Subspaces
        - Eigenvalues and Eigenvectors
        - Diagonalization and Applications
        - Linear Transformations
        """,
        
        "computer_science_path": """
        Computer Science Learning Path:
        Fundamentals
        → Data Structures (Lists, Trees, Graphs)
        → Algorithms (Sorting, Searching, Dynamic Programming)
        → Complexity Analysis (Big O Notation)
        Advanced
        → Graph Algorithms (BFS, DFS, Dijkstra)
        → Advanced DP (Optimal Substructure)
        """,
    }
    
    return jsonify({
        'examples': examples,
        'instructions': 'POST the "text" field to /api/parser/parse'
    }), 200


@parser_routes.route('/infer-category', methods=['POST'])
def infer_category():
    """Infer the category/domain from text"""
    
    try:
        data = request.get_json()
        
        if not data or not data.get('text'):
            return jsonify({'error': 'text field required'}), 400
        
        text = data.get('text')
        category = ConceptParserService.infer_category_from_text(text)
        
        return jsonify({
            'inferred_category': category,
            'text_preview': text[:200] + '...' if len(text) > 200 else text
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@parser_routes.route('/status', methods=['GET'])
def parser_status():
    """Check parser service status"""
    
    gemini_key = os.getenv('GEMINI_API_KEY')
    
    return jsonify({
        'status': 'ready' if gemini_key else 'not_configured',
        'gemini_api_configured': bool(gemini_key),
        'available_endpoints': [
            'POST /api/parser/parse',
            'GET /api/parser/validate/<category>',
            'GET /api/parser/examples',
            'POST /api/parser/infer-category'
        ]
    }), 200
