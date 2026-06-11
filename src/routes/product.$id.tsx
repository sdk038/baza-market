import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ShieldCheck, Truck, RotateCcw, ShoppingCart, MessageCircle, Store } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, PLACEHOLDER_IMG } from "@/lib/mock-data";
import { cartStore } from "@/lib/cart-store";
import { useProduct, useProducts } from "@/lib/queries";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/product/$id")({
  head: () => ({ meta: [{ title: "Товар — Baza Market" }] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: similarAll = [] } = useProducts({ category: product?.category_id ?? null, limit: 8 });
  const similar = similarAll.filter((p) => p.id !== id).slice(0, 4);
  const navigate = useNavigate();
  const { user } = useAuth();

  function contactSeller() {
    if (!product) return;
    if (!user) { navigate({ to: "/auth", search: { next: `/product/${id}` } as any }); return; }
    navigate({ to: "/messages/$userId", params: { userId: product.supplier_id } });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center text-muted-foreground">Загрузка…</div>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-2xl px-4 py-24 text-center">
          <h1 className="text-3xl font-black">Товар не найден</h1>
          <Link to="/catalog" className="mt-6 inline-block text-primary underline">Вернуться в каталог</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Главная</Link>
          {" / "}
          <Link to="/catalog" className="hover:text-foreground">Каталог</Link>
          {" / "}
          <span className="text-foreground">{product.title}</span>
        </nav>

        <div className="grid gap-10 md:grid-cols-2 animate-fade-in">
          <div className="overflow-hidden rounded-3xl border border-border bg-card animate-scale-in">
            <img src={product.image_url || PLACEHOLDER_IMG} alt={product.title} className="aspect-square w-full object-cover" />
          </div>
          <div className="animate-slide-up">
            <h1 className="mt-3 text-3xl font-black md:text-4xl">{product.title}</h1>
            <p className="mt-5 text-muted-foreground">{product.description}</p>

            <div className="mt-6 flex items-end gap-3">
              <div className="text-4xl font-black">{formatPrice(product.price)}</div>
              {product.old_price && (
                <div className="text-lg text-muted-foreground line-through">{formatPrice(product.old_price)}</div>
              )}
            </div>
            <div className="mt-2 text-sm text-[var(--brand-green)] font-semibold">
              В наличии: {product.stock} шт.
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              <Truck className="mr-1 inline h-4 w-4" /> Доставка за {product.delivery_days} дн.
            </div>

            <button
              onClick={() => cartStore.add(product.id)}
              disabled={product.stock <= 0}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full gradient-brand px-6 py-4 text-base font-bold text-white shadow-brand transition hover:scale-[1.01] md:w-auto"
            >
              <ShoppingCart className="h-5 w-5" /> {product.stock > 0 ? "В корзину" : "Нет в наличии"}
            </button>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to="/seller/$id"
                params={{ id: product.supplier_id }}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary"
              >
                <Store className="h-4 w-4" /> Магазин поставщика
              </Link>
              <button
                onClick={contactSeller}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold transition hover:border-primary"
              >
                <MessageCircle className="h-4 w-4" /> Связаться с продавцом
              </button>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
              {[
                { i: Truck, t: `Доставка ${product.delivery_days} дн.` },
                { i: ShieldCheck, t: "Гарантия качества" },
                { i: RotateCcw, t: "Возврат 14 дней" },
              ].map(({ i: Icon, t }) => (
                <div key={t} className="rounded-xl border border-border bg-card p-3">
                  <Icon className="h-4 w-4 text-[var(--brand-violet)]" />
                  <div className="mt-2 text-muted-foreground">{t}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {similar.length > 0 && (
          <section className="mt-20">
            <h2 className="mb-6 text-2xl font-black">Похожие товары</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {similar.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}