import { Hono } from "hono";
import * as db from "../database/booking.js";
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
import { requireAuth } from "../middleware/auth.js";
import type { User } from "@supabase/supabase-js";
import type { BookingBody, NewBooking } from "../types/booking.js";

const bookings = new Hono({ strict: false });

bookings.get("/me", requireAuth, async (c) => {
  try {
    const supabase = c.get("supabase");

    const user = c.get("user") as User;

    const myBookings = await db.getBookingsByUserId(supabase, user.id);

    return c.json(myBookings, 200);
  } catch (error) {
    return c.json({ error: "Failed to fetch your bookings" }, 500);
  }
});

bookings.get(
  "/properties/:propertyId",
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
      return c.json({ error: "Failed to fetch bookings" }, 500);
    }
  },
);

bookings.get("/:id", requireAuth, bookingParamValidator, async (c) => {
  try {
    const supabase = c.get("supabase");

    const { id } = c.req.valid("param");

    const booking = await db.getBookingById(supabase, id);

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    return c.json(booking);
  } catch (error) {
    return c.json({ error: "Failed to fetch booking" }, 500);
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

      const user = c.get("user") as User;

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
      return c.json({ error: "Failed to create booking" }, 400);
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
      return c.json({ error: "Failed to update booking" }, 400);
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

      const body: NewBooking = c.req.valid("json");

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
      return c.json({ error: "Failed to update booking" }, 400);
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
      return c.json({ error: "Failed to delete booking" }, 500);
    }
  },
);

export default bookings;