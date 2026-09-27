import mongoose from "mongoose";

const sportsMeetSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    startDate: {
      type: Date,
      required: true,
    },

    endDate: {
      type: Date,
      required: true,
    },

    venue: {
      type: String,
      required: true,
      trim: true,
    },

    applicationStartDate: {
      type: Date,
      required: true,
    },

    applicationEndDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "draft",
        "applications_open",
        "applications_closed",
        "ongoing",
        "completed",
      ],
      default: "draft",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const SportsMeet = mongoose.model(
  "SportsMeet",
  sportsMeetSchema
);

export default SportsMeet;