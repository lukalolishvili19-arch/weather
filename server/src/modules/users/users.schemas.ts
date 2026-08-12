import { z } from "zod";

export const userIdParamsSchema = z.object({
  id: z.string().cuid(),
});

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().trim().min(1).max(120).optional(),
  avatarUrl: z.string().url().max(2048).optional(),
  passwordHash: z.string().min(1).max(255).optional(),
});

export const updateUserSchema = z
  .object({
    email: z.string().email().max(255).optional(),
    name: z.string().trim().min(1).max(120).nullable().optional(),
    avatarUrl: z.string().url().max(2048).nullable().optional(),
    passwordHash: z.string().min(1).max(255).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
