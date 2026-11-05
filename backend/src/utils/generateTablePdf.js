import PDFDocument from "pdfkit";
import { loadHeaderLogos } from "./brandImages.js";

// =====================================================
// GENERATE A TABLE PDF (lists and reports)
//
// await generateTablePdf({
//   title: "Event Participant List",
//   meetName: "KPT Annual Sports Meet 2026-27",
//   highlight: { text: "100 Mtrs. Run", detail: "M100 · Male" },
//   subtitle: ["13 registered"],
//   columns: [{ header: "Name", width: 2, align: "left" }, ...],
//   rows: [["Vishma", ...], ...],
//   landscape: false,
//   minRowHeight: 0,   // e.g. room for a signature
// })
//
// The heading is centred between the college logos.
// Column widths are relative weights. Long text wraps
// inside its cell; the table heading repeats on every page.
// =====================================================

const ORANGE = "#F97316";
const ORANGE_DARK = "#9A3412";
const ORANGE_SOFT = "#FFF7ED";
const NAVY = "#142B4A";
const DARK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const ZEBRA = "#F8FAFC";

const MARGIN = 36;
const CELL_PADDING = 5;
const FONT_SIZE = 9;

const LOGO_SIZE = 58;

const generateTablePdf = async ({
  title,
  meetName = "",
  highlight = null,
  subtitle = [],
  columns,
  rows,
  landscape = false,
  footerNote = "",
  minRowHeight = 0,
}) => {
  const logos = await loadHeaderLogos();

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: landscape ? "landscape" : "portrait",
        margins: {
          top: MARGIN,
          bottom: MARGIN,
          left: MARGIN,
          right: MARGIN,
        },
        bufferPages: true,
      });

      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const tableWidth = doc.page.width - MARGIN * 2;
      const totalWeight = columns.reduce(
        (sum, column) => sum + (column.width || 1),
        0
      );

      const widths = columns.map(
        (column) => (tableWidth * (column.width || 1)) / totalWeight
      );

      const bottomLimit = () => doc.page.height - MARGIN - 18;

      // ---------------------------------------------
      // HEADING (first page only)
      // College logo | emblem + college name | logo
      // ---------------------------------------------

      const drawLogo = (image, x, y, size) => {
        if (!image) {
          return;
        }

        try {
          doc.image(image, x, y, {
            fit: [size, size],
            align: "center",
            valign: "center",
          });
        } catch (error) {
          console.error("List PDF logo error:", error.message);
        }
      };

      const top = MARGIN;
      const centreX = MARGIN + LOGO_SIZE + 10;
      const centreWidth = tableWidth - (LOGO_SIZE + 10) * 2;

      drawLogo(logos.left, MARGIN, top, LOGO_SIZE);
      drawLogo(logos.right, MARGIN + tableWidth - LOGO_SIZE, top, LOGO_SIZE);
      drawLogo(logos.emblem, MARGIN + tableWidth / 2 - 13, top - 4, 26);

      doc
        .fillColor(NAVY)
        .font("Helvetica-Bold")
        .fontSize(13)
        .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE", centreX, top + 26, {
          width: centreWidth,
          align: "center",
        });

      if (meetName) {
        doc
          .moveDown(0.2)
          .fillColor(MUTED)
          .font("Helvetica")
          .fontSize(10)
          .text(meetName, centreX, doc.y, {
            width: centreWidth,
            align: "center",
          });
      }

      // Divider under the heading
      const dividerY = Math.max(doc.y, top + LOGO_SIZE) + 8;

      doc
        .moveTo(MARGIN, dividerY)
        .lineTo(MARGIN + tableWidth, dividerY)
        .lineWidth(1.5)
        .strokeColor(ORANGE)
        .stroke();

      doc
        .fillColor(DARK)
        .font("Helvetica-Bold")
        .fontSize(12)
        .text(String(title).toUpperCase(), MARGIN, dividerY + 10, {
          width: tableWidth,
          align: "center",
          characterSpacing: 1,
        });

      // ---------------------------------------------
      // HIGHLIGHT BAND (e.g. the event name)
      // ---------------------------------------------

      if (highlight?.text) {
        const bandTop = doc.y + 8;

        doc.font("Helvetica-Bold").fontSize(17);
        const textHeight = doc.heightOfString(highlight.text, {
          width: tableWidth - 24,
        });

        const bandHeight =
          textHeight + (highlight.detail ? 30 : 16);

        doc
          .roundedRect(MARGIN, bandTop, tableWidth, bandHeight, 6)
          .fillAndStroke(ORANGE_SOFT, ORANGE);

        doc
          .fillColor(ORANGE_DARK)
          .font("Helvetica-Bold")
          .fontSize(17)
          .text(highlight.text, MARGIN + 12, bandTop + 8, {
            width: tableWidth - 24,
            align: "center",
          });

        if (highlight.detail) {
          doc
            .fillColor(DARK)
            .font("Helvetica")
            .fontSize(10)
            .text(highlight.detail, MARGIN + 12, doc.y + 2, {
              width: tableWidth - 24,
              align: "center",
            });
        }

        doc.y = bandTop + bandHeight;
      }

      doc.font("Helvetica").fontSize(10).fillColor(MUTED);

      for (const line of subtitle.filter(Boolean)) {
        doc.moveDown(0.4).text(line, MARGIN, doc.y, {
          width: tableWidth,
          align: "center",
        });
      }

      doc.x = MARGIN;
      doc.moveDown(1);

      // ---------------------------------------------
      // TABLE
      // ---------------------------------------------

      const rowHeight = (cells, font, header = false) => {
        doc.font(font).fontSize(FONT_SIZE);

        const textHeight =
          Math.max(
            ...cells.map((cell, index) =>
              doc.heightOfString(String(cell ?? ""), {
                width: widths[index] - CELL_PADDING * 2,
              })
            )
          ) +
          CELL_PADDING * 2;

        return header ? textHeight : Math.max(textHeight, minRowHeight);
      };

      const drawRow = (cells, { header = false, shade = false } = {}) => {
        const font = header ? "Helvetica-Bold" : "Helvetica";
        const height = rowHeight(cells, font, header);
        const y = doc.y;
        let x = MARGIN;

        if (header) {
          doc.rect(MARGIN, y, tableWidth, height).fill(ORANGE);
        } else if (shade) {
          doc.rect(MARGIN, y, tableWidth, height).fill(ZEBRA);
        }

        cells.forEach((cell, index) => {
          doc
            .font(font)
            .fontSize(FONT_SIZE)
            .fillColor(header ? "#FFFFFF" : DARK)
            .text(String(cell ?? ""), x + CELL_PADDING, y + CELL_PADDING, {
              width: widths[index] - CELL_PADDING * 2,
              align: columns[index].align || "left",
            });

          x += widths[index];
        });

        doc
          .moveTo(MARGIN, y + height)
          .lineTo(MARGIN + tableWidth, y + height)
          .lineWidth(0.5)
          .strokeColor(LINE)
          .stroke();

        doc.x = MARGIN;
        doc.y = y + height;
      };

      const headerCells = columns.map((column) => column.header);

      drawRow(headerCells, { header: true });

      if (rows.length === 0) {
        doc
          .moveDown(1)
          .font("Helvetica-Oblique")
          .fontSize(10)
          .fillColor(MUTED)
          .text("No records.", MARGIN, doc.y, {
            width: tableWidth,
            align: "center",
          });
      }

      rows.forEach((cells, index) => {
        if (doc.y + rowHeight(cells, "Helvetica") > bottomLimit()) {
          doc.addPage();
          doc.y = MARGIN;
          drawRow(headerCells, { header: true });
        }

        drawRow(cells, { shade: index % 2 === 1 });
      });

      if (footerNote) {
        doc
          .moveDown(1.2)
          .font("Helvetica")
          .fontSize(9)
          .fillColor(MUTED)
          .text(footerNote, MARGIN, doc.y, { width: tableWidth });
      }

      // ---------------------------------------------
      // PAGE NUMBERS + PRINT DATE
      // ---------------------------------------------

      const printedOn = new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const range = doc.bufferedPageRange();

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Writing inside the bottom margin must not add a page
        const bottom = doc.page.margins.bottom;
        doc.page.margins.bottom = 0;

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(MUTED)
          .text(
            `Printed ${printedOn}   ·   Page ${i + 1} of ${range.count}`,
            MARGIN,
            doc.page.height - MARGIN + 4,
            { width: tableWidth, align: "right", lineBreak: false }
          );

        doc.page.margins.bottom = bottom;
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default generateTablePdf;
