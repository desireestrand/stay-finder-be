import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { BasicSupabaseClient } from "../types/supabase.js";
import type {
  Booking,
  BookingFilter,
  BookingBody,
  NewBooking,
  BookingInsert,
} from "../types/booking.js";
import { mapDbError } from "../utils/error.js";

const TABLE_NAME = "bookings";

const SELECT_QUERY = "booking_id, property_id, user_id, guest_name, guest_email, check_in, check_out, guests, price_per_night, total_price, status, created_at";

const QUERY_ID = "booking_id";
const QUERY_PROPERTY_ID = "property_id";

export async function getBookingsByUserId(
  supabase: BasicSupabaseClient,
  userId: string,
): Promise<Booking[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .eq("user_id", userId)
    .order("check_in", { ascending: true });

  if (error) {
    throw mapDbError(error);
  }

  return data ?? [];
}

export async function getBookingsByPropertyId(
  supabase: BasicSupabaseClient,
  propertyId: string,
  filters?: BookingFilter,
): Promise<Booking[]> {
  let query = supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .eq(QUERY_PROPERTY_ID, propertyId)
    .order("check_in", { ascending: false });

  if (filters?.from) {
    query = query.gte("check_in", filters.from);
  }

  if (filters?.to) {
    query = query.lte("check_in", filters.to);
  }

  const { data, error } = await query;

  if (error) {
    throw mapDbError(error);
  }

  return data ?? [];
}

export async function getBookingById(
  supabase: BasicSupabaseClient,
  bookingId: string,
): Promise<Booking | null> {
  const { data, error }: PostgrestSingleResponse<Booking | null> =
    await supabase
      .from(TABLE_NAME)
      .select(SELECT_QUERY)
      .eq(QUERY_ID, bookingId)
      .maybeSingle();

  if (error) {
    throw mapDbError(error);
  }

  return data;
}

export async function createBooking(
  supabase: BasicSupabaseClient,
  propertyId: string,
  booking: BookingBody,
  userId: string,
): Promise<Booking> {
  const newBooking: BookingInsert = {
    ...booking,
    property_id: propertyId,
    user_id: userId
  };

  const { data, error }: PostgrestSingleResponse<Booking> = await supabase
    .from(TABLE_NAME)
    .insert(newBooking)
    .select(SELECT_QUERY)
    .single();

  if (error) {
    throw mapDbError(error);
  }

  if (!data) {
    throw new Error("Booking could not be created");
  }

  return data;
}

export async function patchBookingById(
  supabase: BasicSupabaseClient,
  propertyId: string,
  bookingId: string,
  updates: Partial<BookingBody>,
): Promise<Booking | null> {
  const { data, error }: PostgrestSingleResponse<Booking | null> =
    await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq(QUERY_ID, bookingId)
      .eq(QUERY_PROPERTY_ID, propertyId)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw mapDbError(error);
  }

  return data;
}

export async function updateBookingById(
  supabase: BasicSupabaseClient,
  propertyId: string,
  bookingId: string,
  booking: Partial<BookingBody>,
): Promise<Booking | null> {
  const { data, error }: PostgrestSingleResponse<Booking | null> =
    await supabase
      .from(TABLE_NAME)
      .update(booking)
      .eq(QUERY_ID, bookingId)
      .eq(QUERY_PROPERTY_ID, propertyId)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw mapDbError(error);
  }

  return data;
}

export async function deleteBookingById(
  supabase: BasicSupabaseClient,
  propertyId: string,
  bookingId: string,
): Promise<Booking | null> {
  const { data, error }: PostgrestSingleResponse<Booking | null> =
    await supabase
      .from(TABLE_NAME)
      .delete()
      .eq(QUERY_ID, bookingId)
      .eq(QUERY_PROPERTY_ID, propertyId)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw mapDbError(error);
  }

  return data;
}
