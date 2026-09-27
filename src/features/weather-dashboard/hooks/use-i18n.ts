import { useCallback, useMemo } from "react";

import { localeTag, translate, type MessageKey, type MessageParams } from "../lib/i18n";
import { usePreferences } from "../model/preferences-context";

export function useI18n() {
  const { settings } = usePreferences();
  const language = settings?.language ?? "en";
  const locale = localeTag(language);

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => translate(language, key, params),
    [language],
  );

  return useMemo(() => ({ language, locale, t }), [language, locale, t]);
}
