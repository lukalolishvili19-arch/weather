const required = (value: string | undefined, fallback: string) => value || fallback;

export const env = Object.freeze({
  apiUrl: required(import.meta.env.VITE_API_URL, "http://localhost:4000/api/v1"),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
});
