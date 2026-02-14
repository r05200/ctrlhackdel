# Gemini AI-Powered Concept Parser

## Overview

The Concept Parser is an intelligent AI-powered system that reads table of contents, concept lists, or curriculum outlines and automatically:

1. **Extracts concepts** from unstructured text
2. **Infers relationships** between concepts (prerequisites, dependencies)
3. **Interpolates missing prerequisites** (e.g., if user mentions "L'Hôpital's Rule", the system adds "Derivatives")
4. **Creates the skill tree** automatically with all dependencies
5. **Validates and refines** the generated tree

## Key Features

### 🤖 Gemini Integration
- Uses Google's Gemini API for natural language understanding
- Extracts structure from messy/informal text
- Understands domain-specific knowledge
- Generates dependency relationships intelligently

### 🔗 Dependency Interpolation
The system recognizes domain-specific prerequisite mappings:

```
Math Domain:
  "L'Hôpital's Rule" → requires ["Derivatives", "Limits"]
  "Eigenvalues" → requires ["Matrix Operations", "Determinants"]
  "Integration" → requires ["Derivatives", "Antiderivatives"]
```

### 🎯 Automatic Difficulty Levels
- Assigns difficulty 1-10 based on content type
- Ensures child concepts are harder than prerequisites
- Auto-corrects invalid difficulty progressions

### ✅ Tree Validation
- Detects circular dependencies
- Finds orphaned prerequisites
- Suggests fixes automatically

## Setup

### 1. Get Gemini API Key

```bash
# Visit: https://ai.google.dev/
# Create project
# Generate API key
# Copy your key
```

### 2. Set Environment Variable

**Flask** (`flask-backend/.env`):
```env
GEMINI_API_KEY=your_api_key_here
```

### 3. Install Dependencies

```bash
cd flask-backend
pip install -r requirements.txt
```

The key dependency is:
```
google-generativeai==0.3.0
```

## API Endpoints

### 1. Parse Text and Create Concepts

**Endpoint**: `POST /api/parser/parse`

**Request**:
```json
{
  "text": "Table of Contents:\n1. Limits\n2. Derivatives\n3. Integration",
  "category": "Calculus"
}
```

**Response** (201 Created):
```json
{
  "status": "success",
  "data": {
    "created_count": 8,
    "created_concepts": [
      {
        "concept_id": "limits",
        "title": "Limits",
        "description": "Introduction to limits...",
        "difficulty_level": 1,
        "prerequisites": []
      },
      {
        "concept_id": "derivatives",
        "title": "Derivatives",
        "difficulty_level": 2,
        "prerequisites": ["limits"]
      }
    ],
    "interpolated_count": 2,
    "interpolated_concepts": ["Continuity", "Antiderivatives"],
    "relationships_count": 5,
    "category": "Calculus",
    "summary": "A comprehensive calculus curriculum...",
    "learning_path": "Start with Limits, then Derivatives, then Integration..."
  }
}
```

### 2. Validate Concept Tree

**Endpoint**: `GET /api/parser/validate/<category>`

**Response**:
```json
{
  "category": "Calculus",
  "total_concepts": 12,
  "issues_found": 1,
  "issues": [
    {
      "type": "difficulty_adjustment",
      "concept": "Integration",
      "message": "..."
    }
  ],
  "fixes_applied": 1,
  "fixes": [...],
  "validation_status": "has_issues"
}
```

### 3. Infer Category

**Endpoint**: `POST /api/parser/infer-category`

**Request**:
```json
{
  "text": "Matrix multiplication, vectors, eigenvalues..."
}
```

**Response**:
```json
{
  "inferred_category": "Linear Algebra",
  "text_preview": "Matrix multiplication, vectors, eigenvalues..."
}
```

### 4. Get Examples

**Endpoint**: `GET /api/parser/examples`

**Response**:
```json
{
  "examples": {
    "calculus_toc": "1. Limits and Continuity\n2. Derivatives...",
    "linear_algebra_outline": "Linear Algebra Fundamentals:\n- Basic Vectors..."
  },
  "instructions": "POST the 'text' field to /api/parser/parse"
}
```

### 5. Parser Status

**Endpoint**: `GET /api/parser/status`

**Response**:
```json
{
  "status": "ready",
  "gemini_api_configured": true,
  "available_endpoints": [...]
}
```

## Usage Examples

### Example 1: Parse Calculus Curriculum

```bash
curl -X POST http://localhost:5000/api/parser/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "1. Limits and Continuity\n2. Derivatives\n3. Differentiation Rules\n4. Applications of Derivatives\n5. Integration\n6. Integration Techniques\n7. Applications of Integration",
    "category": "Calculus"
  }'
```

