# Weather API

Production-ready Express + TypeScript service using Prisma and PostgreSQL.

## Local setup

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
```

Set `VISUAL_CROSSING_API_KEY` in `.env` before calling weather endpoints.

The API runs at `http://localhost:4000`.

## Auth

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| POST | `/api/v1/auth/refresh` | Refresh token |
| POST | `/api/v1/auth/logout` | Refresh token |
| GET | `/api/v1/auth/profile` | Bearer access JWT |
| PATCH | `/api/v1/auth/profile` | Bearer access JWT |

## Weather (Visual Crossing)

All weather routes require Bearer auth and return normalized JSON (`source`, `units`, `location`, …).

| Method | Path | Query |
|--------|------|-------|
| GET | `/api/v1/weather/current` | `location` |
| GET | `/api/v1/weather/hourly` | `location`, optional `days` (1–15, default 2) |
| GET | `/api/v1/weather/daily` | `location`, optional `days` (1–15, default 15) |
| GET | `/api/v1/weather/historical` | `location`, `startDate`, `endDate` (`YYYY-MM-DD`) |
| GET | `/api/v1/weather/alerts` | `location` |

Example:

```text
GET /api/v1/weather/current?location=Tbilisi,GE
Authorization: Bearer <accessToken>
```

## Commands

- `npm run dev` — development server with watch mode
- `npm run build` — compile TypeScript
- `npm start` — run the compiled service
- `npm run typecheck` — validate TypeScript
- `npm run prisma:deploy` — apply migrations
