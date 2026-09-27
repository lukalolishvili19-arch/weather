import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ChartPoint, MetricConfig } from "../../hooks/use-analytics-charts";
import { useDisplayUnits } from "../../hooks/use-display-units";
import { ChartTooltip } from "./weather-visuals";

type DynamicWeatherChartProps = {
  metricKey: string;
  config: MetricConfig;
  points: ChartPoint[];
  height?: number;
};

export function DynamicWeatherChart({
  metricKey,
  config,
  points,
  height = 240,
}: DynamicWeatherChartProps) {
  const { animateCharts } = useDisplayUnits();
  const gradientId = `metric-fill-${config.id}`;
  const duration = animateCharts ? 0.28 : 0;
  const chartDuration = animateCharts ? 900 : 0;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={metricKey}
        initial={animateCharts ? { opacity: 0, y: 10 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={animateCharts ? { opacity: 0, y: -8 } : undefined}
        transition={{ duration, ease: "easeOut" }}
        className="w-full"
      >
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: -16 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={config.color} stopOpacity={0.34} />
                <stop offset="100%" stopColor={config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.04)"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "#7a8ba8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={28}
            />
            <YAxis
              tick={{ fill: "#7a8ba8", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              unit={config.unit ? config.unit : undefined}
              width={52}
            />
            <Tooltip
              content={
                <ChartTooltip
                  valueFormatter={(value, key) => {
                    if (key === "secondary" && config.secondaryLabel) {
                      return `${config.secondaryLabel}: ${value}${config.id === "rain" ? "" : config.unit}`;
                    }
                    return `${config.label}: ${value}${config.unit}`;
                  }}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              name={config.label}
              stroke={config.color}
              strokeWidth={2.6}
              fill={`url(#${gradientId})`}
              dot={{ r: 3, fill: config.color, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
              isAnimationActive={animateCharts}
              animationBegin={0}
              animationDuration={chartDuration}
              animationEasing="ease-out"
            />
            {points.some((point) => point.secondary !== undefined) && (
              <Area
                type="monotone"
                dataKey="secondary"
                name={config.secondaryLabel ?? "Secondary"}
                stroke={config.color}
                strokeOpacity={0.45}
                strokeWidth={1.8}
                strokeDasharray="5 4"
                fill="transparent"
                dot={false}
                isAnimationActive={animateCharts}
                animationBegin={animateCharts ? 120 : 0}
                animationDuration={chartDuration}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}
