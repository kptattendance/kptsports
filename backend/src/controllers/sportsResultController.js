import mongoose from "mongoose";
import SportsResult from "../models/SportsResult.js";
import SportsMeet from "../models/SportsMeet.js";
import Event from "../models/Event.js";
import SportsApplication from "../models/SportsApplication.js";
import sendError from "../utils/sendError.js";
import { syncWinnerCertificates } from "../utils/syncCertificates.js";

const EVENT_FIELDS =
  "code name category gender participationCategory eventType teamSize resultType unit isActive displayOrder";

const PARTICIPANT_FIELDS =
  "name registerNumber collegeCode semester branch gender photo status";

const POSITIONS = [1, 2, 3];

// Students rejected by the admin take no part in results
const notRejected = { $ne: "rejected" };

// ======================================================
// HELPER: find the meet given in the request
// ======================================================

const findMeet = async (meetId) => {
  if (!meetId || !mongoose.isValidObjectId(meetId)) {
    return null;
  }

  return SportsMeet.findById(meetId);
};

// ======================================================
// HELPER: results of one event, with participant names
// ======================================================

const findEventResults = (meetId, eventId) =>
  SportsResult.find({
    meet: meetId,
    event: eventId,
  })
    .populate("participants", PARTICIPANT_FIELDS)
    .sort({ position: 1 })
    .lean();

// ======================================================
// GET ALL RESULTS
// GET /api/sports-results?meetId=&eventId=&position=
// ======================================================

export const getAllResults = async (req, res) => {
  try {
    const { meetId, eventId, position } = req.query;

    const filter = {};

    if (meetId) {
      filter.meet = meetId;
    }

    if (eventId) {
      filter.event = eventId;
    }

    if (position) {
      filter.position = Number(position);
    }

    const results = await SportsResult.find(filter)
      .populate("meet", "name shortName year")
      .populate("event", EVENT_FIELDS)
      .populate("participants", PARTICIPANT_FIELDS)
      .sort({ event: 1, position: 1 });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error("GET ALL RESULTS ERROR:", error);

    return sendError(res, error, "Failed to fetch results.");
  }
};

// ======================================================
// RESULT BOARD
// GET /api/sports-results/board?meetId=
//
// One row per event: how many students registered,
// the saved 1st / 2nd / 3rd places, and when they were
// entered. Rows with places are "entered", so an event
// is never entered twice by mistake.
// ======================================================

export const getResultBoard = async (req, res) => {
  try {
    const meet = await findMeet(req.query.meetId);

    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found.",
      });
    }

    const [events, participantCounts, results] =
      await Promise.all([
        Event.find({})
          .select(EVENT_FIELDS)
          .sort({ displayOrder: 1, name: 1 })
          .lean(),

        SportsApplication.aggregate([
          {
            $match: {
              meet: meet._id,
              status: notRejected,
            },
          },
          { $unwind: "$selectedEvents" },
          {
            $group: {
              _id: "$selectedEvents",
              count: { $sum: 1 },
            },
          },
        ]),

        SportsResult.find({ meet: meet._id })
          .populate("participants", "name registerNumber collegeCode")
          .lean(),
      ]);

    const countByEvent = new Map(
      participantCounts.map((item) => [String(item._id), item.count])
    );

    const resultsByEvent = new Map();

    for (const result of results) {
      const key = String(result.event);

      if (!resultsByEvent.has(key)) {
        resultsByEvent.set(key, []);
      }

      resultsByEvent.get(key).push(result);
    }

    const rows = events.map((event) => {
      const key = String(event._id);

      const eventResults = (resultsByEvent.get(key) || []).sort(
        (a, b) => a.position - b.position
      );

      const enteredAt = eventResults.reduce(
        (latest, result) =>
          !latest || result.updatedAt > latest
            ? result.updatedAt
            : latest,
        null
      );

      return {
        event,
        participantCount: countByEvent.get(key) || 0,
        results: eventResults.map((result) => ({
          position: result.position,
          resultValue: result.resultValue,
          participants: result.participants,
        })),
        entered: eventResults.length > 0,
        enteredAt,
      };
    });

    return res.status(200).json({
      success: true,
      meet,
      rows,
    });
  } catch (error) {
    console.error("RESULT BOARD ERROR:", error);

    return sendError(res, error, "Failed to load results.");
  }
};

// ======================================================
// RESULT SHEET FOR ONE EVENT
// GET /api/sports-results/event/:eventId?meetId=
//
// The registered students (to choose winners from)
// and the places already saved.
// ======================================================

