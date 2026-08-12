# SkyCast Weather Dashboard

React + Vite frontend and Express + Prisma API for live weather, forecasts, analytics, maps, air quality, alerts, and exports.

## Quick start (frontend)

```bash
npm install
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173). No env file is required for the UI — it defaults to `http://localhost:4000/api/v1`.

Copy `.env.example` to `.env` only if you need to override the API URL:

```bash
cp .env.example .env
```

## Full stack (weather data + auth)

Weather features need the API and PostgreSQL.

### 1. Database

```bash
cd server
docker compose up -d
```

### 2. API env

```bash
cp .env.example .env
```

Set at least `VISUAL_CROSSING_API_KEY` in `server/.env`. JWT secrets and `DATABASE_URL` already have local defaults.

### 3. Install, migrate, run API

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Or from the repo root:

```bash
npm run server:dev
```

API: [http://localhost:4000](http://localhost:4000)

### 4. Frontend

From the repo root:

```bash
npm install
npm run dev
```

Register an account, then use the dashboard.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite frontend |
| `npm run build` | Typecheck + production build |
| `npm run preview` | Preview production build |
| `npm run typecheck` | TypeScript project references check |
| `npm run lint` | ESLint |
| `npm run server:dev` | Start Express API |
| `npm run server:build` | Build API |
| `npm run server:typecheck` | Typecheck API |

## Environment

### Frontend (`.env.example`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:4000/api/v1` | Backend API base URL |

Vite also proxies `/api` → `http://localhost:4000` during development.

### Backend (`server/.env.example`)

See `server/README.md` for the full list. Required for real weather: `DATABASE_URL`, JWT secrets, `VISUAL_CROSSING_API_KEY`.

## Production build

```bash
npm run build
npm run preview
```

Optimized output includes:

- Route-level lazy loading + code splitting
- Separate chunks for React, charts, map, motion, export (PDF/Excel), and React Query
- CSS code splitting
- React Query cache defaults tuned for weather data

## App features

- Dashboard, search, favorites
- Analytics charts and period summaries
- Export weather/analytics as PDF, CSV, Excel
- City compare, travel planner
- Air quality, alerts, interactive map
- Notifications, profile, settings (theme, language, units)

## Architecture

```
src/
  app/           # providers + router
  features/      # auth + weather-dashboard
  shared/        # http client, query client, UI primitives
server/          # Express API, Prisma, weather integrations
```
