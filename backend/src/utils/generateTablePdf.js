import PDFDocument from "pdfkit";

// =====================================================
// GENERATE A TABLE PDF (lists and reports)
//
// generateTablePdf({
//   title: "Participant List",
//   subtitle: ["KPT Sports Meet 2026", "100 Mtrs. Run (M100)"],
//   columns: [{ header: "Name", width: 2, align: "left" }, ...],
//   rows: [["Vishma", ...], ...],
//   landscape: false,
//   minRowHeight: 0,   // e.g. room for a signature
// })
//
// Column widths are relative weights. Long text wraps
// inside its cell; the heading row repeats on every page.
// =====================================================

const ORANGE = "#F97316";
const DARK = "#0F172A";
const MUTED = "#64748B";
const LINE = "#E2E8F0";
const ZEBRA = "#F8FAFC";

const MARGIN = 36;
const CELL_PADDING = 5;
const FONT_SIZE = 9;

const generateTablePdf = ({
  title,
  subtitle = [],
  columns,
  rows,
  landscape = false,
  footerNote = "",
  minRowHeight = 0,
}) =>
  new Promise((resolve, reject) => {
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
      // TITLE BLOCK (first page only)
      // ---------------------------------------------

      doc
        .fillColor(ORANGE)
        .font("Helvetica-Bold")
        .fontSize(9)
        .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALORE", MARGIN, MARGIN);

      doc
        .moveDown(0.3)
        .fillColor(DARK)
        .font("Helvetica-Bold")
        .fontSize(16)
        .text(title);

      doc.font("Helvetica").fontSize(10).fillColor(MUTED);

      for (const line of subtitle.filter(Boolean)) {
        doc.moveDown(0.15).text(line);
      }

      doc.moveDown(0.8);

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

export default generateTablePdf;
