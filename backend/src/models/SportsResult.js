import mongoose from "mongoose";

const sportsResultSchema = new mongoose.Schema(
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

    position: {
      type: Number,
      enum: [1, 2, 3],
      required: true,
    },

    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SportsApplication",
        required: true,
      },
    ],

    resultValue: {
      type: String,
      trim: true,
      default: "",
    },

    resultUnit: {
      type: String,
      trim: true,
      default: "",
    },

    remarks: {
      type: String,
      trim: true,
      default: "",
    },

    isFinal: {
      type: Boolean,
      default: false,
    },

    finalizedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One 1st/2nd/3rd place for one event
sportsResultSchema.index(
  {
    meet: 1,
    event: 1,
    position: 1,
  },
  {
    unique: true,
  }
);

const SportsResult =
  mongoose.model(
    "SportsResult",
    sportsResultSchema
  );

export default SportsResult;