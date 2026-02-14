# 🚀 Backend-Frontend Integration Guide

## ✅ Integration Complete!

The frontend and backend are now fully connected. Here's what was integrated:

### 🔧 What Was Done

1. **Created API Service** (`frontend/src/services/api.js`)
   - `fetchKnowledgeGraph()` - Get knowledge tree from backend
   - `verifyExplanation()` - Verify user explanations
   - `completeNode()` - Mark nodes as completed
   - `fetchUserProgress()` - Get user stats
   - `resetProgress()` - Reset for testing
   - `checkBackendHealth()` - Check if backend is running

2. **Updated ConstellationView Component**
   - Fetches live data from backend on mount
   - Falls back to local data if backend is offline
   - Shows loading state while fetching
   - Displays offline warning if backend not available
   - Integrated Boss Fight Modal with backend verification

3. **Updated BossFightModal Component**
   - User types explanation in textarea
   - Submits to backend for AI verification
   - Shows score (0-100) and feedback
   - Displays suggestions if failed
   - Allows retry on failure
   - Unlocks new nodes on success

### 📦 API Endpoints Used

| Method | Endpoint                 | Purpose             |
| ------ | ------------------------ | ------------------- |
| GET    | `/api/graph`             | Get knowledge graph |
| GET    | `/api/progress`          | Get user stats      |
| POST   | `/api/node/:id/complete` | Complete a node     |
| POST   | `/api/verify`            | Verify explanation  |
| POST   | `/api/reset`             | Reset progress      |

## 🚀 How to Run

### Option 1: Quick Start (Recommended)

```bash
# From project root, double-click:
start-all.bat
```

This starts both servers automatically!

### Option 2: Manual Start

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

Server runs on: `http://localhost:5000`

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

App runs on: `http://localhost:5173` (Vite) or `http://localhost:3000`

## 🧪 Testing the Integration

### 1. **Start Servers**

- Run `start-all.bat` or manually start both servers
- Backend should show: "🧠 NEXUS Backend API Running!"
- Frontend should show: "VITE v... ready in Xms"

### 2. **Open App**

- Go to `http://localhost:5173` (or the port Vite shows)
- Enter any prompt in the text box
- Press Enter or click Submit

### 3. **View Constellation**

- You should see the constellation tree
- Check top-left corner - if no yellow warning, backend is connected!
- If you see "⚠️ Using offline data", backend isn't running

### 4. **Test Boss Fight**

- Click on a green/active node in the constellation
- Boss Fight modal appears
- Click "BEGIN EXPLANATION"
- Type an explanation (minimum 20 words recommended)
- Click "SUBMIT EXPLANATION"
- Wait for AI verification
- See your score and feedback!

### 5. **Complete a Node**

- If score ≥ 70, you pass!
- Click "CLAIM VICTORY & UNLOCK NEXT NODES"
- Node turns fully white (mastered)
- Child nodes unlock and turn green (active)

### 6. **Reset Progress** (for testing)

```bash
# In a new terminal or PowerShell:
curl -X POST http://localhost:5000/api/reset
```

## 🐛 Troubleshooting

### Backend Issues

**Problem:** Backend won't start

```bash
# Solution:
cd backend
npm install
npm start
```

**Problem:** Port 5000 already in use

```bash
# Kill existing process:
npx kill-port 5000
# Or change PORT in backend/.env or backend/server.js
```

### Frontend Issues

**Problem:** Frontend shows offline warning

- Check if backend isrunning (`http://localhost:5000` should show API info)
- Check console for CORS errors
- Verify API_BASE_URL in `frontend/src/services/api.js` matches backend port

**Problem:** "Module not found: framer-motion"

```bash
cd frontend
npm install framer-motion
```

### Integration Issues

**Problem:** Boss Fight doesn't submit

- Check browser console (F12) for errors
- Verify backend `/api/verify` endpoint is responding
- Check Network tab in DevTools

**Problem:** Nodes don't unlock after winning

- Check backend console for errors
- Verify `/api/node/:id/complete` endpoint response
- Check if graph data is updating in response

## 📊 Backend API Testing

Test endpoints directly:

```bash
# Get knowledge graph
curl http://localhost:5000/api/graph

# Get progress
curl http://localhost:5000/api/progress

# Verify explanation (example)
curl -X POST http://localhost:5000/api/verify \
  -H "Content-Type: application/json" \
  -d "{\"nodeId\":\"data-structures\",\"explanation\":\"Data structures organize data efficiently. Arrays store elements in contiguous memory with O(1) access time.\"}"

# Complete a node (if active)
curl -X POST http://localhost:5000/api/node/data-structures/complete

# Reset progress
curl -X POST http://localhost:5000/api/reset
```

## 🎯 Next Steps / Enhancements

### Optional Improvements You Can Add:

1. **Toast Notifications** - Add react-toastify for better UX

   ```bash
   cd frontend
   npm install react-toastify
   ```

2. **Voice Input** - Add Web Speech API for voice explanations
3. **Persistent Storage** - Add database (MongoDB/PostgreSQL) instead of in-memory
4. **User Accounts** - Add authentication and per-user progress
5. **LLM Integration** - Connect real AI (Gemini/GPT-4) for better verification
6. **Progress Dashboard** - Add stats page showing completion percentage
7. **Custom Trees** - Implement `/api/generate-tree` with LLM

## 📝 Code Structure

```
frontend/
├── src/
│   ├── services/
│   │   └── api.js                 # ✨ NEW - Backend API calls
│   ├── components/
│   │   ├── ConstellationView.jsx  # ✨ UPDATED - Uses live data
│   │   └── BossFightModal.jsx     # ✨ UPDATED - Backend integration
│   └── data/
│       └── knowledgeGraph.js      # Fallback data

backend/
├── server.js                      # Express API
└── package.json                   # Dependencies
```

## 🎉 Success Indicators

You'll know integration is working when:

- ✅ No offline warning appears in constellation view
- ✅ Boss Fight submits and shows score from backend
- ✅ Nodes unlock after winning Boss Fight
- ✅ Browser console shows successful API calls
- ✅ Backend console logs API requests

## 🤝 Support

If you encounter issues:

1. Check both terminal outputs for errors
2. Open browser DevTools (F12) → Console tab
3. Check Network tab → filter by "localhost:5000"
4. Verify both servers are running
5. Try the curl commands above to test backend directly

---

**🎊 Integration is complete! Your frontend and backend are now talking to each other!**

Start the servers and try completing your first Boss Fight! 🚀
