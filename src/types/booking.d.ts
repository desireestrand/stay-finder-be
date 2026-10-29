import type { Database } from "./database.types.js";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];

export type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

export type NewBooking = Omit<
  BookingInsert,
  "booking_id" | "created_at" | "total_price" | "price_per_night"
> & {
  property_id?: string;
  user_id?: string;
  status?: BookingStatus;
};

export type BookingBody = Omit<NewBooking, "property_id" | "user_id">;

export type BookingValidKey = keyof Booking;

export type BookingFilter = {
  from?: string;
  to?: string;
};
