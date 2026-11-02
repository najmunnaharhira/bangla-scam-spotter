import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  Flag,
  MapPinned,
  Phone,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

import { AdminShell } from "@/components/admin/admin-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { getAdminOverview, type AdminOverview } from "@/lib/admin/admin.functions";
import { districtLabel } from "@/lib/districts";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [{ title: "Admin dashboard — ScamShield BD" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminDashboardPage,
});

function friendlyErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/^[A-Z_]+:\s*/, "") || "Something went wrong. Please try again.";
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  tone?: "default" | "accent";
}) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-slate-500">{label}</CardTitle>
        <Icon className={tone === "accent" ? "size-4 text-primary" : "size-4 text-slate-400"} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-slate-900">{value}</div>
      </CardContent>
    </Card>
  );
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
      <AdminShell>
        <section className="mx-auto w-full max-w-6xl px-4 py-14 text-center text-slate-500">
          Loading admin dashboard...
        </section>
      </AdminShell>
    );
  }

  if (state.status === "error") {
    return (
      <AdminShell onSignOut={handleLogout}>
        <section className="mx-auto w-full max-w-sm px-4 py-16">
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive"
          >
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>{state.message}</p>
          </div>
        </section>
      </AdminShell>
    );
  }

  const { overview } = state;
  const { reportStats, recentReports } = overview;

  return (
    <AdminShell email={overview.email} onSignOut={handleLogout}>
      <section className="mx-auto w-full max-w-6xl px-4 py-10">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">
            Community scam reports and configured app content, live from the database.
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total reports" value={reportStats.total} icon={Flag} tone="accent" />
          <StatCard label="Reports today" value={reportStats.today} icon={CalendarDays} />
          <StatCard label="This week" value={reportStats.thisWeek} icon={TrendingUp} />
          <StatCard
            label="Top district"
            value={
              reportStats.topDistrict ? (
                <span className="text-lg">
                  {districtLabel(reportStats.topDistrict.district, "en")}
                  <span className="ml-1.5 text-sm font-normal text-slate-400">
                    ({reportStats.topDistrict.count})
                  </span>
                </span>
              ) : (
                <span className="text-base text-slate-400">No data yet</span>
              )
            }
            icon={MapPinned}
          />
        </div>

        <Card className="mt-6 border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
            <div>
              <CardTitle className="text-base">Recent reports</CardTitle>
              <CardDescription>Latest 10 community-submitted scam reports.</CardDescription>
            </div>
            {reportStats.topScamType ? (
              <Badge variant="outline" className="gap-1.5 whitespace-nowrap">
                <ShieldAlert className="size-3.5" aria-hidden="true" />
                Top type: {reportStats.topScamType.scamType} ({reportStats.topScamType.count})
              </Badge>
            ) : null}
          </CardHeader>
          <CardContent>
            {recentReports.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">
                No reports yet — once the community reports are enabled on the live database, they'll
                appear here.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Identifier</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Scam type</TableHead>
                    <TableHead className="text-right">Reported</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="max-w-[12rem] truncate font-medium">
                        {report.identifier}
                      </TableCell>
                      <TableCell className="text-slate-500">
                        {report.district ? districtLabel(report.district, "en") : "—"}
                      </TableCell>
                      <TableCell className="text-slate-500">{report.channel ?? "—"}</TableCell>
                      <TableCell className="text-slate-500">{report.scamType ?? "—"}</TableCell>
                      <TableCell className="text-right text-slate-500">
                        {relativeTime(report.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <h2 className="mt-10 text-lg font-semibold text-slate-900">Configured content</h2>
        <p className="mt-1 text-sm text-slate-500">
          What the public app currently shows — not editable here yet.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Helplines" value={overview.stats.helplines} icon={Phone} />
          <StatCard label="Scam types" value={overview.stats.scamTypes} icon={ShieldAlert} />
          <StatCard label="Golden rules" value={overview.stats.goldenRules} icon={ShieldAlert} />
          <StatCard label="Channels" value={overview.stats.channels} icon={Phone} />
        </div>

        <Card className="mt-6 border-slate-200">
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
                    <TableCell className="text-slate-500">{helpline.note}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-base">Scam types covered</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {overview.scamTypes.map((scam) => (
                  <li key={scam.title}>
                    <p className="font-medium">{scam.title}</p>
                    <p className="text-slate-500">{scam.description}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card className="border-slate-200">
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
    </AdminShell>
  );
}
