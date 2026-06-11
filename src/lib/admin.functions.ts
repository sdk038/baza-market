import { createServerFn } from "@tanstack/react-start";

const ADMIN_CODE = "Firik2010";

/** Создаёт или повышает пользователя до админа по секретному коду. */
export const createAdminAccount = createServerFn({ method: "POST" })
  .inputValidator((d: { email: string; password: string; code: string }) => d)
  .handler(async ({ data }) => {
    if (data.code !== ADMIN_CODE) {
      throw new Error("Неверный код администратора");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Try to find existing user by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let userId = list?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase())?.id;

    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: "Администратор", role: "admin" },
      });
      if (error || !created.user) throw new Error(error?.message ?? "Не удалось создать аккаунт");
      userId = created.user.id;
    } else {
      // ensure password matches
      await supabaseAdmin.auth.admin.updateUserById(userId, { password: data.password });
    }

    // Ensure admin role
    await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" as const }, { onConflict: "user_id,role" });

    return { ok: true };
  });

/** Возвращает id первого админа (для кнопок "связаться с админом"). */
export const getAdminId = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin")
    .limit(1)
    .maybeSingle();
  return { adminId: data?.user_id ?? null };
});