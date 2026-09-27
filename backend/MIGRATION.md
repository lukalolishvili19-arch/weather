# Node → Java migration notes

Source of truth for behaviour was the Node API in `../server` (Express 5, Prisma, zod). Where the Node
code and its documentation disagreed, the code's actual runtime behaviour was preserved.

## Status

| Area | Status |
| --- | --- |
| All 59 Node routes | implemented, same paths, methods, status codes, JSON shapes and error codes |
| Database | same tables; Flyway baselines the existing Prisma schema, no DDL runs on the live DB |
| Auth | same JWT format/secrets, same refresh cookie, existing sessions and bcryptjs hashes keep working |
| Frontend | no changes required or made |
| Node API (`../server`) | untouched and still deployed; retire only after the Java API is verified in production |

## Feature inventory

- **Auth**: register (201, email lowercased, `EMAIL_IN_USE` 409), login (`INVALID_CREDENTIALS` 401),
  refresh with rotation (cookie first, then JSON/urlencoded `refreshToken`; `REFRESH_TOKEN_REQUIRED`,
  `INVALID_REFRESH_TOKEN`), logout (revokes, clears cookie), profile get/patch. Access token in the
  response body; refresh token in the body and in the `refreshToken` cookie
  (`HttpOnly; Path=/api/v1/auth; Max-Age=<refresh TTL>; SameSite=Lax`, or `Secure; SameSite=None` in production).
  Refresh tokens are stored hashed with user agent and client IP (rightmost `X-Forwarded-For` hop, like `trust proxy 1`).
- **User settings**: `/me` get (auto-created with defaults) and patch; theme, language, units, time format,
  animation and notification toggles.
- **Favorites**: list (pinned first), add (`FAVORITE_EXISTS` 409), pin/unpin, delete.
- **Search history**: list (effectively 20 newest, see differences), add, delete one, clear all.
- **Notifications**: list, weather-alert sync for a location (rain/storm/heat from the 3-day forecast plus
  provider alerts, deduplicated by `dedupeKey`), mark one/all read, clear read, delete.
- **Locations**: autocomplete (popular list + Open-Meteo geocoding), suggestions, resolve by name or coordinates
  (Nominatim reverse geocoding).
- **Weather**: current, hourly, daily (up to 30 days), historical (`INVALID_DATE_RANGE`), alerts with
  categorised cards, air quality (Open-Meteo, US AQI categories and health advice), map config
  (OpenWeather tile overlays when a key is configured).
  Visual Crossing is used when `VISUAL_CROSSING_API_KEY` is set, otherwise Open-Meteo, as in Node.
  Provider failures surface as errors (`WEATHER_UPSTREAM_*`, `WEATHER_RATE_LIMITED`, `AIR_QUALITY_UPSTREAM_*`,
  `GEOCODER_*`; 429/502), with the same codes and messages as Node; no fallback data is invented.
- **Health**: `GET /api/v1/health` → `{status, service, environment, uptimeSeconds, timestamp}`.
- **Cross-cutting**: `{"data": ...}` success envelope, `{"error": {code, message, details?, requestId}}` errors,
  zod-identical validation messages and `details.formErrors/fieldErrors`, `X-Request-Id`, helmet-equivalent
  security headers, 1 MB body limit, CORS allow-list with credentials, gzip.

## Endpoints

All under `/api/v1`. Public: `health`, `auth/register|login|refresh|logout`, `weather/**` and
`locations/**` (weather works without an account). Everything else requires
`Authorization: Bearer <accessToken>`. The Node API's router was changed the same way, so both backends agree.
Login/register and the public weather routes are rate limited per client IP (429 `RATE_LIMITED` with `Retry-After`).

