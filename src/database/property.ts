import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase.js";
import type { PaginatedListResponse } from "../types/global.js";

const TABLE_NAME = "properties";

const SELECT_QUERY_LIST = [
  "property_id",
  "title",
  "description",
  "city",
  "country",
  "price_per_night",
  "max_guests",
  "image_url",
  "created_at",
] as const;

const SELECT_QUERY = SELECT_QUERY_LIST.join(", ");

const QUERY_ID = "property_id";

export async function getProperties(
  query: PropertyListQuery,
): Promise<PaginatedListResponse<Property>> {
  const startIndex = query.offset;
  const endIndex = query.offset + query.limit - 1;
  const ascending = query.sort_order === "asc";

  let supabaseQuery = supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY, { count: "exact" });

  if (query.city) {
    supabaseQuery = supabaseQuery.eq("city", query.city);
  }

  if (query.max_guests) {
    supabaseQuery = supabaseQuery.gte("max_guests", query.max_guests);
  }

  if (query.min_price !== undefined) {
    supabaseQuery = supabaseQuery.gte("price_per_night", query.min_price);
  }

  if (query.max_price !== undefined) {
    supabaseQuery = supabaseQuery.lte("price_per_night", query.max_price);
  }

  if (query.q) {
    const searchPattern = `%${query.q}%`;
    supabaseQuery = supabaseQuery.or(
      `title.ilike.${searchPattern},description.ilike.${searchPattern},city.ilike.${searchPattern}`,
    );
  }

  const { data, error, count } = await supabaseQuery
    .order(query.sort_by, { ascending })
    .range(startIndex, endIndex);

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data as unknown as Property[]) ?? [],
    count: count ?? 0,
    offset: query.offset,
    limit: query.limit,
  };
}

export async function getPropertyById(id: string): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
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

export async function createProperty(property: NewProperty): Promise<Property> {
  const { data, error }: PostgrestSingleResponse<Property> = await supabase
    .from(TABLE_NAME)
    .insert(property)
    .select(SELECT_QUERY)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Property could not be created");
  }

  return data;
}

export async function patchProperty(
  id: string,
  updates: Partial<NewProperty>,
): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq(QUERY_ID, id)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updateProperty(
  id: string,
  property: NewProperty,
): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .update(property)
      .eq(QUERY_ID, id)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deleteProperty(id: string): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .delete()
      .eq(QUERY_ID, id)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
