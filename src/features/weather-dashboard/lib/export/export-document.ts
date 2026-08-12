import type { ExportDocument, ExportFormat } from "./export-types";
import { exportCsv, slugifyFilename } from "./export-types";

export async function exportDocument(
  document: ExportDocument,
  format: ExportFormat,
  baseFilename: string,
) {
  const safeName = slugifyFilename(baseFilename) || "skycast-export";

  if (format === "csv") {
    exportCsv(document, `${safeName}.csv`);
    return;
  }

  if (format === "excel") {
    const { exportExcel } = await import("./export-writers");
    await exportExcel(document, `${safeName}.xlsx`);
    return;
  }

  const { exportPdf } = await import("./export-writers");
  await exportPdf(document, `${safeName}.pdf`);
}
