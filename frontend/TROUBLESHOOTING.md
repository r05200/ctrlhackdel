# 🔧 TROUBLESHOOTING GUIDE

## 🚨 **COMMON ISSUES & FIXES**

### Graph Not Appearing / Black Screen

**Symptoms:**

- Just see black background
- No nodes or links visible
- Console shows errors about WebGL

**Solutions:**

1. **Check Browser Compatibility**

   ```bash
   # Use Chrome/Edge (best WebGL support)
   # Avoid old browsers
   ```

2. **GPU Acceleration**
   - Chrome: `chrome://gpu` → Ensure "WebGL" is enabled
   - Edge: `edge://gpu`
   - Enable hardware acceleration in browser settings

3. **Console Errors**
   - Open DevTools (F12)
   - Check Console tab
   - Look for red errors about Three.js or react-force-graph

4. **Clear Cache & Reload**
   ```bash
   Ctrl + Shift + R (Windows)
   Cmd + Shift + R (Mac)
   ```

---

### Nodes Loading in Wrong Positions

**Symptoms:**

- All nodes clumped together
- Nodes overlapping
- Graph doesn't spread out

**Solutions:**

1. **Increase Warmup Ticks** in `App.jsx`:

   ```javascript
   <ForceGraph3D
     warmupTicks={100} // Increase to 200
     cooldownTicks={0}
   />
   ```

2. **Adjust Force Strength**:
   ```javascript
   <ForceGraph3D
     d3AlphaDecay={0.01} // Slower = more spreading time
     d3VelocityDecay={0.3} // Lower = more bouncy
   />
   ```

---

### Modal Not Opening on Click

**Symptoms:**

- Click green nodes, nothing happens
- No error in console
- Hover works, but click doesn't

**Solutions:**

1. **Check Node Status**
   - Only `status: 'active'` nodes can be clicked
   - Open `src/data/knowledgeGraph.js`
   - Verify at least one node has `status: 'active'`

2. **Z-Index Conflict**
   - Check if another element is blocking clicks
   - In DevTools, inspect the clicked area

3. **React State Issue**
   - Refresh page (Ctrl + R)
   - Check console for React errors

---

### Graph Spinning Too Fast/Slow

**Symptoms:**

- Auto-rotation is jerky or too aggressive
- Motion sickness from spinning

**Solutions:**

1. **Adjust Rotation Speed** in `App.jsx`:

   ```javascript
   const rotateInterval = setInterval(() => {
     angle += 0.3; // CHANGE THIS (lower = slower)
     // ...
   }, 2000); // CHANGE THIS (higher = slower rotation)
   ```

2. **Disable Auto-Rotation Completely**:
   ```javascript
   // Comment out the entire useEffect with rotation
   /*
   useEffect(() => {
     // ... rotation code
   }, []);
   */
   ```

---

### Performance Issues / Lag

**Symptoms:**

- Graph stutters
- FPS drops
- Mouse movements laggy

**Solutions:**

1. **Reduce Particle Effects**:

   ```javascript
   <ForceGraph3D
     linkDirectionalParticles={1} // Lower from 2 to 1 or 0
     linkDirectionalParticleSpeed={0.003} // Lower from 0.005
   />
   ```

2. **Simplify Node Rendering**:

   ```javascript
   // In nodeThreeObject, remove glow/ring effects:
   // Comment out the glow sphere and ring mesh creation
   ```

3. **Close Other Tabs**
   - Browser using too much memory
   - Close unused tabs

4. **Reduce Graph Complexity**:
   - Remove some nodes from `knowledgeGraph.js`
   - Start with 7-10 nodes instead of 13

---

### Colors Not Showing Correctly

**Symptoms:**

- All nodes same color
- Locked/Active/Mastered look identical

**Solutions:**

1. **Check CSS Variables** in `src/index.css`:

   ```css
   :root {
     --neon-blue: #00f3ff;
     --neon-green: #39ff14;
     --locked-gray: #555555;
   }
   ```

2. **Verify Node Status**:

   ```javascript
   // In knowledgeGraph.js
   nodes: [
     { id: "node1", status: "mastered" }, // Should be blue
     { id: "node2", status: "active" }, // Should be green
     { id: "node3", status: "locked" }, // Should be gray
   ];
   ```

3. **Check getNodeColor Function**:
   ```javascript
   // In knowledgeGraph.js
   export const getNodeColor = (status) => {
     console.log("Node status:", status); // Add debug log
     switch (status) {
       case "mastered":
         return "#4cc9f0";
       // ...
     }
   };
   ```

---

### Port 3000 Already in Use

**Symptoms:**

```
Error: Port 3000 is already in use
```

**Solutions:**

1. **Kill Existing Process**:

   ```powershell
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID_NUMBER> /F
   ```

2. **Use Different Port**:
   ```javascript
   // In vite.config.js
   export default defineConfig({
     server: {
       port: 3001, // Change to 3001
     },
   });
   ```

---

### Modal Styling Broken

**Symptoms:**

- Modal appears but looks unstyled
- Missing animations
- Colors wrong

**Solutions:**

1. **Import CSS in Component**:

   ```javascript
   // In BossFightModal.jsx
   import "./BossFightModal.css"; // Make sure this line exists
   ```

2. **Check CSS File Location**:

   ```
   src/
   └── components/
       ├── BossFightModal.jsx
       └── BossFightModal.css  ← Must be here
   ```

3. **Clear Vite Cache**:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

