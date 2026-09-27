import SportsMeet from "../models/SportsMeet.js";

// =====================================================
// CREATE SPORTS MEET
// =====================================================
export const createSportsMeet = async (req, res) => {
  try {
    const {
      name,
      shortName,
      year,
      startDate,
      endDate,
      venue,
      applicationStartDate,
      applicationEndDate,
      status,
      isActive,
    } = req.body;

    // Required fields
    if (
      !name ||
      !year ||
      !startDate ||
      !endDate ||
      !venue ||
      !applicationStartDate ||
      !applicationEndDate
    ) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided",
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    const applicationStart = new Date(applicationStartDate);
    const applicationEnd = new Date(applicationEndDate);

    if (
      isNaN(start.getTime()) ||
      isNaN(end.getTime()) ||
      isNaN(applicationStart.getTime()) ||
      isNaN(applicationEnd.getTime())
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date provided",
      });
    }

    if (end < start) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    if (applicationEnd < applicationStart) {
      return res.status(400).json({
        success: false,
        message: "Application end date cannot be before application start date",
      });
    }

    // Check whether same year already has an active meet
    const existingMeet = await SportsMeet.findOne({
      year,
      isActive: true,
    });

    if (existingMeet) {
      return res.status(409).json({
        success: false,
        message: `An active sports meet already exists for ${year}`,
      });
    }

    const sportsMeet = await SportsMeet.create({
      name: name.trim(),
      shortName: shortName?.trim() || "",
      year,
      startDate: start,
      endDate: end,
      venue: venue.trim(),
      applicationStartDate: applicationStart,
      applicationEndDate: applicationEnd,
      status: status || "draft",
      isActive: isActive !== undefined ? isActive : true,
    });

    return res.status(201).json({
      success: true,
      message: "Sports meet created successfully",
      data: sportsMeet,
    });
  } catch (error) {
    console.error("CREATE SPORTS MEET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create sports meet",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL SPORTS MEETS
// =====================================================
export const getAllSportsMeets = async (req, res) => {
  try {
    const {
      search,
      year,
      status,
      isActive,
    } = req.query;

    const filter = {};

    // Search by name / short name / venue
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { shortName: { $regex: search, $options: "i" } },
        { venue: { $regex: search, $options: "i" } },
      ];
    }

    if (year) {
      filter.year = Number(year);
    }

    if (status) {
      filter.status = status;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const sportsMeets = await SportsMeet.find(filter).sort({
      year: -1,
      startDate: -1,
    });

    return res.status(200).json({
      success: true,
      count: sportsMeets.length,
      data: sportsMeets,
    });
  } catch (error) {
    console.error("GET SPORTS MEETS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sports meets",
      error: error.message,
    });
  }
};

