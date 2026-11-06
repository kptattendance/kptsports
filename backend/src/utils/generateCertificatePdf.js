import path from "path";
import { fileURLToPath } from "url";
import PDFDocument from "pdfkit";
import {
  CLOUDINARY_HOST,
  COLLEGE_WATERMARK_URL,
  LOGO3_URL,
  LOGO4_URL,
  LOGO5_URL,
  downloadImage,
} from "./brandImages.js";

// =====================================================
// CREATE CLOUDINARY JPG URL
// =====================================================

const createCloudinaryJpgUrl = (
  publicId
) => {
  if (!publicId) {
    return "";
  }

  return `${CLOUDINARY_HOST}${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${publicId}.jpg`;
};

// =====================================================
// SHARED IMAGES (logos + watermark)
// Downloaded once per PDF, even when it holds many pages.
// =====================================================

const loadSharedImages = async () => {
  const [
    logo3Buffer,
    logo4Buffer,
    logo5Buffer,
    collegeWatermarkBuffer,
  ] = await Promise.all([
    downloadImage(LOGO3_URL, "LEFT COLLEGE LOGO"),
    downloadImage(LOGO4_URL, "RIGHT COLLEGE LOGO"),
    downloadImage(LOGO5_URL, "KARNATAKA EMBLEM"),
    downloadImage(
      COLLEGE_WATERMARK_URL,
      "COLLEGE BUILDING WATERMARK"
    ),
  ]);

  return {
    logo3Buffer,
    logo4Buffer,
    logo5Buffer,
    collegeWatermarkBuffer,
  };
};

// =====================================================
// STUDENT PHOTO
//
// FIRST: Certificate.photo
// FALLBACK: Application.photo
// ATTEMPT 1: stored photo URL
// ATTEMPT 2: URL rebuilt from the Cloudinary publicId
// =====================================================

const loadStudentPhoto = async ({
  certificate,
  application,
}) => {
  const url =
    certificate?.photo?.url ||
    application?.photo?.url ||
    "";

  const publicId =
    certificate?.photo?.publicId ||
    application?.photo?.publicId ||
    "";

  let buffer = null;

  if (url) {
    buffer = await downloadImage(
      url,
      "STUDENT PHOTO FROM URL"
    );
  }

  if (!buffer && publicId) {
    buffer = await downloadImage(
      createCloudinaryJpgUrl(publicId),
      "STUDENT PHOTO FROM PUBLIC ID"
    );
  }

  if (!buffer) {
    console.error(
      `No usable student photo for certificate ${certificate?.certificateNumber}`
    );
  }

  return buffer;
};

// A few photos at a time, so a large batch does not
// open hundreds of connections at once.
const PHOTO_BATCH_SIZE = 8;

const loadStudentPhotos = async (items) => {
  const photos = [];

  for (let i = 0; i < items.length; i += PHOTO_BATCH_SIZE) {
    photos.push(
      ...(await Promise.all(
        items
          .slice(i, i + PHOTO_BATCH_SIZE)
          .map(loadStudentPhoto)
      ))
    );
  }

  return photos;
};

// =====================================================
// FONTS (Google Fonts, SIL Open Font License,
// licences next to the files in src/assets/fonts)
// =====================================================

const FONT_DIR = fileURLToPath(
  new URL("../assets/fonts/", import.meta.url)
);

const FONTS = {
  title: "CinzelDecorative-Bold.ttf",
  script: "GreatVibes-Regular.ttf",
  serif: "CrimsonText-Regular.ttf",
  serifItalic: "CrimsonText-Italic.ttf",
  serifSemi: "CrimsonText-SemiBold.ttf",
  serifBold: "CrimsonText-Bold.ttf",
  sans: "Lato-Regular.ttf",
  sansBold: "Lato-Bold.ttf",
  sansBlack: "Lato-Black.ttf",
};

const registerFonts = (doc) => {
  for (const [name, file] of Object.entries(FONTS)) {
    doc.registerFont(name, path.join(FONT_DIR, file));
  }
};

// =====================================================
// COLOURS
// =====================================================

