import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, Trash2, ArrowRight, CheckCircle2, Truck, MessageCircle } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useCart, cartStore } from "@/lib/cart-store";
import { formatPrice, type DbProduct } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getAdminId } from "@/lib/admin.functions";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Корзина — Baza Market" }] }),
  component: CartPage,
});

function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkout, setCheckout] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fetchAdminId = useServerFn(getAdminId);

  async function contactAdmin() {
    if (!user) return;
    const { adminId } = await fetchAdminId();
    if (adminId) navigate({ to: "/messages/$userId", params: { userId: adminId } });
  }

  const ids = cart.map((i) => i.id);
  const { data: dbProducts = [] } = useQuery({
    queryKey: ["cart-products", ids],
    queryFn: async () => {
      if (ids.length === 0) return [];
      const { data } = await supabase.from("products").select("*").in("id", ids);
      return (data ?? []) as DbProduct[];
    },
    enabled: ids.length > 0,
  });
  const items = cart
    .map((i) => ({ ...i, product: dbProducts.find((p) => p.id === i.id) }))
    .filter((i) => i.product) as { id: string; qty: number; product: DbProduct }[];

  const total = items.reduce((s, i) => s + (i.product!.price * i.qty), 0);
  const delivery = total > 0 ? (total > 5000 ? 0 : 390) : 0;
  const maxDeliveryDays = items.reduce((m, i) => Math.max(m, i.product.delivery_days), 0);
  const estDate = new Date(Date.now() + maxDeliveryDays * 86400000);
  const estStr = estDate.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });

  const submitOrder = async (form: HTMLFormElement) => {
    if (!user) {
      navigate({ to: "/auth", search: { next: "/cart" } as any });
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData(form);
      const { data: orderId, error } = await supabase.rpc("place_order", {
        p_customer_name: String(fd.get("name") || ""),
        p_phone: String(fd.get("phone") || ""),
        p_address: String(fd.get("address") || ""),
        p_payment_method: String(fd.get("pay") || "Картой"),
        p_total: total + delivery,
        p_delivery_days: maxDeliveryDays || 3,
        p_estimated_delivery: estDate.toISOString().slice(0, 10),
        p_items: items.map((i) => ({
          product_id: i.product.id,
          product_title: i.product.title,
          price: i.product.price,
          qty: i.qty,
        })),
      });
      if (error || !orderId) throw error ?? new Error("Не удалось создать заказ");
      cartStore.clear();
      setDone(true);
    } catch (e: any) {
      console.error("[checkout]", e);
      alert("Не удалось оформить заказ: " + (e?.message ?? e?.details ?? "неизвестная ошибка"));
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-xl px-4 py-24 text-center animate-fade-in">
          <CheckCircle2 className="mx-auto h-20 w-20 text-[var(--brand-green)] animate-scale-in" />
          <h1 className="mt-6 text-3xl font-black">Заказ оформлен!</h1>
          <p className="mt-2 text-muted-foreground">
            Ожидаемая доставка через <span className="font-bold text-foreground">{maxDeliveryDays} дн.</span> — к{" "}
            <span className="font-bold text-foreground">{estStr}</span>.
            <br /> Статус заказа доступен в личном кабинете.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link to="/account" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary">
              Мои заказы
            </Link>
            <button onClick={contactAdmin} className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary">
              <MessageCircle className="h-4 w-4" /> Связь с админом
            </button>
            <Link to="/messages" className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold hover:border-primary">
              <MessageCircle className="h-4 w-4" /> Чат с поставщиком
            </Link>
            <Link to="/" className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
              На главную <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-2xl px-4 py-24 text-center">
          <div className="text-6xl">🛍️</div>
          <h1 className="mt-4 text-3xl font-black">Корзина пуста</h1>
          <p className="mt-2 text-muted-foreground">Самое время выбрать что-нибудь интересное.</p>
          <Link to="/catalog" className="mt-6 inline-flex rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white shadow-brand">
            В каталог
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black md:text-4xl">
          {checkout ? "Оформление заказа" : "Корзина"}
        </h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-3">
            {!checkout
              ? items.map((i) => (
                  <div key={i.id} className="flex gap-4 rounded-2xl border border-border bg-card p-4">
                    <img src={i.product.image_url || ""} alt="" className="h-24 w-24 rounded-xl object-cover bg-secondary" />
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-start justify-between gap-3">
                        <Link to="/product/$id" params={{ id: i.id }} className="font-semibold hover:text-primary">
                          {i.product!.title}
                        </Link>
                        <button onClick={() => cartStore.remove(i.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-auto flex items-center justify-between">
                        <div className="inline-flex items-center gap-1 rounded-full border border-border">
                          <button onClick={() => cartStore.setQty(i.id, i.qty - 1)} className="flex h-8 w-8 items-center justify-center hover:bg-secondary rounded-l-full">
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-8 text-center text-sm font-bold">{i.qty}</span>
                          <button onClick={() => cartStore.setQty(i.id, i.qty + 1)} className="flex h-8 w-8 items-center justify-center hover:bg-secondary rounded-r-full">
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-lg font-black">{formatPrice(i.product!.price * i.qty)}</div>
                      </div>
                    </div>
                  </div>
                ))
              : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitOrder(e.currentTarget);
                  }}
                  className="space-y-4 rounded-2xl border border-border bg-card p-6"
                >
                  {!user && (
                    <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                      Чтобы оформить заказ, <Link to="/auth" search={{ next: "/cart" } as any} className="text-primary underline">войдите</Link> или зарегистрируйтесь.
                    </div>
                  )}
                  {[
                    { n: "name", l: "Имя", t: "text" },
                    { n: "phone", l: "Телефон", t: "tel" },
                    { n: "address", l: "Адрес доставки", t: "text" },
                  ].map((f) => (
                    <div key={f.n}>
                      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{f.l}</label>
                      <input
                        required
                        type={f.t}
                        name={f.n}
                        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-muted-foreground">Способ оплаты</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Наличными", "Картой"].map((p, idx) => (
                        <label key={p} className="flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background p-3 text-sm has-[:checked]:border-primary has-[:checked]:bg-secondary">
                          <input type="radio" name="pay" value={p} defaultChecked={idx === 1} />
                          {p}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-secondary/40 p-3 text-sm">
                    <Truck className="mr-1.5 inline h-4 w-4 text-[var(--brand-violet)]" />
                    Ожидаемая доставка: <span className="font-bold">{maxDeliveryDays} дн.</span> · к {estStr}
                  </div>
                  <button disabled={submitting} className="w-full rounded-full gradient-brand py-4 text-sm font-bold text-white shadow-brand disabled:opacity-60">
                    {submitting ? "Оформляем…" : `Подтвердить заказ · ${formatPrice(total + delivery)}`}
                  </button>
                </form>
              )}
          </div>

          <aside className="h-fit rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24">
            <h3 className="text-lg font-black">Итого</h3>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Товары ({items.reduce((s, i) => s + i.qty, 0)})</span>
                <span className="text-foreground">{formatPrice(total)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Доставка</span>
                <span className="text-foreground">{delivery === 0 ? "Бесплатно" : formatPrice(delivery)}</span>
              </div>
              {items.length > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Ожидается к</span>
                  <span className="text-foreground">{estStr} · {maxDeliveryDays} дн.</span>
                </div>
              )}
              <div className="my-3 border-t border-border" />
              <div className="flex justify-between text-lg font-black">
                <span>К оплате</span>
                <span>{formatPrice(total + delivery)}</span>
              </div>
            </div>
            {!checkout && (
              <button
                onClick={() => {
                  if (!user) {
                    navigate({ to: "/auth", search: { next: "/cart" } as any });
                    return;
                  }
                  setCheckout(true);
                }}
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand py-3.5 text-sm font-bold text-white shadow-brand transition hover:scale-[1.02] active:scale-95 animate-pulse-brand"
              >
                {user ? "Оформить заказ" : "Войти и оформить"} <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}