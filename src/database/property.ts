import type {
  SupabaseClient,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";
import type { PaginatedListResponse } from "../types/global.js";

const TABLE_NAME = "properties";

const SELECT_QUERY_LIST: PropertyValidKey[] = [
  "property_id",
  "title",
  "description",
  "city",
  "country",
  "price_per_night",
  "max_guests",
  "kind",
  "image_url",
  "created_at",
];

const SELECT_QUERY = SELECT_QUERY_LIST.join(", ");

const QUERY_ID = "property_id";
const QUERY_KIND = "kind";

function applyPropertyFilters(supabaseQuery: any, query: PropertyListQuery) {
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

  const startIndex = query.offset;
  const endIndex = query.offset + query.limit - 1;
  const ascending = query.sort_order === "asc";

  return supabaseQuery
    .order(query.sort_by, { ascending })
    .range(startIndex, endIndex);
}

export async function getProperties(
  supabase: SupabaseClient,
  query: PropertyListQuery,
): Promise<PaginatedListResponse<Property>> {
  let supabaseQuery = supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY, { count: "exact" });

  supabaseQuery = applyPropertyFilters(supabaseQuery, query);

  const { data, error, count } = await supabaseQuery;

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

export async function getPropertiesByKind(
  supabase: SupabaseClient,
  kind: PropertyKind,
  query: PropertyListQuery,
): Promise<PaginatedListResponse<Property>> {
  let supabaseQuery = supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY, { count: "exact" })
    .eq(QUERY_KIND, kind);

  supabaseQuery = applyPropertyFilters(supabaseQuery, query);

  const { data, error, count } = await supabaseQuery;

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

export async function getPropertyById(
  supabase: SupabaseClient,
  id: string,
): Promise<Property | null> {
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

export async function createProperty(
  supabase: SupabaseClient,
  property: NewProperty,
): Promise<Property> {
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
  supabase: SupabaseClient,
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
  supabase: SupabaseClient,
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

export async function deleteProperty(
  supabase: SupabaseClient,
  id: string,
): Promise<Property | null> {
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
