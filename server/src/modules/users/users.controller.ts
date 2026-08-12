import type { RequestHandler } from "express";

import { asyncHandler } from "../../common/async-handler.js";
import { sendNoContent, sendSuccess } from "../../common/http.js";
import { usersService } from "./users.service.js";
import type { CreateUserInput, UpdateUserInput } from "./users.schemas.js";

export const listUsers: RequestHandler = asyncHandler(async (_request, response) => {
  const users = await usersService.list();
  sendSuccess(response, users);
});

export const getUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await usersService.getById(request.params.id as string);
  sendSuccess(response, user);
});

export const createUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await usersService.create(request.body as CreateUserInput);
  sendSuccess(response, user, 201);
});

export const updateUser: RequestHandler = asyncHandler(async (request, response) => {
  const user = await usersService.update(
    request.params.id as string,
    request.body as UpdateUserInput,
  );
  sendSuccess(response, user);
});

export const deleteUser: RequestHandler = asyncHandler(async (request, response) => {
  await usersService.remove(request.params.id as string);
  sendNoContent(response);
});
