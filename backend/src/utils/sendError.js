// =====================================================
// SEND ERROR
//
// Shared catch-block response.
// Bad input (invalid id / failed schema validation)
// is reported as 400. Anything else is a 500 with a
// generic message, so internal details never reach
// the client. The full error is logged by the caller.
// =====================================================

const sendError = (res, error, message) => {
  if (error?.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid value provided.",
    });
  }

  if (error?.name === "ValidationError") {
    const firstError = Object.values(
      error.errors || {}
    )[0];

    return res.status(400).json({
      success: false,
      message:
        firstError?.message ||
        "Invalid data provided.",
    });
  }

  // Cloudinary rejected the uploaded file
  if (error?.http_code === 400) {
    return res.status(400).json({
      success: false,
      message:
        "The photo could not be processed. Please upload a JPG, PNG or WEBP image.",
    });
  }

  return res.status(500).json({
    success: false,
    message,
  });
};

export default sendError;
