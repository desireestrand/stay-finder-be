import type { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { AppError } from "./error.js";

export function handleRouteError(
  c: Context,
  error: unknown,
  fallbackMessage: string,
) {
  if (error instanceof AppError) {
    return c.json({ error: error.message, code: error.code }, error.statusCode);
  }

  if (error instanceof HTTPException) {
    return c.json({ error: error.message }, error.status);
  }

  console.error(`Unexpected error in ${c.req.method} ${c.req.path}:`, error);

  return c.json({ error: fallbackMessage }, 500);
}
