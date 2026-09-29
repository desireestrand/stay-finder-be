import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const propertyParamSchema = z.object({
  id: z.string().uuid("Property id must be a valid UUID")
});

export const propertyParamValidator = zValidator("param", propertyParamSchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.issues }, 400);
  }
});