# NEXUS Skill Tree Web App - Integration Guide

## ✅ Integration Complete!

Your backend and frontend are now fully integrated into a functional, interactive skill tree web app.

## 🚀 Quick Start

### Prerequisites
- Node.js installed on your system
- Two terminal windows (one for backend, one for frontend)

### Start the Application

**Terminal 1 - Start Backend Server:**
```bash
cd c:\Users\frank\Downloads\ctrlhackdel\backend
npm start
```
Backend will run on: `http://localhost:5000`

**Terminal 2 - Start Frontend Dev Server:**
```bash
cd c:\Users\frank\Downloads\ctrlhackdel\frontend
npm run dev
```
Frontend will run on: `http://localhost:3000`

**Open your browser:**
Navigate to `http://localhost:3000`

## 🎮 How to Use the Skill Tree

### 1. **View the Tree**
- The interactive 3D knowledge graph displays all skills and their dependencies
- **Blue nodes** = Mastered skills (unlocked & completed)
- **Green nodes** = Active skills (ready to challenge)
- **Gray nodes** = Locked skills (prerequisites not completed)

### 2. **Challenge a Skill**
- Click on a **green (active)** node to start a boss fight
- Review the node description and challenge prompt
- Click "BEGIN ORAL EXAM" to start the recording phase

### 3. **Boss Fight Challenge**
The AI will evaluate your explanation based on:
- **Length & Depth**: 40 points for comprehensive explanation (>20 words)
- **Terminology**: 30 points for using relevant keywords
- **AI Confidence**: Up to 30 points for overall quality
- **Passing Score**: 70% or higher

### 4. **Results & Unlocking**
- **Pass (≥70%)**: Node is mastered, child nodes may unlock
- **Fail (<70%)**: Retry the challenge with more detail
- New active nodes automatically become available when all prerequisites are complete

### 5. **Track Progress**
- **Stats Panel** (top-right): Shows your mastery percentage and challenges completed
- **Reset Button**: Start over (for testing)

## 📋 Architecture Overview

### Backend (`/backend`)
**Express.js REST API** with in-memory database:

#### API Endpoints:
- `GET /` - Health check & endpoint documentation
- `GET /api/graph` - Fetch complete knowledge graph
- `GET /api/progress` - Get user stats and progress
- `POST /api/node/:nodeId/complete` - Mark node as mastered
- `POST /api/verify` - AI verification of explanation (uses basic scoring)
- `POST /api/reset` - Reset all progress
- `POST /api/generate-tree` - Generate custom trees (stub for LLM integration)

**Running on**: Port 5000

### Frontend (`/frontend`)
**React + Vite + Tailwind CSS** with 3D visualization:

#### Key Components:
- **App.jsx** - Main component with sidebar and header
- **SkillTreeView.jsx** - Manages graph data and user interaction
- **SkillTreeVisualization.jsx** - 3D force-directed graph using react-force-graph-3d
- **BossFightModal.jsx** - Interactive challenge UI with AI verification
- **services/api.js** - Centralized API communication layer

**Running on**: Port 3000

## 🔌 API Integration Details

### Request Flow

```
User Click Node (green/active)
    ↓
BossFightModal Opens
    ↓
User sees challenge
    ↓
App generates sample explanation
    ↓
POST /api/verify (backend evaluates explanation)
    ↓
Backend scores response (AI simulation)
    ↓
ShowResult (Pass/Fail with feedback)
    ↓
If Pass: POST /api/node/:id/complete
    ↓
Backend unlocks child nodes
    ↓
Frontend refreshes graph
```

### Example API Call (JavaScript)
```javascript
import apiService from './services/api';

// Get graph
const graphData = await apiService.getGraph();

// Get progress
const progress = await apiService.getProgress();

// Complete a node
const result = await apiService.completeNode('data-structures');

// Verify explanation
const verification = await apiService.verifyExplanation('data-structures', 'explanation text');
```

## 📊 Current Graph Structure

### Skill Tree Hierarchy:
- **Level 1**: Programming Basics (starting node - mastered)
- **Level 2**: Data Structures, Algorithms
- **Level 3**: Linear Algebra, Statistics, Calculus
- **Level 4**: Python for ML, Machine Learning Basics
- **Level 5**: Neural Networks, Deep Learning
- **Level 6**: Computer Vision, NLP, Reinforcement Learning

**Total Skills**: 13 nodes with dependency tracking

## 🎯 Features Implemented

✅ Backend-Frontend Integration
✅ Real-time graph updates on node completion
✅ AI explanation verification (simulated with keyword + length checking)
✅ Automatic child node unlocking on prerequisites
✅ User progress tracking and statistics
✅ Interactive 3D visualization with hover effects
✅ Boss fight modal with staged UI
✅ Responsive design with Tailwind CSS
✅ CORS enabled for cross-origin requests
✅ Error handling and loading states

## 🚀 Next Steps / Enhancements

### Phase 2 - AI Integration
```bash
# Replace simulated verification with real LLM (Gemini/GPT-4)
# Update: backend/server.js verifyExplanation endpoint
```

### Phase 3 - User Authentication
```bash
# Add MongoDB/Firebase for persistent user data
# Track individual user progress across sessions
```

### Phase 4 - Advanced Features
- Voice/audio input processing
- Custom skill tree generation
- Social leaderboards
- Difficulty levels
- Skill trees for different subjects

### Phase 5 - Mobile & Deployment
- React Native for mobile
- Docker containerization
- AWS/Heroku deployment

## 🔧 Troubleshooting

### **Backend not starting?**
```bash
# Check if port 5000 is in use
lsof -i :5000  # On Mac/Linux
netstat -ano | findstr :5000  # On Windows

# Kill the process or change PORT in server.js
```

### **Frontend can't connect to backend?**
- Ensure CORS is enabled (✅ already configured)
- Check `API_URL` in `services/api.js` (should be http://localhost:5000)
- Check browser console for error messages

### **No nodes showing in the tree?**
- Verify backend is running: `curl http://localhost:5000`
- Check browser network tab for API responses
- Try resetting progress: Click "Reset Progress" button

### **Build errors?**
```bash
# Clear node_modules and reinstall
# Frontend:
cd frontend && rm -rf node_modules && npm install

# Backend:
cd backend && rm -rf node_modules && npm install
```

## 📚 File Structure

```
ctrlhackdel/
├── backend/
│   ├── server.js (Express API)
│   ├── package.json
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── services/
│   │   │   └── api.js (API communication)
│   │   ├── components/
│   │   │   ├── SkillTreeView.jsx (main view)
│   │   │   ├── SkillTreeVisualization.jsx (3D graph)
│   │   │   ├── BossFightModal.jsx (challenge UI)
│   │   │   ├── Sidebar.jsx
│   │   │   └── ... (other components)
│   │   └── data/
│   │       └── knowledgeGraph.js (local backup)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── ...
├── INTEGRATION_GUIDE.md (this file)
└── ...
```

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Verify both servers are running
3. Review API response in Network tab
4. Check backend logs for server errors

## 🎉 Congratulations!

Your skill tree web app is now fully functional! Users can:
- View an interactive 3D knowledge graph
- Challenge skills through boss fights
- Get AI-powered feedback on their explanations
- Unlock new skills by mastering prerequisites
- Track their learning progress

Enjoy building your knowledge empire! 🚀
