import mongoose from "mongoose";

// Faculty / staff take part too. They have no register
// number, parents, date of birth or semester.
export const PARTICIPANT_TYPES = ["student", "faculty"];

export const DESIGNATIONS = [
  "Lecturer",
  "Senior Grade Lecturer",
  "Selection Grade Lecturer",
  "HOD",
  "Principal",
  "Office Staff",
];

// Field is required only for students
function requiredForStudents() {
  return this.participantType !== "faculty";
}

const sportsApplicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    meet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsMeet",
      required: true,
      index: true,
    },

    participantType: {
      type: String,
      enum: PARTICIPANT_TYPES,
      default: "student",
      required: true,
    },

    // Faculty only, optional
    designation: {
      type: String,
      enum: [...DESIGNATIONS, ""],
      default: "",
    },

    collegeCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    registerNumber: {
      type: String,
      required: requiredForStudents,
      default: "",
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    fatherName: {
      type: String,
      required: requiredForStudents,
      default: "",
      trim: true,
    },

    motherName: {
      type: String,
      trim: true,
      default: "",
    },

    dateOfBirth: {
      type: Date,
      required: requiredForStudents,
    },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    semester: {
      type: Number,
      enum: [1, 2, 3, 4, 5, 6],
      required: requiredForStudents,
    },

    // Department (students and faculty)
    branch: {
      type: String,
      required: true,
      trim: true,
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
      default: "",
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

    selectedEvents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Event",
      },
    ],

    status: {
      type: String,
      enum: [
        "submitted",
        "approved",
        "rejected",
      ],
      default: "submitted",
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

sportsApplicationSchema.index(
  {
    meet: 1,
    user: 1,
  },
  {
    unique: true,
  }
);

const SportsApplication = mongoose.model(
  "SportsApplication",
  sportsApplicationSchema
);

export default SportsApplication;