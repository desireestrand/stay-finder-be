import { Hono } from "hono";
import fs from "fs/promises";
import bookingValidator from "../validators/bookingValidator.js";

const bookingApp = new Hono({ strict: false });

bookingApp.get("/", async (c) => {
  try {
    const data: string = await fs.readFile("src/data/bookings.json", "utf8");
    const bookings: Booking[] = JSON.parse(data);

    return c.json(bookings);
  } catch (error) {
    return c.json([]);
  }
});

bookingApp.post("/", bookingValidator, async (c) => {
  try {
    const booking: NewBooking = c.req.valid("json");

    const data = await fs
      .readFile("src/data/bookings.json", "utf8")
      .catch(() => "[]");
    const bookings: NewBooking[] = JSON.parse(data);

    bookings.push(booking);
    await fs.writeFile(
      "src/data/bookings.json",
      JSON.stringify(bookings, null, 2),
    );

    return c.json(booking, 201);
  } catch (error) {
    return c.json({ error: "Failed to create booking" }, 400);
  }
});

bookingApp.put("/:id", bookingValidator, async (c) => {
  const id = c.req.param("id");

  try {
    const data = await fs
      .readFile("src/data/bookings.json", "utf8")
      .catch(() => "[]");
    let bookings: Booking[] = JSON.parse(data);

    const index = bookings.findIndex((b) => b.booking_id === id);

    if (index === -1) {
      return c.json({ error: "Booking not found" }, 404);
    }

    const body = c.req.valid("json") as NewBooking;

    const updatedBooking: Booking = {
      ...bookings[index],
      ...body,
      booking_id: id,
    };

    bookings[index] = updatedBooking;

    await fs.writeFile(
      "src/data/bookings.json",
      JSON.stringify(bookings, null, 2),
    );

    return c.json(updatedBooking);
  } catch (error) {
    return c.json({ error: "Failed to update booking" }, 400);
  }
});

bookingApp.delete("/:id", async (c) => {
  const id = c.req.param("id");

  try {
    const data = await fs
      .readFile("src/data/bookings.json", "utf8")
      .catch(() => "[]");
    let bookings: Booking[] = JSON.parse(data);

    const index = bookings.findIndex((b) => b.booking_id === id);

    if (index === -1) {
      return c.json({ error: "Booking not found" }, 404);
    }

    const deletedBooking = bookings.splice(index, 1)[0];

    await fs.writeFile(
      "src/data/bookings.json",
      JSON.stringify(bookings, null, 2),
    );

    return c.json({
      message: "Booking deleted successfully",
      booking: deletedBooking,
    });
  } catch (error) {
    return c.json({ error: "Failed to delete booking" }, 500);
  }
});

export default bookingApp;
