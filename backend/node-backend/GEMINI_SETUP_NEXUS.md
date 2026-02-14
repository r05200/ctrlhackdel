# AI-Powered Topic Generation Setup

The backend now uses **Google Gemini AI** to dynamically generate learning paths based on user prompts!

## 🚀 Quick Setup

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Configure Backend

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Open the `.env` file (or create it if it doesn't exist)

3. Replace the placeholder with your actual API key:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   PORT=5001
   NODE_ENV=development
   ```

4. Save the file

### 3. Restart Backend Server

```bash
npm start
```

You should see:
```
🧠 NEXUS Backend API Running!
🚀 Server: http://localhost:5001
```

If the API key is not configured, you'll see a warning:
```
⚠️  WARNING: Gemini API key not configured! AI topic generation will use fallback templates.
```

## 🎯 How It Works

### With Gemini API (Recommended)
- User enters any topic (e.g., "blockchain", "game development", "cooking")
- Backend sends prompt to Gemini AI
- AI generates a custom learning roadmap with 8-12 interconnected topics
- Topics are organized by difficulty level (1-6)
- Logical prerequisite relationships are automatically created

### Without Gemini API (Fallback)
- Backend uses a generic template structure
- Still functional but less personalized
- Topics follow a basic progression pattern

## 📊 API Endpoint

### Generate Custom Learning Tree

**POST** `/api/generate-tree`

**Request Body:**
```json
{
  "topic": "artificial intelligence"
}
```

**Response:**
```json
{
  "success": true,
  "topic": "artificial intelligence",
  "graph": {
    "nodes": [
      {
        "id": "ai-basics",
        "label": "AI\\nBasics",
        "status": "mastered",
        "level": 1,
        "description": "Introduction to artificial intelligence concepts"
      },
      ...
    ],
    "links": [
      {
        "source": "ai-basics",
        "target": "machine-learning"
      },
      ...
    ]
  }
}
```

## 🔒 API Key Security

**Important:** Never commit your `.env` file to version control!

The `.env` file is already in `.gitignore`. Only commit `.env.example` with placeholder values.

## 🆓 Gemini API Pricing

- **Free tier**: 60 requests per minute
- **More than enough** for development and small projects
- Each topic generation = 1 API request

## 🧪 Testing

Test the endpoint with curl:

```bash
curl -X POST http://localhost:5001/api/generate-tree \
  -H "Content-Type: application/json" \
  -d '{"topic":"cybersecurity"}'
```

Or use the frontend - just type any topic in the input box!

## 🛠️ Troubleshooting

### "API key not configured" warning
- Check that `.env` file exists in `/backend` folder
- Verify `GEMINI_API_KEY` is set correctly (no quotes, no spaces)
- Restart the backend server after changing `.env`

### "Failed to generate learning tree" error
- Check your internet connection
- Verify API key is valid (test at https://makersuite.google.com)
- Check Gemini API quota/rate limits
- Backend will automatically fallback to generic template

### Port 5001 already in use
```bash
# Kill existing process
Stop-Process -Name "node" -Force

# Or use different port in .env
PORT=5002
```

## 📝 Example Topics to Try

- Programming languages: "rust", "golang", "kotlin"
- Technologies: "kubernetes", "graphql", "terraform"
- Domains: "quantum computing", "bioinformatics", "fintech"
- Skills: "public speaking", "photography", "meditation"
- Anything! The AI adapts to any topic

---

**Built with ❤️ for ctrlhackdel hackathon**
