import SportsResult from "../models/SportsResult.js";
import SportsMeet from "../models/SportsMeet.js";
import Event from "../models/Event.js";
import SportsApplication from "../models/SportsApplication.js";

// ======================================================
// GET ALL RESULTS
// GET /api/sports-results
// ======================================================

export const getAllResults = async (
  req,
  res
) => {
  try {
    const {
      meetId,
      eventId,
      position,
      final,
    } = req.query;

    const filter = {};

    if (meetId) {
      filter.meet = meetId;
    }

    if (eventId) {
      filter.event = eventId;
    }

    if (position) {
      filter.position =
        Number(position);
    }

    if (final === "true") {
      filter.isFinal = true;
    }

    if (final === "false") {
      filter.isFinal = false;
    }

    const results =
      await SportsResult.find(filter)
        .populate(
          "meet",
          "name shortName year startDate endDate venue"
        )
        .populate(
          "event",
          "code name category gender participationCategory eventType teamSize resultType unit"
        )
        .populate({
          path: "participants",
          select:
            "name registerNumber collegeCode fatherName motherName dateOfBirth gender semester branch phone email photo participationCategory status",
        })
        .sort({
          event: 1,
          position: 1,
        });

    return res.status(200).json({
      success: true,
      count: results.length,
      results,
    });

  } catch (error) {

    console.error(
      "GET ALL RESULTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch results.",
      error:
        error.message,
    });
  }
};


// ======================================================
// GET RESULTS FOR ONE EVENT
// GET /api/sports-results/event/:eventId
// ======================================================

export const getResultsByEvent =
  async (
    req,
    res
  ) => {

    try {

      const {
        eventId,
      } = req.params;

      const {
        meetId,
      } = req.query;

      if (!meetId) {
        return res.status(400).json({
          success: false,
          message:
            "meetId is required.",
        });
      }

      const event =
        await Event.findById(
          eventId
        );

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      const results =
        await SportsResult.find({
          meet: meetId,
          event: eventId,
        })
          .populate(
            "event",
            "code name category gender participationCategory eventType teamSize resultType unit"
          )
          .populate({
            path: "participants",
            select:
              "name registerNumber collegeCode fatherName motherName dateOfBirth gender semester branch phone email photo participationCategory status",
          })
          .sort({
            position: 1,
          });

      return res.status(200).json({
        success: true,
        event,
        results,
      });

    } catch (error) {

      console.error(
        "GET EVENT RESULTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch event results.",
        error:
          error.message,
      });
    }
  };


// ======================================================
// CREATE / UPDATE RESULT
// POST /api/sports-results
// ======================================================

export const saveResult =
  async (
    req,
    res
  ) => {

    try {

      const {
        meetId,
        eventId,
        position,
        participants,
        resultValue,
        resultUnit,
        remarks,
      } = req.body;

      // --------------------------------------------------
      // BASIC VALIDATION
      // --------------------------------------------------

      if (
        !meetId ||
        !eventId ||
        !position
      ) {
        return res.status(400).json({
          success: false,
          message:
            "meetId, eventId and position are required.",
        });
      }

      const positionNumber =
        Number(position);

      if (
        ![1, 2, 3].includes(
          positionNumber
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Position must be 1, 2 or 3.",
        });
      }

      if (
        !Array.isArray(
          participants
        ) ||
        participants.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one participant is required.",
        });
      }

      // --------------------------------------------------
      // MEET
      // --------------------------------------------------

      const meet =
        await SportsMeet.findById(
          meetId
        );

      if (!meet) {
        return res.status(404).json({
          success: false,
          message:
            "Sports meet not found.",
        });
      }

      // --------------------------------------------------
      // EVENT
      // --------------------------------------------------

      const event =
        await Event.findOne({
          _id: eventId,
          meet: meetId,
        });

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found for this sports meet.",
        });
      }

      // --------------------------------------------------
      // TEAM SIZE VALIDATION
      // --------------------------------------------------

      const expectedTeamSize =
        event.eventType ===
        "team"
          ? Number(
              event.teamSize || 1
            )
          : 1;

      if (
        participants.length !==
        expectedTeamSize
      ) {

        return res.status(400).json({
          success: false,
          message:
            event.eventType ===
            "team"
              ? `This event requires exactly ${expectedTeamSize} participants.`
              : "This is an individual event. Only one participant is allowed.",
        });

      }

      // --------------------------------------------------
      // REMOVE DUPLICATE PARTICIPANTS
      // --------------------------------------------------

      const uniqueParticipants =
        [
          ...new Set(
            participants.map(
              (id) =>
                String(id)
            )
          ),
        ];

      if (
        uniqueParticipants.length !==
        participants.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate participants are not allowed.",
        });
      }

      // --------------------------------------------------
      // GET APPLICATIONS
      // --------------------------------------------------

      const applications =
        await SportsApplication.find({
          _id: {
            $in:
              uniqueParticipants,
          },
          meet: meetId,
          selectedEvents: eventId,
        });

      if (
        applications.length !==
        uniqueParticipants.length
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more selected participants are not registered for this event.",
        });
      }

      // --------------------------------------------------
      // CHECK EXISTING FINAL RESULT
      // --------------------------------------------------

      const existingResult =
        await SportsResult.findOne({
          meet: meetId,
          event: eventId,
          position:
            positionNumber,
        });

      if (
        existingResult?.isFinal
      ) {
        return res.status(400).json({
          success: false,
          message:
            "This result has already been finalized and cannot be changed.",
        });
      }

      // --------------------------------------------------
      // CHECK PARTICIPANT ALREADY HAS ANOTHER POSITION
      // --------------------------------------------------

      const participantAlreadyPlaced =
        await SportsResult.findOne({
          meet: meetId,
          event: eventId,
          position: {
            $ne:
              positionNumber,
          },
          participants: {
            $in:
              uniqueParticipants,
          },
        });

      if (
        participantAlreadyPlaced
      ) {
        return res.status(400).json({
          success: false,
          message:
            "One or more participants are already assigned to another position in this event.",
        });
      }

      // --------------------------------------------------
      // SAVE / UPDATE
      // --------------------------------------------------

      const result =
        await SportsResult.findOneAndUpdate(
          {
            meet: meetId,
            event: eventId,
            position:
              positionNumber,
          },
          {
            $set: {
              meet: meetId,
              event: eventId,
              position:
                positionNumber,
              participants:
                uniqueParticipants,
              resultValue:
                resultValue ||
                "",
              resultUnit:
                resultUnit ||
                event.unit ||
                "",
              remarks:
                remarks ||
                "",
              isFinal: false,
              finalizedAt: null,
            },
          },
          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        )
          .populate(
            "event",
            "code name category gender participationCategory eventType teamSize resultType unit"
          )
          .populate({
            path: "participants",
            select:
              "name registerNumber collegeCode fatherName motherName dateOfBirth gender semester branch phone email photo participationCategory status",
          });

      return res.status(200).json({
        success: true,
        message:
          `${positionNumber === 1 ? "1st" : positionNumber === 2 ? "2nd" : "3rd"} place result saved successfully.`,
        result,
      });

    } catch (error) {

      console.error(
        "SAVE RESULT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to save result.",
        error:
          error.message,
      });
    }
  };


