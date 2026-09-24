import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const propertyParamSchema = z.object({
  id: z.string().min(1, "Property id is required")
});

const propertyParamValidator = zValidator(
  "param",
  propertyParamSchema,
  (result, c) => {
    if (!result.success) {
      return c.json({ errors: result.error.issues }, 400);
    }
  }
);

export default propertyParamValidator;