import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const bookingQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const bookingQueryValidator = zValidator("query", bookingQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.issues }, 400);
    }
});