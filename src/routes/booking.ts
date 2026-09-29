import { Hono } from "hono";
import * as db from "../database/booking.js";
import { bookingValidator } from "../validators/bookingValidator.js";
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

export default bookingApp;
