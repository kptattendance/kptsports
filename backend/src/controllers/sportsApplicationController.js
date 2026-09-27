import SportsApplication from "../models/SportsApplication.js";
import SportsMeet from "../models/SportsMeet.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import cloudinary from "../config/cloudinary.js";

// ======================================================
// HELPER: Upload image buffer to Cloudinary
// ======================================================

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "sports-meet/students",
        resource_type: "image",
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    stream.end(buffer);
  });
};

// ======================================================
// HELPER: Delete image from Cloudinary
// ======================================================

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error.message);
  }
};

// ======================================================
// HELPER: Validate Events
// ======================================================

const validateEvents = async ({
  eventIds,
  meetId,
  gender,
  participationCategory,
}) => {
  if (!Array.isArray(eventIds)) {
    return {
      valid: false,
      message: "Event selection is invalid.",
    };
  }

  if (eventIds.length === 0) {
    return {
      valid: false,
      message: "At least one event must be selected.",
    };
  }

  const uniqueEventIds = [...new Set(eventIds.map(String))];

  const events = await Event.find({
    _id: { $in: uniqueEventIds },
    meet: meetId,
    isActive: true,
    applicationOpen: true,
  });

  if (events.length !== uniqueEventIds.length) {
    return {
      valid: false,
      message:
        "One or more selected events are invalid, inactive, or closed.",
    };
  }

  // ----------------------------------------------------
  // Gender validation
  // ----------------------------------------------------

  const invalidGenderEvent = events.find(
    (event) =>
      event.gender !== "open" &&
      event.gender !== "mixed" &&
      event.gender !== gender
  );

  if (invalidGenderEvent) {
    return {
      valid: false,
      message: `"${invalidGenderEvent.name}" is not available for ${gender}.`,
    };
  }

  // ----------------------------------------------------
  // Participation category validation
  // ----------------------------------------------------

  const invalidCategoryEvent = events.find(
    (event) =>
      event.participationCategory !== participationCategory
  );

  if (invalidCategoryEvent) {
    return {
      valid: false,
      message: `"${invalidCategoryEvent.name}" does not belong to the selected participation category.`,
    };
  }

  return {
    valid: true,
    events,
    eventIds: uniqueEventIds,
  };
};

// ======================================================
// CREATE APPLICATION
// POST /api/sports-applications
// ======================================================

export const createApplication = async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const user = await User.findOne({
      clerkUserId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const {
      meetId,
      collegeCode,
      registerNumber,
      name,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      semester,
      branch,
      phone,
      email,
      participationCategory,
      eventIds,
    } = req.body;

    // ----------------------------------------------------
    // Required fields
    // ----------------------------------------------------

    if (
      !meetId ||
      !collegeCode ||
      !registerNumber ||
      !name ||
      !fatherName ||
      !dateOfBirth ||
      !gender ||
      !semester ||
      !branch ||
      !phone ||
      !participationCategory
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required student details.",
      });
    }

    // ----------------------------------------------------
    // Photo required
    // ----------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Student photo is required.",
      });
    }

    // ----------------------------------------------------
    // Find meet
    // ----------------------------------------------------

    const meet = await SportsMeet.findById(meetId);

    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found.",
      });
    }

    if (!meet.isActive) {
      return res.status(400).json({
        success: false,
        message: "This sports meet is not active.",
      });
    }

    // ----------------------------------------------------
    // Check application period
    // ----------------------------------------------------

    const now = new Date();

    if (
      now < new Date(meet.applicationStartDate) ||
      now > new Date(meet.applicationEndDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Application period is closed.",
      });
    }

    // ----------------------------------------------------
    // Check existing application
    // ----------------------------------------------------

    const existingApplication =
      await SportsApplication.findOne({
        user: user._id,
        meet: meetId,
      });

    if (existingApplication) {
      return res.status(409).json({
        success: false,
        message:
          "An application has already been submitted for this sports meet.",
      });
    }

    // ----------------------------------------------------
    // Parse event IDs
    // ----------------------------------------------------

    let parsedEventIds;

    try {
      parsedEventIds =
        typeof eventIds === "string"
          ? JSON.parse(eventIds)
          : eventIds;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid event selection.",
      });
    }

    // ----------------------------------------------------
    // Validate events
    // ----------------------------------------------------

    const eventValidation = await validateEvents({
      eventIds: parsedEventIds,
      meetId,
      gender,
      participationCategory,
    });

    if (!eventValidation.valid) {
      return res.status(400).json({
        success: false,
        message: eventValidation.message,
      });
    }

    // ----------------------------------------------------
    // Upload photo
    // ----------------------------------------------------

    const uploadedPhoto = await uploadToCloudinary(
      req.file.buffer
    );

    // ----------------------------------------------------
    // Create application
    // ----------------------------------------------------

    const application = await SportsApplication.create({
      user: user._id,

      meet: meetId,

      collegeCode: collegeCode.trim().toUpperCase(),

      registerNumber: registerNumber.trim().toUpperCase(),

      name: name.trim(),

      fatherName: fatherName.trim(),

      motherName: motherName?.trim() || "",

      dateOfBirth,

      gender,

      semester: Number(semester),

      branch: branch.trim(),

      phone: phone.trim(),

      email: email?.trim().toLowerCase() || "",

      participationCategory,

      photo: {
        url: uploadedPhoto.secure_url,
        publicId: uploadedPhoto.public_id,
      },

      selectedEvents: eventValidation.eventIds,

      status: "submitted",

      submittedAt: new Date(),
    });

    const populatedApplication =
      await SportsApplication.findById(application._id)
        .populate("meet")
        .populate("selectedEvents");

    return res.status(201).json({
      success: true,
      message: "Sports meet application submitted successfully.",
      data: populatedApplication,
    });
  } catch (error) {
    console.error(
      "Create application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to create application.",
      error: error.message,
    });
  }
};

