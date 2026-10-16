import * as z from "zod";
import { zValidator } from "@hono/zod-validator";
import { getValidatorError } from "../utils/validation.js";

const bookingParamSchema = z.object({
  id: z.uuid("Booking ID must be a valid UUID"),
});

const propertyAndBookingParamSchema = z.object({
  propertyId: z.uuid("Property ID must be a valid UUID"),
  bookingId: z.uuid("Booking ID must be a valid UUID"),
});

export const bookingParamValidator = zValidator(
  "param",
  bookingParamSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);

export const propertyAndBookingParamValidator = zValidator(
  "param",
  propertyAndBookingParamSchema,
  (result, c) => {
    if (!result.success) {
      return c.json(getValidatorError(result.error), 400);
    }
  },
);
