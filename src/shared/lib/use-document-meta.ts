import { useEffect } from "react";

const DEFAULT_TITLE = "SkyCast — Weather Dashboard";
const DEFAULT_DESCRIPTION =
  "SkyCast weather dashboard with forecasts, analytics, maps, air quality, and alerts.";

export function useDocumentMeta(options: {
  title?: string;
  description?: string;
}) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = options.title
      ? `${options.title} · SkyCast`
      : DEFAULT_TITLE;

    const descriptionTag =
      document.querySelector('meta[name="description"]') ??
      (() => {
        const meta = document.createElement("meta");
        meta.setAttribute("name", "description");
        document.head.appendChild(meta);
        return meta;
      })();

    const previousDescription = descriptionTag.getAttribute("content");
    descriptionTag.setAttribute("content", options.description ?? DEFAULT_DESCRIPTION);

    return () => {
      document.title = previousTitle;
      if (previousDescription != null) {
        descriptionTag.setAttribute("content", previousDescription);
      }
    };
  }, [options.title, options.description]);
}
