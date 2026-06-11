import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Search, ShoppingCart, User, LogOut, LayoutDashboard, Store, MessageCircle, LogIn } from "lucide-react";
import { BazaLogo } from "./BazaLogo";
import { useCart } from "@/lib/cart-store";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const cart = useCart();
  const count = cart.reduce((s, i) => s + i.qty, 0);
  const { user, isAdmin, isSupplier, signOut } = useAuth();
  const navigate = useNavigate();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/catalog", search: { q: q || undefined } as any });
  };
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl animate-fade-in">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:gap-6 md:px-6">
        <Link to="/" className="flex items-center gap-2.5 shrink-0 transition hover:scale-[1.03]">
          <BazaLogo className="h-10 w-10 animate-float" />
          <div className="leading-none">
            <div className="text-lg font-black tracking-wide">BAZA</div>
            <div className="text-[10px] font-semibold tracking-[0.25em] text-gradient-brand">
              MARKET
            </div>
          </div>
        </Link>

        <form onSubmit={submit} className="hidden flex-1 md:block">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Искать товары, бренды, категории…"
              className="h-11 w-full rounded-full border border-border bg-secondary/40 pl-11 pr-4 text-sm outline-none transition focus:border-primary focus:bg-secondary"
            />
          </div>
        </form>

        <nav className="ml-auto flex items-center gap-1">
          <Link
            to="/catalog"
            className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground md:inline-flex"
          >
            Каталог
          </Link>
          {isSupplier && !isAdmin && (
            <Link to="/supplier" className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground md:inline-flex">
              <Store className="mr-1 inline h-4 w-4" /> Поставщику
            </Link>
          )}
          {isAdmin && (
            <Link to="/admin" className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground md:inline-flex">
              <LayoutDashboard className="mr-1 inline h-4 w-4" /> Админ
            </Link>
          )}
          {user && (
            <Link to="/messages" className="hidden rounded-full px-3 py-2 text-sm text-muted-foreground transition hover:bg-secondary hover:text-foreground md:inline-flex">
              <MessageCircle className="mr-1 inline h-4 w-4" /> Чат
            </Link>
          )}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 text-sm font-semibold text-foreground transition hover:border-primary hover:bg-secondary"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {(user.email ?? "Аккаунт").split("@")[0]}
                </span>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-xl animate-scale-in">
                  <div className="border-b border-border px-4 py-3 text-xs">
                    <div className="text-muted-foreground">Вы вошли как</div>
                    <div className="truncate font-semibold">{user.email}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-wider text-gradient-brand">
                      {isAdmin ? "Администратор" : isSupplier ? "Поставщик" : "Покупатель"}
                    </div>
                  </div>
                  <Link to="/account" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                    <User className="h-4 w-4" /> Мои заказы
                  </Link>
                  <Link to="/messages" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                    <MessageCircle className="h-4 w-4" /> Сообщения
                  </Link>
                  {isSupplier && !isAdmin && (
                    <Link to="/supplier" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                      <Store className="h-4 w-4" /> Панель поставщика
                    </Link>
                  )}
                  {isAdmin && (
                    <Link to="/admin" onClick={() => setMenuOpen(false)} className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-secondary">
                      <LayoutDashboard className="h-4 w-4" /> Админ-панель
                    </Link>
                  )}
                  <button onClick={async () => { await signOut(); setMenuOpen(false); router.invalidate(); navigate({ to: "/" }); }} className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-sm text-destructive hover:bg-secondary">
                    <LogOut className="h-4 w-4" /> Выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-3 text-sm font-semibold transition hover:border-primary hover:bg-secondary md:px-4">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Войти</span>
            </Link>
          )}
          <Link
            to="/cart"
            className="relative inline-flex h-10 items-center gap-2 rounded-full gradient-brand px-4 text-sm font-semibold text-white shadow-brand transition hover:scale-[1.05] active:scale-95"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Корзина</span>
            {count > 0 && (
              <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-primary animate-pulse-brand">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>

      {/* mobile search */}
      <form onSubmit={submit} className="px-4 pb-3 md:hidden">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск по Baza Market"
            className="h-10 w-full rounded-full border border-border bg-secondary/40 pl-11 pr-4 text-sm outline-none"
          />
        </div>
      </form>
    </header>
  );
}