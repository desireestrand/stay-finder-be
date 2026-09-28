interface NewProperty {
  title: string;
  description: string;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  image_url?: string | null;
}

interface Property extends NewProperty {
  id: string;
  created_at: string;
}