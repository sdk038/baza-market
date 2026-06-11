import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Store, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { type DbProduct } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/seller/$id")({
  head: () => ({ meta: [{ title: "Магазин поставщика — Baza Market" }] }),
  component: SellerPage,
});

function SellerPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["seller", id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["seller-products", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("supplier_id", id).eq("is_active", true).order("created_at", { ascending: false });
      return (data ?? []) as DbProduct[];
    },
  });

  function contact() {
    if (!user) { navigate({ to: "/auth", search: { next: `/seller/${id}` } as any }); return; }
    navigate({ to: "/messages/$userId", params: { userId: id } });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8">
          <div className="absolute inset-0 -z-10 gradient-brand opacity-20" />
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-brand text-3xl text-white shadow-brand">
              <Store className="h-9 w-9" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-white/80">Поставщик</div>
              <h1 className="mt-1 text-3xl font-black md:text-4xl">{profile?.shop_name || profile?.full_name || "Магазин"}</h1>
              <div className="mt-1 text-sm text-muted-foreground">Товаров: {products.length}</div>
            </div>
            <button onClick={contact} className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[var(--brand-dark)] transition hover:scale-105">
              <MessageCircle className="h-4 w-4" /> Написать
            </button>
          </div>
        </div>

        <h2 className="mt-10 text-2xl font-black">Товары магазина</h2>
        {products.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
            У этого поставщика пока нет товаров.
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        <div className="mt-8">
          <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground">← Назад в каталог</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}