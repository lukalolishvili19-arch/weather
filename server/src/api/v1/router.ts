import { Router } from "express";

import { favoritesRouter } from "../../modules/favorites/favorites.routes.js";
import { authRouter } from "../../modules/auth/auth.routes.js";
import { healthRouter } from "../../modules/health/health.routes.js";
import { locationsRouter } from "../../modules/locations/locations.routes.js";
import { notificationsRouter } from "../../modules/notifications/notifications.routes.js";
import { searchHistoryRouter } from "../../modules/search-history/search-history.routes.js";
import { userSettingsRouter } from "../../modules/user-settings/user-settings.routes.js";
import { usersRouter } from "../../modules/users/users.routes.js";
import { weatherRouter } from "../../modules/weather/weather.routes.js";
import { requireAuth } from "../../middleware/require-auth.js";

export const v1Router = Router();

v1Router.use("/health", healthRouter);
v1Router.use("/auth", authRouter);

v1Router.use("/weather", requireAuth, weatherRouter);
v1Router.use("/locations", requireAuth, locationsRouter);
v1Router.use("/users", requireAuth, usersRouter);
v1Router.use("/favorites", requireAuth, favoritesRouter);
v1Router.use("/search-history", requireAuth, searchHistoryRouter);
v1Router.use("/notifications", requireAuth, notificationsRouter);
v1Router.use("/user-settings", requireAuth, userSettingsRouter);