// ======================================================
// GET MY APPLICATION
// GET /api/sports-applications/my
// ======================================================

export const getMyApplication = async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId;

    const user = await User.findOne({
      clerkUserId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const { meetId } = req.query;

    const query = {
      user: user._id,
    };

    if (meetId) {
      query.meet = meetId;
    }

    const application =
      await SportsApplication.findOne(query)
        .populate("meet")
        .populate("selectedEvents");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(
      "Get my application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch application.",
      error: error.message,
    });
  }
};

// ======================================================
// GET ALL APPLICATIONS
// GET /api/sports-applications
// ======================================================

export const getAllApplications = async (req, res) => {
  try {
    const {
      meetId,
      eventId,
      gender,
      participationCategory,
      status,
      collegeCode,
      search,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // ----------------------------------------------------
    // Meet filter
    // ----------------------------------------------------

    if (meetId) {
      query.meet = meetId;
    }

    // ----------------------------------------------------
    // Event filter
    // ----------------------------------------------------

    if (eventId) {
      query.selectedEvents = eventId;
    }

    // ----------------------------------------------------
    // Gender filter
    // ----------------------------------------------------

    if (gender) {
      query.gender = gender;
    }

    // ----------------------------------------------------
    // Participation category
    // ----------------------------------------------------

    if (participationCategory) {
      query.participationCategory =
        participationCategory;
    }

    // ----------------------------------------------------
    // Status
    // ----------------------------------------------------

    if (status) {
      query.status = status;
    }

    // ----------------------------------------------------
    // College
    // ----------------------------------------------------

    if (collegeCode) {
      query.collegeCode =
        collegeCode.trim().toUpperCase();
    }

    // ----------------------------------------------------
    // Search
    // ----------------------------------------------------

    if (search) {
      query.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          registerNumber: {
            $regex: search,
            $options: "i",
          },
        },
        {
          collegeCode: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    const pageNumber = Math.max(
      Number(page) || 1,
      1
    );

    const limitNumber = Math.min(
      Math.max(Number(limit) || 50, 1),
      200
    );

    const skip =
      (pageNumber - 1) * limitNumber;

    const [applications, total] =
      await Promise.all([
        SportsApplication.find(query)
          .populate("meet")
          .populate("selectedEvents")
          .populate("user", "name email role")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limitNumber),

        SportsApplication.countDocuments(query),
      ]);

    return res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(
          total / limitNumber
        ),
      },
    });
  } catch (error) {
    console.error(
      "Get all applications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch applications.",
      error: error.message,
    });
  }
};

