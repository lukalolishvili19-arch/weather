// Usage: node scripts/smoke.mjs <base-url-including-/api/v1>
// Registers a throwaway smoke<timestamp>@example.com account in the target database and prints every response.
const base = process.argv[2];
if (!base) {
  console.error("Usage: node scripts/smoke.mjs http://localhost:4000/api/v1");
  process.exit(1);
}
let cookie = "";

async function call(method, path, { body, token, useCookie } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (useCookie && cookie) headers.Cookie = cookie;
  const response = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    const pair = setCookie.split(";")[0];
    cookie = pair.endsWith("=") ? "" : pair;
  }
  const text = await response.text();
  const short = text.length > 260 ? `${text.slice(0, 260)}...` : text;
  console.log(`${method} ${path} -> ${response.status} ${short}`);
  return { status: response.status, json: text ? JSON.parse(text) : null, setCookie };
}

const email = `smoke${Date.now()}@example.com`;
const reg = await call("POST", "/auth/register", { body: { email, password: "Password123!", name: "Smoke" } });
console.log(`   Set-Cookie: ${reg.setCookie}`);
const token = reg.json.data.accessToken;
await call("POST", "/auth/register", { body: { email: email.toUpperCase(), password: "Password123!" } });
await call("POST", "/auth/login", { body: { email, password: "wrong" } });
await call("POST", "/auth/login", { body: { email, password: "Password123!" } });
await call("POST", "/auth/register", { body: { email: "bad", password: "short" } });
await call("GET", "/auth/profile");
await call("GET", "/auth/profile", { token: "garbage" });
await call("GET", "/auth/profile", { token });
await call("PATCH", "/auth/profile", { token, body: {} });
await call("PATCH", "/auth/profile", { token, body: { name: "Renamed", avatarUrl: null } });
await call("GET", "/user-settings/me", { token });
await call("PATCH", "/user-settings/me", { token, body: { theme: "DARK", temperatureUnit: "FAHRENHEIT" } });
await call("PATCH", "/user-settings/me", { token, body: { theme: "PURPLE" } });
await call("PATCH", "/user-settings/me", { token, body: { animateCharts: "true" } });
const fav = await call("POST", "/favorites/me", {
  token,
  body: { locationId: "tbilisi", locationName: "Tbilisi", country: "Georgia", latitude: 41.69, longitude: 44.8 },
});
await call("POST", "/favorites/me", { token, body: { locationId: "tbilisi", locationName: "Tbilisi" } });
await call("PATCH", `/favorites/me/${fav.json.data.id}/pin`, { token, body: { isPinned: true } });
await call("PATCH", "/favorites/me/not-a-cuid/pin", { token, body: { isPinned: "yes" } });
await call("GET", "/favorites/me", { token });
await call("POST", "/search-history/me", { token, body: { query: "Tbilisi", locationName: "Tbilisi" } });
await call("POST", "/search-history/me", { token, body: { query: "tbilisi" } });
await call("GET", "/search-history/me?limit=12", { token });
await call("GET", "/search-history/me?limit=abc", { token });
await call("GET", "/locations/autocomplete?q=Tbil", { token });
await call("GET", "/locations/suggestions?limit=3", { token });
await call("POST", "/locations/resolve", { token, body: {} });
await call("POST", "/locations/resolve", { token, body: { q: "Tbilisi" } });
await call("GET", "/weather/current?location=Tbilisi", { token });
await call("GET", "/weather/hourly?location=Tbilisi&hours=24", { token });
await call("GET", "/weather/daily?location=Tbilisi&days=7", { token });
await call("GET", "/weather/alerts?location=Tbilisi", { token });
await call("GET", "/weather/air-quality?location=Tbilisi", { token });
await call("GET", "/weather/map-config", { token });
await call("GET", "/weather/current", { token });
await call("GET", "/weather/historical?location=Tbilisi&startDate=2026-09-10&endDate=2026-09-01", { token });
await call("POST", "/notifications/me/sync?location=Tbilisi", { token });
await call("GET", "/notifications/me", { token });
await call("PATCH", "/notifications/me/read-all", { token });
await call("DELETE", "/notifications/me/read", { token });
await call("GET", "/users", { token });
await call("POST", "/users", { token, body: { email: "x@example.com" } });
await call("GET", "/nope");
await call("POST", "/auth/refresh", { useCookie: true });
await call("POST", "/auth/refresh", { body: { refreshToken: reg.json.data.refreshToken } });
await call("POST", "/auth/refresh", {});
await call("POST", "/auth/logout", { useCookie: true });
await call("DELETE", `/favorites/me/${fav.json.data.id}`, { token });
await call("DELETE", "/search-history/me", { token });
