import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Truck, ShieldCheck, Zap, Tag } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { useCategories, useProducts } from "@/lib/queries";
import { getAdminId } from "@/lib/admin.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Baza Market — всё, что нужно в одном месте" },
      { name: "description", content: "Онлайн-маркетплейс Baza Market: электроника, одежда, товары для дома и многое другое с быстрой доставкой." },
      { property: "og:title", content: "Baza Market" },
      { property: "og:description", content: "Всё, что нужно — в одном месте." },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: categories = [] } = useCategories();
  const { data: products = [] } = useProducts({ limit: 8 });
  const navigate = useNavigate();
  const { user } = useAuth();
  const fetchAdminId = useServerFn(getAdminId);

  async function contactAdmin() {
    if (!user) {
      navigate({ to: "/auth", search: { next: "/" } as any });
      return;
    }
    const { adminId } = await fetchAdminId();
    if (!adminId) {
      alert("Администратор ещё не создан. Создайте аккаунт администратора во вкладке 'Админ' на странице входа.");
      return;
    }
    navigate({ to: "/messages/$userId", params: { userId: adminId } });
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-[var(--brand-blue)] opacity-30 blur-[120px] animate-float" />
            <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-[var(--brand-violet)] opacity-30 blur-[140px] animate-float delay-200" />
          </div>
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 md:py-24">
            <div className="flex flex-col justify-center animate-fade-in">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                <Zap className="h-3.5 w-3.5 text-[var(--brand-violet)]" />
                Сезонные скидки до −60%
              </span>
              <h1 className="mt-5 text-4xl font-black leading-[1.05] sm:text-5xl md:text-7xl">
                Всё, что нужно —{" "}
                <span className="text-gradient-brand animate-gradient-pan">в одном месте</span>
              </h1>
              <p className="mt-5 max-w-lg text-base text-muted-foreground md:text-lg">
                Тысячи проверенных товаров от лучших поставщиков. Быстрая доставка,
                безопасная оплата, удобный возврат.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  to="/catalog"
                  className="inline-flex items-center gap-2 rounded-full gradient-brand px-6 py-3.5 text-sm font-bold text-white shadow-brand transition hover:scale-[1.03] animate-pulse-brand"
                >
                  В каталог <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#popular"
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-6 py-3.5 text-sm font-semibold transition hover:border-primary"
                >
                  Популярное
                </a>
              </div>

              <div className="mt-10 grid max-w-md grid-cols-3 gap-4 text-sm">
                {[
                  { i: Truck, t: "Доставка от 1 дня" },
                  { i: ShieldCheck, t: "Безопасно" },
                  { i: Tag, t: "Лучшие цены" },
                ].map(({ i: Icon, t }) => (
                  <div key={t} className="flex flex-col items-start gap-2">
                    <Icon className="h-5 w-5 text-[var(--brand-violet)]" />
                    <span className="text-xs text-muted-foreground">{t}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero promo card */}
            <div className="relative animate-scale-in delay-200">
              <div className="relative overflow-hidden rounded-3xl border border-border bg-card/60 p-8 shadow-brand backdrop-blur">
                <div className="absolute inset-0 -z-10 gradient-brand opacity-20" />
                <div className="text-[11px] font-bold uppercase tracking-[0.3em] text-white/80">
                  Акция недели
                </div>
                <div className="mt-3 text-4xl font-black leading-tight md:text-5xl">
                  −40% <br /> на электронику
                </div>
                <p className="mt-3 max-w-xs text-sm text-white/70">
                  Наушники, смарт-часы, гаджеты для дома по сниженным ценам.
                </p>
                <Link
                  to="/catalog"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[var(--brand-dark)] transition hover:bg-white/90"
                >
                  Смотреть подборку <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORIES */}
        <section className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="mb-6 flex items-end justify-between">
            <h2 className="text-2xl font-black md:text-3xl">Категории</h2>
            <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground">
              Все →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-8">
            {categories.map((c) => (
              <Link
                key={c.id}
                to="/catalog"
                search={{ cat: c.id } as any}
                className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card/60 p-4 text-center transition hover:-translate-y-1 hover:border-primary/60"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-2xl transition group-hover:gradient-brand">
                  {c.emoji}
                </div>
                <div className="text-xs font-semibold">{c.name}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* POPULAR */}
        <section id="popular" className="mx-auto max-w-7xl px-4 py-10 md:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black md:text-3xl">Популярные товары</h2>
              <p className="mt-1 text-sm text-muted-foreground">Выбор покупателей этой недели</p>
            </div>
            <Link to="/catalog" className="text-sm text-muted-foreground hover:text-foreground">
              Все →
            </Link>
          </div>
          {products.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
              Пока нет товаров. Зарегистрируйтесь как поставщик и добавьте первые!
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {products.map((p, i) => (
                <div key={p.id} className="animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA become supplier */}
        <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-10 md:p-14">
            <div className="absolute inset-0 -z-10 gradient-brand opacity-25" />
            <div className="relative max-w-2xl">
              <h3 className="text-3xl font-black md:text-4xl">
                Станьте поставщиком Baza Market
              </h3>
              <p className="mt-3 text-white/80">
                Продавайте свои товары миллионам покупателей. Подключение за 1 день,
                удобная панель управления и аналитика.
              </p>
              <button onClick={contactAdmin} className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[var(--brand-dark)] transition hover:bg-white/90 hover:scale-105">
                Подать заявку <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
