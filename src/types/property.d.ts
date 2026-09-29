interface Property {
  property_id: string;
  created_at: string;
  title: string;
  description: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  image_url?: string | null;
}

type NewProperty = Omit<Property, "property_id" | "created_at">;

type PropertySortBy = "title" | "city" | "price_per_night" | "created_at";
type SortOrder = "asc" | "desc";

type PropertyListQuery = {
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
