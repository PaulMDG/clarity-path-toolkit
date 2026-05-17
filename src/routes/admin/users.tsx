import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, MailCheck, KeyRound, Trash2, UserPlus } from "lucide-react";
import { PageHeader, Card, Field, inputCls, StatusBadge } from "@/components/admin/AdminUI";
import { useAuth } from "@/hooks/useAuth";
import {
  listAdminUsers,
  inviteAdminUser,
  confirmUserEmail,
  setUserRole,
  sendPasswordResetEmail,
  deleteAdminUser,
} from "@/lib/users.functions";

export const Route = createFileRoute("/admin/users")({
  component: UsersPage,
});

function UsersPage() {
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const fetchUsers = useServerFn(listAdminUsers);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users"] });

  const invite = useServerFn(inviteAdminUser);
  const confirm = useServerFn(confirmUserEmail);
  const setRole = useServerFn(setUserRole);
  const reset = useServerFn(sendPasswordResetEmail);
  const del = useServerFn(deleteAdminUser);

  const mInvite = useMutation({
    mutationFn: (vars: { email: string; role: "admin" | "superadmin" }) =>
      invite({ data: { email: vars.email, role: vars.role, autoConfirm: true } }),
    onSuccess: () => { toast.success("Admin invited"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mConfirm = useMutation({
    mutationFn: (userId: string) => confirm({ data: { userId } }),
    onSuccess: () => { toast.success("Email confirmed"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mRole = useMutation({
    mutationFn: (vars: { userId: string; role: "admin" | "superadmin"; enabled: boolean }) =>
      setRole({ data: vars }),
    onSuccess: () => { toast.success("Role updated"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });
  const mReset = useMutation({
    mutationFn: (email: string) => reset({ data: { email } }),
    onSuccess: () => toast.success("Password reset link generated"),
    onError: (e: Error) => toast.error(e.message),
  });
  const mDel = useMutation({
    mutationFn: (userId: string) => del({ data: { userId } }),
    onSuccess: () => { toast.success("Admin removed"); refresh(); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [email, setEmail] = useState("");
  const [role, setRoleField] = useState<"admin" | "superadmin">("admin");

  const iAmSuper = (data?.users ?? []).some(
    (u) => u.id === me?.id && u.roles.includes("superadmin"),
  );

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="Manage who can sign in to the ClarityPath admin."
      />

      <Card className="mb-6">
        <h2 className="mb-3 font-medium">Invite admin</h2>
        {!iAmSuper && (
          <p className="mb-3 text-xs text-amber-700">
            Only superadmins can invite or change roles.
          </p>
        )}
        <form
          className="grid gap-3 md:grid-cols-[1fr_180px_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            if (!email) return;
            mInvite.mutate({ email: email.trim(), role });
            setEmail("");
          }}
        >
          <Field label="Email">
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls}
              disabled={!iAmSuper}
            />
          </Field>
          <Field label="Role">
            <select
              value={role} onChange={(e) => setRoleField(e.target.value as "admin" | "superadmin")}
              className={inputCls} disabled={!iAmSuper}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
            </select>
          </Field>
          <div className="flex items-end">
            <button
              type="submit"
              className="btn-primary !py-2 !text-sm"
              disabled={!iAmSuper || mInvite.isPending}
            >
              <UserPlus size={14} /> {mInvite.isPending ? "Inviting…" : "Invite"}
            </button>
          </div>
        </form>
        <p className="mt-2 text-xs text-muted-foreground">
          A user account is created and email-confirmed. Share the password reset link so they can set their password.
        </p>
      </Card>

      <Card className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Roles</th>
              <th className="px-4 py-3">Last sign in</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {data?.users.map((u) => {
              const isMe = u.id === me?.id;
              const isSuper = u.roles.includes("superadmin");
              const isAdmin = u.roles.includes("admin");
              return (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{u.email ?? "(no email)"}</div>
                    {isMe && <div className="text-xs text-muted-foreground">You</div>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.email_confirmed_at ? "published" : "draft"} />
                    <span className="ml-2 text-xs text-muted-foreground">
                      {u.email_confirmed_at ? "verified" : "unverified"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {isSuper && (
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          superadmin
                        </span>
                      )}
                      {isAdmin && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                          admin
                        </span>
                      )}
                      {!isSuper && !isAdmin && (
                        <span className="text-xs text-muted-foreground">none</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {!u.email_confirmed_at && (
                        <button
                          onClick={() => mConfirm.mutate(u.id)}
                          className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted"
                          title="Mark email verified"
                        >
                          <MailCheck size={12} /> Verify
                        </button>
                      )}
                      {u.email && (
                        <button
                          onClick={() => mReset.mutate(u.email!)}
                          className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted"
                          title="Send password reset"
                        >
                          <KeyRound size={12} /> Reset
                        </button>
                      )}
                      <button
                        disabled={!iAmSuper}
                        onClick={() =>
                          mRole.mutate({ userId: u.id, role: "superadmin", enabled: !isSuper })
                        }
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        <ShieldCheck size={12} />
                        {isSuper ? "Revoke super" : "Make super"}
                      </button>
                      <button
                        disabled={!iAmSuper}
                        onClick={() =>
                          mRole.mutate({ userId: u.id, role: "admin", enabled: !isAdmin })
                        }
                        className="inline-flex items-center gap-1 rounded border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                      >
                        <ShieldCheck size={12} />
                        {isAdmin ? "Revoke admin" : "Make admin"}
                      </button>
                      <button
                        disabled={!iAmSuper || isMe}
                        onClick={() => {
                          if (confirm(`Delete ${u.email}? This cannot be undone.`))
                            mDel.mutate(u.id);
                        }}
                        className="inline-flex items-center gap-1 rounded border border-destructive/30 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {data && data.users.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No admins yet</td></tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
