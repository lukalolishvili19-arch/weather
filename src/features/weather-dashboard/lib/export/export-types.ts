export type ExportFormat = "pdf" | "csv" | "excel";

export type ExportReportKind = "weather" | "analytics";

export type ExportTable = {
  title: string;
  headers: string[];
  rows: Array<Array<string | number | null | undefined>>;
};

export type ExportDocument = {
  title: string;
  subtitle: string;
  generatedAt: string;
  tables: ExportTable[];
};

export function slugifyFilename(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function cellValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsv(document: ExportDocument): string {
  const lines: string[] = [];
  lines.push(escapeCsv(document.title));
  lines.push(escapeCsv(document.subtitle));
  lines.push(escapeCsv(`Generated: ${document.generatedAt}`));
  lines.push("");

  for (const table of document.tables) {
    lines.push(escapeCsv(table.title));
    lines.push(table.headers.map(escapeCsv).join(","));
    for (const row of table.rows) {
      lines.push(row.map((cell) => escapeCsv(cellValue(cell))).join(","));
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function exportCsv(document: ExportDocument, filename: string) {
  const csv = buildCsv(document);
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
  downloadBlob(filename.endsWith(".csv") ? filename : `${filename}.csv`, blob);
}
