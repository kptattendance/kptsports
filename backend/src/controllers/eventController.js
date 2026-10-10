import Event from "../models/Event.js";
import SportsMeet from "../models/SportsMeet.js";
import sendError from "../utils/sendError.js";

// =====================================================
// CREATE EVENT
// POST /api/events
// =====================================================

export const createEvent = async (
  req,
  res
) => {
  try {
    const {
      meet,
      code,
      name,
      category,
      gender,
      participationCategory,
      eventType,
      maxParticipantsPerInstitution,
      teamSize,
      resultType,
      unit,
      applicationOpen,
      isActive,
      displayOrder,
    } = req.body;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (
      !meet ||
      !code ||
      !name ||
      !category ||
      !gender ||
      !participationCategory
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Meet, code, name, category, gender and participation category are required",
      });
    }

    // -------------------------------------------------
    // CHECK MEET
    // -------------------------------------------------

    const meetData =
      await SportsMeet.findById(meet);

    if (!meetData) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found",
      });
    }

    // -------------------------------------------------
    // VALIDATE PARTICIPATION CATEGORY
    // -------------------------------------------------

    if (
      ![
        "regular",
        "physically_challenged",
      ].includes(
        participationCategory
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid participation category",
      });
    }

    // -------------------------------------------------
    // VALIDATE GENDER
    // -------------------------------------------------

    if (
      ![
        "male",
        "female",
        "mixed",
        "open",
      ].includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender",
      });
    }

    // -------------------------------------------------
    // VALIDATE EVENT TYPE
    // -------------------------------------------------

    const finalEventType =
      eventType || "individual";

    if (
      ![
        "individual",
        "team",
      ].includes(finalEventType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid event type",
      });
    }

    // -------------------------------------------------
    // TEAM SIZE
    // -------------------------------------------------

    if (
      finalEventType === "team" &&
      (!teamSize ||
        Number(teamSize) < 2)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Team events must have a valid team size",
      });
    }

    // -------------------------------------------------
    // CHECK DUPLICATE EVENT
    // -------------------------------------------------

    const existingEvent =
      await Event.findOne({
        meet,
        code: code.trim().toUpperCase(),
        gender,
        participationCategory,
      });

    if (existingEvent) {
      return res.status(409).json({
        success: false,
        message:
          "This event already exists for the selected meet",
      });
    }

    // -------------------------------------------------
    // CREATE EVENT
    // -------------------------------------------------

    const event =
      await Event.create({
        meet,

        code: code
          .trim()
          .toUpperCase(),

        name: name.trim(),

        category,

        gender,

        participationCategory,

        eventType:
          finalEventType,

        maxParticipantsPerInstitution:
          maxParticipantsPerInstitution
            ? Number(
                maxParticipantsPerInstitution
              )
            : null,

        teamSize:
          finalEventType === "team"
            ? Number(teamSize)
            : null,

        resultType:
          resultType || "position",

        unit:
          unit?.trim() || null,

        applicationOpen:
          applicationOpen !==
          undefined
            ? applicationOpen
            : true,

        isActive:
          isActive !== undefined
            ? isActive
            : true,

        displayOrder:
          displayOrder !== undefined
            ? Number(displayOrder)
            : 0,
      });

    const populatedEvent =
      await Event.findById(
        event._id
      ).populate(
        "meet",
        "name shortName year startDate endDate venue status"
      );

    return res.status(201).json({
      success: true,
      message:
        "Event created successfully",
      event: populatedEvent,
    });
  } catch (error) {
    console.error(
      "Create event error:",
      error
    );

    // MongoDB duplicate index
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "An event with the same code, gender and participation category already exists for this meet",
      });
    }

    return sendError(res, error, "Failed to create event");
  }
};

// =====================================================
// GET ALL EVENTS
// GET /api/events
//
// Query:
// ?meet=ID
// ?gender=male
// ?category=athletics
// ?participationCategory=regular
// ?eventType=individual
// ?applicationOpen=true
// ?isActive=true
// =====================================================

export const getAllEvents = async (
  req,
  res
) => {
  try {
    const {
      meet,
      gender,
      category,
      participationCategory,
      eventType,
      applicationOpen,
      isActive,
    } = req.query;

    const filter = {};

    if (meet) {
      filter.meet = meet;
    }

    if (gender) {
      filter.gender = gender;
    }

    if (category) {
      filter.category = category;
    }

    if (participationCategory) {
      filter.participationCategory =
        participationCategory;
    }

    if (eventType) {
      filter.eventType = eventType;
    }

    if (applicationOpen !== undefined) {
      filter.applicationOpen =
        applicationOpen === "true";
    }

    if (isActive !== undefined) {
      filter.isActive =
        isActive === "true";
    }

    const events =
      await Event.find(filter)
        .populate(
          "meet",
          "name shortName year startDate endDate venue status"
        )
        .sort({
          displayOrder: 1,
          name: 1,
        });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    console.error(
      "Get all events error:",
      error
    );

    return sendError(res, error, "Failed to get events");
  }
};

