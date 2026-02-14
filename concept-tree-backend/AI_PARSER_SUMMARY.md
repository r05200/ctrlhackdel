## AI Parser - Quick Integration Guide

You've now got a **Gemini-powered AI parser** integrated with your concept tree backend!

### 🚀 Quick Start

1. **Get Gemini API Key** (free):
   - Visit https://ai.google.dev/
   - Create a project
   - Generate an API key

2. **Set Environment Variable**:
   ```bash
   # Edit flask-backend/.env
   GEMINI_API_KEY=your_key_here_sk_...
   ```

3. **Start Services**:
   ```bash
   # Terminal 1: MongoDB
   mongod
   
   # Terminal 2: Flask
   cd flask-backend
   pip install -r requirements.txt  # Includes google-generativeai
   python app.py
   ```

4. **Parse Your First Curriculum**:
   ```bash
   curl -X POST http://localhost:5000/api/parser/parse \
     -H "Content-Type: application/json" \
     -d '{
       "text": "1. Limits\n2. Continuity\n3. Derivatives\n4. Integration",
       "category": "Calculus"
     }'
   ```

### 📝 What It Does

**Input**: Messy text like a table of contents
```
Calculus Course:
1. Limits and Continuity
2. Derivatives
3. Integration
```

**Output**: Fully structured skill tree
```
✓ Creates concepts: Limits, Continuity, Derivatives, Integration
✓ Infers relationships: Derivatives requires Continuity
✓ Interpolates missing: Adds "Fundamental Theorem"
✓ Sets difficulty levels: 1→2→3 progression
✓ Stores in MongoDB: All relationships preserved
```

### 🎯 Key Features

| Feature | Example |
|---------|---------|
| **Extracts Concepts** | "L'Hôpital's Rule" → parsed concept |
| **Infers Prerequisites** | Automatically adds "Derivatives" before "L'Hôpital's" |
| **Auto-fixes** | Adjusts difficulty if Derivative (level 3) > its prerequisites |
| **Multiple Input Formats** | Bullet lists, numbered lists, hierarchies, paragraphs |
| **Category Detection** | "Eigenvalues, matrices..." → infers "Linear Algebra" |
| **Validation** | Detects circular references, orphaned concepts |

### 📊 API Endpoints Added

```
POST   /api/parser/parse                 # Parse text → create tree
GET    /api/parser/validate/<category>   # Validate & fix tree
POST   /api/parser/infer-category        # Guess category from text
GET    /api/parser/examples              # Show sample inputs
GET    /api/parser/status                # Check if configured
```

### 🖥️ CLI Tool

```bash
# Easy command-line interface
cd examples

# Parse from text
python parser_cli.py --text "1. Topic A\n2. Topic B"

# Parse from file
python parser_cli.py --file my_toc.txt --category "Calculus"

# Validate tree
python parser_cli.py --validate "Calculus"

# Show examples
python parser_cli.py --examples
```

### 📚 Sample Files Included

- `sample_calculus_toc.txt` - Full Calculus I curriculum
- `sample_linear_algebra_toc.txt` - Complete Linear Algebra
- `sample_cs_curriculum.txt` - Computer Science fundamentals

Try: `python parser_cli.py --file examples/sample_calculus_toc.txt`

### 🔗 How It Integrates

```
Your Input (TOC)
    ↓
AI Parser (Gemini)
    ↓
Create Concepts + Dependencies
    ↓
Same MongoDB as Before
    ↓
All Your Existing APIs Work!

GET /api/concepts/category/Calculus/tree
GET /api/users/student1/available-concepts
POST /api/users/student1/skills/complete
```

### ⚙️ Configuration

**Domain Knowledge** - Edit prerequisite rules:
```python
# flask-backend/services/gemini_service.py
MATH_PREREQUISITES = {
    "l'hôpital's rule": ["derivatives", "limits"],
    "eigenvalues": ["matrix operations", "determinants"],
    # Add domain-specific rules
}
```

### 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| "Gemini API not configured" | Set `GEMINI_API_KEY` in `.env` |
| Connection refused | Start Flask: `python app.py` |
| "Could not parse JSON" | Check API key is valid and internet connected |
| Circular dependency | Run validation: `python parser_cli.py --validate "Category"` |

### 📈 Example Workflow

```bash
# 1. Parse Calculus from file
python parser_cli.py \
  --file examples/sample_calculus_toc.txt \
  --category "Calculus"

# Output shows:
# ✅ Created: 12 concepts
# 🔧 Interpolated: 2 concepts (Continuity, Antiderivatives)
# ✓ Related: 8 dependencies

# 2. Validate the tree
python parser_cli.py --validate "Calculus"

# Output shows:
# Status: PASSED
# Fixes Applied: 2 (difficulty adjustments)

# 3. Use with your existing APIs
curl http://localhost:5000/api/concepts?category=Calculus
curl http://localhost:5000/api/concepts/category/Calculus/tree

# 4. Track user progress (unchanged)
curl -X POST http://localhost:5000/api/users/alice/skills/complete \
  -H "Content-Type: application/json" \
  -d '{"concept_id": "limits"}'
```

### 📖 Full Documentation

See `GEMINI_PARSER.md` for:
- Complete API reference
- Architecture details
- Best practices
- Limitations & future work
- More examples

### 🎉 You Now Have

✅ Gemini AI text parser  
✅ Automatic prerequisite inference  
✅ Intelligent interpolation (L'Hôpital's → adds Derivatives)  
✅ Domain-specific validation  
✅ CLI tool for testing  
✅ Full integration with existing system  
✅ 3 sample curricula to test with  

### Next Steps

1. Get [Gemini API key](https://ai.google.dev/) (takes 2 min, free)
2. Add to `flask-backend/.env`
3. Run: `python examples/parser_cli.py --file examples/sample_calculus_toc.txt`
4. Watch it create your skill tree! 🚀

---

**Questions?** Check `GEMINI_PARSER.md` for detailed docs
