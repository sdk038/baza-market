import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/mock-data";

const STATUS_LABEL: Record<string, string> = {
  new: "Новый",
  processing: "В обработке",
  shipped: "Отправлен",
  delivered: "Доставлен",
  cancelled: "Отменён",
};
const STATUS_COLOR: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400",
  processing: "bg-yellow-500/15 text-yellow-400",
  shipped: "bg-purple-500/15 text-purple-400",
  delivered: "bg-emerald-500/15 text-emerald-400",
  cancelled: "bg-red-500/15 text-red-400",
};

export const Route = createFileRoute("/account")({
  head: () => ({ meta: [{ title: "Мои заказы — Baza Market" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { user, loading } = useAuth();
  const { data: orders = [] } = useQuery({
    queryKey: ["my-orders", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("buyer_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Войдите, чтобы посмотреть заказы</h1>
          <Link to="/auth" search={{ next: "/account" } as any} className="mt-6 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white shadow-brand">Войти</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-4 py-10 md:px-6">
        <h1 className="text-3xl font-black md:text-4xl">Мои заказы</h1>
        <p className="mt-1 text-sm text-muted-foreground">{orders.length} заказов</p>
        <div className="mt-8 space-y-4">
          {orders.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">
              Заказов пока нет. <Link to="/catalog" className="text-primary underline">Перейти в каталог</Link>
            </div>
          )}
          {orders.map((o: any) => (
            <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">Заказ #{o.id.slice(0, 8)}</div>
                  <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ru-RU")}</div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_COLOR[o.status]}`}>{STATUS_LABEL[o.status]}</span>
              </div>
              <div className="mt-4 space-y-1 text-sm">
                {o.order_items?.map((it: any) => (
                  <div key={it.id} className="flex justify-between">
                    <span>{it.product_title} × {it.qty}</span>
                    <span className="text-muted-foreground">{formatPrice(it.price * it.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-sm">
                <div className="text-muted-foreground">
                  Доставка к <span className="font-semibold text-foreground">{o.estimated_delivery ? new Date(o.estimated_delivery).toLocaleDateString("ru-RU") : "—"}</span>
                </div>
                <div className="text-lg font-black">{formatPrice(o.total)}</div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}