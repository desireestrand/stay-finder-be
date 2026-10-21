import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const propertyQuerySchema = z
  .object({
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
    sort_order: z.enum(["asc", "desc"]).default("desc"),
    start_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
    end_date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)")
      .optional(),
  })
  .refine(
    (val) => {
      if (
        (val.start_date && !val.end_date) ||
        (!val.start_date && val.end_date)
      ) {
        return false;
      }

      return true;
    },
    {
      message: "Both start_date and end_date must be provided together",
      path: ["end_date"],
    },
  )
  .refine(
    (val) => {
      if (!val.start_date) return true;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const start = new Date(val.start_date);
      start.setHours(0, 0, 0, 0);

      return start >= today;
    },
    {
      message: "Start date cannot be in the past",
      path: ["start_date"],
    },
  )
  .refine(
    (val) => {
      if (!val.start_date || !val.end_date) return true;

      return new Date(val.end_date) > new Date(val.start_date);
    },
    {
      message: "End date must be after start date",
      path: ["end_date"],
    },
  );

export const propertyQueryValidator = zValidator(
  "query",
  propertyQuerySchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
