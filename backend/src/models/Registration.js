import mongoose from "mongoose";

const registrationSchema = new mongoose.Schema(
  {
    meet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsMeet",
      required: true,
      index: true,
    },

    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    institution: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Institution",
      required: true,
      index: true,
    },

    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },

    status: {
      type: String,
      enum: [
        "applied",
        "approved",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
    },

    chestNumber: {
      type: String,
      trim: true,
      default: null,
    },

    attendanceStatus: {
      type: String,
      enum: [
        "not_marked",
        "present",
        "absent",
        "disqualified",
      ],
      default: "not_marked",
    },
  },
  {
    timestamps: true,
  }
);

registrationSchema.index(
  {
    meet: 1,
    student: 1,
    event: 1,
  },
  {
    unique: true,
  }
);

const Registration = mongoose.model(
  "Registration",
  registrationSchema
);

export default Registration;