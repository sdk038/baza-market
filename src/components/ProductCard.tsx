import { Link } from "@tanstack/react-router";
import { Truck, Plus } from "lucide-react";
import { type DbProduct, formatPrice, PLACEHOLDER_IMG } from "@/lib/mock-data";
import { cartStore } from "@/lib/cart-store";

export function ProductCard({ product }: { product: DbProduct }) {
  const discount =
    product.old_price && product.old_price > product.price
      ? Math.round(((product.old_price - product.price) / product.old_price) * 100)
      : 0;
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition duration-300 hover:-translate-y-2 hover:border-primary/60 hover:shadow-brand shadow-card">
      <Link
        to="/product/$id"
        params={{ id: product.id }}
        className="relative block aspect-square overflow-hidden bg-secondary/40"
      >
        <img
          src={product.image_url || PLACEHOLDER_IMG}
          alt={product.title}
          loading="lazy"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = PLACEHOLDER_IMG; }}
          className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
        />
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--brand-green)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            −{discount}%
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Truck className="h-3.5 w-3.5 text-[var(--brand-violet)]" />
          <span>Доставка {product.delivery_days} дн.</span>
        </div>
        <Link
          to="/product/$id"
          params={{ id: product.id }}
          className="line-clamp-2 text-sm font-medium leading-snug transition hover:text-primary"
        >
          {product.title}
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div>
            <div className="text-lg font-black tracking-tight">
              {formatPrice(product.price)}
            </div>
            {product.old_price && (
              <div className="text-xs text-muted-foreground line-through">
                {formatPrice(product.old_price)}
              </div>
            )}
          </div>
          <button
            onClick={() => cartStore.add(product.id)}
            aria-label="Добавить в корзину"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full gradient-brand text-white shadow-brand transition hover:scale-110"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}