// ======================================================
// FINALIZE EVENT RESULTS
// POST /api/sports-results/event/:eventId/finalize
// ======================================================

export const finalizeEventResults =
  async (
    req,
    res
  ) => {

    try {

      const {
        eventId,
      } = req.params;

      const {
        meetId,
      } = req.body;

      if (!meetId) {
        return res.status(400).json({
          success: false,
          message:
            "meetId is required.",
        });
      }

      // --------------------------------------------------
      // EVENT
      // --------------------------------------------------

      const event =
        await Event.findOne({
          _id: eventId,
          meet: meetId,
        });

      if (!event) {
        return res.status(404).json({
          success: false,
          message:
            "Event not found.",
        });
      }

      // --------------------------------------------------
      // RESULTS
      // --------------------------------------------------

      const results =
        await SportsResult.find({
          meet: meetId,
          event: eventId,
        }).sort({
          position: 1,
        });

      if (
        results.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "No results have been entered for this event.",
        });
      }

      // --------------------------------------------------
      // CHECK POSITIONS
      // --------------------------------------------------

      const positions =
        results.map(
          (result) =>
            result.position
        );

      const hasDuplicatePositions =
        new Set(
          positions
        ).size !==
        positions.length;

      if (
        hasDuplicatePositions
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Duplicate positions found.",
        });
      }

      // --------------------------------------------------
      // FINALIZE
      // --------------------------------------------------

      await SportsResult.updateMany(
        {
          meet: meetId,
          event: eventId,
        },
        {
          $set: {
            isFinal: true,
            finalizedAt:
              new Date(),
          },
        }
      );

      const finalResults =
        await SportsResult.find({
          meet: meetId,
          event: eventId,
        })
          .populate(
            "event",
            "code name category gender participationCategory eventType teamSize resultType unit"
          )
          .populate({
            path: "participants",
            select:
              "name registerNumber collegeCode fatherName motherName dateOfBirth gender semester branch phone email photo participationCategory status",
          })
          .sort({
            position: 1,
          });

      return res.status(200).json({
        success: true,
        message:
          "Event results finalized successfully.",
        results:
          finalResults,
      });

    } catch (error) {

      console.error(
        "FINALIZE RESULTS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to finalize event results.",
        error:
          error.message,
      });
    }
  };


// ======================================================
// GET ONE RESULT
// GET /api/sports-results/:id
// ======================================================

export const getResultById =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await SportsResult.findById(
          req.params.id
        )
          .populate(
            "meet",
            "name shortName year startDate endDate venue"
          )
          .populate(
            "event",
            "code name category gender participationCategory eventType teamSize resultType unit"
          )
          .populate({
            path: "participants",
            select:
              "name registerNumber collegeCode fatherName motherName dateOfBirth gender semester branch phone email photo participationCategory status",
          });

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Result not found.",
        });
      }

      return res.status(200).json({
        success: true,
        result,
      });

    } catch (error) {

      console.error(
        "GET RESULT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to fetch result.",
        error:
          error.message,
      });
    }
  };


// ======================================================
// DELETE RESULT
// DELETE /api/sports-results/:id
// ======================================================

export const deleteResult =
  async (
    req,
    res
  ) => {

    try {

      const result =
        await SportsResult.findById(
          req.params.id
        );

      if (!result) {
        return res.status(404).json({
          success: false,
          message:
            "Result not found.",
        });
      }

      if (
        result.isFinal
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Finalized results cannot be deleted.",
        });
      }

      await SportsResult.findByIdAndDelete(
        req.params.id
      );

      return res.status(200).json({
        success: true,
        message:
          "Result deleted successfully.",
      });

    } catch (error) {

      console.error(
        "DELETE RESULT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete result.",
        error:
          error.message,
      });
    }
  };