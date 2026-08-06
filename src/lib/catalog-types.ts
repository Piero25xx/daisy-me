export type Category = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  palette: string;
  position: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  description: string;
  materials: string | null;
  care: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  category_id: string | null;
  image_url: string | null;
  hover_image_url: string | null;
  is_new: boolean;
  is_bestseller: boolean;
};

export type Variant = {
  id: string;
  product_id: string;
  size: string;
  color: string;
  color_hex: string | null;
  stock: number;
};

export type Review = {
  id: string;
  product_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  body: string;
  photo_url: string | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
};

export function formatPrice(cents: number): string {
  return `$${Math.round(cents / 100).toLocaleString("en-US")}`;
}
