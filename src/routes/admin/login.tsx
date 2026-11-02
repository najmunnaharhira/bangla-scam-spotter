import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, Loader2, Lock, ShieldCheck } from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ensureAdminAccount } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Admin login — ScamShield BD" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        // First-ever login: the admin account may not exist in Supabase yet.
        try {
          await ensureAdminAccount();
        } catch {
          // If seeding itself fails, fall through and report the original sign-in error.
        }
        ({ error: signInError } = await supabase.auth.signInWithPassword({ email, password }));
      }
      if (signInError) {
        setError("Invalid email or password.");
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setError("Could not start a session. Please try again.");
        return;
      }
      await navigate({ to: "/admin" });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminShell>
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-sm flex-col justify-center px-4 py-12">
        <Card className="border-slate-200 shadow-lg">
          <CardHeader className="items-center text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </span>
            <CardTitle className="mt-2 text-xl">Admin sign in</CardTitle>
            <CardDescription>Restricted access — ScamShield BD operators only.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error ? (
                <div
                  role="alert"
                  className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
                >
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <p>{error}</p>
                </div>
              ) : null}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-slate-500">
          <Lock className="size-3.5" aria-hidden="true" />
          This area is monitored and limited to authorized ScamShield BD staff.
        </p>
      </section>
    </AdminShell>
  );
}
