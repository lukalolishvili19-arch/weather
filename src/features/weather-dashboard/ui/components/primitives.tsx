import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

const badgeStyles = {
  orange: "border-[#f7921e]/25 bg-[#f7921e]/10 text-[#f7921e]",
  blue: "border-[#4a9eff]/25 bg-[#4a9eff]/10 text-[#4a9eff]",
  lime: "border-[#a3e635]/25 bg-[#a3e635]/10 text-[#a3e635]",
  green: "border-[#22c55e]/25 bg-[#22c55e]/10 text-[#22c55e]",
  amber: "border-[#f59e0b]/25 bg-[#f59e0b]/10 text-[#f59e0b]",
  red: "border-[#ef4444]/25 bg-[#ef4444]/10 text-[#ef4444]",
  muted: "border-[#7a8ba8]/20 bg-[#7a8ba8]/10 text-[#7a8ba8]",
};

export type BadgeVariant = keyof typeof badgeStyles;

export function SurfaceCard({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={cn("rounded-[20px] border border-border bg-card p-5 text-card-foreground", className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "mb-4 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-7">
      <h1 className="text-[26px] font-black leading-normal tracking-[-0.5px] text-foreground">
        {title}
      </h1>
      <p className="text-[13px] text-muted-foreground">{subtitle}</p>
    </header>
  );
}

export function Badge({
  variant = "muted",
  children,
}: {
  variant?: BadgeVariant;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-[3px] text-[11px] font-bold",
        badgeStyles[variant],
      )}
    >
      {children}
    </span>
  );
}

export function ActionButton({
  children,
  icon,
  variant = "ghost",
  className,
  type = "button",
  disabled,
  onClick,
}: {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  className?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-[13px] font-semibold disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary" &&
          "border-0 bg-gradient-to-br from-[#c44404] to-[#f7921e] text-white",
        variant === "ghost" && "border border-border bg-secondary/60 text-foreground",
        variant === "danger" && "border border-red-500/25 bg-red-500/10 text-red-500",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  max = 100,
  color = "#f7921e",
  className,
}: {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}) {
  const width = Math.min((value / max) * 100, 100);
  return (
    <div className={cn("h-[5px] overflow-hidden rounded-full bg-border", className)}>
      <div className="h-full rounded-full" style={{ width: `${width}%`, background: color }} />
    </div>
  );
}

export function StatCard({
  icon,
  label,
  value,
  detail,
  color,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div
      className="flex flex-col gap-2 rounded-[18px] border p-4"
      style={{ background: `${color}12`, borderColor: `${color}2a` }}
    >
      <div className="flex items-center gap-2">
        <span style={{ color }}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
          {label}
        </span>
      </div>
      <strong className="text-[22px] font-extrabold leading-none text-foreground">{value}</strong>
      <span className="text-[11px] font-semibold" style={{ color }}>
        {detail}
      </span>
    </div>
  );
}

export function Toggle({
  enabled,
  onChange,
  disabled,
}: {
  enabled: boolean;
  onChange?: (next: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange?.(!enabled)}
      className={cn(
        "relative block h-6 w-11 shrink-0 rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        enabled ? "bg-[#f7921e]" : "bg-switch-background",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_1px_4px_rgba(0,0,0,0.3)] transition-all",
          enabled ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function StaticToggle({ enabled }: { enabled: boolean }) {
  return <Toggle enabled={enabled} disabled />;
}

export function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3.5">
      <div className="flex-1">
        <p className="text-[13px] font-bold text-foreground">{label}</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <div className={cn("h-px bg-border", className)} />;
}
