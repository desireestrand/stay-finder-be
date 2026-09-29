type BookingStatus = "pending" | "confirmed" | "cancelled";

interface Booking {
  booking_id: string;
  property_id: string;
  guest_name: string;
  guest_email: string;
  check_in: string;
  check_out: string;
  guests: number;
  status: BookingStatus;
  created_at: string;
}

type NewBooking = Omit<Booking, "booking_id" | "created_at" | "status"> & {
  status?: BookingStatus;
};

type BookingQuery = {
  from?: string;
  to?: string;
};