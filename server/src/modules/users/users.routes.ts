import { Router } from "express";

import { validateRequest } from "../../middleware/validate-request.js";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "./users.controller.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamsSchema,
} from "./users.schemas.js";

export const usersRouter = Router();

usersRouter.get("/", listUsers);
usersRouter.post("/", validateRequest(createUserSchema), createUser);
usersRouter.get("/:id", validateRequest(userIdParamsSchema, "params"), getUser);
usersRouter.patch(
  "/:id",
  validateRequest(userIdParamsSchema, "params"),
  validateRequest(updateUserSchema),
  updateUser,
);
usersRouter.delete("/:id", validateRequest(userIdParamsSchema, "params"), deleteUser);
