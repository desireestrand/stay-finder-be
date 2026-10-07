import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const bookingQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export const bookingQueryValidator = zValidator("query", bookingQuerySchema, (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
});