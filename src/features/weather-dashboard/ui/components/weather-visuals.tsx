const FONT = "'Manrope', sans-serif";

export function SunriseArc({ progress = 0.65 }: { progress?: number }) {
  const clamped = Math.min(Math.max(progress, 0), 1);
  const angle = Math.PI * (1 - clamped);
  const cx = 120 + 58 * Math.cos(angle);
  const cy = 78 - 58 * Math.sin(angle);

  return (
    <svg viewBox="0 0 240 110" className="max-h-[110px] w-full" aria-label="Sunrise to sunset arc">
      <path
        d="M 62 78 A 58 58 0 0 1 178 78"
        fill="none"
        stroke="rgba(255,255,255,0.09)"
        strokeWidth="1.5"
        strokeDasharray="5 5"
      />
      <ellipse cx="120" cy="80" rx="72" ry="9" fill="rgba(247,146,30,0.05)" />
      <line x1="52" y1="78" x2="188" y2="78" stroke="rgba(255,255,255,0.12)" />
      <path
        d={`M 62 78 A 58 58 0 0 1 ${cx.toFixed(2)} ${cy.toFixed(2)}`}
        fill="none"
        stroke="#f7921e"
        strokeWidth="2.5"
        strokeLinecap="round"
        className="drop-shadow-[0_0_5px_rgba(247,146,30,0.6)]"
      />
      <circle cx={cx} cy={cy} r="10" fill="rgba(247,146,30,0.12)" />
      <circle
        cx={cx}
        cy={cy}
        r="6"
        fill="#f7921e"
        className="drop-shadow-[0_0_10px_#f7921e]"
      />
    </svg>
  );
}

export function AqiGauge({
  value = null,
  label = "—",
  color = "#7a8ba8",
}: {
  value?: number | null;
  label?: string;
  color?: string;
}) {
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const numeric = typeof value === "number" && Number.isFinite(value) ? value : 0;
  const dash = Math.min(numeric / 300, 1) * circumference * 0.75;
  return (
    <div className="relative h-[168px] w-[168px]">
      <svg viewBox="0 0 168 168" className="h-full w-full -rotate-[135deg]">
        <circle
          cx="84"
          cy="84"
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="12"
          strokeDasharray={`${circumference * 0.75} ${circumference}`}
          strokeLinecap="round"
        />
        <circle
          cx="84"
          cy="84"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeDasharray={`${dash} ${circumference}`}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-1 text-center">
        <strong className="text-[34px] font-extrabold leading-none text-white">
          {value == null ? "—" : Math.round(value)}
        </strong>
        <span className="mt-1 text-[11px] font-bold" style={{ color }}>
          AQI
        </span>
        <span className="mt-1 max-w-[110px] text-[11px] leading-tight text-white/40">{label}</span>
      </div>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string; name?: string; color?: string }>;
  label?: string;
  valueFormatter?: (value: number, key: string, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#111e38] px-3.5 py-2.5 shadow-2xl">
      {label && <p className="mb-1.5 text-[11px] font-semibold text-[#7a8ba8]">{label}</p>}
      {payload.map((item) => (
        <p
          key={item.dataKey}
          className="mb-0.5 text-[13px] font-bold"
          style={{ color: item.color ?? "#f7921e", fontFamily: FONT }}
        >
          {valueFormatter
            ? valueFormatter(item.value, String(item.dataKey), item.name)
            : `${item.name ?? item.dataKey}: ${item.value}`}
        </p>
      ))}
    </div>
  );
}
