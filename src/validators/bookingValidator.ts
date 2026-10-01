import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const bookingSchema = z.object({
  property_id: z.string().uuid("Property ID must be a valid UUID"),
  guest_name: z.string().min(1, "Guest name is required"),
  guest_email: z.string().email("Valid email address is required"),
  check_in: z.string().min(1, "Check-in date is required"),
  check_out: z.string().min(1, "Check-out date is required"),
  guests: z.number().int().min(1, "Guests must be greater than 0"),
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
});

const bookingOptionalSchema = bookingSchema.partial();

export const bookingValidator = zValidator("json", bookingSchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.issues }, 400);
  }
});

export const bookingOptionalValidator = zValidator("json", bookingOptionalSchema, (result, c) => {
  if (!result.success) {
    return c.json({ errors: result.error.issues }, 400);
  }
});