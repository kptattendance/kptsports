import User from "../models/User.js";

const ALLOWED_ROLES = [
  "admin",
  "sports_officer",
  "college_coordinator",
  "student",
];

// =====================================================
// CREATE USER - ADMIN
// =====================================================
export const createUser = async (req, res) => {
  try {
    const {
      clerkUserId,
      name,
      email,
      phone,
      role,
      isActive,
    } = req.body;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------
    if (!clerkUserId || !name || !email) {
      return res.status(400).json({
        success: false,
        message: "Clerk User ID, name and email are required",
      });
    }

    const cleanClerkUserId = clerkUserId.trim();
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || "";

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    // -------------------------------------------------
    // VALIDATE ROLE
    // -------------------------------------------------
    const userRole = role || "student";

    if (!ALLOWED_ROLES.includes(userRole)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // -------------------------------------------------
    // CHECK CLERK ID DUPLICATE
    // -------------------------------------------------
    const existingClerkUser = await User.findOne({
      clerkUserId: cleanClerkUserId,
    });

    if (existingClerkUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this Clerk User ID already exists",
      });
    }

    // -------------------------------------------------
    // CHECK EMAIL DUPLICATE
    // -------------------------------------------------
    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });
    }

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------
    const user = await User.create({
      clerkUserId: cleanClerkUserId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: userRole,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    return res.status(201).json({
      success: true,
      message: "User created successfully",
      data: user,
    });
  } catch (error) {
    console.error("CREATE USER ERROR:", error);

    // MongoDB duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with the same unique information already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user",
      error: error.message,
    });
  }
};

// =====================================================
// CREATE / SYNC MY USER
// =====================================================
// Used when a newly authenticated Clerk user enters
// the Sports Meet application for the first time.
//
// Clerk User ID comes from authentication.
// It is NEVER accepted from the browser.
// =====================================================
export const createMyUser = async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated Clerk User ID not found",
      });
    }

    const {
      name,
      email,
      phone,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone?.trim() || "";

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty",
      });
    }

    // -------------------------------------------------
    // CHECK WHETHER USER ALREADY EXISTS
    // -------------------------------------------------
    const existingUser = await User.findOne({
      clerkUserId,
    });

    if (existingUser) {
      if (!existingUser.isActive) {
        return res.status(403).json({
          success: false,
          message: "This user account has been deactivated",
        });
      }

      return res.status(200).json({
        success: true,
        message: "User already exists",
        data: existingUser,
        alreadyExists: true,
      });
    }

    // -------------------------------------------------
    // CHECK EMAIL
    // -------------------------------------------------
    const existingEmail = await User.findOne({
      email: cleanEmail,
    });

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message:
          "This email is already associated with another application user",
      });
    }

    // -------------------------------------------------
    // NEW USERS ARE STUDENTS BY DEFAULT
    // -------------------------------------------------
    const user = await User.create({
      clerkUserId,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      role: "student",
      isActive: true,
    });

    return res.status(201).json({
      success: true,
      message: "User profile created successfully",
      data: user,
      alreadyExists: false,
    });
  } catch (error) {
    console.error("CREATE MY USER ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "User information already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create user profile",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY USER
// =====================================================
export const getMyUser = async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    const user = await User.findOne({
      clerkUserId,
    }).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Application user profile not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GET MY USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user profile",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL USERS
// =====================================================
export const getAllUsers = async (req, res) => {
  try {
    const {
      search,
      role,
      isActive,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // -------------------------------------------------
    // SEARCH
    // -------------------------------------------------
    if (search?.trim()) {
      filter.$or = [
        {
          name: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          email: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          clerkUserId: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // -------------------------------------------------
    // ROLE FILTER
    // -------------------------------------------------
    if (role) {
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid role filter",
        });
      }

      filter.role = role;
    }

    // -------------------------------------------------
    // ACTIVE FILTER
    // -------------------------------------------------
    if (isActive !== undefined) {
      if (isActive !== "true" && isActive !== "false") {
        return res.status(400).json({
          success: false,
          message: "isActive must be true or false",
        });
      }

      filter.isActive = isActive === "true";
    }

    // -------------------------------------------------
    // PAGINATION
    // -------------------------------------------------
    let currentPage = Number(page);
    let pageLimit = Number(limit);

    if (!Number.isInteger(currentPage) || currentPage < 1) {
      currentPage = 1;
    }

    if (!Number.isInteger(pageLimit) || pageLimit < 1) {
      pageLimit = 20;
    }

    // Maximum 100 records per request
    if (pageLimit > 100) {
      pageLimit = 100;
    }

    const skip = (currentPage - 1) * pageLimit;

    const [users, totalUsers] = await Promise.all([
      User.find(filter)
        .select("-__v")
        .sort({ name: 1 })
        .skip(skip)
        .limit(pageLimit),

      User.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalUsers / pageLimit);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        currentPage,
        limit: pageLimit,
        totalUsers,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
      },
    });
  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
      error: error.message,
    });
  }
};

