import { Hono } from "hono";
import * as db from "../database/booking.js";
import {
  bookingValidator,
  bookingOptionalValidator,
} from "../validators/bookingValidator.js";
import { bookingParamValidator } from "../validators/bookingParamValidator.js";
import { bookingQueryValidator } from "../validators/bookingQueryValidator.js";

const bookingApp = new Hono({ strict: false });

bookingApp.get("/", bookingQueryValidator, async (c) => {
  const query = c.req.valid("query");

  try {
    const bookings = await db.getBookings(query);
    return c.json(bookings);
  } catch (error) {
    return c.json({ error: "Failed to fetch bookings" }, 500);
  }
});

bookingApp.get("/:id", bookingParamValidator, async (c) => {
  try {
    const { id } = c.req.valid("param");

    const booking = await db.getBookingById(id);

    if (!booking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    return c.json(booking);
  } catch (error) {
    return c.json({ error: "Failed to fetch booking" }, 500);
  }
});

bookingApp.post("/", bookingValidator, async (c) => {
  try {
    const body: NewBooking = c.req.valid("json");

    if (new Date(body.check_out) <= new Date(body.check_in)) {
      return c.json({ error: "Check-out must be after check-in" }, 400);
    }

    const booking = await db.createBooking(body);

    return c.json(booking, 201);
  } catch (error) {
    return c.json({ error: "Failed to create booking" }, 400);
  }
});

bookingApp.patch(
  "/:id",
  bookingParamValidator,
  bookingOptionalValidator,
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const updates = c.req.valid("json");

      if (updates.check_in && updates.check_out) {
        if (new Date(updates.check_out) <= new Date(updates.check_in)) {
          return c.json({ error: "Check-out must be after check-in" }, 400);
        }
      }

      const updatedBooking = await db.patchBooking(id, updates);

      if (!updatedBooking) {
        return c.json({ error: "Booking not found" }, 404);
      }

      return c.json(updatedBooking);
    } catch (error) {
      return c.json({ error: "Failed to update booking" }, 400);
    }
  },
);

bookingApp.put("/:id", bookingParamValidator, bookingValidator, async (c) => {
  try {
    const { id } = c.req.valid("param");
    const body: NewBooking = c.req.valid("json");

    if (new Date(body.check_out) <= new Date(body.check_in)) {
      return c.json({ error: "Check-out must be after check-in" }, 400);
    }

    const updatedBooking = await db.updateBooking(id, body);

    if (!updatedBooking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    return c.json(updatedBooking);
  } catch (error) {
    return c.json({ error: "Failed to update booking" }, 400);
  }
});

bookingApp.delete("/:id", bookingParamValidator, async (c) => {
  try {
    const { id } = c.req.valid("param");

    const deletedBooking = await db.deleteBooking(id);

    if (!deletedBooking) {
      return c.json({ error: "Booking not found" }, 404);
    }

    return c.json({ message: "Booking deleted", booking: deletedBooking }, 200);
  } catch (error) {
    return c.json({ error: "Failed to delete booking" }, 500);
  }
});

export default bookingApp;
