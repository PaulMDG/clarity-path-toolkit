import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Field, inputCls } from "@/components/admin/AdminUI";

export const Route = createFileRoute("/admin/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: (s.redirect as string) || "/admin",
  }),
  component: LoginPage,
});

function LoginPage() {
  const nav = useNavigate();
  const { redirect } = useSearch({ from: "/admin/login" });
  const { session, isAdmin, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [busy, setBusy] = useState(false);

  if (!loading && session && isAdmin) {
    nav({ to: redirect });
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message);
      else toast.success("Signed in");
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      if (error) toast.error(error.message);
      else
        toast.success(
          "Account created. Ask the project owner to grant your user the admin role.",
        );
    }
    setBusy(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted px-4">
      <div className="w-full max-w-sm rounded-lg border bg-white p-8 shadow-sm">
        <h1 className="font-serif text-2xl" style={{ color: "#1A2B3C" }}>ClarityPath Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to continue" : "Create an admin account"}
        </p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Email">
            <input
              type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)} className={inputCls}
              autoComplete="email"
            />
          </Field>
          <Field label="Password">
            <input
              type="password" required minLength={8} value={password}
              onChange={(e) => setPassword(e.target.value)} className={inputCls}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
            />
          </Field>
          <button type="submit" disabled={busy} className="btn-primary w-full justify-center">
            {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
        >
          {mode === "signin"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
