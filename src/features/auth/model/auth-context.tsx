import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";

import { authApi, type UpdateProfilePayload } from "../api/auth-api";
import { tokenStorage } from "../lib/token-storage";
import type { AuthUser } from "../model/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/** Cached per-user data that must not survive a sign-out or an account switch. */
const USER_QUERY_KEYS = ["favorites", "search-history", "notifications", "user-settings"] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const refreshProfile = useCallback(async () => {
    const profile = await authApi.getProfile();
    setUser(profile);
  }, []);

  const updateProfile = useCallback(async (payload: UpdateProfilePayload) => {
    const profile = await authApi.updateProfile(payload);
    setUser(profile);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const accessToken = tokenStorage.getAccessToken();
      const refreshToken = tokenStorage.getRefreshToken();

      if (!accessToken && !refreshToken) {
        if (!cancelled) setIsBootstrapping(false);
        return;
      }

      try {
        if (!accessToken && refreshToken) {
          const session = await authApi.refresh(refreshToken);
          tokenStorage.setTokens(session.accessToken, session.refreshToken);
          if (!cancelled) setUser(session.user);
        } else {
          const profile = await authApi.getProfile();
          if (!cancelled) setUser(profile);
        }
      } catch {
        tokenStorage.clear();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // A failed token refresh anywhere in the app ends the session and returns to guest mode.
  useEffect(() => tokenStorage.onClear(() => setUser(null)), []);

  const userId = user?.id ?? null;
  useEffect(() => {
    for (const key of USER_QUERY_KEYS) {
      queryClient.removeQueries({ queryKey: [key] });
    }
  }, [userId, queryClient]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login({ email, password });
    tokenStorage.setTokens(session.accessToken, session.refreshToken);
    setUser(session.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const session = await authApi.register({
      email,
      password,
      ...(name ? { name } : {}),
    });
    tokenStorage.setTokens(session.accessToken, session.refreshToken);
    setUser(session.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken() ?? undefined;
    try {
      await authApi.logout(refreshToken);
    } finally {
      tokenStorage.clear();
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isBootstrapping,
      login,
      register,
      logout,
      refreshProfile,
      updateProfile,
    }),
    [user, isBootstrapping, login, register, logout, refreshProfile, updateProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
