# 🔧 QUICK INTEGRATION TEST

Run these commands to test the backend API:

## 1. Test Backend Connection

```powershell
# Check if backend is running
curl http://localhost:5000
```

**Expected:** JSON response with API info

---

## 2. Test Graph Endpoint

```powershell
curl http://localhost:5000/api/graph
```

**Expected:** Full knowledge graph with nodes and links

---

## 3. Test Progress

```powershell
curl http://localhost:5000/api/progress
```

**Expected:** User stats and progress data

---

## 4. Test Node Completion

```powershell
curl -X POST http://localhost:5000/api/node/data-structures/complete `
  -H "Content-Type: application/json"
```

**Expected:** Success message + updated graph

---

## 5. Test Verification

```powershell
$body = @{
    nodeId = "data-structures"
    explanation = "Data structures are ways to organize and store data efficiently"
} | ConvertTo-Json

curl -X POST http://localhost:5000/api/verify `
  -H "Content-Type: application/json" `
  -d $body
```

**Expected:** Score + feedback

---

## 6. Test Reset

```powershell
curl -X POST http://localhost:5000/api/reset
```

**Expected:** Success + reset confirmation

---

## Frontend Integration Test

1. Open http://localhost:3000 in browser
2. Open browser DevTools (F12)
3. Check Console tab
4. Look for: "Fetching graph from backend..."
5. Check Network tab for API calls

**If you see:**

- ✅ "Backend not connected" → Frontend works but using local data
- ✅ No error → Backend connected successfully!
- ❌ CORS error → Check backend CORS settings
- ❌ Connection refused → Backend not running

---

## Quick Debug

### Backend not responding?

```powershell
# Check if process is running
Get-Process | Where-Object {$_.ProcessName -eq "node"}

# Check port 5000
netstat -ano | findstr :5000

# Restart backend
cd backend
npm start
```

### Frontend not loading graph?

1. Check browser console (F12)
2. Look for network errors
3. Verify backend URL in App.jsx: `const API_URL = 'http://localhost:5000';`

---

## Full Test Sequence

```powershell
# 1. Start backend (Terminal 1)
cd backend
npm start

# 2. Wait 3 seconds

# 3. Test API (Terminal 2)
curl http://localhost:5000/api/graph

# 4. Start frontend (Terminal 3 or use start-all.bat)
cd frontend
npm run dev

# 5. Open browser
# http://localhost:3000

# 6. Click green node
# Should open Boss Fight modal

# 7. Complete boss fight
# Should update graph (node turns blue, children unlock)
```

---

## Expected Flow

1. **Load Page** → Frontend fetches `/api/graph`
2. **Graph Renders** → 3D visualization appears
3. **Click Green Node** → Modal opens
4. **Complete Boss Fight** → POST to `/api/node/:id/complete`
5. **Graph Updates** → Node turns blue, children unlock
6. **Stats Update** → Progress panel shows new numbers

---

## Success Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] No CORS errors in console
- [ ] Graph loads successfully
- [ ] Click green node opens modal
- [ ] Completing node updates graph
- [ ] Stats panel shows correct numbers
- [ ] Particle effects flow on completed paths

---

**If all checks pass: YOU'RE READY TO DEMO! 🎉**
