import mongoose from "mongoose";

const resultSchema = new mongoose.Schema(
  {
    meet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsMeet",
      required: true,
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    registration: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Registration",
      default: null,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      default: null,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      default: null,
    },

    position: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    performance: {
      type: Number,
      default: null,
    },

    performanceText: {
      type: String,
      trim: true,
      default: null,
    },

    remarks: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "provisional",
        "confirmed",
      ],
      default: "provisional",
    },

    declaredAt: {
      type: Date,
      default: null,
    },

    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

resultSchema.index(
  {
    event: 1,
    position: 1,
  },
  {
    unique: true,
  }
);

const Result = mongoose.model(
  "Result",
  resultSchema
);

export default Result;