import { useSyncExternalStore } from "react";

type CartItem = { id: string; qty: number };
const KEY = "baza_cart_v1";
let cart: CartItem[] = [];
const listeners = new Set<() => void>();

function load() {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) cart = JSON.parse(raw);
  } catch {}
}
function persist() {
  if (typeof window !== "undefined") localStorage.setItem(KEY, JSON.stringify(cart));
  listeners.forEach((l) => l());
}
load();

export const cartStore = {
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  get() {
    return cart;
  },
  add(id: string) {
    const existing = cart.find((i) => i.id === id);
    if (existing) existing.qty += 1;
    else cart = [...cart, { id, qty: 1 }];
    persist();
  },
  setQty(id: string, qty: number) {
    if (qty <= 0) cart = cart.filter((i) => i.id !== id);
    else cart = cart.map((i) => (i.id === id ? { ...i, qty } : i));
    persist();
  },
  remove(id: string) {
    cart = cart.filter((i) => i.id !== id);
    persist();
  },
  clear() {
    cart = [];
    persist();
  },
};

export function useCart() {
  return useSyncExternalStore(
    cartStore.subscribe,
    () => cartStore.get(),
    () => [] as CartItem[],
  );
}