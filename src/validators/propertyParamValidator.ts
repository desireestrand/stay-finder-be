import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const propertyParamSchema = z.object({
  propertyId: z.uuid("Property id must be a valid UUID"),
});

const propertyKindParamSchema = z.object({
  kind: z.enum(["apartment", "villa", "cabin"], {
    message: 'Invalid kind. Must be one of: "apartment", "villa", "cabin"',
  }),
});

export const propertyParamValidator = zValidator(
  "param",
  propertyParamSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const propertyKindParamValidator = zValidator(
  "param",
  propertyKindParamSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
