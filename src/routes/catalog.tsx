import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useProducts } from "@/lib/queries";

type Search = { q?: string; cat?: string };

export const Route = createFileRoute("/catalog")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    q: typeof s.q === "string" ? s.q : undefined,
    cat: typeof s.cat === "string" ? s.cat : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Каталог — Baza Market" },
      { name: "description", content: "Каталог товаров Baza Market: электроника, одежда, дом, спорт и многое другое." },
    ],
  }),
  component: Catalog,
});

function Catalog() {
  const { q, cat: catParam } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [sort, setSort] = useState<"new" | "price-asc" | "price-desc">("new");
  const PRICE_MAX = 2_000_000;
  const [maxPrice, setMaxPrice] = useState(PRICE_MAX);
  const { data: categories = [] } = useCategories();
  const { data: list = [], isLoading } = useProducts({
    category: catParam ?? null,
    search: q,
    maxPrice: maxPrice >= PRICE_MAX ? undefined : maxPrice,
    sort,
  });
  const setCat = (cat: string | null) =>
    navigate({ search: (prev: any) => ({ ...prev, cat: cat ?? undefined }) });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black md:text-4xl">
              {q ? `Поиск: «${q}»` : "Каталог"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">{list.length} товаров</p>
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-10 rounded-full border border-border bg-card px-4 text-sm outline-none"
          >
            <option value="new">Новинки</option>
            <option value="price-asc">Цена ↑</option>
            <option value="price-desc">Цена ↓</option>
          </select>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <aside className="space-y-6 rounded-2xl border border-border/60 bg-card/40 p-5 h-fit sticky top-24">
            <div>
              <h3 className="mb-3 text-sm font-bold">Категории</h3>
              <ul className="space-y-1.5 text-sm">
                <li>
                  <button
                    onClick={() => setCat(null)}
                    className={`w-full rounded-lg px-3 py-1.5 text-left transition ${!catParam ? "gradient-brand text-white" : "hover:bg-secondary"}`}
                  >
                    Все
                  </button>
                </li>
                {categories.map((c) => (
                  <li key={c.id}>
                    <button
                      onClick={() => setCat(c.id)}
                      className={`w-full rounded-lg px-3 py-1.5 text-left transition ${catParam === c.id ? "gradient-brand text-white" : "hover:bg-secondary"}`}
                    >
                      {c.emoji} {c.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold">Цена до</h3>
              <input
                type="range"
                min={1000}
                max={PRICE_MAX}
                step={1000}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-[var(--brand-violet)]"
              />
              <div className="mt-1 text-sm text-muted-foreground">
                до <span className="font-bold text-foreground">{maxPrice >= PRICE_MAX ? "∞" : maxPrice.toLocaleString("ru-RU") + " ₽"}</span>
              </div>
            </div>
          </aside>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {list.map((p, i) => (
              <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}>
                <ProductCard product={p} />
              </div>
            ))}
            {!isLoading && list.length === 0 && (
              <div className="col-span-full rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
                Ничего не найдено
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}