# GymKhanna 💪

A mobile-first training journal built with the MERN stack. Log workouts, review personal records, and track body weight, water intake, and weekly goals.

**Existing deployment:** [gymkhanna.onrender.com](https://gymkhanna-frontend.onrender.com)
**Existing backend API:** [gymkhanna-backend.onrender.com](https://gymkhanna.onrender.com/api/health)

---

## Features

**Workout Tracking**
- Create workout sessions with exercises, sets, reps, and weight
- Auto-calculates total session volume (sets × reps × weight)
- PR (Personal Record) detection — automatically flags when you lift a new heaviest weight for any exercise
- Search workout history by workout or exercise name
- Repeat a past workout as an editable draft, or repeat the latest workout from the journal

**Previous sets**
- Selecting a lift starts the first set with the weight and reps from the first completed set the last time you logged it
- Adding a set uses the matching previous set when available, then copies the last row in the draft
- Adjust weight in 1 kg steps or enter a fractional weight directly. A new bodyweight exercise starts at 0 kg

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
- Short-lived JWT access tokens and rotating refresh tokens in an HttpOnly cookie
- Error boundary for graceful crash handling

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, Tailwind CSS v4 |
| Charts | Recharts |
| Routing | React Router |
| Backend | Node.js, Express |
| Database | MongoDB, Mongoose |
| Cache | Redis (optional) |
| Auth | JWT, bcrypt |
| Deployment | Render (backend + frontend), MongoDB Atlas |

---

## Architecture Highlights

**Backend**
- Express routes use JWT middleware and a consistent `{ success, data, message }` response shape.
- The previous-sets endpoint filters to the authenticated user in MongoDB and returns the latest completed sets for each exercise.

**Redis cache**
- Authenticated reads of `/api/sessions/stats` and `/api/sessions/prs` check a per-user cache before querying MongoDB.
- Cached values expire after 60 seconds. Creating or deleting a workout removes that user's cache version, so any read already in progress can only fill the old version.
- Without `REDIS_URL`, or if a Redis operation fails, the API continues using MongoDB. If Redis cannot receive an invalidation during an outage, a previously cached response can be stale until its TTL expires.

**Frontend**
- React Context and an Axios interceptor handle sign-in and token refresh. React Router protects the journal screens.

---

## Local Setup

### Prerequisites
- Node.js 22 (tested with 22.22.3)
- A MongoDB connection (local or Atlas)
- A running Redis instance if you want to exercise caching

### Backend

```bash
cd backend
npm ci
```

Create `backend/.env`:
```
PORT=5001
MONGODB_URI=your_mongodb_connection_string
ACCESS_TOKEN_SECRET=your_long_random_secret_here
CLIENT_URL=http://localhost:5173
# Optional
# REDIS_URL=redis://127.0.0.1:6379
```

```bash
node seed.js      # seed the default exercise library (30 exercises)
npm run dev       # starts on port 5001
```

### Frontend

```bash
cd frontend
npm ci
```

Create `frontend/.env`:
```
VITE_API_URL=http://localhost:5001/api
```

```bash
npm run dev       # starts on port 5173
```

To run the existing and new test suites, use `npm --prefix backend test -- --runInBand`
and `npm --prefix frontend test` from the repository root.

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
| GET | `/api/sessions/last-sets` | Latest completed sets by exercise for the signed-in user |
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

**Why pure functions for PR and streak logic?**

Testable in isolation without mocking a database. The controller's job is data orchestration; the service function's job is the actual logic. Separating them keeps both simple.

---

## Project Structure

```
gymkhanna/
├── backend/
│   ├── controllers/     # HTTP handlers (thin layer, calls services)
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Workout rules and Redis caching
│   │   ├── sessionCache.js
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