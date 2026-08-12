export type LocationSuggestion = {
  id: string;
  label: string;
  name: string;
  country: string | null;
  admin1: string | null;
  latitude: number;
  longitude: number;
  type: string;
  weatherQuery: string;
};

export type SearchHistoryEntry = {
  id: string;
  userId: string;
  query: string;
  locationId: string | null;
  locationName: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  searchedAt: string;
};

export type ApiSuccess<T> = {
  data: T;
};
