# 🧪 Integration Testing Guide

This document provides step-by-step instructions to verify all aspects of the NEXUS Skill Tree integration.

## ✅ Pre-Test Checklist

- [ ] Both servers running (Backend on 5000, Frontend on 3000)
- [ ] Browser can access http://localhost:3000
- [ ] No console errors (F12 to open DevTools)
- [ ] Backend responding to pings

## 📋 Test Cases

### Test 1: Backend Server Health
**Goal**: Verify backend is accessible

```bash
# Command:
curl http://localhost:5000

# Expected Response:
{
  "status": "ok",
  "message": "NEXUS Backend API",
  "version": "1.0.0",
  "endpoints": { ... }
}
```

**Status**: ✅ / ❌

---

### Test 2: Get Skills Graph
**Goal**: Verify knowledge graph loads correctly

```bash
# Command:
curl http://localhost:5000/api/graph

# Expected Response:
{
  "success": true,
  "data": {
    "nodes": [
      { "id": "programming-basics", "status": "mastered", "level": 1, ... },
      { "id": "data-structures", "status": "active", "level": 2, ... },
      ...
    ],
    "links": [
      { "source": "programming-basics", "target": "data-structures" },
      ...
    ]
  }
}

# Verify:
- 13 nodes total
- "programming-basics" has status: "mastered"
- "data-structures" has status: "active"
```

**Status**: ✅ / ❌

---

### Test 3: Get User Progress
**Goal**: Verify progress tracking works

```bash
# Command:
curl http://localhost:5000/api/progress

# Expected Response:
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
    "completedChallenges": 1
  }
}

# Verify:
- mastered = 1
- active = 1
- locked = 11
- percentage = 8 (1/13 = 7.69% ≈ 8%)
```

**Status**: ✅ / ❌

---

### Test 4: Frontend Loads
**Goal**: Verify React app starts without errors

**Steps**:
1. Open http://localhost:3000 in browser
2. Open Developer Tools (F12)
3. Look at Console tab

**Expected**:
- ✅ No red errors in console
- ✅ Splash screen appears
- ✅ After ~3 seconds, main app loads
- ✅ Skill tree visualization visible (black background with nodes)
- ✅ Stats panel visible (top-right corner showing "Progress Stats")

**Status**: ✅ / ❌

---

### Test 5: Click a Node
**Goal**: Verify frontend correctly communicates with backend

**Steps**:
1. Look at the skill tree (3D graph)
2. Find the GREEN nodes (these are active/clickable)
3. Click on a green node (e.g., "Data Structures")

**Expected**:
- ✅ Boss Fight Modal opens
- ✅ Modal shows node name and description
- ✅ Modal shows "BEGIN ORAL EXAM" button
- ✅ Node is highlighted in gold color

**Status**: ✅ / ❌

---

### Test 6: Complete Boss Fight
**Goal**: Verify challenge flow works

**Steps**:
1. With modal open, click "BEGIN ORAL EXAM"
2. Watch the 3-second "listening" animation
3. Watch the "analyzing" phase

**Expected**:
- ✅ Recording phase shows pulsing orb and timer
- ✅ Analyzing phase shows spinner
- ✅ After ~5 seconds total, result appears

**Status**: ✅ / ❌

---

### Test 7: Pass Challenge & Unlock Nodes
**Goal**: Verify API call completes node and updates graph

**Steps**:
1. After challenge completes, result should show "✓ BOSS DEFEATED!"
2. Check Score (should be 50-100%)
3. Click "CLAIM VICTORY & UNLOCK NEXT NODES"

**Expected**:
- ✅ Success message appears
- ✅ Modal closes
- ✅ Graph updates in real-time
- ✅ New green (active) nodes appear
- ✅ "Data Structures" node becomes blue (mastered)

**Verify with API**:
```bash
curl http://localhost:5000/api/progress
# Should now show:
# "mastered": 2 (was 1)
# "active": 2-3 (was 1)
```

**Status**: ✅ / ❌

---

### Test 8: Locked Node Cannot Be Selected
**Goal**: Verify prerequisite checking

**Steps**:
1. Try clicking a GRAY node (locked skill)
2. Observe behavior

**Expected**:
- ✅ Alert appears: "This node is locked. Complete the prerequisites first!"
- ✅ Boss fight does NOT open
- ✅ Node is not selected

**Status**: ✅ / ❌

---

### Test 9: Progress Stats Update
**Goal**: Verify stats panel reflects current progress

**Steps**:
1. Look at top-right stats panel
2. Note the numbers shown
3. Complete a challenge
4. Check stats again

**Expected**:
- ✅ Stats update in real-time
- ✅ Mastered count increases
- ✅ Active count updates
- ✅ Locked count decreases
- ✅ Completion percentage increases

**Example**:
```
Before: Mastered: 1/13, Completion: 8%
After:  Mastered: 2/13, Completion: 15%
```

**Status**: ✅ / ❌

---

### Test 10: Reset Progress
**Goal**: Verify reset functionality

**Steps**:
1. Click "Reset Progress" button (bottom of stats panel)
2. Confirm the alert
3. Observe graph changes

**Expected**:
- ✅ Confirmation dialog appears
- ✅ After reset, only "Programming Basics" is mastered
- ✅ Only "Data Structures" and "Algorithms" are active
- ✅ All other skills are locked
- ✅ Stats show Mastered: 1/13, Completion: 8%

**Status**: ✅ / ❌

---

### Test 11: Verify Explanation Scoring
**Goal**: Ensure AI verification is working

**Note**: Current implementation uses simulated scoring. Each boss fight generates:

```
Score = (word count score) + (keyword score) + (random bonus)
- Explanation > 20 words: +40 points
- Contains "data" keyword: +30 points  
- Confidence bonus: 0-30 points
Result: Pass if score >= 70
```

**Steps**:
1. Complete multiple challenges
2. Observe different scores
3. Verify consistency

**Expected**:
- ✅ Scores vary (50-100%)
- ✅ Most attempts (60-70%) should pass
- ✅ Feedback message relates to score
- ✅ Both passes and failures occur

**Status**: ✅ / ❌

---

### Test 12: Network Tab Verification
**Goal**: Verify all API calls are being made

**Steps**:
1. Open DevTools (F12) → Network tab
2. Clear the log
3. Complete a challenge
4. Observe network requests

**Expected Calls**:
- ✅ `GET /api/graph` (during page load)
- ✅ `GET /api/progress` (during page load)
- ✅ `POST /api/verify` (when boss fight completes)
- ✅ `POST /api/node/:id/complete` (when result is pass)
- ✅ `GET /api/graph` and `GET /api/progress` (on refresh)

**Filtering**: Use filter input "api" to see only API calls

**Status**: ✅ / ❌

---

### Test 13: Browser Console Errors
**Goal**: Ensure no JavaScript errors

**Steps**:
1. Open DevTools (F12) → Console tab
2. Look for red error messages
3. Complete a full challenge cycle
4. Check for any new errors

**Expected**:
- ✅ No red error messages
- ✅ May have yellow warnings (acceptable)
- ✅ API responses logged (optional)

**Status**: ✅ / ❌

---

### Test 14: Multiple Skill Challenges
**Goal**: Verify system handles multiple skill unlocks

**Steps**:
1. Complete "Data Structures" challenge
2. Observe what unlocks (should include "Linear Algebra")
3. Try clicking multiple green nodes
4. Complete them in sequence

**Expected**:
- ✅ Each completion unlocks at least one new skill
- ✅ Graph visually updates each time
- ✅ Prerequisites are checked correctly
- ✅ System handles rapid clicks gracefully
- ✅ No duplicate node unlocks

**Example Flow**:
```
Start: Programming Basics (blue) + Data Structures (green)
After DS: Add Linear Algebra (green)
After LA: Add Python (green) + Neural Networks (green)
... continues until all unlocked
```

**Status**: ✅ / ❌

---

### Test 15: Responsive UI
**Goal**: Verify UI works at different window sizes

**Steps**:
1. Resize browser window (try mobile width ~400px)
2. Check if 3D graph still renders
3. Check if buttons are clickable
4. Try fullscreen (F11)

**Expected**:
- ✅ Graph adapts to window size
- ✅ Buttons remain clickable
- ✅ Text remains readable
- ✅ No layout breaks
- ✅ Modal centered on screen
- ✅ Stats panel visible with overflow if needed

**Status**: ✅ / ❌

---

## 🐛 Issue Logging

If tests fail, document issues here:

### Issue #1: ___________________
- **Test**: [Number]
- **Expected**: 
- **Actual**: 
- **Steps to Reproduce**: 
- **Solution Attempted**: 
- **Status**: 🔴 Unresolved / 🟡 In Progress / ✅ Resolved

---

### Issue #2: ___________________
- **Test**: [Number]
- **Expected**: 
- **Actual**: 
- **Steps to Reproduce**: 
- **Solution Attempted**: 
- **Status**: 🔴 Unresolved / 🟡 In Progress / ✅ Resolved

---

## 📊 Test Summary

| Test | Status | Notes |
|------|--------|-------|
| 1. Backend Health | ✅/❌ | |
| 2. Get Graph | ✅/❌ | |
| 3. Get Progress | ✅/❌ | |
| 4. Frontend Loads | ✅/❌ | |
| 5. Click Node | ✅/❌ | |
| 6. Start Challenge | ✅/❌ | |
| 7. Pass Challenge | ✅/❌ | |
| 8. Locked Prevention | ✅/❌ | |
| 9. Stats Update | ✅/❌ | |
| 10. Reset | ✅/❌ | |
| 11. Scoring | ✅/❌ | |
| 12. Network Calls | ✅/❌ | |
| 13. No Errors | ✅/❌ | |
| 14. Multiple Unlocks | ✅/❌ | |
| 15. Responsiveness | ✅/❌ | |

**Total Passed**: __ / 15

---

## 🎯 Performance Benchmarks

After all tests pass, measure these:

### Backend Response Times
```bash
# Time first response
time curl http://localhost:5000/api/graph

# Expected: < 50ms for queries
# Expected: < 100ms for updates
```

### Frontend Load Time
- Open DevTools → Performance tab
- Reload page (Ctrl+Shift+R for hard refresh)
- Check "Largest Contentful Paint" (should be < 3s)

### Challenge Flow Time
- From click to result display: Should be ~5-6 seconds
- No noticeable lag or stuttering

---

## ✅ Final Verification

When all tests pass, verify:

- [ ] Backend running stably (no crashes)
- [ ] Frontend running stably (no freezes)
- [ ] No console errors
- [ ] All API endpoints responding
- [ ] Graph updating correctly
- [ ] UI responsive and smooth
- [ ] Prerequisite system working
- [ ] Progress tracking accurate

## 🎉 Test Complete!

If all tests pass, your integration is **COMPLETE** and **FUNCTIONAL**.

Congratulations! Your skill tree web app is ready for use! 🚀

---

## 📞 Support

For test failures, check:
1. **Console errors** (F12 → Console)
2. **Network tab** for failed requests
3. **Backend logs** for server errors
4. **Firewall/antivirus** blocking connections
5. **Port conflicts** (5000 or 3000 in use)

Need help? Review the INTEGRATION_GUIDE.md for troubleshooting steps.