// =====================================================
// GET USER BY ID
// =====================================================
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    const user = await User.findById(id).select("-__v");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GET USER BY ID ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE MY USER
// =====================================================
// Student/user can update only personal information.
// Role, Clerk ID and account status cannot be changed here.
// =====================================================
export const updateMyUser = async (req, res) => {
  try {
    const clerkUserId = req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authenticated user not found",
      });
    }

    const user = await User.findOne({
      clerkUserId,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "User account is deactivated",
      });
    }

    const {
      name,
      phone,
    } = req.body;

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("UPDATE MY USER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user profile",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER - ADMIN / SPORTS OFFICER
// =====================================================
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const {
      name,
      email,
      phone,
      role,
      isActive,
    } = req.body;

    // -------------------------------------------------
    // NAME
    // -------------------------------------------------
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name cannot be empty",
        });
      }

      user.name = name.trim();
    }

    // -------------------------------------------------
    // EMAIL
    // -------------------------------------------------
    if (email !== undefined) {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail) {
        return res.status(400).json({
          success: false,
          message: "Email cannot be empty",
        });
      }

      const existingEmail = await User.findOne({
        email: cleanEmail,
        _id: { $ne: id },
      });

      if (existingEmail) {
        return res.status(409).json({
          success: false,
          message: "Another user already uses this email",
        });
      }

      user.email = cleanEmail;
    }

    // -------------------------------------------------
    // PHONE
    // -------------------------------------------------
    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    // -------------------------------------------------
    // ROLE
    // -------------------------------------------------
    if (role !== undefined) {
      if (!ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user role",
        });
      }

      // Prevent admin from accidentally removing
      // the last active admin.
      if (
        user.role === "admin" &&
        role !== "admin"
      ) {
        const activeAdminCount = await User.countDocuments({
          role: "admin",
          isActive: true,
          _id: { $ne: id },
        });

        if (activeAdminCount === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot remove the role from the last active administrator",
          });
        }
      }

      user.role = role;
    }

    // -------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------
    if (isActive !== undefined) {
      const newActiveStatus = Boolean(isActive);

      // Cannot deactivate the last admin
      if (
        user.role === "admin" &&
        user.isActive === true &&
        newActiveStatus === false
      ) {
        const activeAdminCount = await User.countDocuments({
          role: "admin",
          isActive: true,
          _id: { $ne: id },
        });

        if (activeAdminCount === 0) {
          return res.status(400).json({
            success: false,
            message:
              "Cannot deactivate the last active administrator",
          });
        }
      }

      user.isActive = newActiveStatus;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "A user with the same unique information already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE USER ROLE ONLY
// =====================================================
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!ALLOWED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // LAST ADMIN PROTECTION
    // -------------------------------------------------
    if (
      user.role === "admin" &&
      role !== "admin"
    ) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: id },
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot change the role of the last active administrator",
        });
      }
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("UPDATE USER ROLE ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user role",
      error: error.message,
    });
  }
};

// =====================================================
// TOGGLE USER ACTIVE STATUS
// =====================================================
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // DO NOT ALLOW SELF-DEACTIVATION
    // -------------------------------------------------
    if (user.clerkUserId === req.clerkUserId) {
      return res.status(400).json({
        success: false,
        message: "A user cannot deactivate their own account",
      });
    }

    // -------------------------------------------------
    // LAST ADMIN PROTECTION
    // -------------------------------------------------
    if (
      user.role === "admin" &&
      user.isActive === true
    ) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: id },
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot deactivate the last active administrator",
        });
      }
    }

    user.isActive = !user.isActive;

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${
        user.isActive ? "activated" : "deactivated"
      } successfully`,
      data: user,
    });
  } catch (error) {
    console.error("TOGGLE USER STATUS ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update user status",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE USER
// =====================================================
// IMPORTANT:
// This performs a SAFE DELETE by deactivating the user.
// The MongoDB document is retained because other models
// may reference User._id.
// =====================================================
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // -------------------------------------------------
    // PREVENT SELF DELETE
    // -------------------------------------------------
    if (user.clerkUserId === req.clerkUserId) {
      return res.status(400).json({
        success: false,
        message: "A user cannot delete their own account",
      });
    }

    // -------------------------------------------------
    // LAST ADMIN PROTECTION
    // -------------------------------------------------
    if (user.role === "admin" && user.isActive) {
      const activeAdminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
        _id: { $ne: id },
      });

      if (activeAdminCount === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Cannot deactivate the last active administrator",
        });
      }
    }

    // -------------------------------------------------
    // SAFE DELETE = DEACTIVATE
    // -------------------------------------------------
    user.isActive = false;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    console.error("DELETE USER ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
      error: error.message,
    });
  }
};

// =====================================================
// RESTORE USER
// =====================================================
export const restoreUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isActive) {
      return res.status(400).json({
        success: false,
        message: "User is already active",
      });
    }

    user.isActive = true;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User restored successfully",
      data: user,
    });
  } catch (error) {
    console.error("RESTORE USER ERROR:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to restore user",
      error: error.message,
    });
  }
};