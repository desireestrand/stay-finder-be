import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.js";

const TABLE_NAME = "bookings";

const SELECT_QUERY_LIST = [
  "booking_id",
  "property_id",
  "guest_name",
  "guest_email",
  "check_in",
  "check_out",
  "guests",
  "status",
  "created_at",
] as const;

const SELECT_QUERY = SELECT_QUERY_LIST.join(", ");

const QUERY_ID = "booking_id";

export async function getBookings(query: BookingQuery): Promise<Booking[]> {
  let supabaseQuery = supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .order("created_at", { ascending: false });

  if (query?.from) {
    supabaseQuery = supabaseQuery.gte("check_in", query.from);
  }

  if (query?.to) {
    supabaseQuery = supabaseQuery.lte("check_in", query.to);
  }

  const { data, error } = await supabaseQuery;

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as Booking[]) ?? [];
}

export async function getBookingById(id: string): Promise<Booking | null> {
  const { data, error }: PostgrestSingleResponse<Booking | null> =
    await supabase
      .from(TABLE_NAME)
      .select(SELECT_QUERY)
      .eq(QUERY_ID, id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createBooking(booking: NewBooking): Promise<Booking> {
  const bookingToInsert = {
    ...booking,
    status: booking.status ?? "pending",
  };

  const { data, error }: PostgrestSingleResponse<Booking> = await supabase
    .from(TABLE_NAME)
    .insert(bookingToInsert)
    .select(SELECT_QUERY)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Booking could not be created");
  }

  return data;
}
