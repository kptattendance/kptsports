import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    // =====================================================
    // CERTIFICATE NUMBER
    // =====================================================

    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      uppercase: true,
    },

    // =====================================================
    // SPORTS MEET
    // =====================================================

    meet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsMeet",
      required: true,
      index: true,
    },

    // =====================================================
    // EVENT
    // =====================================================

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    // =====================================================
    // SPORTS APPLICATION
    // =====================================================

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsApplication",
      required: true,
      index: true,
    },

    // =====================================================
    // CERTIFICATE TYPE
    // =====================================================

    certificateType: {
      type: String,
      enum: [
        "winner",
        "participation",
      ],
      required: true,
    },

    // =====================================================
    // POSITION
    // =====================================================

    position: {
      type: Number,
      enum: [1, 2, 3, null],
      default: null,
    },

    // =====================================================
    // STUDENT DETAILS
    // =====================================================

    studentName: {
      type: String,
      required: true,
      trim: true,
    },

    registerNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    collegeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    // =====================================================
    // STUDENT PHOTO
    // Snapshot of the photo at certificate generation
    // =====================================================

    photo: {
      url: {
        type: String,
        default: "",
        trim: true,
      },

      publicId: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // =====================================================
    // EVENT / MEET SNAPSHOT
    // =====================================================

    eventName: {
      type: String,
      required: true,
      trim: true,
    },

    meetName: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // ISSUE DETAILS
    // =====================================================

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    // =====================================================
    // PDF DETAILS
    // =====================================================

    pdfUrl: {
      type: String,
      default: "",
      trim: true,
    },

    publicId: {
      type: String,
      default: "",
      trim: true,
    },

    isGenerated: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// PREVENT DUPLICATE CERTIFICATES
// =====================================================

certificateSchema.index(
  {
    meet: 1,
    event: 1,
    application: 1,
    certificateType: 1,
  },
  {
    unique: true,
  }
);

// =====================================================
// MODEL
// =====================================================

const Certificate =
  mongoose.models.Certificate ||
  mongoose.model(
    "Certificate",
    certificateSchema
  );

export default Certificate;