const NAVY = "#142B4A";
const MAROON = "#8B1E2D";
const GOLD = "#B8860B";
const GOLD_LIGHT = "#E9C46A";
const INK = "#2D3748";
const MUTED = "#5A6577";
const PAPER = "#FFFDF7";
const GREEN = "#176B3A";

// Medal colours: [rim, light centre, text]
const MEDALS = {
  1: ["#B8860B", "#FBE7A1", "#5C4300"],
  2: ["#7D8590", "#EEF0F3", "#2F3640"],
  3: ["#9A5B2A", "#F3C9A0", "#4A2A10"],
  participation: ["#142B4A", "#3C5A86", "#FFFFFF"],
};

const PLACE_NAMES = {
  1: "First Place",
  2: "Second Place",
  3: "Third Place",
};

const PLACE_SHORT = {
  1: "1st",
  2: "2nd",
  3: "3rd",
};

// =====================================================
// SMALL HELPERS
// =====================================================

const formatLongDate = (value) => {
  const date = value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

// "05 to 07 November 2026" / "30 November to 02 December 2026"
const formatDateRange = (start, end) => {
  const from = start ? new Date(start) : null;
  const to = end ? new Date(end) : null;

  if (!from || Number.isNaN(from.getTime())) {
    return "";
  }

  if (!to || Number.isNaN(to.getTime()) || from.toDateString() === to.toDateString()) {
    return `on ${formatLongDate(from)}`;
  }

  const part = (date, options) =>
    date.toLocaleDateString("en-IN", { ...options, timeZone: "Asia/Kolkata" });

  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `from ${part(from, { day: "2-digit" })} to ${formatLongDate(to)}`;
  }

  return `from ${part(from, { day: "2-digit", month: "long" })} to ${formatLongDate(to)}`;
};

const titleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (letter) => letter.toUpperCase());

// Largest font size (down to `min`) at which text fits
const fitFontSize = (doc, font, text, maxWidth, size, min) => {
  let fontSize = size;

  doc.font(font);

  while (fontSize > min && doc.fontSize(fontSize).widthOfString(text) > maxWidth) {
    fontSize -= 1;
  }

  return fontSize;
};

const drawDiamond = (doc, x, y, size, color) => {
  doc
    .save()
    .moveTo(x, y - size)
    .lineTo(x + size, y)
    .lineTo(x, y + size)
    .lineTo(x - size, y)
    .closePath()
    .fill(color)
    .restore();
};

const drawStar = (doc, cx, cy, outer, inner, color) => {
  doc.save();

  for (let i = 0; i < 10; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);

    if (i === 0) {
      doc.moveTo(x, y);
    } else {
      doc.lineTo(x, y);
    }
  }

  doc.closePath().fill(color).restore();
};

// Gold line with a diamond in the middle
const drawOrnamentLine = (doc, cx, y, halfWidth) => {
  doc
    .save()
    .moveTo(cx - halfWidth, y)
    .lineTo(cx - 8, y)
    .moveTo(cx + 8, y)
    .lineTo(cx + halfWidth, y)
    .lineWidth(0.8)
    .strokeColor(GOLD)
    .stroke()
    .restore();

  drawDiamond(doc, cx, y, 4, GOLD);
};

// Centred paragraph that mixes fonts and colours.
// segments: [{ text, font, color }]. Words are wrapped and
// each line is centred by hand, because PDFKit mis-centres
// lines that switch font part-way.
const drawRichParagraph = (doc, segments, { centreX, top, width, fontSize, lineHeight }) => {
  const words = [];

  for (const segment of segments) {
    for (const part of segment.text.split(/(\s+)/)) {
      if (part) {
        words.push({ ...segment, text: part, space: /^\s+$/.test(part) });
      }
    }
  }

  const measure = (word) => doc.font(word.font).fontSize(fontSize).widthOfString(word.text);

  const lines = [];
  let line = [];
  let lineWidth = 0;

  for (const word of words) {
    const wordWidth = measure(word);

    if (!word.space && line.length && lineWidth + wordWidth > width) {
      lines.push(line);
      line = [];
      lineWidth = 0;
    }

    if (word.space && line.length === 0) {
      continue;
    }

    line.push({ ...word, width: wordWidth });
    lineWidth += wordWidth;
  }

  if (line.length) {
    lines.push(line);
  }

  lines.forEach((items, index) => {
    while (items.length && items[items.length - 1].space) {
      items.pop();
    }

    const total = items.reduce((sum, item) => sum + item.width, 0);
    let x = centreX - total / 2;
    const y = top + index * lineHeight;

    for (const item of items) {
      if (!item.space) {
        doc
          .font(item.font)
          .fontSize(fontSize)
          .fillColor(item.color)
          .text(item.text, x, y, { lineBreak: false });
      }

      x += item.width;
    }
  });

  return top + lines.length * lineHeight;
};