---

### Links/Edges Not Visible

**Symptoms:**

- See nodes but no connecting lines
- Graph looks disconnected

**Solutions:**

1. **Check Links Array** in `knowledgeGraph.js`:

   ```javascript
   links: [
     { source: "node1", target: "node2" }, // IDs must match node IDs
   ];
   ```

2. **Verify Node IDs Match**:

   ```javascript
   // Source/target must reference actual node IDs
   nodes: [
     { id: 'data-structures', ... }
   ],
   links: [
     { source: 'programming-basics', target: 'data-structures' }  // ✅ Correct
     { source: 'wrong-id', target: 'data-structures' }  // ❌ Won't render
   ]
   ```

3. **Increase Link Width**:
   ```javascript
   <ForceGraph3D
     linkWidth={4} // Increase from 2 to 4
     linkOpacity={0.8} // Increase from 0.6
   />
   ```

---

### Boss Fight Completes Instantly

**Symptoms:**

- Click "Begin Oral Exam"
- Immediately shows success
- No recording phase

**Solutions:**

This is **expected behavior** for the demo. The Boss Fight is simulated to save time during the hackathon presentation.

**To make it more realistic:**

1. **Increase Timing** in `BossFightModal.jsx`:

   ```javascript
   setTimeout(() => {
     setIsRecording(false);
     setStage("checking");
     simulateAICheck();
   }, 5000); // Change from 3000 to 5000 (5 seconds of "recording")
   ```

2. **Add Manual Button**:
   ```javascript
   // Replace auto-timeout with:
   <button
     onClick={() => {
       setIsRecording(false);
       setStage("checking");
       simulateAICheck();
     }}
   >
     Stop Recording
   </button>
   ```

---

## 🎯 **PRE-DEMO CHECKLIST**

Run these checks **5 minutes before presenting**:

```bash
# 1. Kill any old dev servers
# Ctrl + C in terminal

# 2. Fresh install (if paranoid)
cd frontend
rm -rf node_modules
npm install

# 3. Start clean server
npm run dev

# 4. Open in browser
http://localhost:3000

# 5. Test clicks:
#    - Click gray node → Should show "locked" alert
#    - Click green node → Should open modal
#    - Click "Begin Oral Exam" → Should show recording animation
#    - Wait for success → Should show blue node after closing modal

# 6. Check console (F12)
#    - Should see no red errors
```

---

## 🐛 **DEBUGGING COMMANDS**

### Check if server is running:

```powershell
netstat -ano | findstr :3000
```

### See all npm processes:

```powershell
Get-Process | Where-Object {$_.ProcessName -eq "node"}
```

### Force kill all Node processes:

```powershell
Stop-Process -Name "node" -Force
```

### View Vite logs:

```bash
npm run dev -- --debug
```

### Check package versions:

```bash
npm list react react-dom react-force-graph-3d three
```

---

## 📱 **BROWSER-SPECIFIC FIXES**

### Chrome

- Best compatibility
- If issues: Disable extensions (Incognito mode)
- `chrome://flags` → Enable "WebGL 2.0"

### Edge

- Same engine as Chrome
- Usually works identically

### Firefox

- May have slower 3D performance
- Check `about:config` → `webgl.force-enabled = true`

### Safari (Mac)

- Worst WebGL support
- Avoid if possible
- Use Chrome on Mac instead

---

## 🔥 **EMERGENCY FIXES** (Last Resort)

### Nuclear Option #1: Complete Reinstall

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Nuclear Option #2: Use Different Computer

- Copy `frontend/` folder to USB
- Paste on teammate's laptop
- Run `npm install && npm run dev`

### Nuclear Option #3: Recorded Demo

- Record screen video of working demo
- Play video if live demo fails
- Still answer questions live

---

## 💡 **PRO TIPS**

1. **Always have backup laptop ready** with project pre-loaded
2. **Test on presentation screen** before your slot (different GPU)
3. **Have teammate test on their machine** (cross-device verification)
4. **Keep browser tab open** the entire hackathon (don't close it)
5. **Disable browser auto-updates** during event
6. **Turn off Windows/Mac updates** for the day
7. **Charge laptop to 100%** before presenting

---

## 📞 **STILL STUCK?**

### Quick Diagnosis:

```bash
# Check Node version
node --version  # Should be >= 18

# Check npm version
npm --version   # Should be >= 9

# Check if Vite is installed
npx vite --version
```

### Common Version Issues:

```bash
# If Node version too old:
# Download latest LTS from nodejs.org

# If weird dependency errors:
npm install --legacy-peer-deps
```

---

## ✅ **EXPECTED BEHAVIOR SUMMARY**

### What SHOULD work:

- ✅ Graph renders with floating nodes
- ✅ Graph auto-rotates slowly
- ✅ Nodes are colored (Blue/Green/Gray)
- ✅ Lines connect nodes
- ✅ Particles flow on some links
- ✅ Clicking green node opens modal
- ✅ Modal shows boss fight animation
- ✅ Completing fight updates graph

### What is NORMAL:

- Graph takes 2-3 seconds to stabilize on load
- Nodes bounce a bit before settling
- Some slight performance variation on different machines
- Boss fight is simulated (not real AI yet)

### What is NOT normal:

- ❌ Blank/black screen for >5 seconds
- ❌ Console full of red errors
- ❌ Clicking does nothing
- ❌ Graph doesn't render at all

---

**Need more help? Read the main README.md for architecture details.**
