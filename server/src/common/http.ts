import type { Response } from "express";

export type ApiSuccessBody<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export function sendSuccess<T>(
  response: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>,
): void {
  const body: ApiSuccessBody<T> = meta ? { data, meta } : { data };
  response.status(statusCode).json(body);
}

export function sendNoContent(response: Response): void {
  response.status(204).send();
}
