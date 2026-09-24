interface NewProperty {
  property_id?: string;
  title: string;
  description: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
}

interface Property extends NewProperty {
  property_id: string;
}