import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { favoritesApi } from "../api/favorites-api";
import type { CreateFavoritePayload, Favorite } from "../api/favorites.types";

const FAVORITES_KEY = ["favorites", "me"] as const;

function sortFavorites(favorites: Favorite[]) {
  return [...favorites].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: favoritesApi.listMine,
    staleTime: 30_000,
  });
}

export function useFavoriteActions() {
  const queryClient = useQueryClient();

  const add = useMutation({
    mutationFn: (payload: CreateFavoritePayload) => favoritesApi.add(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<Favorite[]>(FAVORITES_KEY);

      const optimistic: Favorite = {
        id: `temp-${payload.locationId}`,
        userId: "me",
        locationId: payload.locationId,
        locationName: payload.locationName,
        country: payload.country ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        isPinned: payload.isPinned ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) => {
        if (current.some((item) => item.locationId === payload.locationId)) {
          return current;
        }
        return sortFavorites([optimistic, ...current]);
      });

      return { previous };
    },
    onError: (_error, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },
    onSuccess: (favorite) => {
      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) =>
        sortFavorites([
          favorite,
          ...current.filter(
            (item) => item.locationId !== favorite.locationId && !item.id.startsWith("temp-"),
          ),
        ]),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => favoritesApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<Favorite[]>(FAVORITES_KEY);
      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) =>
        current.filter((item) => item.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });

  const pin = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned: boolean }) =>
      favoritesApi.pin(id, isPinned),
    onMutate: async ({ id, isPinned }) => {
      await queryClient.cancelQueries({ queryKey: FAVORITES_KEY });
      const previous = queryClient.getQueryData<Favorite[]>(FAVORITES_KEY);
      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) =>
        sortFavorites(
          current.map((item) =>
            item.id === id
              ? { ...item, isPinned, updatedAt: new Date().toISOString() }
              : item,
          ),
        ),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(FAVORITES_KEY, context.previous);
      }
    },
    onSuccess: (favorite) => {
      queryClient.setQueryData<Favorite[]>(FAVORITES_KEY, (current = []) =>
        sortFavorites(current.map((item) => (item.id === favorite.id ? favorite : item))),
      );
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: FAVORITES_KEY });
    },
  });

  return { add, remove, pin };
}

export function favoriteWeatherQuery(favorite: Favorite): string {
  const name = favorite.locationName?.trim();
  if (name && !/^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/.test(name)) {
    return name;
  }
  if (favorite.latitude != null && favorite.longitude != null) {
    return `${favorite.latitude},${favorite.longitude}`;
  }
  return favorite.locationName || "Tbilisi";
}
