import { isAxiosError } from "axios";
import { AnimatePresence, motion } from "framer-motion";
import {
  BarChart2,
  CloudSun,
  Download,
  FileSpreadsheet,
  FileText,
  Table2,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  buildChartPoints,
  getMetricConfigs,
  localizeMetricConfigs,
  type ChartMetricId,
  type ChartRange,
} from "../../hooks/use-analytics-charts";
import { useExportActions } from "../../hooks/use-export";
import { useI18n } from "../../hooks/use-i18n";
import { usePreferences } from "../../model/preferences-context";
import {
  buildAnalyticsReportDocument,
  buildWeatherReportDocument,
} from "../../lib/export/build-reports";
import type { ExportFormat, ExportReportKind } from "../../lib/export/export-types";
import type { MessageKey } from "../../lib/i18n";
import { getStoredWeatherLocation } from "../../lib/location-storage";
import { PageContainer } from "../components/app-shell";
import {
  ActionButton,
  Badge,
  PageHeader,
  SectionLabel,
  SurfaceCard,
} from "../components/primitives";
import { cn } from "@/shared/lib/cn";

const reportKindMeta: Array<{
  id: ExportReportKind;
  labelKey: MessageKey;
  descriptionKey: MessageKey;
  icon: typeof CloudSun;
}> = [
  {
    id: "weather",
    labelKey: "export.weatherReport",
    descriptionKey: "export.weatherReportDesc",
    icon: CloudSun,
  },
  {
    id: "analytics",
    labelKey: "export.analyticsReport",
    descriptionKey: "export.analyticsReportDesc",
    icon: BarChart2,
  },
];

const formatMeta: Array<{
  id: ExportFormat;
  label: string;
  extension: string;
  icon: typeof FileText;
  detailKey: MessageKey;
}> = [
  {
    id: "pdf",
    label: "PDF",
    extension: ".pdf",
    icon: FileText,
    detailKey: "export.pdfDetail",
  },
  {
    id: "csv",
    label: "CSV",
    extension: ".csv",
    icon: Table2,
    detailKey: "export.csvDetail",
  },
  {
    id: "excel",
    label: "Excel",
    extension: ".xlsx",
    icon: FileSpreadsheet,
    detailKey: "export.excelDetail",
  },
];

const rangeKeys: Array<{ id: ChartRange; key: MessageKey }> = [
  { id: "hourly", key: "analytics.rangeHourly" },
  { id: "weekly", key: "analytics.rangeWeekly" },
  { id: "monthly", key: "analytics.rangeMonthly" },
];

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const message = (error.response?.data as { error?: { message?: string } } | undefined)?.error
      ?.message;
    if (message) return message;
  }
  if (error instanceof Error) return error.message;
  return fallback;
}

