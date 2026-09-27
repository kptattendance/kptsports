import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    registerNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: true,
      trim: true,
    },

    motherName: {
      type: String,
      trim: true,
    },

    dateOfBirth: {
      type: Date,
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    semester: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      required: true,
    },

    branch: {
      type: String,
      required: true,
      trim: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
participationCategory: {
  type: String,
  enum: ["regular", "physically_challenged"],
  default: "regular",
  required: true,
},
    photo: {
      url: {
        type: String,
        required: true,
      },

      publicId: {
        type: String,
        required: true,
      },
    },

    isProfileComplete: {
      type: Boolean,
      default: false,
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

const Student = mongoose.model(
  "Student",
  studentSchema
);

export default Student;