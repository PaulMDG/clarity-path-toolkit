import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

type Role = "admin" | "superadmin";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);
  if (error) throw new Error(error.message);
  if (!data?.some((r) => r.role === "admin" || r.role === "superadmin")) {
    throw new Error("Forbidden: admin access required");
  }
}

async function assertSuperadmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "superadmin");
  if (error) throw new Error(error.message);
  if (!data?.length) throw new Error("Forbidden: superadmin access required");
}

export const listAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.userId);

    const { data: roleRows, error: rolesErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rolesErr) throw new Error(rolesErr.message);

    const userIds = Array.from(new Set(roleRows?.map((r) => r.user_id) ?? []));
    const users = await Promise.all(
      userIds.map(async (id) => {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        const u = data?.user;
        const roles = (roleRows ?? [])
          .filter((r) => r.user_id === id)
          .map((r) => r.role as Role);
        return {
          id,
          email: u?.email ?? null,
          email_confirmed_at: u?.email_confirmed_at ?? null,
          last_sign_in_at: u?.last_sign_in_at ?? null,
          created_at: u?.created_at ?? null,
          roles,
        };
      }),
    );
    users.sort((a, b) => (a.email ?? "").localeCompare(b.email ?? ""));
    return { users };
  });

export const inviteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      email: z.string().email(),
      role: z.enum(["admin", "superadmin"]).default("admin"),
      autoConfirm: z.boolean().default(true),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.userId);

    // Try find existing
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = existing?.users.find((u) => u.email?.toLowerCase() === data.email.toLowerCase());

    if (!user) {
      const tempPassword = crypto.randomUUID() + "Aa1!";
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: tempPassword,
        email_confirm: data.autoConfirm,
      });
      if (error) throw new Error(error.message);
      user = created.user!;
    } else if (data.autoConfirm && !user.email_confirmed_at) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, { email_confirm: true });
    }

    const { error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: user.id, role: data.role });
    if (roleErr && !roleErr.message.includes("duplicate")) throw new Error(roleErr.message);

    return { ok: true, userId: user.id };
  });

export const confirmUserEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({
      userId: z.string().uuid(),
      role: z.enum(["admin", "superadmin"]),
      enabled: z.boolean(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.userId);
    if (data.enabled) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: data.userId, role: data.role });
      if (error && !error.message.includes("duplicate")) throw new Error(error.message);
    } else {
      // Prevent removing your own last superadmin
      if (data.role === "superadmin" && data.userId === context.userId) {
        const { data: supers } = await supabaseAdmin
          .from("user_roles")
          .select("user_id")
          .eq("role", "superadmin");
        if ((supers?.length ?? 0) <= 1) {
          throw new Error("Cannot remove the last superadmin");
        }
      }
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.userId)
        .eq("role", data.role);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const sendPasswordResetEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ email: z.string().email(), redirectTo: z.string().url().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: data.redirectTo ? { redirectTo: data.redirectTo } : undefined,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAdminUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ userId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperadmin(context.userId);
    if (data.userId === context.userId) throw new Error("You cannot delete your own account");

    // Block deleting the last superadmin
    const { data: supers } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "superadmin");
    const isLastSuper =
      supers?.some((s) => s.user_id === data.userId) && (supers?.length ?? 0) <= 1;
    if (isLastSuper) throw new Error("Cannot delete the last superadmin");

    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
