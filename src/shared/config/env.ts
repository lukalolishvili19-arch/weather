const required = (value: string | undefined, fallback: string) => value?.trim() || fallback;

export const env = Object.freeze({
  apiUrl: required(
    import.meta.env.VITE_API_URL,
    import.meta.env.PROD ? "/api/v1" : "http://localhost:4000/api/v1",
  ),
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
});
