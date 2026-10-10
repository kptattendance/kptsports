import Institution from "../models/Institution.js";
import escapeRegex from "../utils/escapeRegex.js";
import sendError from "../utils/sendError.js";

// Contact details are only visible to staff.
// Students only need the list of colleges.
const STAFF_ROLES = ["admin", "sports_officer"];

const PUBLIC_FIELDS =
  "code name shortName district isActive";

const visibleFields = (user) =>
  STAFF_ROLES.includes(user?.role)
    ? ""
    : PUBLIC_FIELDS;

// =====================================================
// CREATE INSTITUTION
// POST /api/institutions
// =====================================================

export const createInstitution = async (
  req,
  res
) => {
  try {
    const {
      code,
      name,
      shortName,
      district,
      address,
      contactPerson,
      contactPhone,
      contactEmail,
    } = req.body;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (!code || !name) {
      return res.status(400).json({
        success: false,
        message:
          "Institution code and name are required",
      });
    }

    const formattedCode =
      code.trim().toUpperCase();

    // -------------------------------------------------
    // CHECK DUPLICATE CODE
    // -------------------------------------------------

    const existingInstitution =
      await Institution.findOne({
        code: formattedCode,
      });

    if (existingInstitution) {
      return res.status(409).json({
        success: false,
        message:
          "Institution with this code already exists",
      });
    }

    // -------------------------------------------------
    // CREATE
    // -------------------------------------------------

    const institution =
      await Institution.create({
        code: formattedCode,

        name: name.trim(),

        shortName:
          shortName?.trim() || "",

        district:
          district?.trim() || "",

        address:
          address?.trim() || "",

        contactPerson:
          contactPerson?.trim() || "",

        contactPhone:
          contactPhone?.trim() || "",

        contactEmail:
          contactEmail
            ?.trim()
            .toLowerCase() || "",

        isActive: true,
      });

    return res.status(201).json({
      success: true,
      message:
        "Institution created successfully",
      institution,
    });
  } catch (error) {
    console.error(
      "Create institution error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Institution code already exists",
      });
    }

    return sendError(res, error, "Failed to create institution");
  }
};

// =====================================================
// GET ALL INSTITUTIONS
// GET /api/institutions
//
// Query:
// ?search=polytechnic
// ?district=Mangalore
// ?isActive=true
// =====================================================

export const getAllInstitutions = async (
  req,
  res
) => {
  try {
    const {
      search,
      district,
      isActive,
    } = req.query;

    const filter = {};

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          code: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
        {
          shortName: {
            $regex: escapeRegex(search),
            $options: "i",
          },
        },
      ];
    }

    // -------------------------------------------------
    // DISTRICT
    // -------------------------------------------------

    if (district) {
      filter.district = {
        $regex: escapeRegex(district),
        $options: "i",
      };
    }

    // -------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------

    if (isActive !== undefined) {
      filter.isActive =
        isActive === "true";
    }

    const institutions =
      await Institution.find(filter)
        .select(visibleFields(req.user))
        .sort({
          name: 1,
        });

    return res.status(200).json({
      success: true,
      count: institutions.length,
      institutions,
    });
  } catch (error) {
    console.error(
      "Get institutions error:",
      error
    );

    return sendError(res, error, "Failed to get institutions");
  }
};

// =====================================================
// GET SINGLE INSTITUTION
// GET /api/institutions/:id
// =====================================================

export const getInstitutionById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const institution =
      await Institution.findById(id)
        .select(visibleFields(req.user));

    if (!institution) {
      return res.status(404).json({
        success: false,
        message:
          "Institution not found",
      });
    }

    return res.status(200).json({
      success: true,
      institution,
    });
  } catch (error) {
    console.error(
      "Get institution error:",
      error
    );

    return sendError(res, error, "Failed to get institution");
  }
};

// =====================================================
// UPDATE INSTITUTION
// PUT /api/institutions/:id
// =====================================================

export const updateInstitution = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const institution =
      await Institution.findById(id);

    if (!institution) {
      return res.status(404).json({
        success: false,
        message:
          "Institution not found",
      });
    }

    const {
      code,
      name,
      shortName,
      district,
      address,
      contactPerson,
      contactPhone,
      contactEmail,
    } = req.body;

    // -------------------------------------------------
    // CODE
    // -------------------------------------------------

    if (code !== undefined) {
      const formattedCode =
        code.trim().toUpperCase();

      const duplicate =
        await Institution.findOne({
          code: formattedCode,
          _id: {
            $ne: id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another institution already uses this code",
        });
      }

      institution.code =
        formattedCode;
    }

    // -------------------------------------------------
    // NAME
    // -------------------------------------------------

    if (name !== undefined) {
      institution.name =
        name.trim();
    }

    if (shortName !== undefined) {
      institution.shortName =
        shortName.trim();
    }

    if (district !== undefined) {
      institution.district =
        district.trim();
    }

    if (address !== undefined) {
      institution.address =
        address.trim();
    }

    if (
      contactPerson !== undefined
    ) {
      institution.contactPerson =
        contactPerson.trim();
    }

    if (
      contactPhone !== undefined
    ) {
      institution.contactPhone =
        contactPhone.trim();
    }

    if (
      contactEmail !== undefined
    ) {
      institution.contactEmail =
        contactEmail
          .trim()
          .toLowerCase();
    }

    await institution.save();

    return res.status(200).json({
      success: true,
      message:
        "Institution updated successfully",
      institution,
    });
  } catch (error) {
    console.error(
      "Update institution error:",
      error
    );

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Institution code already exists",
      });
    }

    return sendError(res, error, "Failed to update institution");
  }
};

// =====================================================
// DELETE INSTITUTION
// DELETE /api/institutions/:id
// =====================================================

export const deleteInstitution = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const institution =
      await Institution.findById(id);

    if (!institution) {
      return res.status(404).json({
        success: false,
        message:
          "Institution not found",
      });
    }

    // -------------------------------------------------
    // IMPORTANT
    // -------------------------------------------------
    // We will later prevent deletion if students
    // or registrations are linked to this institution.
    //
    // For now, delete is allowed only for admin.
    // -------------------------------------------------

    await Institution.findByIdAndDelete(
      id
    );

    return res.status(200).json({
      success: true,
      message:
        "Institution deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete institution error:",
      error
    );

    return sendError(res, error, "Failed to delete institution");
  }
};

// =====================================================
// ACTIVATE / DEACTIVATE INSTITUTION
// PATCH /api/institutions/:id/status
// =====================================================

export const toggleInstitutionStatus =
  async (req, res) => {
    try {
      const { id } = req.params;

      const institution =
        await Institution.findById(id);

      if (!institution) {
        return res.status(404).json({
          success: false,
          message:
            "Institution not found",
        });
      }

      institution.isActive =
        !institution.isActive;

      await institution.save();

      return res.status(200).json({
        success: true,
        message:
          institution.isActive
            ? "Institution activated successfully"
            : "Institution deactivated successfully",
        isActive:
          institution.isActive,
        institution,
      });
    } catch (error) {
      console.error(
        "Toggle institution status error:",
        error
      );

      return sendError(res, error, "Failed to update institution status");
    }
  };