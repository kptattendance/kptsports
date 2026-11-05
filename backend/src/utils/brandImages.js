// =====================================================
// COLLEGE LOGOS AND IMAGE DOWNLOAD
// Used by the certificates and by the list PDFs.
// =====================================================

export const CLOUDINARY_HOST = "https://res.cloudinary.com/";

export const COLLEGE_WATERMARK_URL =
  "https://res.cloudinary.com/tszalf5h/image/upload/v1790564455/clgimg1.jpg";

// Left college logo
export const LOGO3_URL =
  "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932916/logo3_vptob4.jpg";

// Right college logo
export const LOGO4_URL =
  "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932915/logo4_q0ujtn.png";

// Karnataka emblem
export const LOGO5_URL =
  "https://res.cloudinary.com/dnreqxbdw/image/upload/v1757932915/logo5_czeuoz.png";

// =====================================================
// DOWNLOAD IMAGE FROM URL
//
// Only Cloudinary images are fetched. Cloudinary is
// asked for JPEG, because PDFKit cannot embed WEBP/HEIC.
// Returns null when the image is not available.
// =====================================================

export const downloadImage = async (
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
// HEADER LOGOS FOR LIST PDFS
// Kept in memory, so every list does not download them
// again. A failed download is tried again next time.
// =====================================================

let cachedLogos = null;

export const loadHeaderLogos = async () => {
  if (cachedLogos) {
    return cachedLogos;
  }

  // Small copies (240px wide): the logos are printed small,
  // and full-size images would make every list ~1 MB.
  const small = (url) => url.replace("/upload/", "/upload/w_240/");

  const [left, right, emblem] = await Promise.all([
    downloadImage(small(LOGO3_URL), "LEFT COLLEGE LOGO"),
    downloadImage(small(LOGO4_URL), "RIGHT COLLEGE LOGO"),
    downloadImage(small(LOGO5_URL), "KARNATAKA EMBLEM"),
  ]);

  const logos = { left, right, emblem };

  if (left && right && emblem) {
    cachedLogos = logos;
  }

  return logos;
};
