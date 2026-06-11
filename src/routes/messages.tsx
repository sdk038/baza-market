import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Сообщения — Baza Market" }] }),
  component: InboxPage,
});

function InboxPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => { if (!loading && !user) navigate({ to: "/auth", search: { next: "/messages" } as any }); }, [user, loading, navigate]);

  const { data: conversations = [] } = useQuery({
    queryKey: ["inbox", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order("created_at", { ascending: false });
      const map = new Map<string, any>();
      (msgs ?? []).forEach((m: any) => {
        const peer = m.sender_id === user.id ? m.recipient_id : m.sender_id;
        if (!map.has(peer)) map.set(peer, m);
      });
      const peerIds = Array.from(map.keys());
      if (peerIds.length === 0) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name, shop_name").in("id", peerIds);
      return Array.from(map.entries()).map(([pid, last]) => ({
        peerId: pid,
        last,
        profile: (profs ?? []).find((p) => p.id === pid),
      }));
    },
    enabled: !!user,
  });

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-8 animate-fade-in">
        <h1 className="text-3xl font-black md:text-4xl">Сообщения</h1>
        <div className="mt-6 space-y-2">
          {conversations.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center text-muted-foreground">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 opacity-50" />
              Чатов пока нет. Напишите поставщику со страницы товара.
            </div>
          )}
          {conversations.map((c: any) => (
            <Link
              key={c.peerId}
              to="/messages/$userId"
              params={{ userId: c.peerId }}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition hover-lift"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-white font-black">
                {(c.profile?.shop_name || c.profile?.full_name || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="font-semibold">{c.profile?.shop_name || c.profile?.full_name || "Пользователь"}</div>
                <div className="truncate text-sm text-muted-foreground">{c.last.body}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(c.last.created_at).toLocaleDateString("ru-RU")}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}