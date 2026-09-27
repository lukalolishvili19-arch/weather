import { isAxiosError } from "axios";

type ApiErrorBody = {
  error?: {
    message?: string;
    details?: { formErrors?: string[]; fieldErrors?: Record<string, string[] | undefined> };
  };
};

/** The API's own message, preferring the specific field messages of a validation error. */
export function apiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null;
  const body = error.response?.data as ApiErrorBody | undefined;
  const details = body?.error?.details;
  const fieldMessages = Object.entries(details?.fieldErrors ?? {})
    .filter(([, messages]) => messages?.length)
    .map(([field, messages]) => `${field[0]?.toUpperCase()}${field.slice(1)}: ${messages![0]}`);
  const specific = [...(details?.formErrors ?? []), ...fieldMessages];
  if (specific.length) return specific.join(" ");
  return body?.error?.message ?? null;
}

/** Where to return after signing in: the page that asked for an account, else the dashboard. */
export function redirectTarget(state: unknown): string {
  if (
    typeof state === "object" &&
    state &&
    "from" in state &&
    typeof (state as { from?: unknown }).from === "string" &&
    (state as { from: string }).from.startsWith("/")
  ) {
    return (state as { from: string }).from;
  }
  return "/";
}
