import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "@/app/App";
import { bootThemeFromStorage } from "@/features/weather-dashboard/lib/theme";
import "@/figma/styles/index.css";

bootThemeFromStorage();

const root = document.getElementById("root");

if (!root) {
  throw new Error("Root element not found");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
