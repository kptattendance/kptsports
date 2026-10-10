import cloudinary from "../config/cloudinary.js";

export const uploadToCloudinary = (
  buffer,
  folder = "sports-meet/students"
) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",

        // Cloudinary checks the real file content,
        // not the type claimed by the browser.
        allowed_formats: [
          "jpg",
          "png",
          "webp",
          "heic",
          "heif",
        ],
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
};

export const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

export default uploadToCloudinary;
