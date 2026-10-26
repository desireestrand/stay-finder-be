import { Hono } from "hono";
import * as db from "../database/bookings.js";
import {
  bookingValidator,
  bookingOptionalValidator,
} from "../validators/bookingValidator.js";
import { propertyParamValidator } from "../validators/propertyParamValidator.js";
import {
  bookingParamValidator,
  propertyAndBookingParamValidator,
} from "../validators/bookingParamValidator.js";
import { bookingQueryValidator } from "../validators/bookingQueryValidator.js";
import { requireAuth, getAuthUser } from "../middleware/auth.js";
import type { BookingBody, NewBooking } from "../types/booking.js";

const bookings = new Hono({ strict: false });

bookings.get("/me", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");
    const user = getAuthUser(c);

    const myBookings = await db.getBookingsByUserId(supabase, user.id);

    return c.json(myBookings, 200);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch your bookings";
    return c.json({ error: message }, 500);
  }
});

bookings.get(
  "/properties/:propertyId",
  requireAuth,
  propertyParamValidator,
  bookingQueryValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const { propertyId } = c.req.valid("param");
      const query = c.req.valid("query");

      const bookings = await db.getBookingsByPropertyId(
        supabase,
        propertyId,
        query,
      );

      return c.json(bookings);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to fetch bookings";
      return c.json({ error: message }, 500);
    }
  },
);

bookings.get("/:bookingId", requireAuth, bookingParamValidator, async (c) => {
  try {
    const supabase = c.get("supabase");
    const { bookingId } = c.req.valid("param");
    const booking = await db.getBookingById(supabase, bookingId);

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    return c.json(booking);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch booking";
    return c.json({ error: message }, 500);
  }
});

bookings.post(
  "/properties/:propertyId",
  requireAuth,
  propertyParamValidator,
  bookingValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const propertyId = c.req.param("propertyId");
      const body: BookingBody = c.req.valid("json");
      const user = getAuthUser(c);

      if (new Date(body.check_out) <= new Date(body.check_in)) {
        return c.json({ error: "Check-out must be after check-in" }, 400);
      }

      const booking = await db.createBooking(
        supabase,
        propertyId,
        {
          ...body,
          status: body.status ?? "pending",
        },
        user.id,
      );

      return c.json(booking, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create booking";
      return c.json({ error: message }, 400);
    }
  },
);

bookings.patch(
  "/properties/:propertyId/:bookingId",
  requireAuth,
  propertyAndBookingParamValidator,
  bookingOptionalValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const propertyId = c.req.param("propertyId");
      const bookingId = c.req.param("bookingId");
      const updates: Partial<BookingBody> = c.req.valid("json");

      if (updates.check_in && updates.check_out) {
        if (new Date(updates.check_out) <= new Date(updates.check_in)) {
          return c.json({ error: "Check-out must be after check-in" }, 400);
        }
      }

      const updatedBooking = await db.patchBooking(
        supabase,
        propertyId,
        bookingId,
        updates,
      );

      if (!updatedBooking) {
        return c.json({ error: "Booking not found" }, 404);
      }

      return c.json(updatedBooking);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update booking";
      return c.json({ error: message }, 400);
    }
  },
);

bookings.put(
  "/properties/:propertyId/:bookingId",
  requireAuth,
  propertyAndBookingParamValidator,
  bookingValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const propertyId = c.req.param("propertyId");
      const bookingId = c.req.param("bookingId");
      const body: BookingBody = c.req.valid("json");

      if (new Date(body.check_out) <= new Date(body.check_in)) {
        return c.json({ error: "Check-out must be after check-in" }, 400);
      }

      const updatedBooking = await db.updateBooking(
        supabase,
        propertyId,
        bookingId,
        body,
      );

      if (!updatedBooking) {
        return c.json({ error: "Booking not found" }, 404);
      }

      return c.json(updatedBooking);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to update booking";
      return c.json({ error: message }, 400);
    }
  },
);

bookings.delete(
  "/properties/:propertyId/:bookingId",
  requireAuth,
  propertyAndBookingParamValidator,
  async (c) => {
    try {
      const supabase = c.get("supabase");
      const propertyId = c.req.param("propertyId");
      const bookingId = c.req.param("bookingId");

      const deletedBooking = await db.deleteBooking(
        supabase,
        propertyId,
        bookingId,
      );

      if (!deletedBooking) {
        return c.json({ error: "Booking not found" }, 404);
      }

      return c.json(
        { message: "Booking deleted", booking: deletedBooking },
        200,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete booking";
      return c.json({ error: message }, 500);
    }
  },
);

export default bookings;
