import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import { requireAuth } from "../../middleware/require-auth.js";
import {
  getProfile,
  login,
  logout,
  refresh,
  register,
  updateProfile,
} from "./auth.controller.js";
import {
  loginSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.schemas.js";

export const authRouter = Router();

authRouter.post("/register", validateRequest(registerSchema), register);
authRouter.post("/login", validateRequest(loginSchema), login);
authRouter.post("/refresh", refresh);
authRouter.post("/logout", logout);
authRouter.get("/profile", requireAuth, getProfile);
authRouter.patch("/profile", requireAuth, validateRequest(updateProfileSchema), updateProfile);
