import PDFDocument from "pdfkit";

// =====================================================
// DOWNLOAD IMAGE FROM URL
//
// Only Cloudinary images are fetched. Cloudinary is
// asked for JPEG, because PDFKit cannot embed WEBP/HEIC.
// Returns null when the image is not available.
// =====================================================

const CLOUDINARY_HOST = "https://res.cloudinary.com/";

const downloadImage = async (
  url,
  imageName = "image"
) => {
  try {
    if (
      !url ||
      !url.startsWith(CLOUDINARY_HOST) ||
      !url.includes("/upload/")
    ) {
      console.error(
        `${imageName}: missing or unsupported URL`
      );

      return null;
    }

    const response = await fetch(
      url.replace("/upload/", "/upload/f_jpg/")
    );

    if (!response.ok) {
      console.error(
        `${imageName}: download failed (${response.status})`
      );

      return null;
    }

    return Buffer.from(
      await response.arrayBuffer()
    );
  } catch (error) {
    console.error(
      `${imageName}: download error:`,
      error.message
    );

    return null;
  }
};

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
// GENERATE CERTIFICATE PDF
// =====================================================

const generateCertificatePdf = async ({
  certificate,
  meet,
  event,
  application,
}) => {
  // =====================================================
  // CLOUDINARY LOGOS
  // =====================================================

  const collegeWatermarkUrl =
    "https://res.cloudinary.com/tszalf5h/image/upload/v1790564455/clgimg1.jpg";

  const logo3Url =
    "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932916/logo3_vptob4.jpg";

  const logo4Url =
    "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932915/logo4_q0ujtn.png";

  const logo5Url =
    "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932915/logo5_czeuoz.png";

  // =====================================================
  // STUDENT PHOTO
  //
  // FIRST: Certificate.photo
  // FALLBACK: Application.photo
  // =====================================================

  const studentPhotoUrl =
    certificate?.photo?.url ||
    application?.photo?.url ||
    "";

  const studentPhotoPublicId =
    certificate?.photo?.publicId ||
    application?.photo?.publicId ||
    "";

  // =====================================================
  // DOWNLOAD HEADER LOGOS + COLLEGE WATERMARK
  // =====================================================

  const [
    logo3Buffer,
    logo4Buffer,
    logo5Buffer,
    collegeWatermarkBuffer,
  ] = await Promise.all([
    downloadImage(
      logo3Url,
      "LEFT COLLEGE LOGO"
    ),

    downloadImage(
      logo4Url,
      "RIGHT COLLEGE LOGO"
    ),

    downloadImage(
      logo5Url,
      "KARNATAKA EMBLEM"
    ),

    downloadImage(
      collegeWatermarkUrl,
      "COLLEGE BUILDING WATERMARK"
    ),
  ]);

  // =====================================================
  // DOWNLOAD STUDENT PHOTO
  //
  // ATTEMPT 1: stored photo URL
  // ATTEMPT 2: URL rebuilt from the Cloudinary publicId
  // =====================================================

  let studentPhotoBuffer = null;

  if (studentPhotoUrl) {
    studentPhotoBuffer =
      await downloadImage(
        studentPhotoUrl,
        "STUDENT PHOTO FROM URL"
      );
  }

  if (
    !studentPhotoBuffer &&
    studentPhotoPublicId
  ) {
    studentPhotoBuffer =
      await downloadImage(
        createCloudinaryJpgUrl(
          studentPhotoPublicId
        ),
        "STUDENT PHOTO FROM PUBLIC ID"
      );
  }

  if (!studentPhotoBuffer) {
    console.error(
      `No usable student photo for certificate ${certificate?.certificateNumber}`
    );
  }

  // =====================================================
  // CREATE PDF
  // =====================================================

  return new Promise(
    (resolve, reject) => {
      try {
        const doc =
          new PDFDocument({
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
          resolve(
            Buffer.concat(chunks)
          );
        });

        doc.on("error", (error) => {
          reject(error);
        });

        // =================================================
        // PAGE SIZE
        // =================================================

        const pageWidth =
          doc.page.width;

        const pageHeight =
          doc.page.height;

        const centerX =
          pageWidth / 2;

        // =================================================
        // COLORS
        // =================================================

        const NAVY =
          "#142B4A";

        const DARK_NAVY =
          "#0B1F36";

        const GOLD =
          "#B8860B";

        const LIGHT_GOLD =
          "#D6B45A";

        const MAROON =
          "#8B1E2D";

        const GREEN =
          "#176B3A";

        const TEXT =
          "#25354A";

// =================================================
// BACKGROUND
// =================================================

doc
  .rect(
    0,
    0,
    pageWidth,
    pageHeight
  )
  .fill("#FFFFFF");

// =================================================
// COLLEGE BUILDING WATERMARK
// =================================================

if (collegeWatermarkBuffer) {
  try {

    doc.save();

    doc.opacity(0.07);

    doc.image(
      collegeWatermarkBuffer,
      centerX - 260,
      190,
      {
        fit: [520, 350],
        align: "center",
        valign: "center",
      }
    );

    doc.restore();

  } catch (error) {
    console.error(
      "COLLEGE WATERMARK PDF ERROR:",
      error.message
    );
  }
}

        // =================================================
        // TOP LEFT DECORATION
        // =================================================

        doc
          .fillColor(DARK_NAVY)
          .moveTo(0, 0)
          .lineTo(155, 0)
          .lineTo(45, 28)
          .lineTo(0, 28)
          .closePath()
          .fill();

        doc
          .fillColor(GOLD)
          .moveTo(0, 28)
          .lineTo(55, 28)
          .lineTo(175, 0)
          .lineTo(145, 0)
          .closePath()
          .fill();

        // =================================================
        // BOTTOM RIGHT DECORATION
        // =================================================

        doc
          .fillColor(DARK_NAVY)
          .moveTo(
            pageWidth,
            pageHeight
          )
          .lineTo(
            pageWidth - 155,
            pageHeight
          )
          .lineTo(
            pageWidth - 45,
            pageHeight - 28
          )
          .lineTo(
            pageWidth,
            pageHeight - 28
          )
          .closePath()
          .fill();

        doc
          .fillColor(GOLD)
          .moveTo(
            pageWidth,
            pageHeight - 28
          )
          .lineTo(
            pageWidth - 55,
            pageHeight - 28
          )
          .lineTo(
            pageWidth - 175,
            pageHeight
          )
          .lineTo(
            pageWidth - 145,
            pageHeight
          )
          .closePath()
          .fill();

        // =================================================
        // OUTER BORDER
        // =================================================

        doc
          .lineWidth(2.5)
          .strokeColor(GOLD)
          .roundedRect(
            18,
            18,
            pageWidth - 36,
            pageHeight - 36,
            3
          )
          .stroke();

        // =================================================
        // INNER BORDER
        // =================================================

        doc
          .lineWidth(0.8)
          .strokeColor(NAVY)
          .roundedRect(
            28,
            28,
            pageWidth - 56,
            pageHeight - 56,
            2
          )
          .stroke();

        // =================================================
        // CORNER CROSSES
        // =================================================

        const crossSize = 12;

        const cornerPoints = [
          [42, 50],
          [pageWidth - 42, 50],
          [42, pageHeight - 50],
          [
            pageWidth - 42,
            pageHeight - 50,
          ],
        ];

        cornerPoints.forEach(
          ([x, y]) => {
            doc
              .lineWidth(1.5)
              .strokeColor(GOLD)
              .moveTo(
                x - crossSize,
                y
              )
              .lineTo(
                x + crossSize,
                y
              )
              .moveTo(
                x,
                y - crossSize
              )
              .lineTo(
                x,
                y + crossSize
              )
              .stroke();
          }
        );

        // =================================================
        // LEFT COLLEGE LOGO
        // =================================================

        if (logo3Buffer) {
          doc.image(
            logo3Buffer,
            55,
            48,
            {
              fit: [88, 82],
              align: "center",
              valign: "center",
            }
          );
        }

        // =================================================
        // RIGHT COLLEGE LOGO
        // =================================================

        if (logo4Buffer) {
          doc.image(
            logo4Buffer,
            pageWidth - 143,
            48,
            {
              fit: [88, 82],
              align: "center",
              valign: "center",
            }
          );
        }

        // =================================================
        // KARNATAKA EMBLEM
        // ABOVE GOVERNMENT TEXT
        // =================================================

        if (logo5Buffer) {
          doc.image(
            logo5Buffer,
            centerX - 20,
            29,
            {
              fit: [40, 27],
              align: "center",
              valign: "center",
            }
          );
        }

        // =================================================
        // GOVERNMENT OF KARNATAKA
        // =================================================

        doc
          .fillColor(NAVY)
          .font("Times-Bold")
          .fontSize(15)
          .text(
            "GOVERNMENT OF KARNATAKA",
            180,
            61,
            {
              width:
                pageWidth - 360,
              align: "center",
            }
          );

        // =================================================
        // DEPARTMENT
        // =================================================

        doc
          .fillColor(NAVY)
          .font("Times-Roman")
          .fontSize(10)
          .text(
            "DEPARTMENT OF TECHNICAL EDUCATION",
            180,
            80,
            {
              width:
                pageWidth - 360,
              align: "center",
            }
          );

        // =================================================
        // COLLEGE NAME
        // =================================================

        doc
          .fillColor(MAROON)
          .font("Times-Bold")
          .fontSize(15)
          .text(
            "KARNATAKA (GOVT.) POLYTECHNIC, MANGALURU",
            150,
            98,
            {
              width:
                pageWidth - 300,
              align: "center",
            }
          );

        // =================================================
        // AUTONOMOUS
        // =================================================

        doc
          .fillColor(NAVY)
          .font("Times-Roman")
          .fontSize(8.5)
          .text(
            "(An Autonomous Institution under AICTE, New Delhi)",
            160,
            118,
            {
              width:
                pageWidth - 320,
              align: "center",
            }
          );

        // =================================================
        // ADDRESS
        // =================================================

        doc
          .fontSize(8.5)
          .text(
            "Kadri Hills, Mangaluru – 575004, Dakshina Kannada, Karnataka",
            160,
            132,
            {
              width:
                pageWidth - 320,
              align: "center",
            }
          );

        // =================================================
        // HEADER DIVIDER
        // =================================================

        const dividerY =
          150;

        doc
          .lineWidth(1)
          .strokeColor(GOLD)
          .moveTo(
            275,
            dividerY
          )
          .lineTo(
            centerX - 20,
            dividerY
          )
          .stroke();

        doc
          .moveTo(
            centerX + 20,
            dividerY
          )
          .lineTo(
            pageWidth - 275,
            dividerY
          )
          .stroke();

        // =================================================
        // CENTER DIAMONDS
        // =================================================

        doc
          .fillColor(GOLD)
          .moveTo(
            centerX,
            dividerY - 7
          )
          .lineTo(
            centerX + 7,
            dividerY
          )
          .lineTo(
            centerX,
            dividerY + 7
          )
          .lineTo(
            centerX - 7,
            dividerY
          )
          .closePath()
          .fill();

        doc
          .fillColor(GOLD)
          .moveTo(
            centerX - 17,
            dividerY
          )
          .lineTo(
            centerX - 11,
            dividerY - 5
          )
          .lineTo(
            centerX - 5,
            dividerY
          )
          .lineTo(
            centerX - 11,
            dividerY + 5
          )
          .closePath()
          .fill();

        doc
          .fillColor(GOLD)
          .moveTo(
            centerX + 17,
            dividerY
          )
          .lineTo(
            centerX + 11,
            dividerY - 5
          )
          .lineTo(
            centerX + 5,
            dividerY
          )
          .lineTo(
            centerX + 11,
            dividerY + 5
          )
          .closePath()
          .fill();

        // =================================================
        // SPORTS MEET NAME
        // =================================================

        const meetName =
          meet?.name ||
          certificate?.meetName ||
          "SPORTS MEET";

        const meetYear =
          meet?.year
            ? ` ${meet.year}`
            : "";

        doc
          .fillColor(GREEN)
          .font("Times-Bold")
          .fontSize(11)
          .text(
            `${meetName}${meetYear}`,
            100,
            161,
            {
              width:
                pageWidth - 200,
              align: "center",
            }
          );

        // =================================================
        // CERTIFICATE
        // =================================================

        doc
          .fillColor(NAVY)
          .font("Times-Bold")
          .fontSize(30)
          .text(
            "CERTIFICATE",
            100,
            178,
            {
              width:
                pageWidth - 200,
              align: "center",
            }
          );

        // =================================================
        // MERIT / PARTICIPATION
        // =================================================

        const isWinner =
          certificate.certificateType ===
          "winner";

        doc
          .fillColor(GOLD)
          .font("Times-Bold")
          .fontSize(12)
          .text(
            isWinner
              ? "OF MERIT"
              : "OF PARTICIPATION",
            100,
            216,
            {
              width:
                pageWidth - 200,
              align: "center",
            }
          );

        // =================================================
        // GOLD LINE
        // =================================================

        doc
          .lineWidth(1)
          .strokeColor(
            LIGHT_GOLD
          )
          .moveTo(
            centerX - 42,
            235
          )
          .lineTo(
            centerX + 42,
            235
          )
          .stroke();

        // =================================================
        // STUDENT PHOTO
        // =================================================

        const photoX = 72;
        const photoY = 298;
        const photoWidth = 92;
        const photoHeight = 112;

        // Outer frame
        doc
          .lineWidth(2)
          .strokeColor(GOLD)
          .rect(
            photoX,
            photoY,
            photoWidth,
            photoHeight
          )
          .stroke();

        // Inner frame
        doc
          .lineWidth(0.8)
          .strokeColor(
            LIGHT_GOLD
          )
          .rect(
            photoX + 4,
            photoY + 4,
            photoWidth - 8,
            photoHeight - 8
          )
          .stroke();

        // =================================================
        // INSERT STUDENT PHOTO
        // =================================================

        if (studentPhotoBuffer) {
          try {
            doc.image(
              studentPhotoBuffer,
              photoX + 5,
              photoY + 5,
              {
                fit: [
                  photoWidth - 10,
                  photoHeight - 10,
                ],
                align: "center",
                valign: "center",
              }
            );

          } catch (error) {
            console.error(
              "PDFKit PHOTO ERROR:",
              error.message
            );

            doc
              .fillColor("#F7F8FA")
              .rect(
                photoX + 5,
                photoY + 5,
                photoWidth - 10,
                photoHeight - 10
              )
              .fill();

            doc
              .fillColor(TEXT)
              .font(
                "Times-Roman"
              )
              .fontSize(8)
              .text(
                "PHOTO ERROR",
                photoX + 5,
                photoY + 52,
                {
                  width:
                    photoWidth - 10,
                  align:
                    "center",
                }
              );
          }
        } else {
          console.error(
            "PHOTO NOT AVAILABLE FOR PDF."
          );

          doc
            .fillColor("#F7F8FA")
            .rect(
              photoX + 5,
              photoY + 5,
              photoWidth - 10,
              photoHeight - 10
            )
            .fill();

          doc
            .fillColor(TEXT)
            .font(
              "Times-Roman"
            )
            .fontSize(8)
            .text(
              "PHOTO NOT FOUND",
              photoX + 5,
              photoY + 50,
              {
                width:
                  photoWidth - 10,
                align:
                  "center",
              }
            );
        }

        // =================================================
        // MAIN CONTENT
        // =================================================

        const contentX =
          190;

        const contentWidth =
          pageWidth - 380;

        // =================================================
        // INTRODUCTION
        // =================================================

        doc
          .fillColor(TEXT)
          .font("Times-Roman")
          .fontSize(11)
          .text(
            "This certificate is proudly presented to",
            contentX,
            252,
            {
              width:
                contentWidth,
              align: "center",
            }
          );

        // =================================================
        // STUDENT NAME
        // =================================================

        doc
          .fillColor(MAROON)
          .font("Times-Bold")
          .fontSize(27)
          .text(
            String(
              certificate.studentName ||
                "STUDENT"
            ).toUpperCase(),
            contentX,
            274,
            {
              width:
                contentWidth,
              align: "center",
            }
          );

        // =================================================
        // GOLD LINE BELOW NAME
        // =================================================

        doc
          .lineWidth(1)
          .strokeColor(
            LIGHT_GOLD
          )
          .moveTo(
            centerX - 75,
            308
          )
          .lineTo(
            centerX + 75,
            308
          )
          .stroke();

        // =================================================
        // REGISTER NUMBER
        // =================================================

        doc
          .fillColor(NAVY)
          .font("Times-Roman")
          .fontSize(9)
          .text(
            `Register Number: ${
              certificate.registerNumber ||
              "-"
            }`,
            contentX,
            316,
            {
              width:
                contentWidth,
              align: "center",
            }
          );

        // =================================================
        // WINNER / PARTICIPATION
        // =================================================

        if (isWinner) {
          const positionText =
            certificate.position === 1
              ? "FIRST PLACE"
              : certificate.position === 2
              ? "SECOND PLACE"
              : "THIRD PLACE";

          // -----------------------------------------------
          // PARAGRAPH LINE 1
          // -----------------------------------------------

          doc
            .fillColor(TEXT)
            .font("Times-Roman")
            .fontSize(10.5)
            .text(
              "in recognition of outstanding achievement and",
              contentX,
              338,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );

          // -----------------------------------------------
          // PARAGRAPH LINE 2
          // -----------------------------------------------

          doc
            .fillColor(TEXT)
            .font("Times-Roman")
            .fontSize(10.5)
            .text(
              "commendable performance in the",
              contentX,
              354,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );

          // -----------------------------------------------
          // POSITION
          // -----------------------------------------------

          doc
            .fillColor(GOLD)
            .font("Times-Bold")
            .fontSize(19)
            .text(
              positionText,
              contentX,
              374,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );

          // -----------------------------------------------
          // EVENT INTRODUCTION
          // -----------------------------------------------

          doc
            .fillColor(TEXT)
            .font("Times-Roman")
            .fontSize(10.5)
            .text(
              "in the following sporting event:",
              contentX,
              399,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );
        } else {
          // -----------------------------------------------
          // PARTICIPATION PARAGRAPH
          // -----------------------------------------------

          doc
            .fillColor(TEXT)
            .font("Times-Roman")
            .fontSize(10.5)
            .text(
              "in recognition of active participation,",
              contentX,
              344,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );

          doc
            .fillColor(TEXT)
            .font("Times-Roman")
            .fontSize(10.5)
            .text(
              "enthusiasm and commendable sportsmanship",
              contentX,
              360,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );

          doc
            .fillColor(TEXT)
            .font("Times-Roman")
            .fontSize(10.5)
            .text(
              "in the following sporting event:",
              contentX,
              376,
              {
                width:
                  contentWidth,
                align: "center",
              }
            );
        }

        // =================================================
        // EVENT NAME
        // =================================================

        const eventY =
          isWinner
            ? 420
            : 398;

        doc
          .fillColor(NAVY)
          .font("Times-Bold")
          .fontSize(21)
          .text(
            String(
              event?.name ||
                certificate.eventName ||
                "SPORTS EVENT"
            ).toUpperCase(),
            180,
            eventY,
            {
              width:
                pageWidth - 360,
              align: "center",
            }
          );

        // =================================================
        // GOLD LINE
        // =================================================

        doc
          .lineWidth(1)
          .strokeColor(
            LIGHT_GOLD
          )
          .moveTo(
            centerX - 70,
            eventY + 29
          )
          .lineTo(
            centerX + 70,
            eventY + 29
          )
          .stroke();

        // =================================================
        // SPORTS MEET
        // =================================================

        doc
          .fillColor(GREEN)
          .font("Times-Bold")
          .fontSize(10)
          .text(
            `${meetName}${meetYear}`,
            180,
            eventY + 38,
            {
              width:
                pageWidth - 360,
              align: "center",
            }
          );

        // =================================================
        // INSTITUTION
        // =================================================

        doc
          .fillColor(TEXT)
          .font("Times-Roman")
          .fontSize(8)
          .text(
            `Representing Institution Code: ${
              certificate.collegeCode ||
              "-"
            }`,
            180,
            eventY + 55,
            {
              width:
                pageWidth - 360,
              align: "center",
            }
          );

        // =================================================
        // MERIT / SPORTS SEAL
        // =================================================

        const sealX =
          pageWidth - 105;

        const sealY = 365;

        const sealRadius = 42;

        doc
          .lineWidth(2)
          .strokeColor(GOLD)
          .circle(
            sealX,
            sealY,
            sealRadius
          )
          .stroke();

        doc
          .lineWidth(1)
          .strokeColor(
            LIGHT_GOLD
          )
          .circle(
            sealX,
            sealY,
            sealRadius - 7
          )
          .stroke();

        // =================================================
        // STAR FUNCTION
        // =================================================

        const drawStar = (
          cx,
          cy,
          outerRadius,
          innerRadius
        ) => {
          const points = 5;

          const angle =
            -Math.PI / 2;

          doc.moveTo(
            cx +
              Math.cos(angle) *
                outerRadius,
            cy +
              Math.sin(angle) *
                outerRadius
          );

          for (
            let i = 1;
            i < points * 2;
            i++
          ) {
            const radius =
              i % 2 === 0
                ? outerRadius
                : innerRadius;

            const currentAngle =
              angle +
              (Math.PI / points) *
                i;

            doc.lineTo(
              cx +
                Math.cos(
                  currentAngle
                ) *
                  radius,
              cy +
                Math.sin(
                  currentAngle
                ) *
                  radius
            );
          }

          doc.closePath();

          doc.fill();
        };

        doc.fillColor(GOLD);

        drawStar(
          sealX - 15,
          sealY - 18,
          5,
          2
        );

        drawStar(
          sealX,
          sealY - 18,
          5,
          2
        );

        drawStar(
          sealX + 15,
          sealY - 18,
          5,
          2
        );

        // =================================================
        // SEAL TEXT
        // =================================================

        doc
          .fillColor(NAVY)
          .font("Times-Bold")
          .fontSize(8)
          .text(
            isWinner
              ? "MERIT"
              : "SPORTS",
            sealX - 30,
            sealY - 2,
            {
              width: 60,
              align: "center",
            }
          );

        doc
          .fontSize(7)
          .text(
            isWinner
              ? "ACHIEVEMENT"
              : "PARTICIPATION",
            sealX - 35,
            sealY + 11,
            {
              width: 70,
              align: "center",
            }
          );

        doc
          .fillColor(GOLD)
          .fontSize(6.5)
          .text(
            "KPT MANGALURU",
            sealX - 35,
            sealY + 25,
            {
              width: 70,
              align: "center",
            }
          );

        // =================================================
        // FOOTER
        // =================================================

        const footerY =
          pageHeight - 125;

        const issuedDate =
          new Date(
            certificate.issuedAt ||
              Date.now()
          );

        const formattedDate =
          issuedDate.toLocaleDateString(
            "en-IN"
          );

        // =================================================
        // CERTIFICATE NUMBER
        // =================================================

        doc
          .fillColor(TEXT)
          .font("Times-Roman")
          .fontSize(8)
          .text(
            `Certificate No.: ${
              certificate.certificateNumber ||
              "-"
            }`,
            55,
            footerY,
            {
              width: 300,
              align: "left",
            }
          );

        // =================================================
        // DATE
        // =================================================

        doc
          .text(
            `Date of Issue: ${formattedDate}`,
            pageWidth - 305,
            footerY,
            {
              width: 250,
              align: "right",
            }
          );

        // =================================================
        // PLACE
        // =================================================

        doc
          .text(
            "Place: Mangaluru",
            pageWidth - 305,
            footerY + 15,
            {
              width: 250,
              align: "right",
            }
          );

        // =================================================
        // SPORTS OFFICER
        // =================================================

        const signatureY =
          pageHeight - 67;

        doc
          .lineWidth(1)
          .strokeColor(NAVY)
          .moveTo(
            65,
            signatureY
          )
          .lineTo(
            250,
            signatureY
          )
          .stroke();

        doc
          .fillColor(NAVY)
          .font("Times-Bold")
          .fontSize(9)
          .text(
            "Sports Officer",
            65,
            signatureY + 5,
            {
              width: 185,
              align: "center",
            }
          );

        // =================================================
        // PRINCIPAL
        // =================================================

        doc
          .moveTo(
            pageWidth - 250,
            signatureY
          )
          .lineTo(
            pageWidth - 65,
            signatureY
          )
          .stroke();

        doc
          .fillColor(MAROON)
          .font("Times-Bold")
          .fontSize(9)
          .text(
            "Principal",
            pageWidth - 250,
            signatureY + 5,
            {
              width: 185,
              align: "center",
            }
          );

        // =================================================
        // BOTTOM MOTTO
        // =================================================

        doc
          .fillColor(GREEN)
          .font("Times-Bold")
          .fontSize(7)
          .text(
            "TECHNICAL EDUCATION FOR A BRIGHTER TOMORROW",
            250,
            pageHeight - 37,
            {
              width:
                pageWidth - 500,
              align: "center",
            }
          );

        // =================================================
        // FINISH
        // =================================================

        doc.end();
      } catch (error) {
        reject(error);
      }
    }
  );
};

export default generateCertificatePdf;