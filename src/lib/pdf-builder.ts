import jsPDF from "jspdf";

interface PageData {
  title: string;
  content: string;
}

interface MultiPagePdfOptions {
  docTitle: string;
  subject?: string;
  includeDate?: boolean;
  pages: PageData[];
}

const BLUE = [37, 99, 235];
const DARK = [30, 41, 59];
const GRAY = [100, 116, 139];
const LIGHT_BLUE = [219, 234, 254];
const WHITE = [255, 255, 255];

function setColor(doc: jsPDF, rgb: number[]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}

export function generateMultiPagePdf(opts: MultiPagePdfOptions): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  const dateStr = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const totalPdfPages: number[] = [];

  opts.pages.forEach((page, idx) => {
    if (idx > 0) doc.addPage();

    let y = 0;

    // Header bar
    doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
    doc.rect(0, 0, pageWidth, 28, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    setColor(doc, WHITE);
    doc.text(opts.docTitle, margin, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const headerParts: string[] = [];
    if (opts.subject) headerParts.push(opts.subject);
    if (opts.includeDate) headerParts.push(dateStr);
    headerParts.push(`Page ${idx + 1} of ${opts.pages.length}`);
    doc.text(headerParts.join("  •  "), margin, 20);

    // Decorative line
    doc.setDrawColor(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2]);
    doc.setLineWidth(0.4);
    doc.line(margin, 25, pageWidth - margin, 25);

    y = 34;

    // Page title
    if (page.title) {
      doc.setFillColor(LIGHT_BLUE[0], LIGHT_BLUE[1], LIGHT_BLUE[2]);
      doc.roundedRect(margin - 2, y - 5, contentWidth + 4, 9, 1.5, 1.5, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      setColor(doc, BLUE);
      doc.text(page.title, margin, y);
      y += 10;
    }

    // Content
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    setColor(doc, DARK);

    const lines = page.content.split("\n");
    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (line.trim() === "") {
        y += 3;
        continue;
      }

      const isBullet = line.startsWith("- ") || line.startsWith("• ") || /^\d+\.\s/.test(line);
      const bulletText = isBullet
        ? line.replace(/^[-•]\s/, "").replace(/^\d+\.\s/, "")
        : line;

      const wrapped = doc.splitTextToSize(bulletText, isBullet ? contentWidth - 8 : contentWidth);
      const needed = wrapped.length * 4.5 + 2;

      // Page break within a logical page
      if (y + needed > pageHeight - 16) {
        // Footer
        doc.setFontSize(8);
        setColor(doc, GRAY);
        doc.text("Student Hub", margin, pageHeight - 8);
        doc.text(`Page ${idx + 1}`, pageWidth / 2, pageHeight - 8, { align: "center" });

        doc.addPage();
        y = 14;
      }

      if (isBullet) {
        doc.setFillColor(BLUE[0], BLUE[1], BLUE[2]);
        doc.circle(margin + 2, y - 1, 0.8, "F");
        doc.text(wrapped, margin + 6, y);
      } else {
        doc.text(wrapped, margin, y);
      }
      y += needed;
    }

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    setColor(doc, GRAY);
    doc.text("Student Hub", margin, pageHeight - 8);
    doc.text(`Page ${idx + 1} of ${opts.pages.length}`, pageWidth / 2, pageHeight - 8, { align: "center" });
  });

  const fileName = (opts.docTitle || "custom-notes")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+$/, "");
  doc.save(`${fileName}.pdf`);
}
