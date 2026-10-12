import type { Database } from "./database.types.js";

export type PropertyKind = "apartment" | "villa" | "cabin";

export type Property = Database["public"]["Tables"]["properties"]["Row"];

type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];

export type NewProperty = Omit<
  PropertyInsert,
  "user_id" | "property_id" | "created_at"
> & {
  user_id?: string | null;
};

export type PropertyValidKey = keyof Property;

type PropertySortBy = "title" | "city" | "price_per_night" | "created_at";
type SortOrder = "asc" | "desc";

type PropertyListFilter = {
  limit: number;
  offset: number;
  city?: string;
  max_guests?: number;
  min_price?: number;
  max_price?: number;
  q?: string;
  sort_by: PropertySortBy;
  sort_order: SortOrder;
};

/* type PropertyKind = "apartment" | "villa" | "cabin";

interface Property {
  property_id: string;
  title: string;
  description: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  kind: PropertyKind;
  image_url?: string | null;
  user_id: string;
  created_at: string;
}

type NewProperty = Omit<Property, "property_id" | "user_id" | "created_at"> & {
  user_id?: string;
};

type PropertyValidKey = keyof Property

type PropertySortBy = "title" | "city" | "price_per_night" | "created_at";
type SortOrder = "asc" | "desc";

type PropertyListFilter = {
  limit: number;
  offset: number;
  city?: string;
  max_guests?: number;
  min_price?: number;
  max_price?: number;
  q?: string;
  sort_by: PropertySortBy;
  sort_order: SortOrder;
};
 */
