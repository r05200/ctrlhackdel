# Library System - Setup Verification Checklist

## Pre-Installation Checks

- [ ] Node.js installed (v14+)
- [ ] MongoDB running locally or cloud access configured
- [ ] Git and basic terminal familiarity
- [ ] Code editor (VS Code recommended)
- [ ] Both backend and frontend terminals available

## Backend Installation

### Step 1: Navigate to Backend
```bash
cd concept-tree-backend/node-backend
```

### Step 2: Install Dependencies
```bash
npm install
```

**Verify**: No error messages, package.json matches your setup

### Step 3: Check Environment
```bash
npm test
```

**Verify**: Test suite runs or shows helpful error messages

### Step 4: Start Backend
```bash
npm start
```

**Expected Output**:
```
🚀 Concept Dependency Tree Backend (Node.js)
📍 Server running on http://localhost:5000
✓ Available Endpoints:
  Trees: CRUD /api/trees/:userId
```

**Checklist**:
- [ ] No error messages
- [ ] Shows "Server running"
- [ ] Port 5000 is available
- [ ] MongoDB connection successful

## Frontend Installation

### Step 1: Navigate to Frontend
```bash
cd frontend
```

### Step 2: Verify Dependencies
```bash
npm install
```

**Verify**: No error messages

### Step 3: Start Frontend
```bash
npm run dev
```

**Expected Output**:
```
VITE v4.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

**Checklist**:
- [ ] Shows local development server URL
- [ ] No error messages
- [ ] Browser can reach the URL

## Integration Verification

### Step 1: Open Frontend
Navigate to http://localhost:5173 in your browser

**Checklist**:
- [ ] Page loads
- [ ] No white screen
- [ ] Sidebar visible
- [ ] "Library" menu item shows

### Step 2: Click Library
Click the "Library" menu item in the sidebar

**Checklist**:
- [ ] Library view opens
- [ ] No console errors (press F12)
- [ ] Shows "No trees found" message
- [ ] Search box appears
- [ ] Filter buttons appear

### Step 3: Test Search
Type "test" in the search box

**Checklist**:
- [ ] Search box responds
- [ ] No errors occur
- [ ] Still shows empty state

### Step 4: Check API Connectivity
Open browser DevTools (F12) and go to Console, paste:

```javascript
fetch('http://localhost:5000/api/trees/test-user')
  .then(r => r.json())
  .then(d => console.log(d))
```

**Expected Output**:
```javascript
{
  success: true,
  count: 0,
  trees: []
}
```

**Checklist**:
- [ ] API responds without CORS errors
- [ ] Response is valid JSON
- [ ] Count shows 0 initially

## Feature Verification

### Operation 1: Save a Tree

1. Navigate to http://localhost:5173
2. Note the Library view is ready
3. Create a test tree by calling the API:

```bash
curl -X POST http://localhost:5000/api/trees \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user-123",
    "title": "Test Tree",
    "description": "This is a test tree",
    "category": "Testing",
    "tags": ["test", "verify"],
    "status": "draft",
    "tree_data": {
      "concepts": [],
      "links": []
    }
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "tree": {
    "_id": "...",
    "user_id": "test-user-123",
    "title": "Test Tree",
    ...
  }
}
```

**Checklist**:
- [ ] Curl command runs without errors
- [ ] Response includes _id
- [ ] Response includes all fields

### Operation 2: View Trees in Library

1. Keep Library view open
2. Refresh the page (F5)
3. The test tree should appear

**Checklist**:
- [ ] Tree appears in library
- [ ] Title displays correctly
- [ ] Category shows "Testing"
- [ ] Tags show as badges
- [ ] Status shows as "📝 draft"

### Operation 3: Edit Tree

1. Click "Edit" button on the tree card
2. Change the title to "Updated Tree"
3. Click "Save"

**Checklist**:
- [ ] Edit mode activates
- [ ] Title field is editable
- [ ] Save button works
- [ ] Tree updates immediately
- [ ] No errors in console

### Operation 4: Filter by Status

1. Look for filter buttons
2. Click on "completed" status filter

**Checklist**:
- [ ] Filter buttons are visible
- [ ] Tree disappears (it's draft, not completed)
- [ ] Click "draft" to show it again
- [ ] Filter responds instantly

### Operation 5: Search

1. Type "Update" in the search box
2. Tree should appear (it has "Updated" in title)

**Checklist**:
- [ ] Search works in real-time
- [ ] Finds by title
- [ ] Finds by description
- [ ] Case-insensitive

### Operation 6: Archive Tree

1. Click the "Archive" button on tree card
2. Tree should disappear from main view

**Checklist**:
- [ ] Archive button works
- [ ] Tree status changes to archived
- [ ] Tree disappears from normal view
- [ ] Can filter to see archived trees

### Operation 7: Delete Tree

1. Click the "Delete" button
2. Confirm deletion in dialog
3. Tree should be gone

**Checklist**:
- [ ] Delete confirmation appears
- [ ] Tree is removed after confirmation
- [ ] Can't undelete (permanent)
- [ ] No errors in console

## Database Verification

### Check MongoDB Collections

Using MongoDB Compass or `mongosh`:

```javascript
// Connect to your MongoDB
use concept-tree-backend