**What happens:**
1. Gemini reads the input list
2. Extracts: Limits, Continuity, Derivatives, Differentiation Rules, etc.
3. Infers: Continuity is prerequisite for Derivatives
4. Interpolates: Adds "Fundamental Theorem of Calculus"
5. Creates all concepts in database
6. Returns created tree with relationships

### Example 2: Linear Algebra with File Input

```bash
# Create a text file with your TOC
cat > my_toc.txt << 'EOF'
Module 1: Vectors
Module 2: Matrices
Module 3: Matrix Multiplication
Module 4: Determinants
Module 5: Eigenvalues
Module 6: Applications
EOF

# Parse it using CLI
python examples/parser_cli.py --file my_toc.txt --category "Linear Algebra"
```

### Example 3: Use CLI to Validate

```bash
# After parsing, validate the tree
python examples/parser_cli.py --validate "Linear Algebra"
```

Output:
```
============================================================
Validation Report: Linear Algebra
============================================================
Total Concepts: 10
Issues Found: 0
Fixes Applied: 2
Status: PASSED

✅ Fixes Applied:
  - [difficulty_adjustment] Matrix Transformations
  - [difficulty_adjustment] Eigenvalue Decomposition

============================================================
```

## How It Works

### Step 1: Text Extraction

```
User Input:
"1. Limits
 2. Derivatives  
 3. Integration"

↓ (Gemini analysis)

Extracted Concepts:
- Limits (difficulty: 1, fundamental: true)
- Derivatives (difficulty: 2, prerequisite: ["Limits"])
- Integration (difficulty: 3, prerequisite: ["Derivatives"])
```

### Step 2: Interpolation

```
Input Concepts: [Limits, Derivatives, L'Hôpital's Rule]

↓ (Domain knowledge check)

Missing Prerequisites Detected:
- Continuity (needed for Derivatives)
- Antiderivatives (needed for Integration)

↓ (Added to concepts list)

Expanded Concepts: [Limits, Continuity, Derivatives, 
                   Antiderivatives, L'Hôpital's Rule]
```

### Step 3: Relationship Building

```
Concepts + Rules → Dependency Graph

Foundational concepts created first:
1. Limits (no prerequisites)
2. Continuity (prerequisite: Limits)

Then dependent concepts:
3. Derivatives (prerequisites: Limits, Continuity)
4. L'Hôpital's Rule (prerequisites: Derivatives, Limits)
```

### Step 4: Validation

```
Check for:
✓ Circular dependencies
✓ Difficulty progression (children > parents)
✓ Orphaned concepts
✓ Missing relationships

Apply fixes:
- Adjust difficulty levels
- Remove invalid relationships
- Flag issues for review
```

## CLI Tool

### Installation

```bash
cd examples
pip install requests
python parser_cli.py --help
```

### Commands

**Parse from text**:
```bash
python parser_cli.py --text "1. Topic A\n2. Topic B\n3. Topic C"
```

**Parse from file**:
```bash
python parser_cli.py --file my_curriculum.txt --category "Computer Science"
```

**Infer category**:
```bash
python parser_cli.py --text "matrices, vectors, eigenvalues" 
# Output: Inferred Category: Linear Algebra
```

**Validate tree**:
```bash
python parser_cli.py --validate "Calculus"
```

**Show examples**:
```bash
python parser_cli.py --examples
```

## Sample Input Files

The `examples/` directory includes ready-to-use sample files:

### `sample_calculus_toc.txt`
Full calculus I curriculum with chapters and sections

**Usage**:
```bash
python parser_cli.py --file examples/sample_calculus_toc.txt --category "Calculus"
```

### `sample_linear_algebra_toc.txt`
Complete linear algebra curriculum organized by modules

### `sample_cs_curriculum.txt`
Computer science fundamentals with 6 tiers of concepts

## Architecture

```
User Input (Text)
    ↓
Flask API: POST /api/parser/parse
    ↓
GeminiConceptExtractor
    ├─ Parse text with LLM
    ├─ Extract concepts
    └─ Infer relationships
    ↓
ConceptInterpolationService
    ├─ Check domain rules
    ├─ Find missing prerequisites
    └─ Augment concept list
    ↓
ConceptParserService
    ├─ Create foundational concepts
    ├─ Create dependent concepts
    ├─ Establish relationships
    └─ Populate database
    ↓
ConceptRefineService
    ├─ Validate tree
    ├─ Detect issues
    └─ Apply fixes
    ↓
Response to User
    └─ Created concepts + summary
```