export function ExportPage() {
  const { t } = useI18n();
  const location = getStoredWeatherLocation();
  const [kind, setKind] = useState<ExportReportKind>("weather");
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [range, setRange] = useState<ChartRange>("weekly");
  const [metric, setMetric] = useState<ChartMetricId>("temperature");
  const [status, setStatus] = useState<string | null>(null);

  const exporter = useExportActions(location);
  const { settings } = usePreferences();
  const temperatureUnit = settings?.temperatureUnit ?? "CELSIUS";
  const windSpeedUnit = settings?.windSpeedUnit ?? "KMH";
  const metrics = useMemo(
    () =>
      localizeMetricConfigs(
        getMetricConfigs(exporter.units, temperatureUnit, windSpeedUnit),
        t,
      ),
    [exporter.units, temperatureUnit, windSpeedUnit, t],
  );

  const preview = useMemo(() => {
    if (kind === "weather") {
      return buildWeatherReportDocument({
        locationLabel: exporter.locationLabel,
        current: exporter.current,
        daily: exporter.daily,
        weeklySummary: exporter.weeklySummary,
        monthlySummary: exporter.monthlySummary,
      });
    }

    const activeMetric = metrics.find((item) => item.id === metric) ?? metrics[0]!;
    const sourceDays =
      range === "monthly"
        ? (exporter.daily?.days ?? [])
        : (exporter.daily?.days ?? []).slice(0, 7);
    const points = buildChartPoints(
      range,
      activeMetric.id,
      exporter.hourly?.hours ?? [],
      sourceDays,
      exporter.hourly?.location.timezone ?? exporter.daily?.location.timezone ?? null,
    );

    return buildAnalyticsReportDocument({
      locationLabel: exporter.locationLabel,
      range,
      metric: activeMetric,
      points,
      units: exporter.units,
      weeklySummary: exporter.weeklySummary,
      monthlySummary: exporter.monthlySummary,
      hourly: exporter.hourly,
      daily: exporter.daily,
    });
  }, [kind, range, metric, metrics, exporter]);

  const handleExport = async () => {
    setStatus(null);
    try {
      await exporter.exportReport({ kind, format, range, metric });
      const label = formatMeta.find((item) => item.id === format)?.label ?? format;
      setStatus(t("export.downloadStarted", { format: label }));
    } catch (error) {
      setStatus(getErrorMessage(error, t("export.unableToPrepare")));
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title={t("export.title")}
        subtitle={t("export.subtitle", { location: exporter.locationLabel })}
      />

      {exporter.isError && (
        <SurfaceCard className="mb-5 border-red-500/20 bg-red-500/5">
          <p className="text-sm text-red-300">
            {getErrorMessage(exporter.error, t("export.unableToPrepare"))}
          </p>
          <ActionButton className="mt-3" onClick={() => void exporter.refetch()}>
            {t("common.retry")}
          </ActionButton>
        </SurfaceCard>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <SurfaceCard>
            <SectionLabel>{t("export.reportType")}</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-2">
              {reportKindMeta.map((item) => {
                const Icon = item.icon;
                const active = kind === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setKind(item.id)}
                    className={cn(
                      "rounded-[16px] border p-4 text-left transition-colors",
                      active
                        ? "border-[#f7921e]/35 bg-[#f7921e]/10"
                        : "border-white/[0.07] bg-white/[0.03] hover:border-white/15",
                    )}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <Icon size={16} className={active ? "text-[#f7921e]" : "text-[#7a8ba8]"} />
                      <span className="text-sm font-bold text-[#e8edf8]">{t(item.labelKey)}</span>
                    </div>
                    <p className="text-[12px] leading-relaxed text-[#7a8ba8]">
                      {t(item.descriptionKey)}
                    </p>
                  </button>
                );
              })}
            </div>
          </SurfaceCard>

          <AnimatePresence initial={false}>
            {kind === "analytics" && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
              >
                <SurfaceCard>
                  <SectionLabel>{t("export.analyticsOptions")}</SectionLabel>
                  <div className="mb-4 flex w-fit gap-1 rounded-[14px] border border-white/[0.07] bg-white/[0.04] p-1">
                    {rangeKeys.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRange(item.id)}
                        className={cn(
                          "rounded-[10px] px-3.5 py-1.5 text-xs font-bold transition-colors",
                          range === item.id
                            ? "bg-[#111e38] text-[#e8edf8]"
                            : "text-[#7a8ba8] hover:text-[#e8edf8]",
                        )}
                      >
                        {t(item.key)}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {metrics.map((item) => {
                      const active = metric === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMetric(item.id)}
                          className={cn(
                            "rounded-[10px] border px-3 py-1.5 text-xs font-bold transition-colors",
                            active
                              ? "border-[#f7921e]/35 bg-[#f7921e]/10 text-[#f7921e]"
                              : "border-white/[0.07] text-[#7a8ba8] hover:text-[#e8edf8]",
                          )}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </SurfaceCard>
              </motion.div>
            )}
          </AnimatePresence>

          <SurfaceCard>
            <SectionLabel>{t("export.format")}</SectionLabel>
            <div className="grid gap-3 sm:grid-cols-3">
              {formatMeta.map((item) => {
                const Icon = item.icon;
                const active = format === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormat(item.id)}
                    className={cn(
                      "rounded-[16px] border p-4 text-left transition-colors",
                      active
                        ? "border-[#f7921e]/35 bg-[#f7921e]/10"
                        : "border-white/[0.07] bg-white/[0.03] hover:border-white/15",
                    )}
                  >
                    <Icon size={18} className={active ? "text-[#f7921e]" : "text-[#7a8ba8]"} />
                    <p className="mt-3 text-sm font-bold text-[#e8edf8]">{item.label}</p>
                    <p className="mt-1 text-[11px] text-[#7a8ba8]">{t(item.detailKey)}</p>
                    <div className="mt-2">
                      <Badge variant={active ? "orange" : "muted"}>{item.extension}</Badge>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ActionButton
                variant="primary"
                icon={<Download size={15} />}
                disabled={exporter.isLoading || exporter.isExporting || !location.trim()}
                onClick={() => void handleExport()}
              >
                {exporter.isExporting
                  ? t("export.exporting")
                  : t("export.exportFormat", {
                      format: formatMeta.find((f) => f.id === format)?.label ?? format,
                    })}
              </ActionButton>
              {status && <p className="text-[12px] text-[#7a8ba8]">{status}</p>}
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="min-h-[420px]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionLabel className="mb-0">{t("export.preview")}</SectionLabel>
            <Badge variant="blue">
              {t("export.tablesCount", { count: preview.tables.length })}
            </Badge>
          </div>

          {exporter.isLoading ? (
            <p className="text-sm text-[#7a8ba8]">{t("export.preparing")}</p>
          ) : (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-[#e8edf8]">{preview.title}</h2>
                <p className="mt-1 text-[13px] text-[#7a8ba8]">{preview.subtitle}</p>
                <p className="mt-1 text-[11px] text-[#5c6d88]">
                  {t("export.generated", { date: preview.generatedAt })}
                </p>
              </div>

              {preview.tables.map((table) => (
                <div key={table.title}>
                  <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.08em] text-[#7a8ba8]">
                    {table.title}
                  </p>
                  <div className="overflow-x-auto rounded-[14px] border border-white/[0.06]">
                    <table className="min-w-full text-left text-[12px]">
                      <thead className="bg-white/[0.03] text-[#7a8ba8]">
                        <tr>
                          {table.headers.map((header) => (
                            <th key={header} className="px-3 py-2 font-semibold">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.slice(0, 6).map((row, index) => (
                          <tr key={`${table.title}-${index}`} className="border-t border-white/[0.05]">
                            {row.map((cell, cellIndex) => (
                              <td key={`${table.title}-${index}-${cellIndex}`} className="px-3 py-2 text-[#c6d0e2]">
                                {cell == null || cell === "" ? "—" : String(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {table.rows.length > 6 && (
                    <p className="mt-1.5 text-[11px] text-[#5c6d88]">
                      {t("export.moreRows", { count: table.rows.length - 6 })}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </SurfaceCard>
      </div>
    </PageContainer>
  );
}