const drawImageSafely = (doc, image, x, y, options, label) => {
  if (!image) {
    return false;
  }

  try {
    doc.image(image, x, y, options);
    return true;
  } catch (error) {
    console.error(`Certificate ${label} error:`, error.message);
    return false;
  }
};

// =====================================================
// DRAW ONE CERTIFICATE ON THE CURRENT PAGE
// =====================================================

const drawCertificate = (
  doc,
  {
    certificate,
    meet,
    event,
    application,
    images,
    studentPhotoBuffer,
  }
) => {
  const {
    logo3Buffer,
    logo4Buffer,
    logo5Buffer,
    collegeWatermarkBuffer,
  } = images;

  const W = doc.page.width;
  const H = doc.page.height;
  const cx = W / 2;

  const isWinner = certificate.certificateType === "winner";
  const position = Number(certificate.position) || null;

  const meetName = meet?.name || certificate.meetName || "Sports Meet";
  const eventName = titleCase(event?.name || certificate.eventName || "");

  // =================================================
  // PAPER + FRAME
  // =================================================

  doc.rect(0, 0, W, H).fill(PAPER);

  // Navy outer band
  doc.save().rect(12, 12, W - 24, H - 24).lineWidth(7).strokeColor(NAVY).stroke().restore();

  // Double gold rules
  doc.save().rect(22, 22, W - 44, H - 44).lineWidth(1.6).strokeColor(GOLD).stroke().restore();
  doc.save().rect(27, 27, W - 54, H - 54).lineWidth(0.5).strokeColor(GOLD).stroke().restore();

  // Corner ornaments
  const corners = [
    [27, 27, 1, 1],
    [W - 27, 27, -1, 1],
    [27, H - 27, 1, -1],
    [W - 27, H - 27, -1, -1],
  ];

  for (const [x, y, dx, dy] of corners) {
    doc
      .save()
      .moveTo(x + dx * 10, y + dy * 48)
      .lineTo(x + dx * 10, y + dy * 10)
      .lineTo(x + dx * 48, y + dy * 10)
      .lineWidth(1.2)
      .strokeColor(GOLD)
      .stroke()
      .restore();

    drawDiamond(doc, x + dx * 10, y + dy * 10, 5, GOLD);
    drawDiamond(doc, x + dx * 52, y + dy * 10, 2.5, GOLD);
    drawDiamond(doc, x + dx * 10, y + dy * 52, 2.5, GOLD);
  }

  // =================================================
  // WATERMARK (college building, very light)
  // =================================================

  if (collegeWatermarkBuffer) {
    doc.save().opacity(0.04);
    drawImageSafely(
      doc,
      collegeWatermarkBuffer,
      cx - 240,
      175,
      { fit: [480, 300], align: "center", valign: "center" },
      "watermark"
    );
    doc.restore();
  }

  // =================================================
  // HEADER
  // =================================================

  drawImageSafely(doc, logo3Buffer, 52, 40, { fit: [74, 74], align: "center", valign: "center" }, "left logo");
  drawImageSafely(doc, logo4Buffer, W - 126, 40, { fit: [74, 74], align: "center", valign: "center" }, "right logo");
  drawImageSafely(doc, logo5Buffer, cx - 15, 34, { fit: [30, 30], align: "center", valign: "center" }, "emblem");

  doc
    .font("sansBold")
    .fontSize(7.5)
    .fillColor(MUTED)
    .text("GOVERNMENT OF KARNATAKA   ·   DEPARTMENT OF TECHNICAL EDUCATION", 140, 68, {
      width: W - 280,
      align: "center",
      characterSpacing: 1.2,
    });

  doc
    .font("serifBold")
    .fontSize(22)
    .fillColor(MAROON)
    .text("KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU", 130, 78, {
      width: W - 260,
      align: "center",
    });

  doc
    .font("serifItalic")
    .fontSize(9.5)
    .fillColor(MUTED)
    .text(
      "An Autonomous Institution under AICTE, New Delhi  ·  Kadri Hills, Mangaluru – 575004, Karnataka",
      130,
      104,
      { width: W - 260, align: "center" }
    );

  // =================================================
  // MEET RIBBON
  // =================================================

  const ribbonText = meetName.toUpperCase();

  doc.font("sansBold").fontSize(9.5);

  const ribbonWidth = Math.min(
    doc.widthOfString(ribbonText, { characterSpacing: 2 }) + 70,
    W - 300
  );

  const ribbonY = 124;
  const ribbonH = 21;
  const ribbonLeft = cx - ribbonWidth / 2;
  const ribbonRight = cx + ribbonWidth / 2;

  doc
    .save()
    .moveTo(ribbonLeft - 12, ribbonY)
    .lineTo(ribbonRight + 12, ribbonY)
    .lineTo(ribbonRight, ribbonY + ribbonH / 2)
    .lineTo(ribbonRight + 12, ribbonY + ribbonH)
    .lineTo(ribbonLeft - 12, ribbonY + ribbonH)
    .lineTo(ribbonLeft, ribbonY + ribbonH / 2)
    .closePath()
    .fill(NAVY)
    .restore();

  doc
    .font("sansBold")
    .fontSize(9.5)
    .fillColor(GOLD_LIGHT)
    .text(ribbonText, ribbonLeft, ribbonY + 5.5, {
      width: ribbonWidth,
      align: "center",
      characterSpacing: 2,
      lineBreak: false,
    });

  // =================================================
  // TITLE
  // =================================================

  const goldText = doc
    .linearGradient(cx - 180, 0, cx + 180, 0)
    .stop(0, "#8A6410")
    .stop(0.5, "#D4A72C")
    .stop(1, "#8A6410");

  doc
    .font("title")
    .fontSize(46)
    .fillColor(goldText)
    .text("Certificate", 0, 150, { width: W, align: "center" });

  const subtitle = isWinner ? "OF MERIT" : "OF PARTICIPATION";

  doc.font("sansBlack").fontSize(10.5);
  const subtitleWidth = doc.widthOfString(subtitle, { characterSpacing: 4 });

  doc
    .fillColor(NAVY)
    .text(subtitle, cx - subtitleWidth / 2, 207, {
      characterSpacing: 4,
      lineBreak: false,
    });

  doc
    .save()
    .moveTo(cx - subtitleWidth / 2 - 70, 213)
    .lineTo(cx - subtitleWidth / 2 - 14, 213)
    .moveTo(cx + subtitleWidth / 2 + 14, 213)
    .lineTo(cx + subtitleWidth / 2 + 70, 213)
    .lineWidth(0.8)
    .strokeColor(GOLD)
    .stroke()
    .restore();

  drawDiamond(doc, cx - subtitleWidth / 2 - 9, 213, 3, GOLD);
  drawDiamond(doc, cx + subtitleWidth / 2 + 9, 213, 3, GOLD);

  // =================================================
  // RECIPIENT
  // =================================================

  const textLeft = 200;
  const textWidth = W - 400;

  doc
    .font("serifItalic")
    .fontSize(14)
    .fillColor(MUTED)
    .text("This is to certify that", textLeft, 230, {
      width: textWidth,
      align: "center",
    });

  const studentName = titleCase(certificate.studentName || application?.name || "Student");
  const nameSize = fitFontSize(doc, "script", studentName, textWidth, 52, 30);

  doc
    .font("script")
    .fontSize(nameSize)
    .fillColor(NAVY)
    .text(studentName, textLeft, 244 + (52 - nameSize) / 2, {
      width: textWidth,
      align: "center",
      lineBreak: false,
    });

  drawOrnamentLine(doc, cx, 310, 200);

  const details = [
    certificate.registerNumber && `Reg. No. ${certificate.registerNumber}`,
    application?.semester && `Semester ${application.semester}`,
    application?.branch,
    certificate.collegeCode && `College Code ${certificate.collegeCode}`,
  ].filter(Boolean);

  doc
    .font("sansBold")
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(details.join("   ·   "), textLeft, 318, {
      width: textWidth,
      align: "center",
      characterSpacing: 0.6,
    });

  // =================================================
  // CITATION
  // =================================================

  const venue = meet?.venue ? `, held at ${meet.venue}` : "";
  const dates = formatDateRange(meet?.startDate, meet?.endDate);
  const when = dates ? ` ${dates}` : "";

  const ending = isWinner && position
    ? `${venue}${when}, displaying outstanding skill, determination and true sportsmanship.`
    : `${venue}${when}, and displayed admirable enthusiasm, team spirit and sportsmanship.`;

  const segments = isWinner && position
    ? [
        { text: "has secured ", font: "serif", color: INK },
        { text: PLACE_NAMES[position], font: "serifBold", color: MAROON },
        { text: " in ", font: "serif", color: INK },
        { text: eventName, font: "serifBold", color: NAVY },
        { text: ` at the ${meetName}${ending}`, font: "serif", color: INK },
      ]
    : [
        { text: "has actively participated in ", font: "serif", color: INK },
        { text: eventName, font: "serifBold", color: NAVY },
        { text: ` at the ${meetName}${ending}`, font: "serif", color: INK },
      ];

  drawRichParagraph(doc, segments, {
    centreX: cx,
    top: 347,
    width: textWidth,
    fontSize: 15.5,
    lineHeight: 22,
  });

  // =================================================
  // PHOTO (left)
  // =================================================

  const photoX = 70;
  const photoY = 222;
  const photoW = 100;
  const photoH = 124;

  doc.save().rect(photoX - 5, photoY - 5, photoW + 10, photoH + 10).lineWidth(1.6).strokeColor(GOLD).stroke().restore();
  doc.save().rect(photoX, photoY, photoW, photoH).fill("#FFFFFF").restore();

  const photoDrawn = drawImageSafely(
    doc,
    studentPhotoBuffer,
    photoX + 3,
    photoY + 3,
    { fit: [photoW - 6, photoH - 6], align: "center", valign: "center" },
    "photo"
  );

  if (!photoDrawn) {
    doc
      .font("sansBold")
      .fontSize(8)
      .fillColor("#A0AEC0")
      .text("PHOTO", photoX, photoY + photoH / 2 - 4, { width: photoW, align: "center" });
  }

  doc.save().rect(photoX, photoY, photoW, photoH).lineWidth(0.5).strokeColor(GOLD).stroke().restore();

  // =================================================
  // MEDAL (right)
  // =================================================

  const [rim, centre, medalText] =
    isWinner && position ? MEDALS[position] : MEDALS.participation;

  const mx = W - 120;
  const my = 272;
  const radius = 46;

  // Ribbon tails
  for (const side of [-1, 1]) {
    doc
      .save()
      .moveTo(mx + side * 10, my + 20)
      .lineTo(mx + side * 36, my + 78)
      .lineTo(mx + side * 24, my + 70)
      .lineTo(mx + side * 16, my + 84)
      .lineTo(mx + side * -6, my + 28)
      .closePath()
      .fill(side < 0 ? NAVY : MAROON)
      .restore();
  }

  // Scalloped edge
  doc.save();
  for (let i = 0; i < 24; i++) {
    const angle = (Math.PI * 2 * i) / 24;
    doc.circle(mx + Math.cos(angle) * radius, my + Math.sin(angle) * radius, 5);
  }
  doc.fill(rim).restore();

  const medalFill = doc
    .radialGradient(mx - 12, my - 14, 4, mx, my, radius)
    .stop(0, centre)
    .stop(1, rim);

  doc.save().circle(mx, my, radius).fill(medalFill).restore();
  doc.save().circle(mx, my, radius - 7).dash(2, { space: 2 }).lineWidth(0.8).strokeColor(medalText).opacity(0.6).stroke().restore();

  if (isWinner && position) {
    doc
      .font("serifBold")
      .fontSize(32)
      .fillColor(medalText)
      .text(PLACE_SHORT[position], mx - radius, my - 25, { width: radius * 2, align: "center" });

    doc
      .font("sansBlack")
      .fontSize(8)
      .fillColor(medalText)
      .text("PLACE", mx - radius, my + 12, { width: radius * 2, align: "center", characterSpacing: 2.5 });
  } else {
    drawStar(doc, mx, my - 8, 15, 6.5, GOLD_LIGHT);

    doc
      .font("sansBlack")
      .fontSize(7)
      .fillColor(medalText)
      .text("PARTICIPANT", mx - radius, my + 13, { width: radius * 2, align: "center", characterSpacing: 1.2 });
  }

  // =================================================
  // SIGNATURES + CERTIFICATE DETAILS
  // =================================================

  const signY = 478;

  const drawSignature = (x, title) => {
    doc.save().moveTo(x, signY).lineTo(x + 170, signY).lineWidth(0.8).strokeColor(NAVY).stroke().restore();

    doc
      .font("serifSemi")
      .fontSize(13)
      .fillColor(NAVY)
      .text(title, x, signY + 6, { width: 170, align: "center" });

    doc
      .font("sans")
      .fontSize(8)
      .fillColor(MUTED)
      .text("Karnataka (Govt.) Polytechnic, Mangaluru", x - 15, signY + 23, { width: 200, align: "center" });
  };

  drawSignature(80, "Sports Officer");
  drawSignature(W - 250, "Principal");

  doc
    .font("sansBold")
    .fontSize(8.5)
    .fillColor(NAVY)
    .text(`Certificate No. ${certificate.certificateNumber || ""}`, cx - 130, signY - 4, {
      width: 260,
      align: "center",
      characterSpacing: 0.5,
    });

  doc
    .font("sans")
    .fontSize(8.5)
    .fillColor(MUTED)
    .text(`Issued on ${formatLongDate(certificate.issuedAt || new Date())}  ·  Mangaluru`, cx - 130, signY + 10, {
      width: 260,
      align: "center",
    });

  // =================================================
  // MOTTO
  // =================================================

  drawOrnamentLine(doc, cx, H - 50, 120);

  doc
    .font("sansBold")
    .fontSize(7.5)
    .fillColor(GREEN)
    .text("TECHNICAL EDUCATION FOR A BRIGHTER TOMORROW", 0, H - 43, {
      width: W,
      align: "center",
      characterSpacing: 2,
      lineBreak: false,
    });
};

// =====================================================
// GENERATE ONE PDF WITH ONE CERTIFICATE PER PAGE
//
// items: [{ certificate, meet, event, application }]
// =====================================================

export const generateCertificatesPdf = async (
  items
) => {
  const [images, photos] = await Promise.all([
    loadSharedImages(),
    loadStudentPhotos(items),
  ]);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        layout: "landscape",
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      });

      const chunks = [];

      doc.on("data", (chunk) => {
        chunks.push(chunk);
      });

      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on("error", reject);

      registerFonts(doc);

      // Open each logo once, so it is stored in the PDF
      // once instead of once per page.
      const openedImages = Object.fromEntries(
        Object.entries(images).map(([name, buffer]) => [
          name,
          buffer ? doc.openImage(buffer) : null,
        ])
      );

      items.forEach((item, index) => {
        if (index > 0) {
          doc.addPage();
        }

        drawCertificate(doc, {
          ...item,
          images: openedImages,
          studentPhotoBuffer: photos[index],
        });
      });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// =====================================================
// GENERATE A SINGLE CERTIFICATE PDF
// =====================================================

const generateCertificatePdf = (item) =>
  generateCertificatesPdf([item]);

export default generateCertificatePdf;