## Configuration

### Domain-Specific Rules

Edit `flask-backend/services/gemini_service.py`:

```python
MATH_PREREQUISITES = {
    "concept_name": ["required", "prerequisites"],
    "green's theorem": ["vector calculus", "line integrals"],
    "stokes' theorem": ["green's theorem", "surface integrals"],
    # Add more as needed
}
```

### Difficulty Ranges

```
1-2: Foundational (variables, basic concepts)
3-4: Intermediate (applying concepts, simple problems)
5-6: Advanced (complex applications, proofs)
7-8: Specialist (cutting-edge topics, research)
9-10: Expert (frontier knowledge)
```

## Troubleshooting

### API Key Issues

```
Error: "Gemini API not configured"
Solution: Set GEMINI_API_KEY in flask-backend/.env
```

### Connection Errors

```
Error: "Could not connect to http://localhost:5000"
Solution: Start Flask: cd flask-backend && python app.py
```

### JSON Parse Errors

```
Error: "Could not parse Gemini response as JSON"
Solution: 
- Check Gemini API key is valid
- Check internet connection
- Try again (rate limiting)
```

### Circular Dependencies

```
Issue: "Circular dependency detected"
Solution: Run validation: python parser_cli.py --validate "Category"
This will auto-fix by removing problematic relationships
```

## Best Practices

### 1. Well-Formatted Input

Good:
```
1. Limits and Continuity
2. Derivatives
   2.1 Power Rule
   2.2 Product Rule
   2.3 Chain Rule
3. Applications of Derivatives
```

Not as good:
```
limits continuity derivatives
power rule product rule chain rule
applications
```

### 2. Explicit Hierarchies

Use indentation or numbering to show structure:
```
Chapter 1: Foundations
1.1 Topic A
1.2 Topic B
Chapter 2: Applications
2.1 Topic C
```

### 3. Validate After Creating

```bash
# Create tree
python parser_cli.py --file my_toc.txt --category "MyDomain"

# Validate it
python parser_cli.py --validate "MyDomain"

# Review suggestions and fixes
```

### 4. Use Categories

Helps Gemini understand context:
```bash
python parser_cli.py --file toc.txt --category "Calculus"
# vs
python parser_cli.py --file toc.txt
# (less context, may infer category incorrectly)
```

## Limitations & Future Improvements

### Current Limitations
- Requires valid Gemini API key
- Single-language input (English recommended)
- Best with academic/technical curricula
- May need manual refinement for very specialized domains

### Future Enhancements
- Multi-language support
- Custom domain mappings per institution
- Visual tree editing after parsing
- Batch parsing multiple curricula
- Prerequisite strength quantification
- Learning time estimates per concept
- Quiz/assessment integration

## Integration with Existing System

The parser integrates seamlessly with your existing:

**Create Concept** → Database via normal endpoints:
```bash
GET /api/concepts
POST /api/concepts
```

**View Dependencies** → Normal graph queries:
```bash
GET /api/concepts/category/Calculus/tree
GET /api/concepts/derivatives/dependencies
```

**Track Progress** → Normal user endpoints:
```bash
POST /api/users/user1/skills/complete
GET /api/users/user1/available-concepts
```

The parsed tree is just like any manually created tree!

## API Response Times

- Text parsing: 5-15 seconds (depends on Gemini)
- Concept creation: 1-2 seconds per concept
- Validation: 1-3 seconds
- Category inference: 2-5 seconds

## Security Considerations

- **API Key**: Store in .env file, never commit to git
- **Rate Limiting**: Gemini API has rate limits (100 requests/hour free)
- **Input Validation**: All user input is validated before Gemini processing
- **Error Handling**: Never exposes API key in error messages

## Support & Examples

### Quick Test

```bash
# 1. Start Flask backend
cd flask-backend
python app.py

# 2. In another terminal, run CLI
cd examples
python parser_cli.py --examples

# 3. Copy one of the examples and parse it
python parser_cli.py --text "1. Limits\n2. Derivatives\n3. Integration"
```

### Full Workflow

```bash
# 1. Parse from file
python parser_cli.py --file sample_calculus_toc.txt

# 2. Validate result
python parser_cli.py --validate "Calculus"

# 3. Check via API
curl http://localhost:5000/api/concepts?category=Calculus

# 4. Export as JSON
curl http://localhost:5000/api/concepts/category/Calculus/tree | jq .
```

---

**Version**: 1.0.0  
**Requires**: Flask, Gemini API key, MongoDB  
**Uses**: google-generativeai library
