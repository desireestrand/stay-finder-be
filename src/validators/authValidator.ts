import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const authSchema = z.object({
  email: z.email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const authValidator = zValidator("json", authSchema, (result, c) => {
  if (!result.success) {
    return c.json(getValidatorError(result.error), 400);
  }
});
