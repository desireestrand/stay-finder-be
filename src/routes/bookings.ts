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
import type { BookingBody } from "../types/booking.js";
import { handleRouteError } from "../utils/handleRouteError.js";

const bookings = new Hono({ strict: false });

bookings.get("/me", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");
    const user = getAuthUser(c);

    const myBookings = await db.getBookingsByUserId(supabase, user.id);

    return c.json(myBookings, 200);
  } catch (error) {
    return handleRouteError(c, error, "Failed to fetch your bookings");
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

      const propertyBookings = await db.getBookingsByPropertyId(
        supabase,
        propertyId,
        query,
      );

      return c.json(propertyBookings);
    } catch (error) {
      return handleRouteError(c, error, "Failed to fetch bookings");
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
    return handleRouteError(c, error, "Failed to fetch booking");
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
      const { propertyId } = c.req.valid("param");
      const body: BookingBody = c.req.valid("json");
      const user = getAuthUser(c);

      const booking = await db.createBooking(
        supabase,
        propertyId,
        { ...body },
        user.id,
      );

      return c.json(booking, 201);
    } catch (error) {
      return handleRouteError(c, error, "Failed to create booking");
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
      const { propertyId } = c.req.valid("param");
      const { bookingId } = c.req.valid("param");
      const updates: Partial<BookingBody> = c.req.valid("json");

      const updatedBooking = await db.patchBookingById(
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
      return handleRouteError(c, error, "Failed to update booking");
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
      const { propertyId } = c.req.valid("param");
      const { bookingId } = c.req.valid("param");
      const body: BookingBody = c.req.valid("json");

      const updatedBooking = await db.updateBookingById(
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
      return handleRouteError(c, error, "Failed to update booking");
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
      const { propertyId } = c.req.valid("param");
      const { bookingId } = c.req.valid("param");

      const deletedBooking = await db.deleteBookingById(
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
      return handleRouteError(c, error, "Failed to delete booking");
    }
  },
);

export default bookings;
