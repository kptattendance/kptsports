import mongoose from "mongoose";

// One record per student, per event, per sports meet.
// An event with no records has not had attendance taken.
const attendanceSchema = new mongoose.Schema(
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

    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsApplication",
      required: true,
      index: true,
    },

    present: {
      type: Boolean,
      required: true,
      default: false,
    },

    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

attendanceSchema.index(
  {
    meet: 1,
    event: 1,
    application: 1,
  },
  {
    unique: true,
  }
);

const Attendance = mongoose.model(
  "Attendance",
  attendanceSchema
);

export default Attendance;