// Check SkillTree collection
db.skilltrees.find()
```

**Checklist**:
- [ ] Collection exists
- [ ] Test tree document appears
- [ ] All fields are saved correctly
- [ ] Timestamps are accurate

## Performance Verification

### Test Performance

1. Create 10 trees with different categories and tags
2. Search for one - should be instant
3. Filter by multiple tags - should be fast
4. No lag or slowness

**Checklist**:
- [ ] All operations feel responsive
- [ ] No noticeable delay
- [ ] Console shows no warnings
- [ ] Network requests complete quickly

## Browser Compatibility

Test in these browsers:

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

Each should show:
- [ ] No console errors
- [ ] Responsive layout
- [ ] All buttons clickable
- [ ] Smooth animations

## Mobile Verification

### Desktop to Mobile Testing

1. Open DevTools (F12)
2. Click Device Toolbar (Ctrl+Shift+M)
3. Select iPhone 12/13/14
4. Verify layouts:

**Checklist**:
- [ ] Search box remains usable
- [ ] Buttons stack properly
- [ ] No horizontal scrolling
- [ ] Touch targets (buttons) minimum 44x44px
- [ ] Text remains readable

## API Endpoint Testing

Test each endpoint:

### GET /api/trees/:userId
```bash
curl http://localhost:5000/api/trees/test-user-123
```
**Checklist**: [ ] Returns array of trees

### GET /api/trees/:userId/categories
```bash
curl http://localhost:5000/api/trees/test-user-123/categories
```
**Checklist**: [ ] Returns array of categories

### GET /api/trees/:userId/tags
```bash
curl http://localhost:5000/api/trees/test-user-123/tags
```
**Checklist**: [ ] Returns array of tags

### POST /api/trees
```bash
curl -X POST http://localhost:5000/api/trees \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","title":"New","status":"draft"}'
```
**Checklist**: [ ] Creates new tree, returns _id

### PUT /api/trees/:treeId
```bash
curl -X PUT http://localhost:5000/api/trees/TREE_ID \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","title":"Updated"}'
```
**Checklist**: [ ] Updates tree successfully

### PATCH /api/trees/:treeId/archive
```bash
curl -X PATCH http://localhost:5000/api/trees/TREE_ID/archive \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}'
```
**Checklist**: [ ] Archives tree (status changes)

### DELETE /api/trees/:treeId
```bash
curl -X DELETE http://localhost:5000/api/trees/TREE_ID \
  -H "Content-Type: application/json" \
  -d '{"userId":"test"}'
```
**Checklist**: [ ] Deletes tree permanently

## Error Handling Verification

### Test Error Scenarios

1. **Create without title**:
```bash
curl -X POST http://localhost:5000/api/trees \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","title":""}'
```
**Expected**: Error message about missing title

2. **Access wrong user's tree**:
```bash
# Create as user1, try to access as user2
```
**Expected**: 404 or unauthorized error

3. **Invalid JSON**:
```bash
curl -X POST http://localhost:5000/api/trees \
  -H "Content-Type: application/json" \
  -d 'invalid json'
```
**Expected**: 400 Bad Request

**Checklist**:
- [ ] All error cases handled
- [ ] User-friendly error messages
- [ ] No 500 errors for user mistakes
- [ ] Console shows helpful debug info

## Documentation Verification

Check these files exist:
- [ ] LIBRARY_IMPLEMENTATION.md - Detailed technical guide
- [ ] LIBRARY_QUICK_START.md - Integration instructions
- [ ] LIBRARY_SUMMARY.md - Complete overview
- [ ] This file - Setup checklist

**Checklist**:
- [ ] All documentation files present
- [ ] Contain helpful information
- [ ] Examples are accurate
- [ ] Links are correct

## Final Checklist

### Core Systems
- [ ] Backend running on :5000
- [ ] Frontend running on :5173
- [ ] MongoDB connected
- [ ] No console errors

### Features
- [ ] Library view displays correctly
- [ ] Search works
- [ ] Filters work
- [ ] CRUD operations work
- [ ] Archive/unarchive works
- [ ] Responsive design works

### Performance
- [ ] Operations feel snappy
- [ ] No noticeable lag
- [ ] Animations are smooth
- [ ] Mobile responsive

### Quality
- [ ] Error handling works
- [ ] Security isolation works
- [ ] Data is persistent
- [ ] No data loss on refresh

## Troubleshooting Guide

### Issue: "Cannot GET /api/trees/:userId"
**Solution**: Check backend is running (`npm start` in backend folder)

### Issue: "CORS error"
**Solution**: Verify backend is configured with CORS middleware

### Issue: "MongoDB connection error"
**Solution**: 
- Check MongoDB is running
- Verify connection string in .env
- Check network access

### Issue: "Empty library shows wrong message"
**Solution**: 
- Check userId is being passed correctly
- Verify backend API responds
- Check browser console for errors

### Issue: "Styling looks broken"
**Solution**:
- Wait for Tailwind to compile
- Hard refresh (Ctrl+Shift+R)
- Check CSS files are imported
- Verify no CSS conflicts

### Issue: "Can't create tree"
**Solution**:
- Check title is not empty
- Verify userId is valid
- Check backend is running
- Check MongoDB has space
- Look at browser console for error message

## Success Criteria

You'll know the setup is complete when:

✅ Library view opens from sidebar  
✅ Can create trees through the API  
✅ Trees appear in library instantly  
✅ Search finds trees  
✅ Filters work correctly  
✅ Can edit trees  
✅ Can delete trees  
✅ No console errors  
✅ Mobile view works  
✅ Everything is fast  

## What's Next

1. **Add Save Button** - Follow LIBRARY_QUICK_START.md
2. **Implement Tree Loading** - Load saved trees into ConstellationView
3. **User Testing** - Have real users try the system
4. **Gather Feedback** - Improve based on feedback
5. **Enhance** - Add more features as needed

---

## Support

If something doesn't work:

1. Check this checklist for similar issues
2. Read the troubleshooting guide
3. Check console errors (F12)
4. Check network tab (F12 → Network)
5. Read relevant .md files
6. Check server logs

**You've got this! 🚀**
