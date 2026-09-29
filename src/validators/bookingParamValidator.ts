import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const bookingParamSchema = z.object({
  id: z.string().uuid("Booking ID must be a valid UUID"),
});

export const bookingParamValidator = zValidator("param", bookingParamSchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.issues }, 400);
  }
});