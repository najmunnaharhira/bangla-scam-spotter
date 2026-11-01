import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AlertTriangle, LogOut, Phone, ShieldAlert, ShieldCheck, Smartphone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOverview, type AdminOverview } from "@/lib/admin/admin.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboardPage,
});

function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^[A-Z_]+:\s*/, "") || "Something went wrong. Please try again.";
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [state, setState] = React.useState<
    { status: "loading" } | { status: "error"; message: string } | { status: "ready"; overview: AdminOverview }
  >({ status: "loading" });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        await navigate({ to: "/admin/login" });
        return;
      }
      try {
        const overview = await getAdminOverview();
        if (!cancelled) setState({ status: "ready", overview });
      } catch (err) {
        if (cancelled) return;
        setState({ status: "error", message: friendlyErrorMessage(err) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/admin/login" });
  };

  if (state.status === "loading") {
    return (
      <section className="mx-auto w-full max-w-5xl px-4 py-14 text-center text-muted-foreground">
        Loading admin dashboard...
      </section>
    );
  }

  if (state.status === "error") {
    return (
      <section className="mx-auto w-full max-w-sm px-4 py-16">
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>{state.message}</p>
        </div>
        <Button className="mt-4 w-full" variant="outline" onClick={handleLogout}>
          Back to login
        </Button>
      </section>
    );
  }

  const { overview } = state;

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:py-14">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Admin dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Signed in as {overview.email}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="size-4" aria-hidden="true" />
          Log out
        </Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Helplines</CardTitle>
            <Phone className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats.helplines}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scam types</CardTitle>
            <ShieldAlert className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats.scamTypes}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Golden rules</CardTitle>
            <ShieldCheck className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats.goldenRules}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Channels</CardTitle>
            <Smartphone className="size-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview.stats.channels}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Helplines</CardTitle>
          <CardDescription>Shown to users on the Get Help page.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Number</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.helplines.map((helpline) => (
                <TableRow key={helpline.name}>
                  <TableCell className="font-medium">{helpline.name}</TableCell>
                  <TableCell>{helpline.number}</TableCell>
                  <TableCell className="text-muted-foreground">{helpline.note}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Scam types covered</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {overview.scamTypes.map((scam) => (
                <li key={scam.title}>
                  <p className="font-medium">{scam.title}</p>
                  <p className="text-muted-foreground">{scam.description}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Golden rules</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1.5 text-sm">
              {overview.goldenRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
