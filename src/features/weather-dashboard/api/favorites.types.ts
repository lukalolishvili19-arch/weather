export type Favorite = {
  id: string;
  userId: string;
  locationId: string;
  locationName: string;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateFavoritePayload = {
  locationId: string;
  locationName: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  isPinned?: boolean;
};

export type ApiSuccess<T> = {
  data: T;
};
