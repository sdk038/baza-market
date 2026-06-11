import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatPrice } from "@/lib/mock-data";
import { TrendingUp, Package, ShoppingBag, Users } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Админ-панель — Baza Market" }] }),
  component: AdminPanel,
});

function AdminPanel() {
  const { user, loading, isAdmin } = useAuth();
  const [tab, setTab] = useState<"stats" | "orders" | "products" | "users">("stats");

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Войдите как админ</h1>
          <Link to="/auth" search={{ next: "/admin" } as any} className="mt-6 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white">Войти</Link>
        </main>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Нет доступа</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Эта страница доступна только администраторам.
            <br/>Чтобы стать админом: в Lovable Cloud → таблица <code className="rounded bg-secondary px-1">user_roles</code> добавьте свою запись с ролью <code className="rounded bg-secondary px-1">admin</code>.
          </p>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black md:text-4xl">Админ-панель</h1>
        <div className="mt-6 flex gap-2 border-b border-border overflow-x-auto">
          <T t="stats" cur={tab} set={setTab} icon={<TrendingUp className="h-4 w-4" />}>Статистика</T>
          <T t="orders" cur={tab} set={setTab} icon={<ShoppingBag className="h-4 w-4" />}>Заказы</T>
          <T t="products" cur={tab} set={setTab} icon={<Package className="h-4 w-4" />}>Товары</T>
          <T t="users" cur={tab} set={setTab} icon={<Users className="h-4 w-4" />}>Пользователи</T>
        </div>
        <div className="mt-6">
          {tab === "stats" && <Stats />}
          {tab === "orders" && <Orders />}
          {tab === "products" && <Products />}
          {tab === "users" && <UsersTab />}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function T({ t, cur, set, children, icon }: any) {
  return (
    <button onClick={() => set(t)} className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${cur === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {icon}{children}
    </button>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [{ data: orders }, { data: products }, { data: users }] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("products").select("id, title, supplier_id"),
        supabase.from("profiles").select("id"),
      ]);
      const { data: items } = await supabase.from("order_items").select("product_title, qty");
      const popularity: Record<string, number> = {};
      (items ?? []).forEach((i: any) => { popularity[i.product_title] = (popularity[i.product_title] || 0) + i.qty; });
      const top = Object.entries(popularity).sort((a, b) => b[1] - a[1]).slice(0, 5);
      const total = (orders ?? []).reduce((s, o: any) => s + Number(o.total), 0);
      return {
        ordersCount: orders?.length ?? 0,
        revenue: total,
        productsCount: products?.length ?? 0,
        usersCount: users?.length ?? 0,
        top,
      };
    },
  });
  if (!data) return null;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Stat label="Заказов" value={data.ordersCount.toString()} />
        <Stat label="Доход" value={formatPrice(data.revenue)} />
        <Stat label="Товаров" value={data.productsCount.toString()} />
        <Stat label="Пользователей" value={data.usersCount.toString()} />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="text-lg font-black">Топ-5 популярных товаров</h3>
        <div className="mt-3 space-y-2">
          {data.top.length === 0 && <div className="text-sm text-muted-foreground">Нет данных</div>}
          {data.top.map(([title, qty]) => (
            <div key={title} className="flex justify-between border-b border-border pb-2 text-sm last:border-0">
              <span>{title}</span><span className="font-bold">{qty} шт.</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-black">{value}</div>
    </div>
  );
}

function Orders() {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-3">
      {orders.map((o: any) => (
        <div key={o.id} className="rounded-2xl border border-border bg-card p-4">
          <div className="flex flex-wrap justify-between gap-3 text-sm">
            <div>
              <div className="font-semibold">#{o.id.slice(0, 8)} · {o.customer_name}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ru-RU")} · {o.phone}</div>
            </div>
            <div className="text-right">
              <div className="font-black">{formatPrice(o.total)}</div>
              <select value={o.status} onChange={async (e) => {
                await supabase.from("orders").update({ status: e.target.value as any }).eq("id", o.id);
                qc.invalidateQueries({ queryKey: ["admin-orders"] });
              }} className="mt-1 rounded-full border border-border bg-background px-3 py-1 text-xs">
                {["new", "processing", "shipped", "delivered", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>
      ))}
      {orders.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">Заказов нет</div>}
    </div>
  );
}

function Products() {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  return (
    <div className="space-y-2">
      {products.map((p: any) => (
        <div key={p.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm">
          <div className="flex-1">
            <div className="font-semibold">{p.title}</div>
            <div className="text-xs text-muted-foreground">{formatPrice(p.price)} · в наличии: {p.stock}</div>
          </div>
          <button onClick={async () => {
            await supabase.from("products").update({ is_active: !p.is_active }).eq("id", p.id);
            qc.invalidateQueries({ queryKey: ["admin-products"] });
          }} className="rounded-full border border-border px-3 py-1 text-xs hover:border-primary">
            {p.is_active ? "Скрыть" : "Показать"}
          </button>
          <button onClick={async () => {
            if (!confirm("Удалить товар?")) return;
            await supabase.from("products").delete().eq("id", p.id);
            qc.invalidateQueries({ queryKey: ["admin-products"] });
          }} className="ml-2 rounded-full border border-destructive/40 px-3 py-1 text-xs text-destructive hover:bg-destructive/10">
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}

function UsersTab() {
  const { data: users = [] } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      return (profiles ?? []).map((p: any) => ({
        ...p,
        roles: (roles ?? []).filter((r: any) => r.user_id === p.id).map((r: any) => r.role),
      }));
    },
  });
  return (
    <div className="space-y-2">
      {users.map((u: any) => (
        <div key={u.id} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4 text-sm">
          <div>
            <div className="font-semibold">{u.full_name || "(без имени)"} {u.shop_name && <span className="text-muted-foreground">· {u.shop_name}</span>}</div>
            <div className="text-xs text-muted-foreground">{u.phone || "—"} · {u.id.slice(0, 8)}</div>
          </div>
          <div className="flex gap-1">
            {u.roles.map((r: string) => (
              <span key={r} className="rounded-full bg-secondary px-3 py-1 text-xs font-bold">{r}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}