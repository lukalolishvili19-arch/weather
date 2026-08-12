import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

import { downloadBlob, type ExportDocument } from "./export-types";

export async function exportExcel(document: ExportDocument, filename: string) {
  const workbook = XLSX.utils.book_new();

  const cover = XLSX.utils.aoa_to_sheet([
    [document.title],
    [document.subtitle],
    [`Generated: ${document.generatedAt}`],
  ]);
  XLSX.utils.book_append_sheet(workbook, cover, "Summary");

  document.tables.forEach((table, index) => {
    const sheetName = table.title.slice(0, 28) || `Sheet ${index + 1}`;
    const aoa = [table.headers, ...table.rows.map((row) => row.map((cell) => cell ?? ""))];
    const sheet = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  });

  const arrayBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([arrayBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  downloadBlob(filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`, blob);
}

export async function exportPdf(document: ExportDocument, filename: string) {
  const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  let cursorY = 48;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(20, 30, 48);
  pdf.text(document.title, marginX, cursorY);
  cursorY += 22;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);
  pdf.setTextColor(90, 105, 130);
  const subtitleLines = pdf.splitTextToSize(document.subtitle, 515);
  pdf.text(subtitleLines, marginX, cursorY);
  cursorY += subtitleLines.length * 14 + 8;
  pdf.text(`Generated: ${document.generatedAt}`, marginX, cursorY);
  cursorY += 18;

  for (const table of document.tables) {
    if (cursorY > 720) {
      pdf.addPage();
      cursorY = 48;
    }

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(24, 36, 56);
    pdf.text(table.title, marginX, cursorY);
    cursorY += 10;

    autoTable(pdf, {
      startY: cursorY,
      head: [table.headers],
      body: table.rows.map((row) => row.map((cell) => (cell == null ? "—" : String(cell)))),
      margin: { left: marginX, right: marginX },
      styles: {
        fontSize: 9,
        cellPadding: 5,
        textColor: [30, 40, 60],
        lineColor: [220, 226, 236],
        lineWidth: 0.4,
      },
      headStyles: {
        fillColor: [247, 146, 30],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [246, 248, 252],
      },
    });

    const lastAutoTable = (
      pdf as unknown as { lastAutoTable?: { finalY: number } }
    ).lastAutoTable;
    cursorY = (lastAutoTable?.finalY ?? cursorY) + 22;
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
