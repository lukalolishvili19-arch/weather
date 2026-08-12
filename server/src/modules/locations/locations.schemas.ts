import { z } from "zod";

export const autocompleteQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const suggestionsQuerySchema = z.object({
  q: z.preprocess(
    (value) => (value === "" || value === null || value === undefined ? undefined : value),
    z.string().trim().max(200).optional(),
  ),
  limit: z.coerce.number().int().min(1).max(24).default(12),
});

export const resolveLocationSchema = z
  .object({
    q: z.string().trim().min(1).max(200).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .refine(
    (value) =>
      Boolean(value.q) ||
      (value.latitude !== undefined && value.longitude !== undefined),
    { message: "Provide q or latitude+longitude" },
  );

export type AutocompleteQuery = z.infer<typeof autocompleteQuerySchema>;
export type SuggestionsQuery = z.infer<typeof suggestionsQuerySchema>;
export type ResolveLocationInput = z.infer<typeof resolveLocationSchema>;