// =====================================================
// GET SINGLE EVENT
// GET /api/events/:id
// =====================================================

export const getEventById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const event =
      await Event.findById(id).populate(
        "meet",
        "name shortName year startDate endDate venue status"
      );

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    console.error(
      "Get event by ID error:",
      error
    );

    return sendError(res, error, "Failed to get event");
  }
};

// =====================================================
// UPDATE EVENT
// PUT /api/events/:id
// =====================================================

export const updateEvent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const event =
      await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const {
      meet,
      code,
      name,
      category,
      gender,
      participationCategory,
      eventType,
      maxParticipantsPerInstitution,
      teamSize,
      resultType,
      unit,
      applicationOpen,
      isActive,
      displayOrder,
    } = req.body;

    // -------------------------------------------------
    // MEET
    // -------------------------------------------------

    if (meet !== undefined) {
      const meetData =
        await SportsMeet.findById(meet);

      if (!meetData) {
        return res.status(404).json({
          success: false,
          message:
            "Sports meet not found",
        });
      }

      event.meet = meet;
    }

    // -------------------------------------------------
    // BASIC DETAILS
    // -------------------------------------------------

    if (code !== undefined) {
      event.code = code
        .trim()
        .toUpperCase();
    }

    if (name !== undefined) {
      event.name = name.trim();
    }

    if (category !== undefined) {
      event.category = category;
    }

    // -------------------------------------------------
    // GENDER
    // -------------------------------------------------

    if (gender !== undefined) {
      if (
        ![
          "male",
          "female",
          "mixed",
          "open",
        ].includes(gender)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender",
        });
      }

      event.gender = gender;
    }

    // -------------------------------------------------
    // PARTICIPATION CATEGORY
    // -------------------------------------------------

    if (
      participationCategory !==
      undefined
    ) {
      if (
        ![
          "regular",
          "physically_challenged",
        ].includes(
          participationCategory
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid participation category",
        });
      }

      event.participationCategory =
        participationCategory;
    }

    // -------------------------------------------------
    // EVENT TYPE
    // -------------------------------------------------

    if (eventType !== undefined) {
      if (
        ![
          "individual",
          "team",
        ].includes(eventType)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid event type",
        });
      }

      event.eventType = eventType;

      if (
        eventType === "individual"
      ) {
        event.teamSize = null;
      }
    }

    // -------------------------------------------------
    // MAX PARTICIPANTS
    // -------------------------------------------------

    if (
      maxParticipantsPerInstitution !==
      undefined
    ) {
      event.maxParticipantsPerInstitution =
        maxParticipantsPerInstitution ===
        null ||
        maxParticipantsPerInstitution ===
          ""
          ? null
          : Number(
              maxParticipantsPerInstitution
            );
    }

    // -------------------------------------------------
    // TEAM SIZE
    // -------------------------------------------------

    if (teamSize !== undefined) {
      if (
        event.eventType === "team"
      ) {
        if (
          !teamSize ||
          Number(teamSize) < 2
        ) {
          return res.status(400).json({
            success: false,
            message:
              "Team size must be at least 2",
          });
        }

        event.teamSize =
          Number(teamSize);
      }
    }

    // -------------------------------------------------
    // RESULT
    // -------------------------------------------------

    if (resultType !== undefined) {
      event.resultType = resultType;
    }

    if (unit !== undefined) {
      event.unit =
        unit?.trim() || null;
    }

    // -------------------------------------------------
    // FLAGS
    // -------------------------------------------------

    if (
      applicationOpen !==
      undefined
    ) {
      event.applicationOpen =
        Boolean(applicationOpen);
    }

    if (
      isActive !== undefined
    ) {
      event.isActive =
        Boolean(isActive);
    }

    if (
      displayOrder !==
      undefined
    ) {
      event.displayOrder =
        Number(displayOrder);
    }

    await event.save();

    const updatedEvent =
      await Event.findById(
        event._id
      ).populate(
        "meet",
        "name shortName year startDate endDate venue status"
      );

    return res.status(200).json({
      success: true,
      message:
        "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error(
      "Update event error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another event with the same code, gender and participation category already exists for this meet",
      });
    }

    return sendError(res, error, "Failed to update event");
  }
};

// =====================================================
// DELETE EVENT
// DELETE /api/events/:id
// =====================================================

export const deleteEvent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const event =
      await Event.findById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await Event.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message:
        "Event deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete event error:",
      error
    );

    return sendError(res, error, "Failed to delete event");
  }
};

// =====================================================
// TOGGLE EVENT APPLICATION STATUS
// PATCH /api/events/:id/application-status
// =====================================================

export const toggleApplicationStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const event =
        await Event.findById(id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      event.applicationOpen =
        !event.applicationOpen;

      await event.save();

      return res.status(200).json({
        success: true,
        message: event.applicationOpen
          ? "Applications opened for this event"
          : "Applications closed for this event",
        applicationOpen:
          event.applicationOpen,
      });
    } catch (error) {
      console.error(
        "Toggle event application status error:",
        error
      );

      return sendError(res, error, "Failed to update application status");
    }
  };