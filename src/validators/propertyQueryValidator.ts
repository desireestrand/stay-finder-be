import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const propertyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  city: z.string().min(1).optional(),
  max_guests: z.coerce.number().int().min(1).optional(),
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  q: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[\p{L}\p{N}\s-]+$/u, "Search contains invalid characters")
    .optional(),
  sort_by: z
    .enum(["title", "city", "price_per_night", "created_at"])
    .default("created_at"),
  sort_order: z.enum(["asc", "desc"]).default("desc")
});

const propertyQueryValidator = zValidator(
  "query",
  propertyQuerySchema,
  (result, c) => {
    if (!result.success) {
      return c.json(
        {
          errors: result.error.issues
        },
        400
      );
    }
  }
);

export default propertyQueryValidator;