import * as z from "zod";
import { zValidator } from "@hono/zod-validator";

const schema = z.object({
  property_id: z.string().min(1, "Property ID is required"),
  guest_name: z.string().min(1, "Guest name is required"),
  guest_email: z.string().email("Valid email is required"),
  check_in: z.string().min(1, "Check-in date is required"),
  check_out: z.string().min(1, "Check-out date is required"),
  guests: z.number().int().positive("Guests must be greater than 0"),
  booking_id: z.string().optional(),
  status: z.enum(["pending", "confirmed", "cancelled"]).optional(),
});

const bookingValidator = zValidator("json", schema, (result, c) => {
  if (!result.success) {
    return c.json(
      {
        errors: result.error.issues,
      },
      400,
    );
  }

  if (!result.data.booking_id) {
    result.data.booking_id = `booking_${Math.floor(
      1000 + Math.random() * 9000,
    )}`;
  }

  if (!result.data.status) {
    result.data.status = "pending";
  }
});

export default bookingValidator;