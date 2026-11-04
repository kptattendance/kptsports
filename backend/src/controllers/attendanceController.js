import mongoose from "mongoose";
import Attendance from "../models/Attendance.js";
import Event from "../models/Event.js";
import SportsApplication from "../models/SportsApplication.js";
import SportsMeet from "../models/SportsMeet.js";
import Certificate from "../models/Certificate.js";
import sendError from "../utils/sendError.js";

const EVENT_FIELDS =
  "code name category gender participationCategory eventType teamSize isActive displayOrder";

const PARTICIPANT_FIELDS =
  "name registerNumber collegeCode semester branch gender photo";

// Students rejected by the admin take no part
const notRejected = { $ne: "rejected" };

const findMeet = async (meetId) => {
  if (!meetId || !mongoose.isValidObjectId(meetId)) {
    return null;
  }

  return SportsMeet.findById(meetId);
};

// ======================================================
// ATTENDANCE BOARD
// GET /api/attendance/board?meetId=
//
// One row per event: students registered, how many were
// marked present / absent, and when attendance was taken.
// ======================================================

export const getAttendanceBoard = async (req, res) => {
  try {
    const meet = await findMeet(req.query.meetId);

    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found.",
      });
    }

    const [events, participantCounts, attendanceCounts] =
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

        Attendance.aggregate([
          { $match: { meet: meet._id } },
          {
            $group: {
              _id: "$event",
              present: {
                $sum: { $cond: ["$present", 1, 0] },
              },
              absent: {
                $sum: { $cond: ["$present", 0, 1] },
              },
              markedAt: { $max: "$updatedAt" },
            },
          },
        ]),
      ]);

    const countByEvent = new Map(
      participantCounts.map((item) => [String(item._id), item.count])
    );

    const attendanceByEvent = new Map(
      attendanceCounts.map((item) => [String(item._id), item])
    );

    const rows = events.map((event) => {
      const key = String(event._id);
      const attendance = attendanceByEvent.get(key);

      return {
        event,
        participantCount: countByEvent.get(key) || 0,
        taken: Boolean(attendance),
        present: attendance?.present || 0,
        absent: attendance?.absent || 0,
        markedAt: attendance?.markedAt || null,
      };
    });

    return res.status(200).json({
      success: true,
      meet,
      rows,
    });
  } catch (error) {
    console.error("ATTENDANCE BOARD ERROR:", error);

    return sendError(res, error, "Failed to load attendance.");
  }
};

// ======================================================
// ATTENDANCE SHEET FOR ONE EVENT
// GET /api/attendance/event/:eventId?meetId=
// ======================================================

export const getEventAttendance = async (req, res) => {
  try {
    const [meet, event] = await Promise.all([
      findMeet(req.query.meetId),
      Event.findById(req.params.eventId).select(EVENT_FIELDS).lean(),
    ]);

    if (!meet || !event) {
      return res.status(404).json({
        success: false,
        message: !meet ? "Sports meet not found." : "Event not found.",
      });
    }

    const [participants, records] = await Promise.all([
      SportsApplication.find({
        meet: meet._id,
        selectedEvents: event._id,
        status: notRejected,
      })
        .select(PARTICIPANT_FIELDS)
        .sort({ name: 1 })
        .lean(),

      Attendance.find({
        meet: meet._id,
        event: event._id,
      })
        .select("application present updatedAt")
        .lean(),
    ]);

    const presentById = new Map(
      records.map((record) => [String(record.application), record.present])
    );

    return res.status(200).json({
      success: true,
      event,
      taken: records.length > 0,
      participants: participants.map((student) => ({
        ...student,
        present: presentById.get(String(student._id)) ?? null,
      })),
    });
  } catch (error) {
    console.error("GET EVENT ATTENDANCE ERROR:", error);

    return sendError(res, error, "Failed to load attendance.");
  }
};

// ======================================================
// SAVE ATTENDANCE FOR ONE EVENT
// PUT /api/attendance/event/:eventId
// Body: { meetId, presentIds: [applicationId, ...] }
//
// Every registered student is saved: present if listed,
// absent otherwise. Saving again simply replaces it.
// ======================================================

export const saveEventAttendance = async (req, res) => {
  try {
    const { meetId, presentIds } = req.body || {};

    const [meet, event] = await Promise.all([
      findMeet(meetId),
      Event.findById(req.params.eventId),
    ]);

    if (!meet || !event) {
      return res.status(404).json({
        success: false,
        message: !meet ? "Sports meet not found." : "Event not found.",
      });
    }

    if (
      !Array.isArray(presentIds) ||
      !presentIds.every((id) => mongoose.isValidObjectId(id))
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid attendance list.",
      });
    }

    const participants = await SportsApplication.find({
      meet: meet._id,
      selectedEvents: event._id,
      status: notRejected,
    })
      .select("_id")
      .lean();

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nobody is registered for this event.",
      });
    }

    const registeredIds = new Set(
      participants.map((student) => String(student._id))
    );

    const present = new Set(presentIds.map(String));

    if ([...present].some((id) => !registeredIds.has(id))) {
      return res.status(400).json({
        success: false,
        message: "One or more students are not registered for this event.",
      });
    }

    await Attendance.bulkWrite(
      participants.map((student) => ({
        updateOne: {
          filter: {
            meet: meet._id,
            event: event._id,
            application: student._id,
          },
          update: {
            $set: {
              present: present.has(String(student._id)),
              markedBy: req.user?._id || null,
            },
          },
          upsert: true,
        },
      }))
    );

    // Absent students get no participation certificate
    const absentIds = participants
      .map((student) => student._id)
      .filter((id) => !present.has(String(id)));

    if (absentIds.length > 0) {
      await Certificate.deleteMany({
        meet: meet._id,
        event: event._id,
        certificateType: "participation",
        application: { $in: absentIds },
      });
    }

    return res.status(200).json({
      success: true,
      message: `Attendance saved for ${event.name}: ${present.size} present, ${absentIds.length} absent.`,
      present: present.size,
      absent: absentIds.length,
    });
  } catch (error) {
    console.error("SAVE ATTENDANCE ERROR:", error);

    return sendError(res, error, "Failed to save attendance.");
  }
};
