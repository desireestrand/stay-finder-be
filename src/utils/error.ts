import type { PostgrestError } from "@supabase/supabase-js";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public statusCode: ContentfulStatusCode,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function conflict(message: string, code = "CONFLICT") {
  return new AppError(409, code, message);
}

export function badRequest(message: string, code = "BAD_REQUEST") {
  return new AppError(400, code, message);
}

export function notFound(resource = "Resource", code = "NOT_FOUND") {
  return new AppError(404, code, `${resource} not found`);
}

export function forbidden(message = "Forbidden", code = "FORBIDDEN") {
  return new AppError(403, code, message);
}

function readConstraintName(message: string): string | null {
  const match = message.match(/constraint "([^"]+)"/);
  return match ? match[1] : null;
}

const CONSTRAINT_MESSAGES: Record<string, string> = {
  check_out_after_check_in: "Check-out must be after check-in",
  bookings_guests_check: "Guests must be greater than 0",
  bookings_status_check:
    'Invalid status. Must be one of: "pending", "confirmed", "cancelled".',
  properties_price_per_night_check: "Price must be greater than 0",
  properties_max_guests_check: "Max guests must be greater than 0",
};

export function mapDbError(error: PostgrestError): AppError {
  switch (error.code) {
    case "23P01":
      return conflict(
        "The property is already booked for the selected dates",
        "BOOKING_OVERLAP",
      );

    case "23505":
      return conflict("This record already exists", "UNIQUE_VIOLATION");

    case "23514": {
      const name = readConstraintName(error.message);
      return badRequest(
        (name && CONSTRAINT_MESSAGES[name]) || "A value breaks a database rule",
        "CHECK_VIOLATION",
      );
    }

    case "23503":
      return notFound("Related record", "FOREIGN_KEY_VIOLATION");

    case "23502":
      return badRequest("A required field is missing", "NOT_NULL_VIOLATION");

    case "22P02":
    case "22007":
    case "22008":
    case "22003":
      return badRequest("A value has an invalid format", "INVALID_FORMAT");

    case "42501":
      return forbidden("You are not allowed to do this", "FORBIDDEN");

    case "PGRST116":
      return notFound("Record", "NOT_FOUND");

    default:
      console.error("Unhandled database error:", error);
      return new AppError(500, "INTERNAL_ERROR", "Database error");
  }
}
