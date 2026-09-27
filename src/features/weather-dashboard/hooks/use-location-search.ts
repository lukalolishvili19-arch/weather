import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { useAuth } from "@/features/auth";

import { searchApi } from "../api/search-api";
import type { LocationSuggestion } from "../api/search.types";

export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useLocationAutocomplete(query: string, enabled = true) {
  const debounced = useDebouncedValue(query.trim(), 350);

  return useQuery({
    queryKey: ["locations", "autocomplete", debounced],
    queryFn: () => searchApi.autocomplete(debounced),
    enabled: enabled && debounced.length >= 2,
    staleTime: 60_000,
  });
}

export function useLocationSuggestions(query: string) {
  const trimmed = query.trim();
  const debounced = useDebouncedValue(trimmed, 350);

  return useQuery({
    queryKey: ["locations", "suggestions", debounced],
    queryFn: () => searchApi.suggestions(debounced || undefined),
    enabled: true,
    staleTime: 60_000,
  });
}

export function useSearchHistory(limit = 20) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ["search-history", "me", limit],
    queryFn: () => searchApi.listHistory(limit),
    enabled: isAuthenticated,
    staleTime: 30_000,
  });
}

export function useSearchHistoryActions() {
  const queryClient = useQueryClient();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["search-history", "me"] });

  const record = useMutation({
    mutationFn: searchApi.recordHistory,
    onSuccess: () => void invalidate(),
  });

  const remove = useMutation({
    mutationFn: searchApi.deleteHistoryItem,
    onSuccess: () => void invalidate(),
  });

  const clear = useMutation({
    mutationFn: searchApi.clearHistory,
    onSuccess: () => void invalidate(),
  });

  return { record, remove, clear };
}

export function suggestionToWeatherQuery(suggestion: LocationSuggestion): string {
  const named =
    suggestion.label?.trim() ||
    suggestion.weatherQuery?.trim() ||
    [suggestion.name, suggestion.country].filter(Boolean).join(", ");
  if (named && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(named)) {
    return named;
  }
  if (suggestion.name?.trim()) {
    return suggestion.country
      ? `${suggestion.name.trim()}, ${suggestion.country.trim()}`
      : suggestion.name.trim();
  }
  if (
    Number.isFinite(suggestion.latitude) &&
    Number.isFinite(suggestion.longitude)
  ) {
    return `${suggestion.latitude.toFixed(4)},${suggestion.longitude.toFixed(4)}`;
  }
  return suggestion.weatherQuery || "Tbilisi";
}
