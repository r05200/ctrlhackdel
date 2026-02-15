# NEXUS

NEXUS is a learning app that turns topics into constellation maps, lets users complete Star Trials, and tracks progress across saved constellations (Galaxy).

## Monorepo Layout

- `frontend/` React + Vite client
- `backend/node-backend/` Express API
- `start-all.bat` legacy helper script (uses old backend path)

## Requirements

- Node.js 18+
- npm

## Quick Start

### 1. Install dependencies

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend/node-backend
npm install
```

### 2. Configure environment

Create `backend/node-backend/.env` (or copy from `.env.example`) and set at minimum:

```env
PORT=5000
GEMINI_API_KEY=your_key_here
ELEVENLABS_API_KEY=your_key_here
# Optional:
# GEMINI_MODEL=gemini-2.5-flash
# GEMINI_MODEL_FALLBACKS=gemini-2.0-flash,gemini-1.5-flash,gemini-1.5-pro
```

If needed, set frontend API base in `frontend/.env`:

```env
VITE_API_BASE_URL=http://localhost:5000
```

### 3. Run the app

```bash
# Terminal 1
cd backend/node-backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

App URLs:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`

## Core Features

- Stargaze topic input and constellation generation
- Galaxy view for saved constellations (open/rename/tag/delete)
- Constellation map with node unlock flow and Star Trial flows
- Settings for startup animation, background elements, user name, and colors
- AI-backed generation/scoring

## Frontend Scripts (`frontend/package.json`)

- `npm run dev`
- `npm run build`
- `npm run preview`

## Backend Scripts (`backend/node-backend/package.json`)

- `npm run dev`
- `npm start`
- `npm test`

## Main Backend Endpoints

- `GET /api/graph`
- `GET /api/progress`
- `POST /api/node/:nodeId/complete`
- `POST /api/verify`
- `POST /api/star-trial/questions`
- `POST /api/generate-tree`
- `GET /api/constellations`
- `POST /api/constellations`
- `PATCH /api/constellations/:id`
- `DELETE /api/constellations/:id`
- `POST /api/voice/transcribe`

## Notes

- The frontend calls backend directly (no Vite proxy requirement).
- Legacy docs in this repo may reference older paths/endpoints.
