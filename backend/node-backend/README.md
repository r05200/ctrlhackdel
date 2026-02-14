# Concept Dependency Tree Backend - Node.js Edition

A complete rewrite of the concept dependency tree backend using **Node.js/Express** instead of Flask. Features AI-powered concept extraction via Gemini API.

## 🎯 What's Different

| Feature | Flask Version | Node.js Version |
|---------|---------------|-----------------|
| **Framework** | Flask | Express.js |
| **ORM** | MongoEngine | Mongoose |
| **Language** | Python | JavaScript/Node.js |
| **Complexity** | 15 files | 12 files |
| **Setup** | Python environment | npm install |

## 🚀 Quick Start

### Prerequisites

- **Node.js** 16+ ([download](https://nodejs.org/))
- **MongoDB** (local or Atlas)
- **Gemini API Key** ([get one here](https://ai.google.dev/))

### Installation

```bash
# Navigate to the backend directory
cd concept-tree-backend/node-backend

# Install dependencies
npm install

# Create .env file with your credentials
cp .env.example .env
# Edit .env with your MongoDB URI and Gemini API key

# Start the server
npm start
```

Server runs on `http://localhost:5000`

## 📁 Project Structure

```
node-backend/
├── src/
│   ├── server.js                 # Main Express app
│   ├── config.js                 # Configuration & constants
│   ├── models/
│   │   ├── Concept.js            # Concept model (Mongoose)
│   │   └── UserSkill.js          # User skill tracking model
│   ├── services/
│   │   ├── geminiService.js      # Gemini API integration
│   │   ├── parserService.js      # Concept parsing orchestration
│   │   ├── conceptService.js     # Database operations
│   │   └── userService.js        # User skill tracking
│   ├── routes/
│   │   ├── conceptRoutes.js      # /api/concepts endpoints
│   │   ├── userRoutes.js         # /api/users endpoints
│   │   └── parserRoutes.js       # /api/parser endpoints
│   └── utils/
│       └── db.js                 # MongoDB connection
├── package.json
├── .env                          # Environment variables
└── README.md
```

## 🔌 API Endpoints

### Concepts

```
GET    /api/concepts                      # List all concepts
GET    /api/concepts/:conceptId           # Get concept by ID
GET    /api/concepts/:conceptId/dependencies
GET    /api/concepts/:conceptId/learning-path
GET    /api/concepts/category/:category   # List by category
GET    /api/concepts/category/:category/tree
POST   /api/concepts                      # Create concept
PUT    /api/concepts/:conceptId           # Update concept
DELETE /api/concepts/:conceptId           # Delete concept
```

### User Skills

```
GET    /api/users/:userId/skills         # Get skill tree
GET    /api/users/:userId/completed      # Get completed concepts
GET    /api/users/:userId/available      # Get available concepts
GET    /api/users/:userId/statistics     # Get statistics
POST   /api/users/:userId/skills/:conceptId/complete
PUT    /api/users/:userId/skills/:conceptId/progress
DELETE /api/users/:userId/skills/:conceptId
```

### Parser (AI)

```
GET    /api/parser/status                # Check if configured
POST   /api/parser/parse                 # Parse text → create concepts
GET    /api/parser/validate/:category    # Validate tree
POST   /api/parser/infer-category        # Auto-detect category
GET    /api/parser/examples              # Get example inputs
```

### System

```
GET    /health                           # Health check
```

## 📝 Usage Examples

### Parse a Curriculum

```bash
curl -X POST http://localhost:5000/api/parser/parse \
  -H "Content-Type: application/json" \
  -d '{
    "text": "1. Limits\n2. Derivatives\n3. Integration",
    "category": "Calculus"
  }'
```

### Get Concept Dependencies

```bash
curl http://localhost:5000/api/concepts/derivatives/dependencies
```

### Track User Progress

```bash
curl -X POST http://localhost:5000/api/users/alice/skills/limits/complete

curl http://localhost:5000/api/users/alice/available
```

### Export User Skill Tree

```bash
curl http://localhost:5000/api/users/alice/export > alice-skills.json
```

## 🧠 Gemini AI Features

### Automatic Concept Extraction

Feed any text, the Gemini API extracts:
- **Concepts** with titles and descriptions
- **Relationships** between concepts
- **Difficulty levels** (1-10)
- **Foundational concepts** identification
- **Learning paths** suggestions

### Intelligent Prerequisite Interpolation

- Domain-specific rules (e.g., "L'Hôpital's Rule" → "Derivatives")
- Customizable via `MATH_PREREQUISITES` in `config.js`
- Automatic difficulty level adjustment

### Example

**Input:**
```
1. L'Hôpital's Rule
2. Integration Techniques
3. Complex Analysis
```

**Output:**
- Extracts: L'Hôpital's Rule, Integration Techniques, Complex Analysis
- Interpolates: Limits, Derivatives, Antiderivatives
- Sets up all prerequisite relationships
- Assigns difficulty levels

## ⚙️ Configuration

Environment variables in `.env`:

```env
MONGO_URI=mongodb://localhost:27017/concept-tree
GEMINI_API_KEY=your_api_key_here
PORT=5000
NODE_ENV=development
```

### Customize Domain Rules

Edit `src/config.js` `MATH_PREREQUISITES` to add your own:

```javascript
{
  "your concept": ["prerequisite1", "prerequisite2"],
  // ... more mappings
}
```

## 🔄 Migration from Flask

If switching from Flask version:

1. **Data is compatible** - same MongoDB schema
2. **Restart on port 5000**
3. **Update API client URLs** if needed
4. **No code changes needed** - endpoints are identical

## 📊 Development

### Run in Watch Mode

```bash
npm run dev
```

Requires `nodemon` (installed with dev dependencies)

### Run Tests

```bash
npm test
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ORM
- **@google/generative-ai** - Gemini API client
- **cors** - Cross-origin requests
- **dotenv** - Environment variables
- **body-parser** - Request parsing

## 🐛 Debugging

Enable debug mode:

```bash
DEBUG=* npm start
```

View Flask logs:

```bash
NODE_ENV=development npm start
```

## 🚀 Deployment

### To Heroku

```bash
heroku create your-app-name
heroku config:set GEMINI_API_KEY=your_key
heroku config:set MONGO_URI=your_mongodb_uri
git push heroku main
```

### To Docker

```bash
docker build -t concept-tree .
docker run -p 5000:5000 concept-tree
```

### To AWS/GCP/Azure

Use provided Dockerfile or deploy to:
- AWS Elastic Beanstalk
- Google Cloud Run
- Azure App Service

## 📚 API Response Format

All endpoints return:

```json
{
  "status": "success|error",
  "data": { /* response data */ },
  "error": "error message if status is error"
}
```

## 🔒 Security

- **Environment variables** - never hardcode secrets
- **CORS enabled** - configure trusted origins in production
- **Input validation** - all user inputs validated
- **MongoDB injection prevention** - mongoose handles escaping
- **Rate limiting** - add middleware for production

## 📖 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Gemini API Documentation](https://ai.google.dev/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test with `npm test`
4. Submit PR

## 📄 License

MIT License - See LICENSE file

## 💬 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check Gemini API status
4. Check MongoDB connection

---

**Ready to use?**

```bash
npm install
npm start
```

Visit http://localhost:5000/health to verify it's running!
