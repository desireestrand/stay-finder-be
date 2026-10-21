import type { PostgrestSingleResponse } from "@supabase/supabase-js";
import type { PaginatedListResponse } from "../types/global.js";
import type { BasicSupabaseClient } from "../types/supabase.js";
import type {
  NewProperty,
  Property,
  PropertyKind,
  PropertyListFilter,
  PropertyValidKey,
} from "../types/property.js";

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
  "user_id",
  "created_at",
];

const SELECT_QUERY = SELECT_QUERY_LIST.join(", ");

const QUERY_ID = "property_id";
const QUERY_KIND = "kind";

type PropertyQuery = ReturnType<typeof selectProperties>;

function selectProperties(supabase: BasicSupabaseClient) {
  return supabase.from(TABLE_NAME).select(SELECT_QUERY, { count: "exact" });
}

async function getBookedPropertyIds(
  supabase: BasicSupabaseClient,
  startDate?: string,
  endDate?: string,
): Promise<string[]> {
  if (!startDate || !endDate) {
    return [];
  }

  const { data, error } = await supabase
    .from("booking_availability")
    .select("property_id")
    .lte("check_in", endDate)
    .gte("check_out", startDate);

  if (error) {
    throw new Error(error.message);
  }

  return [
    ...new Set(
      (data ?? [])
        .map((b) => b.property_id)
        .filter((id): id is string => id !== null),
    ),
  ];
}

function applyDateAvailabilityFilter(
  query: PropertyQuery,
  bookedPropertyIds: string[],
) {
  if (bookedPropertyIds.length > 0) {
    return query.not("property_id", "in", `(${bookedPropertyIds.join(",")})`);
  }

  return query;
}

function applyPropertyFilters(
  query: PropertyQuery,
  filters: PropertyListFilter,
) {
  if (filters.city) {
    query = query.eq("city", filters.city);
  }

  if (filters.max_guests) {
    query = query.gte("max_guests", filters.max_guests);
  }

  if (filters.min_price !== undefined) {
    query = query.gte("price_per_night", filters.min_price);
  }

  if (filters.max_price !== undefined) {
    query = query.lte("price_per_night", filters.max_price);
  }

  if (filters.q) {
    const searchPattern = `%${filters.q}%`;
    query = query.or(
      `title.ilike.${searchPattern},description.ilike.${searchPattern},city.ilike.${searchPattern}`,
    );
  }

  const startIndex = filters.offset;
  const endIndex = filters.offset + filters.limit - 1;
  const ascending = filters.sort_order === "asc";

  return query
    .order(filters.sort_by, { ascending })
    .range(startIndex, endIndex);
}

export async function getPropertiesByUserId(
  supabase: BasicSupabaseClient,
  userId: string,
): Promise<Property[]> {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select(SELECT_QUERY)
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data as unknown as Property[]) ?? [];
}

export async function getProperties(
  supabase: BasicSupabaseClient,
  filters: PropertyListFilter,
): Promise<PaginatedListResponse<Property>> {
  let query = selectProperties(supabase);

  const bookedPropertyIds = await getBookedPropertyIds(
    supabase,
    filters.start_date,
    filters.end_date,
  );

  query = applyDateAvailabilityFilter(query, bookedPropertyIds);

  const filteredQuery = applyPropertyFilters(query, filters);

  const { data, error, count } = await filteredQuery;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data as unknown as Property[]) ?? [],
    count: count ?? 0,
    offset: filters.offset,
    limit: filters.limit,
  };
}

export async function getPropertiesByKind(
  supabase: BasicSupabaseClient,
  kind: PropertyKind,
  filters: PropertyListFilter,
): Promise<PaginatedListResponse<Property>> {
  let query = selectProperties(supabase).eq(QUERY_KIND, kind);

  const bookedPropertyIds = await getBookedPropertyIds(
    supabase,
    filters.start_date,
    filters.end_date,
  );

  query = applyDateAvailabilityFilter(query, bookedPropertyIds);

  const filteredQuery = applyPropertyFilters(query, filters);

  const { data, error, count } = await filteredQuery;

  if (error) {
    throw new Error(error.message);
  }

  return {
    data: (data as unknown as Property[]) ?? [],
    count: count ?? 0,
    offset: filters.offset,
    limit: filters.limit,
  };
}

export async function getPropertyById(
  supabase: BasicSupabaseClient,
  propertyId: string,
): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .select(SELECT_QUERY)
      .eq(QUERY_ID, propertyId)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createProperty(
  supabase: BasicSupabaseClient,
  propertyBody: NewProperty,
): Promise<Property> {
  const { data, error }: PostgrestSingleResponse<Property> = await supabase
    .from(TABLE_NAME)
    .insert(propertyBody)
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

export async function patchPropertyById(
  supabase: BasicSupabaseClient,
  propertyId: string,
  updates: Partial<NewProperty>,
): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .update(updates)
      .eq(QUERY_ID, propertyId)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function updatePropertyById(
  supabase: BasicSupabaseClient,
  propertyId: string,
  property: NewProperty,
): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .update(property)
      .eq(QUERY_ID, propertyId)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function deletePropertyById(
  supabase: BasicSupabaseClient,
  propertyId: string,
): Promise<Property | null> {
  const { data, error }: PostgrestSingleResponse<Property | null> =
    await supabase
      .from(TABLE_NAME)
      .delete()
      .eq(QUERY_ID, propertyId)
      .select(SELECT_QUERY)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
