# 🎓 Concept Dependency Tree Backend

A modern Node.js backend for managing intelligent concept hierarchies and skill trees. This system automatically extracts concepts from curriculum text using Gemini AI, builds dependency graphs, and tracks user progress through structured learning paths.

## ✨ Key Features

- **🤖 AI-Powered Parsing**: Uses Google Gemini to extract concepts and automatically infer prerequisites from unstructured text
- **📊 Smart Dependency Trees**: Automatically builds concept prerequisite chains and difficulty levels
- **👤 User Progress Tracking**: Monitor individual learner progress through concept mastery
- **🔗 Intelligent Interpolation**: Automatically adds missing prerequisite concepts
- **🎯 Learning Paths**: Get recommended learning sequences for any topic
- **🧪 Comprehensive Testing**: 120+ automated tests with full coverage
- **📱 Interactive Demo**: Beautiful web interface for testing the parser

## 🏗️ Architecture

```
Node.js Express Backend (Port 5000)
├── Concept API
├── User Progress Tracking
├── AI Parser (Gemini)
└── Database Operations
    │
    └── MongoDB (Local or Atlas)
```

## 🚀 Quick Start

### Prerequisites
- **Node.js** 14+
- **MongoDB** (installed locally or use MongoDB Atlas)
- **Google Gemini API key** (get from: https://ai.google.dev/)

### 1. Setup

```bash
cd node-backend
npm install
```

### 2. Configure Environment

Create `.env` file in `node-backend/`:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/concept-tree

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Start MongoDB

**Windows (if installed as service):**
```powershell
Get-Service MongoDB
```

**Mac/Linux:**
```bash
mongod
```

### 4. Start the Backend

```bash
cd node-backend
npm start
```

You should see:
```
✓ Connected to MongoDB
🚀 Concept Dependency Tree Backend (Node.js)
📍 Server running on http://localhost:5000
```

## 📒 Using the Demo Interface

Open the interactive parser demo:

```
file:///C:/Users/frank/Downloads/ctrlhackdel/concept-tree-backend/node-backend/parser_demo.html
```

**Features:**
- Paste curriculum text or table of contents
- AI automatically extracts concepts
- View created concepts, dependencies, and learning paths
- Live JSON responses

## 📋 API Endpoints

### Concepts

```bash
# Get all concepts
curl http://localhost:5000/api/concepts

# Get specific concept
curl http://localhost:5000/api/concepts/derivatives

# Get all concepts in category
curl http://localhost:5000/api/concepts/category/Calculus

# Get dependency tree
curl http://localhost:5000/api/concepts/category/Calculus/tree

# Get learning path
curl http://localhost:5000/api/concepts/derivatives/learning-path

# Search concepts
curl "http://localhost:5000/api/concepts/search/derivative"

# Create concept
curl -X POST http://localhost:5000/api/concepts \
  -H "Content-Type: application/json" \
  -d '{"concept_id":"limits","title":"Limits","category":"Calculus"}'

# Update concept
curl -X PUT http://localhost:5000/api/concepts/limits \
  -H "Content-Type: application/json" \
  -d '{"difficulty_level":2}'

# Delete concept
curl -X DELETE http://localhost:5000/api/concepts/limits
```

### User Progress

```bash
# Get skill tree
curl http://localhost:5000/api/users/alice/skills

# Get completed concepts
curl http://localhost:5000/api/users/alice/completed

# Get available concepts
curl http://localhost:5000/api/users/alice/available

# Mark complete
curl -X POST http://localhost:5000/api/users/alice/skills/derivatives/complete

# Update progress
curl -X PUT http://localhost:5000/api/users/alice/skills/derivatives/progress \
  -H "Content-Type: application/json" \
  -d '{"progress":75}'

# Export
curl http://localhost:5000/api/users/alice/export
```

### AI Parser

```bash
# Check status
curl http://localhost:5000/api/parser/status

# Parse curriculum
curl -X POST http://localhost:5000/api/parser/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"1. Limits\n2. Derivatives","category":"Calculus"}'
```

## 🧪 Testing

```bash
# All tests
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

**Test Results:** ✅ 120/120 passing | 44.27% coverage

## 📁 Project Structure

```
node-backend/
├── src/
│   ├── models/           # Database schemas
│   ├── services/         # Business logic
│   ├── routes/           # API endpoints
│   ├── utils/            # Helper functions
│   └── server.js         # Express setup
├── tests/                # Test suites
├── package.json
├── jest.config.js
├── .env
└── parser_demo.html      # Interactive demo
```

## 🐛 Troubleshooting

### MongoDB Connection Failed
```bash
# Check if running
Get-Service MongoDB

# Use MongoDB Atlas as alternative
# Update .env: MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net
```

### Gemini API Not Working
```
1. Get key from: https://ai.google.dev/
2. Add to .env: GEMINI_API_KEY=your_key
3. Restart server
```

### Port 5000 in Use
```powershell
# Find and kill process
Get-NetTCPConnection -LocalPort 5000 | foreach {Stop-Process -Id $_.OwningProcess -Force}
```

## 📚 Sample Curricula

Testing files in `examples/`:
- `sample_calculus_toc.txt`
- `sample_cs_curriculum.txt`
- `sample_linear_algebra_toc.txt`

## 🚀 Deployment

### Docker

```bash
docker build -t concept-tree .
docker run -p 5000:5000 \
  -e MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net \
  -e GEMINI_API_KEY=your_key \
  concept-tree
```

### Docker Compose

```bash
docker-compose up
```

## 📖 More Documentation

- [Testing Guide](node-backend/TESTING.md)
- [Sample Responses](EXAMPLES.json)

## 📝 License

MIT

---

**Ready to use! 🚀**
