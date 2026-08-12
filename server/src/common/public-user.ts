import type { User, UserSettings } from "@prisma/client";

export type PublicUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  settings?: UserSettings | null;
};

export function toPublicUser(
  user: User & { settings?: UserSettings | null },
): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    ...(user.settings !== undefined ? { settings: user.settings } : {}),
  };
}
