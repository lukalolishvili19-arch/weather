import { z } from "zod";

export const searchHistoryIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createSearchHistorySchema = z.object({
  userId: z.string().cuid(),
  query: z.string().trim().min(1).max(255),
  locationId: z.string().trim().min(1).max(120).optional(),
  locationName: z.string().trim().min(1).max(200).optional(),
  country: z.string().trim().min(1).max(120).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export const recordSearchHistorySchema = createSearchHistorySchema.omit({ userId: true });

export const updateSearchHistorySchema = z
  .object({
    query: z.string().trim().min(1).max(255).optional(),
    locationId: z.string().trim().min(1).max(120).nullable().optional(),
    locationName: z.string().trim().min(1).max(200).nullable().optional(),
    country: z.string().trim().min(1).max(120).nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const listSearchHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateSearchHistoryInput = z.infer<typeof createSearchHistorySchema>;
export type RecordSearchHistoryInput = z.infer<typeof recordSearchHistorySchema>;
export type UpdateSearchHistoryInput = z.infer<typeof updateSearchHistorySchema>;
