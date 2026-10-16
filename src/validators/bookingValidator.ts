import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const bookingObject = z.object({
  property_id: z.uuid("Property ID must be a valid UUID"),
  guest_name: z.string().min(1, "Guest name is required"),
  guest_email: z.email("Valid email address is required"),
  check_in: z
    .string()
    .min(1, "Check-in date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Check in date is not valid YYYY-MM-DD"),
  check_out: z
    .string()
    .min(1, "Check-out date is required")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Check out date is not valid YYYY-MM-DD"),
  guests: z.number().int().min(1, "Guests must be greater than 0"),
  status: z
    .enum(
      ["pending", "confirmed", "cancelled"],
      'Invalid status. Must be one of: "pending", "confirmed", "cancelled".',
    )
    .optional(),
});

const dateOrder = {
  message: "Check in can not be later than check out",
  path: ["check_in"],
};

const bookingSchema = bookingObject.refine(
  (data) => data.check_in <= data.check_out,
  dateOrder,
);

const bookingOptionalSchema = bookingObject
  .partial()
  .refine(
    (data) =>
      !data.check_in || !data.check_out || data.check_in <= data.check_out,
    dateOrder,
  );

export const bookingValidator = zValidator(
  "json",
  bookingSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const bookingOptionalValidator = zValidator(
  "json",
  bookingOptionalSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