// ======================================================
// GET SINGLE APPLICATION
// GET /api/sports-applications/:id
// ======================================================

export const getApplicationById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const application =
      await SportsApplication.findById(id)
        .populate("meet")
        .populate("selectedEvents")
        .populate("user", "name email role");

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error(
      "Get application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch application.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE MY APPLICATION
// PUT /api/sports-applications/my
// ======================================================

export const updateMyApplication = async (
  req,
  res
) => {
  try {
    const clerkUserId = req.clerkUserId;

    const user = await User.findOne({
      clerkUserId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const application =
      await SportsApplication.findOne({
        user: user._id,
        meet: req.body.meetId,
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    // ----------------------------------------------------
    // Find meet
    // ----------------------------------------------------

    const meet = await SportsMeet.findById(
      application.meet
    );

    if (!meet) {
      return res.status(404).json({
        success: false,
        message: "Sports meet not found.",
      });
    }

    // ----------------------------------------------------
    // Deadline
    // ----------------------------------------------------

    const now = new Date();

    if (
      now > new Date(meet.applicationEndDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application editing period is closed.",
      });
    }

    // ----------------------------------------------------
    // Fields
    // ----------------------------------------------------

    const {
      collegeCode,
      registerNumber,
      name,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      semester,
      branch,
      phone,
      email,
      participationCategory,
      eventIds,
    } = req.body;

    // ----------------------------------------------------
    // Parse events
    // ----------------------------------------------------

    let parsedEventIds;

    try {
      parsedEventIds =
        typeof eventIds === "string"
          ? JSON.parse(eventIds)
          : eventIds;
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Invalid event selection.",
      });
    }

    // ----------------------------------------------------
    // Validate events
    // ----------------------------------------------------

    const eventValidation = await validateEvents({
      eventIds: parsedEventIds,
      meetId: application.meet,
      gender: gender || application.gender,
      participationCategory:
        participationCategory ||
        application.participationCategory,
    });

    if (!eventValidation.valid) {
      return res.status(400).json({
        success: false,
        message: eventValidation.message,
      });
    }

    // ----------------------------------------------------
    // Update details
    // ----------------------------------------------------

    application.collegeCode =
      collegeCode?.trim().toUpperCase() ||
      application.collegeCode;

    application.registerNumber =
      registerNumber?.trim().toUpperCase() ||
      application.registerNumber;

    application.name =
      name?.trim() || application.name;

    application.fatherName =
      fatherName?.trim() ||
      application.fatherName;

    application.motherName =
      motherName?.trim() ||
      "";

    application.dateOfBirth =
      dateOfBirth || application.dateOfBirth;

    application.gender =
      gender || application.gender;

    application.semester =
      semester
        ? Number(semester)
        : application.semester;

    application.branch =
      branch?.trim() || application.branch;

    application.phone =
      phone?.trim() || application.phone;

    application.email =
      email?.trim().toLowerCase() ||
      application.email;

    application.participationCategory =
      participationCategory ||
      application.participationCategory;

    application.selectedEvents =
      eventValidation.eventIds;

    // ----------------------------------------------------
    // Upload new photo if provided
    // ----------------------------------------------------

    if (req.file) {
      const uploadedPhoto =
        await uploadToCloudinary(
          req.file.buffer
        );

      const oldPublicId =
        application.photo?.publicId;

      application.photo = {
        url: uploadedPhoto.secure_url,
        publicId: uploadedPhoto.public_id,
      };

      if (oldPublicId) {
        await deleteFromCloudinary(
          oldPublicId
        );
      }
    }

    await application.save();

    const updatedApplication =
      await SportsApplication.findById(
        application._id
      )
        .populate("meet")
        .populate("selectedEvents");

    return res.status(200).json({
      success: true,
      message:
        "Sports meet application updated successfully.",
      data: updatedApplication,
    });
  } catch (error) {
    console.error(
      "Update my application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update application.",
      error: error.message,
    });
  }
};

// ======================================================
// UPDATE APPLICATION BY ADMIN
// PUT /api/sports-applications/:id
// ======================================================

export const updateApplication = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const application =
      await SportsApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const {
      collegeCode,
      registerNumber,
      name,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      semester,
      branch,
      phone,
      email,
      participationCategory,
      eventIds,
      status,
    } = req.body;

    // ----------------------------------------------------
    // Validate events only when supplied
    // ----------------------------------------------------

    if (eventIds !== undefined) {
      let parsedEventIds;

      try {
        parsedEventIds =
          typeof eventIds === "string"
            ? JSON.parse(eventIds)
            : eventIds;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: "Invalid event selection.",
        });
      }

      const eventValidation =
        await validateEvents({
          eventIds: parsedEventIds,
          meetId: application.meet,
          gender:
            gender || application.gender,
          participationCategory:
            participationCategory ||
            application.participationCategory,
        });

      if (!eventValidation.valid) {
        return res.status(400).json({
          success: false,
          message: eventValidation.message,
        });
      }

      application.selectedEvents =
        eventValidation.eventIds;
    }

    // ----------------------------------------------------
    // Update fields
    // ----------------------------------------------------

    if (collegeCode !== undefined) {
      application.collegeCode =
        collegeCode.trim().toUpperCase();
    }

    if (registerNumber !== undefined) {
      application.registerNumber =
        registerNumber.trim().toUpperCase();
    }

    if (name !== undefined) {
      application.name = name.trim();
    }

    if (fatherName !== undefined) {
      application.fatherName =
        fatherName.trim();
    }

    if (motherName !== undefined) {
      application.motherName =
        motherName.trim();
    }

    if (dateOfBirth !== undefined) {
      application.dateOfBirth = dateOfBirth;
    }

    if (gender !== undefined) {
      application.gender = gender;
    }

    if (semester !== undefined) {
      application.semester = Number(semester);
    }

    if (branch !== undefined) {
      application.branch = branch.trim();
    }

    if (phone !== undefined) {
      application.phone = phone.trim();
    }

    if (email !== undefined) {
      application.email =
        email.trim().toLowerCase();
    }

    if (participationCategory !== undefined) {
      application.participationCategory =
        participationCategory;
    }

    if (status !== undefined) {
      application.status = status;
    }

    // ----------------------------------------------------
    // Photo
    // ----------------------------------------------------

    if (req.file) {
      const uploadedPhoto =
        await uploadToCloudinary(
          req.file.buffer
        );

      const oldPublicId =
        application.photo?.publicId;

      application.photo = {
        url: uploadedPhoto.secure_url,
        publicId: uploadedPhoto.public_id,
      };

      if (oldPublicId) {
        await deleteFromCloudinary(
          oldPublicId
        );
      }
    }

    await application.save();

    const updatedApplication =
      await SportsApplication.findById(id)
        .populate("meet")
        .populate("selectedEvents")
        .populate(
          "user",
          "name email role"
        );

    return res.status(200).json({
      success: true,
      message:
        "Application updated successfully.",
      data: updatedApplication,
    });
  } catch (error) {
    console.error(
      "Update application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update application.",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE MY APPLICATION
// DELETE /api/sports-applications/my
// ======================================================

export const deleteMyApplication = async (
  req,
  res
) => {
  try {
    const clerkUserId = req.clerkUserId;

    const user = await User.findOne({
      clerkUserId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
      });
    }

    const application =
      await SportsApplication.findOne({
        user: user._id,
        meet: req.query.meetId,
      });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const meet = await SportsMeet.findById(
      application.meet
    );

    if (
      meet &&
      new Date() >
        new Date(meet.applicationEndDate)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Application can no longer be deleted.",
      });
    }

    const publicId =
      application.photo?.publicId;

    await SportsApplication.findByIdAndDelete(
      application._id
    );

    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    return res.status(200).json({
      success: true,
      message:
        "Application deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete my application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete application.",
      error: error.message,
    });
  }
};

// ======================================================
// DELETE APPLICATION BY ADMIN
// DELETE /api/sports-applications/:id
// ======================================================

export const deleteApplication = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const application =
      await SportsApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: "Application not found.",
      });
    }

    const publicId =
      application.photo?.publicId;

    await SportsApplication.findByIdAndDelete(id);

    if (publicId) {
      await deleteFromCloudinary(publicId);
    }

    return res.status(200).json({
      success: true,
      message:
        "Application deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete application error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to delete application.",
      error: error.message,
    });
  }
};