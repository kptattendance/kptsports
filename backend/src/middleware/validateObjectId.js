import mongoose from "mongoose";

// =====================================================
// VALIDATE OBJECT ID
//
// Used with router.param(), so a malformed id in the
// URL returns 400 instead of reaching the database.
// =====================================================

const validateObjectId = (req, res, next, value) => {
  if (!mongoose.isValidObjectId(value)) {
    return res.status(400).json({
      success: false,
      message: "Invalid ID.",
    });
  }

  next();
};

export default validateObjectId;
