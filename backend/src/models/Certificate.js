import mongoose from "mongoose";

const certificateSchema = new mongoose.Schema(
  {
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    meet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsMeet",
      required: true,
    },

    result: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Result",
      required: true,
      unique: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    position: {
      type: Number,
      required: true,
    },

    pdfUrl: {
      type: String,
      default: null,
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    issuedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Certificate = mongoose.model(
  "Certificate",
  certificateSchema
);

export default Certificate;