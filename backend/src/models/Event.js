import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    meet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SportsMeet",
      required: true,
      index: true,
    },

    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        "athletics",
        "road_race",
        "relay",
        "table_tennis",
        "chess",
        "yoga",
        "physically_challenged",
        "other",
      ],
      required: true,
    },

    gender: {
      type: String,
      enum: ["male", "female", "mixed", "open"],
      required: true,
    },
participationCategory: {
  type: String,
  enum: ["regular", "physically_challenged"],
  required: true,
  default: "regular",
},
    eventType: {
      type: String,
      enum: ["individual", "team"],
      default: "individual",
    },

    maxParticipantsPerInstitution: {
      type: Number,
      default: null,
    },

    teamSize: {
      type: Number,
      default: null,
    },

    resultType: {
      type: String,
      enum: [
        "time",
        "distance",
        "points",
        "position",
        "win_loss",
      ],
      default: "position",
    },

    unit: {
      type: String,
      trim: true,
      default: null,
    },

    applicationOpen: {
      type: Boolean,
      default: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.index(
  {
    meet: 1,
    code: 1,
    gender: 1,
    participationCategory: 1,
  },
  {
    unique: true,
  }
);

const Event = mongoose.model(
  "Event",
  eventSchema
);

export default Event;