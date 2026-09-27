import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    shortName: {
      type: String,
      trim: true,
    },

    district: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    contactPerson: {
      type: String,
      trim: true,
    },

    contactPhone: {
      type: String,
      trim: true,
    },

    contactEmail: {
      type: String,
      lowercase: true,
      trim: true,
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

const Institution = mongoose.model(
  "Institution",
  institutionSchema
);

export default Institution;