| Group | Routes |
| --- | --- |
| health | `GET /health` |
| auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/profile`, `PATCH /auth/profile` |
| user-settings | `GET /user-settings/me`, `PATCH /user-settings/me`, `GET /user-settings`, `POST /user-settings`, `GET /user-settings/by-user/:userId`, `GET/PATCH/DELETE /user-settings/:id` |
| favorites | `GET /favorites/me`, `POST /favorites/me`, `PATCH /favorites/me/:id/pin`, `DELETE /favorites/me/:id`, `GET /favorites`, `POST /favorites`, `GET/PATCH/DELETE /favorites/:id` |
| search-history | `GET /search-history/me`, `POST /search-history/me`, `DELETE /search-history/me`, `DELETE /search-history/me/:id`, `GET /search-history`, `POST /search-history`, `GET/PATCH/DELETE /search-history/:id` |
| notifications | `GET /notifications/me`, `POST /notifications/me/sync`, `PATCH /notifications/me/read-all`, `DELETE /notifications/me/read`, `PATCH /notifications/me/:id`, `DELETE /notifications/me/:id`, `GET /notifications`, `POST /notifications`, `GET/PATCH/DELETE /notifications/:id` |
| users | `GET /users`, `POST /users`, `GET/PATCH/DELETE /users/:id` |
| locations | `GET /locations/autocomplete`, `GET /locations/suggestions`, `POST /locations/resolve` |
| weather | `GET /weather/current`, `/hourly`, `/daily`, `/historical`, `/alerts`, `/air-quality`, `/map-config` |

The frontend only calls the `/me`, `auth`, `locations` and `weather` routes.

## Database

- `V1__baseline_prisma_schema.sql` is the concatenation of the three Prisma migrations, verbatim.
- `baseline-on-migrate: true`, `baseline-version: 1`: on the existing Neon database Flyway creates
  `flyway_schema_history` with a BASELINE row and runs nothing else. `_prisma_migrations` and all data stay.
  An empty database gets the full schema from V1.
- `ddl-auto: none`, `clean-disabled: true`. No tables, columns or rows are dropped or altered.
- IDs are generated as cuid-compatible strings; timestamps stay `TIMESTAMP(3)` in UTC.
- Verified by `LegacyDatabaseCompatibilityTest`, which builds a database from the real Prisma migrations
  plus Node-created rows and checks that the Java API reads and writes them without changes.

## Intentional behaviour differences

These are the only places where the Java API does not reproduce Node exactly. None affects a route the
frontend uses in normal operation.

1. **Generic (non-`/me`) routes are restricted to the caller's own records.** In Node, any logged-in user
   could list, edit and delete every account, setting, favorite, history entry and notification, and
   `POST /users` / `PATCH /users/:id` accepted a raw `passwordHash`. Now other users' records give
   `403 FORBIDDEN`, `GET` lists only return the caller's rows, `POST /users` is `403` (use `/auth/register`),
   and `passwordHash` cannot be written. Unused by the frontend.
2. **Malformed JSON body** → `400 VALIDATION_ERROR "Malformed JSON body"` (Node returned 500).
   **Body over 1 MB** → `413` (Node: 500). **Provider returned invalid JSON** → `502` (Node: 500).
3. **Refresh token race**: two concurrent refreshes with the same token can no longer both succeed;
   revocation is a conditional update.
4. **CORS**: a disallowed origin gets no `Access-Control-Allow-Origin` header (same as Node), but its
   preflight gets `403` instead of `204`.
5. **`PATCH` with `"metadata": null`** on notifications stores `NULL` (Prisma rejected it with 500).
6. **Required field sent as `null`** reports `"Required"` instead of zod's `"Expected string, received null"`.
   Status and `fieldErrors` key are the same.

7. **Weather and locations are public** (requested product change: weather without registration).
   Node originally required a login for them; its router now matches.

Preserved on purpose even though they look like bugs:

- `GET /search-history/me?limit=N` validates `limit` (1–100) but always returns at most 20 rows, because
  Express 5 discarded the parsed query in Node. Changing it would change what the Search page shows.

## Verification performed

- `mvn test`: 58 tests, 0 failures (Testcontainers PostgreSQL 17), including guest access, per-user
  ownership, password-never-returned and rate-limit tests.
- Browser end-to-end run (Playwright + Edge against the Java API and the Vite frontend): guest, newly
  registered, logged-in, logged-out and expired-session flows, 44/44 checks passed.
- Docker image built from `Dockerfile`, run with `NODE_ENV=production` against PostgreSQL: container
  health check `healthy`, `scripts/smoke.mjs` covering every route group returned the expected statuses,
  and the refresh cookie was `Secure; HttpOnly; SameSite=None`. Weather calls used live Open-Meteo.

Not verified (no credentials/access available):

- Visual Crossing with a real API key (only tested against a stub that mimics its responses and errors).
- OpenWeather tile overlays with a real key.
- The production Neon database (the baseline was tested on a database built from the same Prisma migrations).
- Deployment to Render and the Vercel frontend running against the Java API.
