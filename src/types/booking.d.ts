import type { Database } from "./database.types.js";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export type Booking = Database["public"]["Tables"]["bookings"]["Row"];

type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];

export type NewBooking = Omit<BookingInsert, "booking_id" | "created_at"> & {
  property_id?: string;
  user_id?: string;
  status?: BookingStatus;
};

type BookingBody = Omit<NewBooking, "property_id" | "user_id">;

export type BookingValidKey = keyof Booking;

export type BookingFilter = {
  from?: string;
  to?: string;
};

/* type BookingStatus = "pending" | "confirmed" | "cancelled";

interface Booking {
  booking_id: string;
  property_id: string;
  user_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: BookingStatus;
  created_at: string;
}

type NewBooking = Omit<Booking, "booking_id" | "user_id" | "status" | "created_at"> & {
    user_id?: string;
    status?: BookingStatus;
};

type BookingBody = Omit<NewBooking, "property_id" | "user_id">;

type BookingValidKey = keyof Booking;

type BookingFilter = {
  from?: string;
  to?: string;
}; */