// =====================================================
// GET SPORTS MEET BY ID
// =====================================================
export const getSportsMeetById = async (req, res) => {
  try {
    const { id } = req.params;

    const sportsMeet = await SportsMeet.findById(id);

    if (!sportsMeet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: sportsMeet,
    });
  } catch (error) {
    console.error("GET SPORTS MEET BY ID ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch sports meet",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SPORTS MEET
// =====================================================
export const updateSportsMeet = async (req, res) => {
  try {
    const { id } = req.params;

    const sportsMeet = await SportsMeet.findById(id);

    if (!sportsMeet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found",
      });
    }

    const {
      name,
      shortName,
      year,
      startDate,
      endDate,
      venue,
      applicationStartDate,
      applicationEndDate,
      status,
      isActive,
    } = req.body;

    // Check duplicate active year if year is being changed
    if (year !== undefined && Number(year) !== sportsMeet.year) {
      const existingMeet = await SportsMeet.findOne({
        year: Number(year),
        isActive: true,
        _id: { $ne: id },
      });

      if (existingMeet) {
        return res.status(409).json({
          success: false,
          message: `An active sports meet already exists for ${year}`,
        });
      }

      sportsMeet.year = Number(year);
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Meet name cannot be empty",
        });
      }

      sportsMeet.name = name.trim();
    }

    if (shortName !== undefined) {
      sportsMeet.shortName = shortName.trim();
    }

    if (venue !== undefined) {
      if (!venue.trim()) {
        return res.status(400).json({
          success: false,
          message: "Venue cannot be empty",
        });
      }

      sportsMeet.venue = venue.trim();
    }

    if (startDate !== undefined) {
      const date = new Date(startDate);

      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid start date",
        });
      }

      sportsMeet.startDate = date;
    }

    if (endDate !== undefined) {
      const date = new Date(endDate);

      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid end date",
        });
      }

      sportsMeet.endDate = date;
    }

    if (applicationStartDate !== undefined) {
      const date = new Date(applicationStartDate);

      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid application start date",
        });
      }

      sportsMeet.applicationStartDate = date;
    }

    if (applicationEndDate !== undefined) {
      const date = new Date(applicationEndDate);

      if (isNaN(date.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid application end date",
        });
      }

      sportsMeet.applicationEndDate = date;
    }

    // Validate date relationships after all updates
    if (sportsMeet.endDate < sportsMeet.startDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    if (
      sportsMeet.applicationEndDate <
      sportsMeet.applicationStartDate
    ) {
      return res.status(400).json({
        success: false,
        message: "Application end date cannot be before application start date",
      });
    }

    if (status !== undefined) {
      const allowedStatuses = [
        "draft",
        "applications_open",
        "applications_closed",
        "ongoing",
        "completed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid sports meet status",
        });
      }

      sportsMeet.status = status;
    }

    if (isActive !== undefined) {
      sportsMeet.isActive = Boolean(isActive);
    }

    await sportsMeet.save();

    return res.status(200).json({
      success: true,
      message: "Sports meet updated successfully",
      data: sportsMeet,
    });
  } catch (error) {
    console.error("UPDATE SPORTS MEET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update sports meet",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE SPORTS MEET
// =====================================================
export const deleteSportsMeet = async (req, res) => {
  try {
    const { id } = req.params;

    const sportsMeet = await SportsMeet.findById(id);

    if (!sportsMeet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found",
      });
    }

    // Prevent deleting an ongoing/completed meet
    if (
      sportsMeet.status === "ongoing" ||
      sportsMeet.status === "completed"
    ) {
      return res.status(400).json({
        success: false,
        message: "Ongoing or completed sports meets cannot be deleted",
      });
    }

    await SportsMeet.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Sports meet deleted successfully",
    });
  } catch (error) {
    console.error("DELETE SPORTS MEET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete sports meet",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE SPORTS MEET STATUS
// =====================================================
export const updateSportsMeetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "draft",
      "applications_open",
      "applications_closed",
      "ongoing",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid sports meet status",
      });
    }

    const sportsMeet = await SportsMeet.findById(id);

    if (!sportsMeet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found",
      });
    }

    sportsMeet.status = status;

    await sportsMeet.save();

    return res.status(200).json({
      success: true,
      message: "Sports meet status updated successfully",
      data: sportsMeet,
    });
  } catch (error) {
    console.error("UPDATE SPORTS MEET STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update sports meet status",
      error: error.message,
    });
  }
};

// =====================================================
// TOGGLE ACTIVE STATUS
// =====================================================
export const toggleSportsMeetActive = async (req, res) => {
  try {
    const { id } = req.params;

    const sportsMeet = await SportsMeet.findById(id);

    if (!sportsMeet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found",
      });
    }

    sportsMeet.isActive = !sportsMeet.isActive;

    await sportsMeet.save();

    return res.status(200).json({
      success: true,
      message: `Sports meet ${
        sportsMeet.isActive ? "activated" : "deactivated"
      } successfully`,
      data: sportsMeet,
    });
  } catch (error) {
    console.error("TOGGLE SPORTS MEET ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update active status",
      error: error.message,
    });
  }
};