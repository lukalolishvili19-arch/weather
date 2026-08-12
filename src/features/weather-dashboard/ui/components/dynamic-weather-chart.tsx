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
  const gradientId = `metric-fill-${config.id}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={metricKey}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
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
              isAnimationActive
              animationBegin={0}
              animationDuration={900}
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
                isAnimationActive
                animationBegin={120}
                animationDuration={900}
                animationEasing="ease-out"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    </AnimatePresence>
  );
}
