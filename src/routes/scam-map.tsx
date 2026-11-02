import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, MapPin, TrendingUp } from "lucide-react";

import { useLanguage } from "@/components/language-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { districtLabel } from "@/lib/districts";
import { callMcpTool } from "@/lib/mcp-client";
import { CHANNELS } from "@/lib/sample-data";

export const Route = createFileRoute("/scam-map")({
  component: ScamMapPage,
});

interface DistrictStat {
  district: string;
  count: number;
}

interface ScamTypeStat {
  scamType: string;
  count: number;
}

function TrendingScamTypes() {
  const { t } = useLanguage();
  const [types, setTypes] = React.useState<ScamTypeStat[] | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    callMcpTool<{ types: ScamTypeStat[] }>("get_trending_scam_types")
      .then(({ structured }) => {
        if (!cancelled) setTypes(structured?.types ?? []);
      })
      .catch(() => {
        if (!cancelled) setTypes([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const max = types && types.length > 0 ? types[0]!.count : 0;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="size-4 text-primary" aria-hidden="true" />
          {t("scamMap.trendingTypes")}
        </CardTitle>
        <CardDescription>{t("scamMap.trendingNote")}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          </div>
        ) : !types || types.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("scamMap.trendingEmpty")}</p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">{t("scamMap.trendingTypes")}</caption>
            <tbody>
              {types.map((row) => (
                <tr key={row.scamType} className="align-middle">
                  <th scope="row" className="w-40 truncate pr-3 py-1.5 text-left font-medium text-foreground">
                    {row.scamType}
                  </th>
                  <td className="py-1.5">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 rounded-full bg-suspicious"
                        style={{ width: `${max > 0 ? Math.max(4, (row.count / max) * 100) : 0}%` }}
                        aria-hidden="true"
                      />
                      <span className="shrink-0 tabular-nums text-muted-foreground">{row.count}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}

function ScamMapPage() {
  const { t, lang } = useLanguage();
  const [channel, setChannel] = React.useState<string>("all");
  const [stats, setStats] = React.useState<DistrictStat[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    callMcpTool<{ districts: DistrictStat[] }>("get_district_scam_stats", {
      channel: channel === "all" ? undefined : channel,
    })
      .then(({ structured }) => {
        if (!cancelled) setStats(structured?.districts ?? []);
      })
      .catch(() => {
        if (!cancelled) setStats([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [channel]);

  const visible = stats ? (showAll ? stats : stats.slice(0, 15)) : [];
  const max = stats && stats.length > 0 ? stats[0]!.count : 0;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <MapPin className="size-6" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t("scamMap.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("scamMap.subtitle")}</p>
        </div>
      </div>

      <div className="mt-6 max-w-xs space-y-2">
        <label className="text-sm font-medium" htmlFor="scam-map-channel">
          {t("scamMap.filterLabel")}
        </label>
        <Select value={channel} onValueChange={setChannel}>
          <SelectTrigger id="scam-map-channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("scamMap.allChannels")}</SelectItem>
            {CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {t(`channel.${c}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t("scamMap.reportsByDistrict")}</CardTitle>
          <CardDescription>{t("scamMap.sourceNote")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" aria-hidden="true" />
            </div>
          ) : !stats || stats.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("scamMap.empty")}</p>
          ) : (
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t("scamMap.reportsByDistrict")}</caption>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.district} className="align-middle">
                    <th
                      scope="row"
                      className="w-32 truncate pr-3 py-1.5 text-left font-medium text-foreground"
                    >
                      {districtLabel(row.district, lang)}
                    </th>
                    <td className="py-1.5">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 rounded-full bg-primary"
                          style={{
                            width: `${max > 0 ? Math.max(4, (row.count / max) * 100) : 0}%`,
                          }}
                          aria-hidden="true"
                        />
                        <span className="shrink-0 tabular-nums text-muted-foreground">
                          {row.count}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {stats && stats.length > 15 ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="mt-4 text-sm font-medium text-primary hover:underline"
            >
              {showAll ? t("scamMap.showTop") : t("scamMap.showAll")}
            </button>
          ) : null}
        </CardContent>
      </Card>

      <TrendingScamTypes />
    </section>
  );
}
