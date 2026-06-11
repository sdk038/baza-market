import { BazaLogo } from "./BazaLogo";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border/60 bg-card/40">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="flex items-center gap-2.5">
            <BazaLogo className="h-10 w-10" />
            <div>
              <div className="text-lg font-black">BAZA</div>
              <div className="text-[10px] font-semibold tracking-[0.25em] text-gradient-brand">
                MARKET
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Всё, что нужно — в одном месте. Тысячи товаров с быстрой доставкой.
          </p>
        </div>
        {[
          { t: "Покупателям", l: ["Как заказать", "Доставка", "Возврат", "Помощь"] },
          { t: "Поставщикам", l: ["Стать поставщиком", "Тарифы", "Документы"] },
          { t: "Компания", l: ["О нас", "Контакты", "Карьера", "Блог"] },
        ].map((c) => (
          <div key={c.t}>
            <h4 className="text-sm font-bold">{c.t}</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              {c.l.map((x) => (
                <li key={x} className="cursor-pointer transition hover:text-foreground">
                  {x}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border/60 py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Baza Market. Все права защищены.
      </div>
    </footer>
  );
}