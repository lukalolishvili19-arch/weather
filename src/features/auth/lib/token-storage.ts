const ACCESS_TOKEN_KEY = "skycast.accessToken";
const REFRESH_TOKEN_KEY = "skycast.refreshToken";

type ClearListener = () => void;
const clearListeners = new Set<ClearListener>();

export const tokenStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    clearListeners.forEach((listener) => listener());
  },

  onClear(listener: ClearListener) {
    clearListeners.add(listener);
    return () => {
      clearListeners.delete(listener);
    };
  },
};
