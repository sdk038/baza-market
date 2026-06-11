import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, Plus, Package, ShoppingBag } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCategories } from "@/lib/queries";
import { formatPrice, type DbProduct } from "@/lib/mock-data";

const STATUSES = ["new", "processing", "shipped", "delivered", "cancelled"] as const;
const STATUS_LABEL: Record<string, string> = { new: "Новый", processing: "В обработке", shipped: "Отправлен", delivered: "Доставлен", cancelled: "Отменён" };

export const Route = createFileRoute("/supplier")({
  head: () => ({ meta: [{ title: "Панель поставщика — Baza Market" }] }),
  component: SupplierPanel,
});

function SupplierPanel() {
  const { user, loading, isSupplier, isAdmin } = useAuth();
  const [tab, setTab] = useState<"products" | "orders">("products");

  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Войдите, чтобы продолжить</h1>
          <Link to="/auth" search={{ next: "/supplier" } as any} className="mt-6 inline-block rounded-full gradient-brand px-6 py-3 text-sm font-bold text-white">Войти</Link>
        </main>
      </div>
    );
  }
  if (!isSupplier && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto max-w-md px-4 py-24 text-center">
          <h1 className="text-2xl font-black">Нет доступа</h1>
          <p className="mt-2 text-sm text-muted-foreground">Эта страница доступна только поставщикам. Зарегистрируйтесь как поставщик.</p>
        </main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6">
        <h1 className="text-3xl font-black md:text-4xl">Панель поставщика</h1>
        <div className="mt-6 flex gap-2 border-b border-border">
          <Tab active={tab === "products"} onClick={() => setTab("products")} icon={<Package className="h-4 w-4" />}>Товары</Tab>
          <Tab active={tab === "orders"} onClick={() => setTab("orders")} icon={<ShoppingBag className="h-4 w-4" />}>Заказы</Tab>
        </div>
        <div className="mt-6">{tab === "products" ? <ProductsTab userId={user.id} /> : <OrdersTab userId={user.id} />}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Tab({ active, onClick, children, icon }: { active: boolean; onClick: () => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
      {icon} {children}
    </button>
  );
}

function ProductsTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: products = [] } = useQuery({
    queryKey: ["supplier-products", userId],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("supplier_id", userId).order("created_at", { ascending: false });
      return (data ?? []) as DbProduct[];
    },
  });
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="inline-flex items-center gap-2 rounded-full gradient-brand px-5 py-2.5 text-sm font-bold text-white shadow-brand">
          <Plus className="h-4 w-4" /> Добавить товар
        </button>
      </div>
      {showForm && (
        <ProductForm
          userId={userId}
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["supplier-products"] }); qc.invalidateQueries({ queryKey: ["products"] }); }}
        />
      )}
      <div className="grid gap-3">
        {products.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">Нет товаров. Добавьте первый!</div>}
        {products.map((p) => (
          <div key={p.id} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
            <img src={p.image_url || ""} alt="" className="h-16 w-16 rounded-xl bg-secondary object-cover" />
            <div className="flex-1">
              <div className="font-semibold">{p.title}</div>
              <div className="text-xs text-muted-foreground">{formatPrice(p.price)} · в наличии: {p.stock} · доставка {p.delivery_days} дн.</div>
            </div>
            <button onClick={() => { setEditing(p); setShowForm(true); }} className="rounded-lg p-2 hover:bg-secondary"><Pencil className="h-4 w-4" /></button>
            <button
              onClick={async () => {
                if (!confirm("Удалить товар?")) return;
                await supabase.from("products").delete().eq("id", p.id);
                qc.invalidateQueries({ queryKey: ["supplier-products"] });
                qc.invalidateQueries({ queryKey: ["products"] });
              }}
              className="rounded-lg p-2 text-destructive hover:bg-secondary"
            ><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductForm({ userId, initial, onClose, onSaved }: { userId: string; initial: DbProduct | null; onClose: () => void; onSaved: () => void }) {
  const { data: categories = [] } = useCategories();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [price, setPrice] = useState(initial?.price.toString() ?? "");
  const [oldPrice, setOldPrice] = useState(initial?.old_price?.toString() ?? "");
  const [stock, setStock] = useState(initial?.stock.toString() ?? "10");
  const [deliveryDays, setDeliveryDays] = useState(initial?.delivery_days.toString() ?? "3");
  const [category, setCategory] = useState(initial?.category_id ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) throw error;
      const { data } = await supabase.storage.from("product-images").createSignedUrl(path, 60 * 60 * 24 * 365 * 5);
      setImageUrl(data?.signedUrl ?? "");
    } catch (e: any) {
      alert("Ошибка загрузки: " + e.message);
    } finally {
      setUploading(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = {
        supplier_id: userId,
        title,
        description: description || null,
        price: Number(price),
        old_price: oldPrice ? Number(oldPrice) : null,
        stock: Number(stock),
        delivery_days: Number(deliveryDays),
        category_id: category || null,
        image_url: imageUrl || null,
        is_active: true,
      };
      if (initial) {
        const { error } = await supabase.from("products").update(payload).eq("id", initial.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (e: any) {
      alert("Ошибка сохранения: " + e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} className="mb-6 grid gap-3 rounded-2xl border border-primary/40 bg-card p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-black">{initial ? "Редактировать товар" : "Новый товар"}</h3>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Отмена</button>
      </div>
      <Input label="Название" value={title} onChange={setTitle} required />
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Описание</label>
        <textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Цена ₽" type="number" value={price} onChange={setPrice} required />
        <Input label="Старая цена ₽ (опц.)" type="number" value={oldPrice} onChange={setOldPrice} />
        <Input label="В наличии" type="number" value={stock} onChange={setStock} required />
        <Input label="Доставка, дней" type="number" value={deliveryDays} onChange={setDeliveryDays} required />
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Категория</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
          <option value="">— без категории —</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-semibold text-muted-foreground">Фото товара</label>
        <div className="flex items-center gap-3">
          {imageUrl && <img src={imageUrl} alt="" className="h-20 w-20 rounded-xl object-cover" />}
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-sm hover:border-primary">
            {uploading ? "Загрузка…" : imageUrl ? "Заменить фото" : "Загрузить фото"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])} />
          </label>
        </div>
      </div>
      <button disabled={busy || uploading} className="mt-2 w-full rounded-full gradient-brand py-3 text-sm font-bold text-white shadow-brand disabled:opacity-60">
        {busy ? "Сохранение…" : "Сохранить"}
      </button>
    </form>
  );
}

function Input({ label, value, onChange, type = "text", required }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary" />
    </div>
  );
}

function OrdersTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: orders = [] } = useQuery({
    queryKey: ["supplier-orders", userId],
    queryFn: async () => {
      // get product ids first
      const { data: prods } = await supabase.from("products").select("id").eq("supplier_id", userId);
      const pids = (prods ?? []).map((p) => p.id);
      if (pids.length === 0) return [];
      const { data: items } = await supabase.from("order_items").select("order_id").in("product_id", pids);
      const oids = Array.from(new Set((items ?? []).map((i) => i.order_id)));
      if (oids.length === 0) return [];
      const { data } = await supabase.from("orders").select("*, order_items(*)").in("id", oids).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="space-y-3">
      {orders.length === 0 && <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-muted-foreground">Заказов пока нет.</div>}
      {orders.map((o: any) => (
        <div key={o.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleString("ru-RU")}</div>
              <div className="font-semibold">{o.customer_name} · {o.phone}</div>
              <div className="text-xs text-muted-foreground">{o.address}</div>
            </div>
            <div className="text-right">
              <div className="font-black">{formatPrice(o.total)}</div>
              <select
                value={o.status}
                onChange={async (e) => {
                  await supabase.from("orders").update({ status: e.target.value as any }).eq("id", o.id);
                  qc.invalidateQueries({ queryKey: ["supplier-orders"] });
                }}
                className="mt-1 rounded-full border border-border bg-background px-3 py-1 text-xs"
              >
                {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-3 space-y-1 border-t border-border pt-3 text-sm">
            {o.order_items?.map((it: any) => (
              <div key={it.id} className="flex justify-between"><span>{it.product_title} × {it.qty}</span><span className="text-muted-foreground">{formatPrice(it.price * it.qty)}</span></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}