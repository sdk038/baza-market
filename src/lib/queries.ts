import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { DbProduct, DbCategory } from "./mock-data";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as DbCategory[];
    },
  });
}

export function useProducts(opts: {
  category?: string | null;
  search?: string;
  maxPrice?: number;
  sort?: "new" | "price-asc" | "price-desc";
  limit?: number;
} = {}) {
  return useQuery({
    queryKey: ["products", opts],
    queryFn: async () => {
      let q = supabase.from("products").select("*").eq("is_active", true);
      if (opts.category) q = q.eq("category_id", opts.category);
      if (opts.search) q = q.ilike("title", `%${opts.search}%`);
      if (opts.maxPrice) q = q.lte("price", opts.maxPrice);
      if (opts.sort === "price-asc") q = q.order("price", { ascending: true });
      else if (opts.sort === "price-desc") q = q.order("price", { ascending: false });
      else q = q.order("created_at", { ascending: false });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as DbProduct[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as DbProduct | null;
    },
  });
}