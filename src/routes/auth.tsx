import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { createAdminAccount } from "@/lib/admin.functions";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  head: () => ({ meta: [{ title: "Вход — Baza Market" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const { next } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup" | "admin">("login");
  const [role, setRole] = useState<"buyer" | "supplier">("buyer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [shopName, setShopName] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const adminFn = useServerFn(createAdminAccount);

  useEffect(() => {
    if (user) navigate({ to: (next as any) || "/" });
  }, [user, next, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        if (password.length < 6) {
          throw new Error("Пароль должен быть не короче 6 символов");
        }
        if (role === "supplier" && !shopName.trim()) {
          throw new Error("Укажите название магазина");
        }
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: fullName, role, shop_name: role === "supplier" ? shopName : null },
          },
        });
        if (error) throw error;
        if (!data.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
          if (signInError) {
            setInfo("Аккаунт создан. Подтвердите email по ссылке из письма, затем войдите.");
            return;
          }
        }
      } else if (mode === "admin") {
        await adminFn({ data: { email, password, code: adminCode } });
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setInfo("Админ-аккаунт активирован.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setErr(e.message ?? "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto flex max-w-md flex-col px-4 py-16 animate-fade-in">
        <h1 className="text-3xl font-black">
          {mode === "login" ? "Вход" : mode === "signup" ? "Регистрация" : "Вход администратора"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "login" ? "Войдите в свой аккаунт Baza Market." : mode === "signup" ? "Создайте аккаунт покупателя или поставщика." : "Введите email, пароль и секретный код."}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-1 rounded-full border border-border bg-card p-1 text-xs font-semibold">
          {(["login", "signup", "admin"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setErr(null); setInfo(null); }}
              className={`rounded-full py-2 transition ${mode === m ? "gradient-brand text-white shadow-brand" : "text-muted-foreground hover:text-foreground"}`}
            >
              {m === "login" ? "Вход" : m === "signup" ? "Регистрация" : "Админ"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 animate-scale-in">
          {mode === "signup" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                {(["buyer", "supplier"] as const).map((r) => (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setRole(r)}
                    className={`rounded-xl border p-3 text-sm font-semibold transition ${role === r ? "border-primary bg-secondary" : "border-border"}`}
                  >
                    {r === "buyer" ? "Покупатель" : "Поставщик"}
                  </button>
                ))}
              </div>
              <Field label="Имя" value={fullName} onChange={setFullName} />
              {role === "supplier" && <Field label="Название магазина" value={shopName} onChange={setShopName} />}
            </>
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail} required />
          <Field label="Пароль" type="password" value={password} onChange={setPassword} required minLength={6} />
          {mode === "admin" && (
            <Field label="Секретный код админа" type="password" value={adminCode} onChange={setAdminCode} required />
          )}
          {err && <div className="rounded-xl bg-destructive/15 p-3 text-sm text-destructive">{err}</div>}
          {info && <div className="rounded-xl bg-[var(--brand-green)]/15 p-3 text-sm text-[var(--brand-green)]">{info}</div>}
          <button disabled={busy} className="w-full rounded-full gradient-brand py-3.5 text-sm font-bold text-white shadow-brand disabled:opacity-60">
            {busy ? "..." : mode === "login" ? "Войти" : mode === "signup" ? "Создать аккаунт" : "Войти как админ"}
          </button>
        </form>
        <Link to="/" className="mt-4 text-center text-xs text-muted-foreground hover:text-foreground">На главную</Link>
      </main>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required, minLength }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; minLength?: number }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      <input
        required={required}
        minLength={minLength}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:border-primary"
      />
      {minLength ? <p className="mt-1 text-[11px] text-muted-foreground">Минимум {minLength} символов</p> : null}
    </div>
  );
}