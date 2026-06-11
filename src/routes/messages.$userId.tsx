import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/messages/$userId")({
  head: () => ({ meta: [{ title: "Сообщения — Baza Market" }] }),
  component: ChatPage,
});

function ChatPage() {
  const { userId } = Route.useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { next: `/messages/${userId}` } as any });
  }, [user, loading, navigate, userId]);

  const { data: peer } = useQuery({
    queryKey: ["peer", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("id, full_name, shop_name").eq("id", userId).maybeSingle();
      return data;
    },
  });

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", user?.id, userId],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      return data ?? [];
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const ch = supabase
      .channel(`chat-${user.id}-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m: any = payload.new;
        if ((m.sender_id === user.id && m.recipient_id === userId) || (m.sender_id === userId && m.recipient_id === user.id)) {
          qc.invalidateQueries({ queryKey: ["chat", user.id, userId] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, userId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user) return;
    setSending(true);
    const body = text.trim();
    setText("");
    await supabase.from("messages").insert({ sender_id: user.id, recipient_id: userId, body });
    qc.invalidateQueries({ queryKey: ["chat", user.id, userId] });
    setSending(false);
  }

  if (loading || !user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-6 animate-fade-in">
        <div className="flex items-center gap-3 border-b border-border pb-4">
          <Link to="/messages" className="rounded-full p-2 hover:bg-secondary"><ArrowLeft className="h-4 w-4" /></Link>
          <div className="flex h-11 w-11 items-center justify-center rounded-full gradient-brand text-white font-bold">
            {(peer?.shop_name || peer?.full_name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div className="font-black">{peer?.shop_name || peer?.full_name || "Пользователь"}</div>
            <div className="text-xs text-muted-foreground">{userId.slice(0, 8)}</div>
          </div>
        </div>

        <div ref={scrollRef} className="my-4 flex-1 space-y-2 overflow-y-auto rounded-2xl border border-border bg-card/40 p-4" style={{ minHeight: 420, maxHeight: "60vh" }}>
          {messages.length === 0 && <div className="py-16 text-center text-sm text-muted-foreground">Напишите первое сообщение 👋</div>}
          {messages.map((m: any) => {
            const mine = m.sender_id === user.id;
            return (
              <div key={m.id} className={`flex animate-fade-in ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${mine ? "gradient-brand text-white shadow-brand" : "bg-secondary"}`}>
                  <div>{m.body}</div>
                  <div className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={send} className="flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Напишите сообщение…"
            className="h-12 flex-1 rounded-full border border-border bg-card px-5 text-sm outline-none focus:border-primary"
          />
          <button disabled={sending || !text.trim()} className="inline-flex h-12 w-12 items-center justify-center rounded-full gradient-brand text-white shadow-brand disabled:opacity-50 hover:scale-105 transition">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </main>
    </div>
  );
}