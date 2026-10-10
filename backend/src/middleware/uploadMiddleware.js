import multer from "multer";

const storage = multer.memoryStorage();

// SVG is deliberately excluded: it can carry scripts.
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },

  fileFilter: (req, file, cb) => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const error = new Error(
        "Only JPG, PNG or WEBP photos are allowed"
      );

      error.status = 400;

      cb(error, false);
    }
  },
});

export default upload;
