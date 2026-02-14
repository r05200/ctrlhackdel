# 🚀 NEXUS Backend API

Simple Express backend for the NEXUS Knowledge RPG hackathon project.

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Server

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Server runs on: `http://localhost:5000`

## API Endpoints

### 1. Health Check

```
GET /
```

Returns API info and available endpoints.

**Response:**

```json
{
  "status": "ok",
  "message": "NEXUS Backend API",
  "version": "1.0.0"
}
```

---

### 2. Get Knowledge Graph

```
GET /api/graph
```

Returns the complete knowledge graph with all nodes and links.

**Response:**

```json
{
  "success": true,
  "data": {
    "nodes": [...],
    "links": [...]
  }
}
```

---

### 3. Get User Progress

```
GET /api/progress
```

Returns user statistics and progress information.

**Response:**

```json
{
  "success": true,
  "stats": {
    "total": 13,
    "mastered": 1,
    "active": 1,
    "locked": 11,
    "percentage": 8
  },
  "userProgress": {
    "masteredNodes": ["programming-basics"],
    "activeNodes": ["data-structures"],
    "totalTimeSpent": 0,
    "completedChallenges": 1
  }
}
```

---

### 4. Complete Node (After Boss Fight)

```
POST /api/node/:nodeId/complete
```

Marks a node as mastered and unlocks child nodes if all prerequisites are met.

**Parameters:**

- `nodeId` (path): ID of the node to complete

**Response:**

```json
{
  "success": true,
  "message": "Node 'Data Structures' marked as mastered!",
  "unlockedNodes": ["linear-algebra"],
  "updatedGraph": {...}
}
```

---

### 5. Verify Explanation (AI Check)

```
POST /api/verify
```

Simulates AI verification of user explanation (for Boss Fight).

**Request Body:**

```json
{
  "nodeId": "data-structures",
  "explanation": "Data structures are ways to organize data efficiently...",
  "audioData": "base64-encoded-audio" // optional
}
```

**Response:**

```json
{
  "success": true,
  "passed": true,
  "score": 85,
  "feedback": "Good explanation length. Used relevant terminology.",
  "message": "Excellent! You clearly understand Data Structures."
}
```

---

### 6. Reset Progress (Testing Only)

```
POST /api/reset
```

Resets all progress back to initial state.

**Response:**

```json
{
  "success": true,
  "message": "Progress reset successfully",
  "graph": {...}
}
```

---

### 7. Generate Custom Tree (Future Feature)

```
POST /api/generate-tree
```

Generate a custom knowledge tree for any topic (requires LLM integration).

**Request Body:**

```json
{
  "topic": "Quantum Physics",
  "difficulty": "intermediate"
}
```

---

## Data Models

### Node Structure

```javascript
{
  id: "unique-node-id",
  label: "Display Name\nMultiline",
  status: "locked" | "active" | "mastered",
  level: 1-6,
  description: "Brief description of the concept"
}
```

### Link Structure

```javascript
{
  source: "parent-node-id",
  target: "child-node-id"
}
```

---

## Testing with cURL

### Get Graph

```bash
curl http://localhost:5000/api/graph
```

### Complete a Node

```bash
curl -X POST http://localhost:5000/api/node/data-structures/complete \
  -H "Content-Type: application/json"
```

### Verify Explanation

```bash
curl -X POST http://localhost:5000/api/verify \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": "data-structures",
    "explanation": "Data structures organize and store data efficiently"
  }'
```

### Reset Progress

```bash
curl -X POST http://localhost:5000/api/reset
```

---

## Frontend Integration

The frontend (`frontend/src/App.jsx`) should fetch data from this API:

```javascript
// Fetch graph on component mount
useEffect(() => {
  fetch("http://localhost:5000/api/graph")
    .then((res) => res.json())
    .then((data) => setGraphData(data.data));
}, []);

// Complete node after boss fight
const handleComplete = (nodeId) => {
  fetch(`http://localhost:5000/api/node/${nodeId}/complete`, {
    method: "POST",
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        setGraphData(data.updatedGraph);
      }
    });
};
```

---

## Environment Variables

Create a `.env` file (optional):

```env
PORT=5000
NODE_ENV=development
```

---

## Production Deployment

### Deploy to Heroku

```bash
heroku create nexus-backend
git push heroku main
```

### Deploy to Vercel

```bash
vercel
```

### Deploy to Railway

```bash
railway up
```

---

## Future Enhancements

1. **Real AI Integration**
   - Integrate Groq/Gemini API for actual explanation verification
   - Use Deepgram for speech-to-text
   - Use ElevenLabs for AI responses

2. **Database**
   - Add MongoDB for persistent storage
   - Store user profiles and progress
   - Track historical performance

3. **Authentication**
   - Add JWT-based auth
   - User registration/login
   - Protected routes

4. **AI Tree Generation**
   - Use LLM to auto-generate skill trees
   - Input: topic name → Output: full dependency graph

5. **Multiplayer**
   - WebSocket support
   - Real-time progress sharing
   - Leaderboards

---

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 5000
npx kill-port 5000
```

### CORS Issues

CORS is already enabled for all origins. If issues persist:

```javascript
app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);
```

### Dependencies Won't Install

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

---

**Built for CtrlHackDel Hackathon 🏆**
