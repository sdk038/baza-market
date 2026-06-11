export type DbProduct = {
  id: string;
  supplier_id: string;
  title: string;
  description: string | null;
  price: number;
  old_price: number | null;
  category_id: string | null;
  stock: number;
  image_url: string | null;
  delivery_days: number;
  is_active: boolean;
  created_at: string;
};

export type DbCategory = { id: string; name: string; emoji: string | null };

export const formatPrice = (n: number) =>
  new Intl.NumberFormat("ru-RU").format(Math.round(n)) + " ₽";

export const PLACEHOLDER_IMG =
  "https://images.unsplash.com/photo-1481437156560-3205f6a55735?auto=format&fit=crop&w=600&q=60";