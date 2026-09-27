import { UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { useI18n } from "@/features/weather-dashboard/hooks/use-i18n";
import type { MessageKey } from "@/features/weather-dashboard/lib/i18n";
import { PageContainer } from "@/features/weather-dashboard/ui/components/app-shell";
import { ActionButton, SurfaceCard } from "@/features/weather-dashboard/ui/components/primitives";
import { cn } from "@/shared/lib/cn";

type AccountPromptProps = {
  messageKey: MessageKey;
  variant?: "page" | "inline";
  className?: string;
};

function AuthLinks({ from }: { from: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap gap-2">
      <Link to="/login" state={{ from }}>
        <ActionButton>{t("auth.logIn")}</ActionButton>
      </Link>
      <Link to="/register" state={{ from }}>
        <ActionButton variant="primary">{t("auth.createAccount")}</ActionButton>
      </Link>
    </div>
  );
}

export function AccountPrompt({ messageKey, variant = "inline", className }: AccountPromptProps) {
  const { t } = useI18n();
  const location = useLocation();

  if (variant === "inline") {
    return (
      <div
        className={cn(
          "flex flex-col gap-3 rounded-[14px] border border-[#f7921e]/20 bg-[#f7921e]/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <p className="text-[13px] font-semibold text-foreground">{t(messageKey)}</p>
        <AuthLinks from={location.pathname} />
      </div>
    );
  }

  return (
    <PageContainer>
      <SurfaceCard className={cn("mx-auto mt-6 max-w-lg px-7 py-8 text-center", className)}>
        <span
          aria-hidden="true"
          className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-[#f7921e]/25 bg-[#f7921e]/10 text-[#f7921e]"
        >
          <UserRound size={24} />
        </span>
        <h1 className="mb-2 text-xl font-black tracking-[-0.4px] text-foreground">
          {t(messageKey)}
        </h1>
        <p className="mb-6 text-[13px] text-muted-foreground">{t("auth.promptOptional")}</p>
        <div className="flex justify-center">
          <AuthLinks from={location.pathname} />
        </div>
        <Link
          to="/"
          className="mt-5 inline-block text-xs font-bold text-[#f7921e] hover:underline"
        >
          {t("auth.continueBrowsing")}
        </Link>
      </SurfaceCard>
    </PageContainer>
  );
}
