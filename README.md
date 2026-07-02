# GymKhanna 💪

A full-stack personal fitness tracker built with the MERN stack. Log workouts, track progressive overload, monitor body weight goals, and stay consistent with a weekly streak system.

**Live Demo:** [gymkhanna.onrender.com](https://gymkhanna.onrender.com) *(link after deployment)*  
**Backend API:** [gymkhanna-backend.onrender.com](https://gymkhanna-backend.onrender.com)

---

## Features

**Workout Tracking**
- Create workout sessions with exercises, sets, reps, and weight
- Auto-calculates total session volume (sets × reps × weight)
- PR (Personal Record) detection — automatically flags when you lift a new heaviest weight for any exercise
- Session history with per-session volume and PR badges

**Progressive Overload Engine**
- After each session, calculates the recommended weight for your next session
- Logic: completed all reps → +2.5kg, partial completion → same weight, failed sets → deload (×0.9)
- Pure function architecture — independently testable, no DB calls inside

**Body Weight Tracking**
- Daily weight logging with a goal weight
- Progress bar showing percentage toward goal
- Direction-agnostic formula (works for both weight loss and weight gain)
- Full weight history

**Water Tracking**
- Quick-add buttons (+250ml, +500ml, +1000ml)
- Daily goal with progress bar
- Resets each day via date-range query

**Goals & Streaks**
- Weekly session frequency goal
- Streak counter — tracks consecutive weeks you hit your target
- ISO week-based comparison (handles year-boundary edge cases correctly)

**Progress Analytics**
- Weight trend line chart (Recharts)
- Session volume bar chart (Recharts)
- All-time personal records per exercise

**Auth & Security**
- JWT authentication with bcrypt password hashing
- Protected routes (frontend + backend)
- Auto-logout on token expiry via axios response interceptor
- Error boundary for graceful crash handling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Auth | JWT, bcrypt |
| Deployment | Render (backend + frontend), MongoDB Atlas |

---

## Architecture Highlights

**Backend**
- RESTful API with consistent `{ success, data, message }` response shape
- Separation of concerns: pure service functions (`overloadEngine.js`, `prEngine.js`, `streakEngine.js`) contain all business logic — controllers handle only HTTP and DB orchestration
- Route ordering enforced carefully to prevent wildcard `/:id` from swallowing specific endpoints like `/prs` and `/stats`
- Axios response interceptor auto-logs out users on 401 (expired token)

**Frontend**
- Context API for global auth and theme state
- Single axios instance with request interceptor auto-attaching JWT
- `Promise.all` for parallel independent data fetches
- Immutable state updates throughout (spread patterns, `.filter()`, `.map()` — no direct mutation)

---

## Local Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier)

### Backend

```bash
cd backend
npm install
```

Create `backend/.env`:
```
PORT=5001
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_here
CLIENT_URL=http://localhost:5173
```

```bash
node seed.js      # seed the default exercise library (30 exercises)
npm run dev       # starts on port 5001
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5001/api
```

```bash
npm run dev       # starts on port 5173
```

### Test the backend is running
```
GET http://localhost:5001/api/health
→ { "success": true, "data": { "status": "ok" }, "message": "" }
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/sessions` | Create workout session (triggers PR detection + streak update) |
| GET | `/api/sessions` | Get all sessions (newest first) |
| GET | `/api/sessions/:id` | Get single session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET | `/api/sessions/prs` | All-time personal records |
| GET | `/api/sessions/stats` | Dashboard stats (totals + recent sessions) |
| POST | `/api/exercises` | Add custom exercise |
| GET | `/api/exercises` | Get exercise library (defaults + user's custom) |
| POST | `/api/bodyweight` | Log weight entry |
| GET | `/api/bodyweight` | Weight history + goal progress |
| PUT | `/api/bodyweight/goal` | Set goal weight |
| POST | `/api/water` | Log water intake |
| GET | `/api/water/today` | Today's water total + goal |
| GET | `/api/goals` | Weekly goal status + streak |
| PUT | `/api/goals` | Set weekly session goal |

---

## Key Design Decisions

**Why goalWeight on User model, not a separate collection?**  
It's a profile setting that gets overwritten in place — not a historical log. Different lifecycle from weight entries, which accumulate over time.

**Why store totalVolume instead of calculating on read?**  
Dashboard and progress pages need to aggregate volume across potentially hundreds of sessions. Pre-computing at write time keeps reads cheap regardless of how much historical data accumulates.

**Why pure functions for overload/PR/streak logic?**  
Testable in isolation without mocking a database. The controller's job is data orchestration; the service function's job is the actual logic. Separating them keeps both simple.

**Why a response interceptor for 401 handling?**  
Centralizes expired-token handling in one place instead of each page needing its own 401 check. The interceptor uses `window.location.href` instead of React Router's `navigate()` because `client.js` lives outside React's component tree.

---

## Project Structure

```
gymkhanna/
├── backend/
│   ├── controllers/     # HTTP handlers (thin layer, calls services)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Pure business logic
│   │   ├── overloadEngine.js
│   │   ├── prEngine.js
│   │   └── streakEngine.js
│   ├── middleware/      # JWT auth middleware
│   └── server.js
└── frontend/
    └── src/
        ├── api/         # Axios instance + API wrappers
        ├── components/  # Reusable UI pieces
        ├── context/     # AuthContext
        ├── hooks/       # useAuth
        ├── pages/       # One file per route
        └── utils/
```

---

## Author

**Keshav Mittal**  
B.Tech IT, Delhi Technological University  
[GitHub](https://github.com/keshavmittl) · [LinkedIn](linkedin.com/in/keshav-mittal-85a8952aa/)