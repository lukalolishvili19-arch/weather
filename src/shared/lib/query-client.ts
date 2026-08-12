import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1_000,
      gcTime: 30 * 60 * 1_000,
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      networkMode: "online",
      structuralSharing: true,
    },
    mutations: {
      retry: 0,
      networkMode: "online",
    },
  },
});
