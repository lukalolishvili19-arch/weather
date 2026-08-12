import { z } from "zod";

export const favoriteIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createFavoriteSchema = z.object({
  userId: z.string().cuid(),
  locationId: z.string().trim().min(1).max(120),
  locationName: z.string().trim().min(1).max(120),
  country: z.string().trim().min(1).max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isPinned: z.boolean().optional(),
});

export const createFavoriteForUserSchema = createFavoriteSchema.omit({ userId: true });

export const updateFavoriteSchema = z
  .object({
    locationId: z.string().trim().min(1).max(120).optional(),
    locationName: z.string().trim().min(1).max(120).optional(),
    country: z.string().trim().min(1).max(120).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    isPinned: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const pinFavoriteSchema = z.object({
  isPinned: z.boolean(),
});

export type CreateFavoriteInput = z.infer<typeof createFavoriteSchema>;
export type CreateFavoriteForUserInput = z.infer<typeof createFavoriteForUserSchema>;
export type UpdateFavoriteInput = z.infer<typeof updateFavoriteSchema>;
export type PinFavoriteInput = z.infer<typeof pinFavoriteSchema>;
