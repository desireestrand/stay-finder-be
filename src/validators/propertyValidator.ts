import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";
import type { PropertyKind } from "../types/property.js";

const propertySchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
  price_per_night: z.number().int().positive("Price must be greater than 0"),
  max_guests: z.number().int().positive("Max guests must be greater than 0"),
  kind: z.enum<PropertyKind[]>(
    ["apartment", "villa", "cabin"],
    `Invalid kind. Must be one of: "apartment", "villa", "cabin".`,
  ),
  image_url: z.url("Image URL must be a valid URL").optional().nullable(),
});

const propertyOptionalSchema = propertySchema.partial();

export const propertyValidator = zValidator(
  "json",
  propertySchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const propertyOptionalValidator = zValidator(
  "json",
  propertyOptionalSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
