# Quick Integration Guide - Save Tree Functionality

## Adding "Save Tree" Button to ConstellationView

Follow these steps to add tree saving functionality to the ConstellationView component:

### Step 1: Import the SaveTreeModal Component

At the top of `frontend/src/components/ConstellationView.jsx`, add:

```jsx
import SaveTreeModal from './SaveTreeModal';
```

### Step 2: Add State Variables

Within the component's state declarations, add:

```jsx
const [showSaveModal, setShowSaveModal] = useState(false);
const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9)); // If not already present
```

### Step 3: Create a Function to Collect Tree Data

Add this function to collect current tree state:

```jsx
const getCurrentTreeData = () => {
  // This depends on your current tree structure
  // Example structure - adjust based on actual implementation
  return {
    concepts: nodes.map(node => ({
      concept_id: node.id,
      title: node.title,
      description: node.description,
      difficulty_level: node.difficulty_level,
      user_status: node.status
    })),
    links: links.map(link => ({
      source: link.source,
      target: link.target
    }))
  };
};
```

### Step 4: Add Save Button

Add a button in the ConstellationView UI (usually in the header or bottom action bar):

```jsx
<button
  className="save-tree-btn"
  onClick={() => setShowSaveModal(true)}
  title="Save current tree to library"
>
  💾 Save Tree
</button>
```

Optional CSS (add to ConstellationView.css):

```css
.save-tree-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #a78bfa, #60a5fa);
  color: #0a0818;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.save-tree-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(167, 139, 250, 0.3);
}
```

### Step 5: Add SaveTreeModal Component

Add the modal component to the JSX return:

```jsx
<SaveTreeModal
  isOpen={showSaveModal}
  onClose={() => setShowSaveModal(false)}
  treeData={getCurrentTreeData()}
  userId={userId}
/>
```

### Step 6: Add Loading Saved Trees (Optional)

To load a saved tree into the current view, add this function:

```jsx
const loadTreeFromLibrary = (tree) => {
  // Load tree_data into current view state
  // This depends on your current tree update mechanism
  
  // Example for updating nodes and links:
  if (tree.tree_data) {
    setNodes(tree.tree_data.concepts.map(c => ({
      id: c.concept_id,
      title: c.title,
      description: c.description,
      difficulty_level: c.difficulty_level,
      status: c.user_status
    })));
    
    setLinks(tree.tree_data.links);
  }
};
```

## Verifying Installation

### Backend Check

1. Start the backend server:
```bash
cd concept-tree-backend/node-backend
npm start
```

2. Verify the tree endpoints are available:
```
✓ Trees: CRUD /api/trees/:userId
```

3. Test the API manually:
```bash
curl http://localhost:5000/api/trees/test-user
```

### Frontend Check

1. Navigate to http://localhost:5173 (or your frontend port)
2. Look for the "Library" menu option in the sidebar
3. Click it to open the Library view
4. Verify no console errors appear

### Full Integration Test

1. Navigate to ConstellationView
2. Look for the new "Save Tree" button
3. Click it
4. Fill in the form and save
5. Go back to Library
6. Verify your new tree appears in the list
7. Test editing, archiving, and deleting

## Troubleshooting Integration

### "SaveTreeModal is not defined"
- Ensure you've imported it: `import SaveTreeModal from './SaveTreeModal';`
- Check the file path is correct

### "treeAPI is not defined" (in SaveTreeModal)
- Verify `treeAPI.js` exists in `frontend/src/services/`
- Check imports in SaveTreeModal.jsx

### Trees won't save
- Check backend is running: `npm start` in `concept-tree-backend/node-backend`
- Check MongoDB is running
- Check browser console for errors
- Verify userId is valid

### Styling looks wrong
- Ensure Tailwind CSS is configured
- Check CSS files are imported
- Verify no CSS conflicts

## Example: Complete ConstellationView Integration

Here's a complete example of what the integration looks like:

```jsx
import React, { useState } from 'react';
import SaveTreeModal from './SaveTreeModal';

export default function ConstellationView({ onBack, userPrompt }) {
  // Existing state...
  const [nodes, setNodes] = useState([]);
  const [links, setLinks] = useState([]);
  
  // New state for save functionality
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [userId] = useState('user-' + Math.random().toString(36).substr(2, 9));

  // Function to get current tree data
  const getCurrentTreeData = () => {
    return {
      concepts: nodes.map(node => ({
        concept_id: node.id,
        title: node.title,
        description: node.description,
        difficulty_level: node.difficulty_level,
        user_status: node.status
      })),
      links: links.map(link => ({
        source: link.source,
        target: link.target
      }))
    };
  };

  return (
    <div className="constellation-view">
      {/* Existing constellation content */}
      
      <div className="action-buttons">
        <button onClick={onBack}>← Back</button>
        <button onClick={() => setShowSaveModal(true)}>💾 Save Tree</button>
      </div>

      <SaveTreeModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        treeData={getCurrentTreeData()}
        userId={userId}
      />
    </div>
  );
}
```

## API Endpoints Reference

All endpoints require the backend to be running at `http://localhost:5000`:

```
GET    /api/trees/:userId               - List all user's trees
GET    /api/trees/:userId?category=X    - Filter by category
GET    /api/trees/:userId?status=X      - Filter by status
GET    /api/trees/:userId?search=X      - Search trees
GET    /api/trees/get/:treeId           - Get single tree
GET    /api/trees/:userId/categories    - Get all categories
GET    /api/trees/:userId/tags          - Get all tags
POST   /api/trees                       - Create new tree
PUT    /api/trees/:treeId               - Update tree
DELETE /api/trees/:treeId               - Delete tree
PATCH  /api/trees/:treeId/archive       - Archive tree
PATCH  /api/trees/:treeId/unarchive     - Unarchive tree
```

## Common Customizations

### Change Default Status
In SaveTreeModal.jsx, modify the default:
```jsx
const [status, setStatus] = useState('in-progress'); // Changed from 'draft'
```

### Add More Status Options
In SaveTreeModal.jsx:
```jsx
const statusOptions = ['draft', 'in-progress', 'completed', 'archived', 'reviewing'];
```

### Change Max Description Length
In SaveTreeModal.jsx:
```jsx
<textarea
  maxLength={500} // Add this
  placeholder="..."
/>
```

### Customize Success Message
In SaveTreeModal.jsx, after successful save:
```jsx
alert('🎉 Tree saved successfully!');
```

## Performance Tips

1. **Debounce Search** - Add debouncing to search queries
2. **Lazy Load Trees** - Only load first 20, then load more on scroll
3. **Cache Categories/Tags** - Store in React Context
4. **Batch Deletes** - Allow selecting multiple trees to delete at once

## Next Steps

1. ✅ Install and test the integration
2. ✅ Customize styling to match your design
3. ✅ Add loading saved trees functionality
4. ✅ Test all CRUD operations
5. ✅ Deploy to production

Feel free to extend and customize as needed!