export const getEventResultSheet = async (req, res) => {
  try {
    const { eventId } = req.params;

    const [meet, event] = await Promise.all([
      findMeet(req.query.meetId),
      Event.findById(eventId).select(EVENT_FIELDS).lean(),
    ]);

    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found.",
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    const [participants, results] = await Promise.all([
      SportsApplication.find({
        meet: meet._id,
        selectedEvents: event._id,
        status: notRejected,
      })
        .select(PARTICIPANT_FIELDS)
        .sort({ name: 1 })
        .lean(),

      findEventResults(meet._id, event._id),
    ]);

    return res.status(200).json({
      success: true,
      event,
      participants,
      results,
    });
  } catch (error) {
    console.error("GET EVENT RESULT SHEET ERROR:", error);

    return sendError(res, error, "Failed to load event results.");
  }
};

// ======================================================
// SAVE ALL PLACES OF ONE EVENT
// PUT /api/sports-results/event/:eventId
//
// Body:
// {
//   meetId,
//   positions: [
//     { position: 1, participants: [applicationId], resultValue },
//     { position: 2, participants: [] },   <- empty = no 2nd place
//   ]
// }
//
// Saving again replaces the earlier entry, so a mistake
// is fixed by simply entering the result again.
// Winner certificates are kept in step with the result.
// ======================================================

export const saveEventResults = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { meetId, positions } = req.body || {};

    const [meet, event] = await Promise.all([
      findMeet(meetId),
      Event.findById(eventId),
    ]);

    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found.",
      });
    }

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found.",
      });
    }

    if (!Array.isArray(positions)) {
      return res.status(400).json({
        success: false,
        message: "Result details are missing.",
      });
    }

    // --------------------------------------------------
    // CLEAN INPUT
    // --------------------------------------------------

    const entries = [];
    const seenPositions = new Set();

    for (const item of positions) {
      const position = Number(item?.position);

      if (!POSITIONS.includes(position)) {
        return res.status(400).json({
          success: false,
          message: "Position must be 1, 2 or 3.",
        });
      }

      if (seenPositions.has(position)) {
        return res.status(400).json({
          success: false,
          message: "Each position can be entered only once.",
        });
      }

      seenPositions.add(position);

      const participants = Array.isArray(item.participants)
        ? item.participants.filter(Boolean).map(String)
        : [];

      if (!participants.every((id) => mongoose.isValidObjectId(id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid participant selected.",
        });
      }

      if (participants.length > 0) {
        entries.push({
          position,
          participants,
          resultValue: String(item.resultValue || "").trim().slice(0, 50),
        });
      }
    }

    // --------------------------------------------------
    // TEAM SIZE
    // --------------------------------------------------

    const label = (position) =>
      position === 1 ? "1st" : position === 2 ? "2nd" : "3rd";

    const expectedSize =
      event.eventType === "team" ? Number(event.teamSize || 1) : 1;

    for (const entry of entries) {
      if (entry.participants.length !== expectedSize) {
        return res.status(400).json({
          success: false,
          message:
            event.eventType === "team"
              ? `${label(entry.position)} place needs exactly ${expectedSize} students (team event).`
              : `${label(entry.position)} place can have only one student.`,
        });
      }
    }

    // --------------------------------------------------
    // SAME STUDENT IN TWO PLACES
    // --------------------------------------------------

    const allIds = entries.flatMap((entry) => entry.participants);

    if (new Set(allIds).size !== allIds.length) {
      return res.status(400).json({
        success: false,
        message: "A student cannot win more than one place in the same event.",
      });
    }

    // --------------------------------------------------
    // STUDENTS MUST BE REGISTERED FOR THIS EVENT
    // --------------------------------------------------

    if (allIds.length > 0) {
      const registered = await SportsApplication.countDocuments({
        _id: { $in: allIds },
        meet: meet._id,
        selectedEvents: event._id,
        status: notRejected,
      });

      if (registered !== allIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more selected students are not registered for this event.",
        });
      }
    }

    // --------------------------------------------------
    // SAVE
    // --------------------------------------------------

    const now = new Date();

    await SportsResult.deleteMany({
      meet: meet._id,
      event: event._id,
      position: {
        $nin: entries.map((entry) => entry.position),
      },
    });

    for (const entry of entries) {
      await SportsResult.findOneAndUpdate(
        {
          meet: meet._id,
          event: event._id,
          position: entry.position,
        },
        {
          $set: {
            participants: entry.participants,
            resultValue: entry.resultValue,
            resultUnit: event.unit || "",
            isFinal: true,
            finalizedAt: now,
          },
        },
        {
          upsert: true,
          runValidators: true,
        }
      );
    }

    const results = await findEventResults(meet._id, event._id);

    await syncWinnerCertificates({ meet, event, results });

    return res.status(200).json({
      success: true,
      message:
        entries.length > 0
          ? `Result saved for ${event.name}.`
          : `Result cleared for ${event.name}.`,
      results,
    });
  } catch (error) {
    console.error("SAVE EVENT RESULTS ERROR:", error);

    return sendError(res, error, "Failed to save result.");
  }
};
