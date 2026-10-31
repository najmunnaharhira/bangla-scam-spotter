import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, MessageSquareText, GraduationCap, LifeBuoy } from "lucide-react";

import { AppLayout } from "@/components/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SCAM_TYPES } from "@/lib/sample-data";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <AppLayout>
      <section className="mx-auto w-full max-w-6xl px-4 py-16 text-center sm:py-24">
        <span className="mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <ShieldCheck className="size-7" aria-hidden="true" />
        </span>
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight sm:text-5xl">
          Is that message a scam? Check it in seconds.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-muted-foreground sm:text-lg">
          ScamShield BD reads any SMS, Messenger, WhatsApp or screenshot and tells you in plain
          language whether it's safe, suspicious, or a likely scam — built for Bangladesh.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/check">Check a message now</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/practice">Try the practice game</Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <Link to="/check" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <MessageSquareText className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-2">Check a message</CardTitle>
                <CardDescription>
                  Paste text or upload a screenshot and get a risk score, red flags and next steps.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/practice" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <GraduationCap className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-2">Practice spotting scams</CardTitle>
                <CardDescription>
                  Play a short round of real-feeling messages and learn to tell scam from genuine.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/help" className="group">
            <Card className="h-full transition-colors group-hover:border-primary">
              <CardHeader>
                <LifeBuoy className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-2">Already scammed? Get help</CardTitle>
                <CardDescription>
                  Get a step-by-step recovery plan and the real helpline numbers to call right now.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="text-2xl font-bold tracking-tight">Common scams in Bangladesh</h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          These are the patterns we see most often. Recognising them is the first step to staying
          safe.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SCAM_TYPES.map((scam) => (
            <Card key={scam.title}>
              <CardHeader>
                <scam.icon className="size-6 text-primary" aria-hidden="true" />
                <CardTitle className="mt-2 text-base">{scam.title}</CardTitle>
                <CardDescription>{scam.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}
