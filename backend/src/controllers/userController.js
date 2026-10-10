import User from "../models/User.js";
import { clerkClient } from "@clerk/express";
import escapeRegex from "../utils/escapeRegex.js";
import sendError from "../utils/sendError.js";

// =====================================================
// ROLES
// =====================================================

// Roles that can be created from Admin → Users
const ADMIN_CREATED_ROLES = [
  "admin",
  "sports_officer",
  "college_coordinator",
];

// All roles existing in the application
const ALL_ROLES = [
  "admin",
  "sports_officer",
  "college_coordinator",
  "student",
];

// =====================================================
// HELPERS
// =====================================================

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);

  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
    };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

// =====================================================
// CREATE USER
//
// Creates:
// 1. Clerk account
// 2. MongoDB User
//
// Used for:
// Admin
// Sports Officer
// College Coordinator
//
// Students should use /api/students/admin-create
// =====================================================

export const createUser = async (req, res) => {
  let clerkUser = null;
  let mongoUser = null;

  try {
    const {
      name,
      email,
      phone,
      role,
      isActive = true,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name is required.",
      });
    }

    if (!email?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    if (!role) {
      return res.status(400).json({
        success: false,
        message: "Role is required.",
      });
    }

    // =================================================
    // ONLY ALLOW NON-STUDENT ROLES HERE
    // =================================================

    if (!ADMIN_CREATED_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role. Student accounts must be created through the Student module.",
      });
    }

    // =================================================
    // CLEAN DATA
    // =================================================

    const cleanName = name.trim();

    const cleanEmail = email.trim().toLowerCase();

    const cleanPhone = phone?.trim() || "";

    // =================================================
    // CHECK MONGODB EMAIL
    // =================================================

    const existingMongoUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingMongoUser) {
      return res.status(409).json({
        success: false,
        message:
          "A user with this email already exists in MongoDB.",
      });
    }

    // =================================================
    // SPLIT NAME
    // =================================================

    const { firstName, lastName } = splitName(cleanName);

    // =================================================
    // CREATE CLERK USER
    //
    // NO PASSWORD REQUIRED
    // =================================================

    const clerkCreateData = {
      emailAddress: [cleanEmail],

      firstName,

      lastName,

      // Allows Clerk user creation without password
      skipPasswordRequirement: true,
    };

   

    // If admin creates inactive user,
    // prevent that user from logging in.
    if (!isActive) {
      clerkCreateData.banned = true;
    }

  

    clerkUser = await clerkClient.users.createUser(
      clerkCreateData
    );


    // =================================================
    // CREATE MONGODB USER
    // =================================================

    mongoUser = await User.create({
      clerkUserId: clerkUser.id,

      name: cleanName,

      email: cleanEmail,

      phone: cleanPhone,

      role,

      isActive: Boolean(isActive),
    });

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(201).json({
      success: true,

      message:
        "User created successfully in Clerk and MongoDB.",

      data: {
        _id: mongoUser._id,

        clerkUserId:
          mongoUser.clerkUserId,

        name: mongoUser.name,

        email: mongoUser.email,

        phone: mongoUser.phone,

        role: mongoUser.role,

        isActive:
          mongoUser.isActive,
      },
    });
  } catch (error) {
    console.error(
      "CREATE USER ERROR:",
      error
    );

    // =================================================
    // ROLLBACK CLERK
    //
    // If Clerk account was created but MongoDB
    // creation failed, remove the Clerk account.
    // =================================================

    if (
      clerkUser?.id &&
      !mongoUser
    ) {
      try {
        await clerkClient.users.deleteUser(
          clerkUser.id
        );

      
      } catch (rollbackError) {
        console.error(
          "CLERK ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    // =================================================
    // CLERK ERROR
    // =================================================

    if (error?.errors?.length) {
      const clerkError =
        error.errors[0];

      console.error(
        "CLERK ERROR DETAILS:",
        error.errors
      );

      return res.status(400).json({
        success: false,

        message:
          clerkError?.longMessage ||
          clerkError?.message ||
          "Clerk could not create the user.",
      });
    }

    // =================================================
    // MONGODB DUPLICATE
    // =================================================

    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,

        message: duplicateField
          ? `A user with the same ${duplicateField} already exists.`
          : "A user with the same information already exists.",
      });
    }

    // =================================================
    // OTHER ERROR
    // =================================================

    return sendError(res, error, "Failed to create user.");
  }
};

// =====================================================
// CREATE MY USER
//
// Used when a user already exists in Clerk
// and needs a MongoDB application user.
//
// Normally used for self-signup.
// =====================================================

export const createMyUser = async (
  req,
  res
) => {
  try {
    const clerkUserId =
      req.clerkUserId;

    if (!clerkUserId) {
      return res.status(401).json({
        success: false,
        message:
          "Clerk authentication required.",
      });
    }

    // =================================================
    // CHECK EXISTING MONGO USER
    // =================================================

    const existingUser =
      await User.findOne({
        clerkUserId,
      });

    if (existingUser) {
      return res.status(200).json({
        success: true,
        message:
          "User already exists.",
        data: existingUser,
      });
    }

    // =================================================
    // GET USER FROM CLERK
    // =================================================

    const clerkUser =
      await clerkClient.users.getUser(
        clerkUserId
      );

    const name =
      clerkUser.fullName ||
      [
        clerkUser.firstName,
        clerkUser.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .trim();

    const email =
      clerkUser.primaryEmailAddress
        ?.emailAddress ||
      clerkUser.emailAddresses?.[0]
        ?.emailAddress ||
      "";

    const phone =
      clerkUser.primaryPhoneNumber
        ?.phoneNumber ||
      clerkUser.phoneNumbers?.[0]
        ?.phoneNumber ||
      "";

    if (!name) {
      return res.status(400).json({
        success: false,
        message:
          "Name is missing from the Clerk account.",
      });
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message:
          "Email is missing from the Clerk account.",
      });
    }

    // =================================================
    // CREATE MONGO USER
    // =================================================

    const mongoUser =
      await User.create({
        clerkUserId,

        name,

        email:
          email.toLowerCase(),

        phone,

        role: "student",

        isActive: true,
      });

    return res.status(201).json({
      success: true,

      message:
        "Application user created successfully.",

      data: mongoUser,
    });
  } catch (error) {
    console.error(
      "CREATE MY USER ERROR:",
      error
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Application user already exists.",
      });
    }

    return sendError(res, error, "Failed to create application user.");
  }
};

// =====================================================
// GET MY USER
// =====================================================

export const getMyUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findOne({
        clerkUserId:
          req.clerkUserId,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Application user not found.",
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "This account is inactive.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "GET MY USER ERROR:",
      error
    );

    return sendError(res, error, "Failed to fetch user.");
  }
};

// =====================================================
// GET ALL USERS
// =====================================================

export const getAllUsers = async (
  req,
  res
) => {
  try {
    const {
      search = "",
      role = "",
      isActive = "",
      page = 1,
      limit = 20,
    } = req.query;

    const currentPage =
      Math.max(
        Number(page) || 1,
        1
      );

    const currentLimit =
      Math.min(
        Math.max(
          Number(limit) || 20,
          1
        ),
        100
      );

    const query = {};

    // =================================================
    // SEARCH
    // =================================================

    const searchText =
      escapeRegex(search);

    if (searchText) {
      const regex =
        new RegExp(
          searchText,
          "i"
        );

      query.$or = [
        {
          name: regex,
        },
        {
          email: regex,
        },
        {
          phone: regex,
        },
        {
          clerkUserId: regex,
        },
      ];
    }

    // =================================================
    // ROLE
    // =================================================

    if (
      role &&
      ALL_ROLES.includes(role)
    ) {
      query.role = role;
    }

    // =================================================
    // STATUS
    // =================================================

    if (isActive === "true") {
      query.isActive = true;
    }

    if (isActive === "false") {
      query.isActive = false;
    }

    const skip =
      (currentPage - 1) *
      currentLimit;

    const [
      users,
      totalUsers,
    ] = await Promise.all([
      User.find(query)
        .select("-__v")
        .sort({
          name: 1,
        })
        .skip(skip)
        .limit(currentLimit)
        .lean(),

      User.countDocuments(
        query
      ),
    ]);

    const totalPages =
      Math.ceil(
        totalUsers /
          currentLimit
      );

    return res.status(200).json({
      success: true,

      data: users,

      pagination: {
        page: currentPage,
        limit: currentLimit,
        totalUsers,
        totalPages,
      },
    });
  } catch (error) {
    console.error(
      "GET ALL USERS ERROR:",
      error
    );

    return sendError(res, error, "Failed to fetch users.");
  }
};

// =====================================================
// GET USER BY ID
// =====================================================

export const getUserById = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(
      "GET USER BY ID ERROR:",
      error
    );

    return sendError(res, error, "Failed to fetch user.");
  }
};

// =====================================================
// UPDATE MY USER
//
// User can update own name and phone.
// =====================================================

export const updateMyUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findOne({
        clerkUserId:
          req.clerkUserId,
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "Application user not found.",
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
          message:
            "Name cannot be empty.",
        });
      }

      user.name =
        name.trim();
    }

    if (phone !== undefined) {
      user.phone =
        phone.trim();
    }

    await user.save();

    // =================================================
    // SYNC NAME WITH CLERK
    // =================================================

    if (name !== undefined) {
      const {
        firstName,
        lastName,
      } = splitName(
        user.name
      );

      await clerkClient.users.updateUser(
        user.clerkUserId,
        {
          firstName,
          lastName,
        }
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Profile updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "UPDATE MY USER ERROR:",
      error
    );

    return sendError(res, error, "Failed to update profile.");
  }
};

// =====================================================
// UPDATE USER
//
// Admin / Sports Officer can update users
// according to route permissions.
//
// Supports:
// name
// email
// phone
// password
// role
// isActive
// =====================================================

export const updateUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    const {
      name,
      email,
      phone,
      role,
      password,
      isActive,
    } = req.body;

    // =================================================
    // PERMISSIONS
    //
    // Only an admin can change role, email, password
    // or active status, or edit another admin.
    // A Sports Officer can only correct name / phone
    // of non-admin users.
    // =================================================

    if (req.user.role !== "admin") {
      const changesProtectedField =
        role !== undefined ||
        email !== undefined ||
        password !== undefined ||
        isActive !== undefined;

      if (
        changesProtectedField ||
        user.role === "admin"
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Only an admin can make this change.",
        });
      }
    }

    // =================================================
    // PREVENT SELF DEACTIVATION
    // =================================================

    if (
      isActive === false &&
      String(user._id) ===
        String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status.",
      });
    }

    // =================================================
    // ROLE VALIDATION
    // =================================================

    if (
      role !== undefined &&
      !ALL_ROLES.includes(role)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role.",
      });
    }

    // =================================================
    // LAST ADMIN PROTECTION
    // =================================================

    if (
      user.role === "admin" &&
      role !== undefined &&
      role !== "admin"
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be changed to another role.",
        });
      }
    }

    if (
      user.role === "admin" &&
      isActive === false
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be deactivated.",
        });
      }
    }

    // =================================================
    // EMAIL DUPLICATE CHECK
    // =================================================

    if (email !== undefined) {
      const cleanEmail =
        email.trim().toLowerCase();

      const duplicate =
        await User.findOne({
          email: cleanEmail,
          _id: {
            $ne: user._id,
          },
        });

      if (duplicate) {
        return res.status(409).json({
          success: false,
          message:
            "Another user already uses this email.",
        });
      }
    }

    // =================================================
    // PHONE DUPLICATE CHECK
    // =================================================

    if (phone !== undefined) {
      const cleanPhone =
        phone.trim();

      if (cleanPhone) {
        const duplicatePhone =
          await User.findOne({
            phone: cleanPhone,
            _id: {
              $ne: user._id,
            },
          });

        if (duplicatePhone) {
          return res.status(409).json({
            success: false,
            message:
              "Another user already uses this phone number.",
          });
        }
      }
    }

    // =================================================
    // UPDATE CLERK
    // =================================================

    const clerkUpdate = {};

    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({
          success: false,
          message:
            "Name cannot be empty.",
        });
      }

      const {
        firstName,
        lastName,
      } = splitName(
        name.trim()
      );

      clerkUpdate.firstName =
        firstName;

      clerkUpdate.lastName =
        lastName;
    }

    // =================================================
    // OPTIONAL PASSWORD UPDATE
    //
    // Password is NOT required.
    // If supplied during editing, it is changed.
    // =================================================

    if (password) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 8 characters.",
        });
      }

      clerkUpdate.password =
        password;

      clerkUpdate.signOutOfOtherSessions =
        true;
    }

    // =================================================
    // UPDATE CLERK
    // =================================================

    if (
      Object.keys(
        clerkUpdate
      ).length > 0
    ) {
      await clerkClient.users.updateUser(
        user.clerkUserId,
        clerkUpdate
      );
    }

    // =================================================
    // UPDATE MONGO USER
    // =================================================

    if (name !== undefined) {
      user.name =
        name.trim();
    }

    if (email !== undefined) {
      user.email =
        email.trim().toLowerCase();
    }

    if (phone !== undefined) {
      user.phone =
        phone.trim();
    }

    if (role !== undefined) {
      user.role = role;
    }

    if (isActive !== undefined) {
      user.isActive =
        Boolean(isActive);
    }

    await user.save();

    // =================================================
    // SYNC ACTIVE STATUS WITH CLERK
    // =================================================

    if (isActive !== undefined) {
      if (isActive) {
        await clerkClient.users.unbanUser(
          user.clerkUserId
        );
      } else {
        await clerkClient.users.banUser(
          user.clerkUserId
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        "User updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "UPDATE USER ERROR:",
      error
    );

    if (error?.errors?.length) {
      return res.status(400).json({
        success: false,
        message:
          error.errors[0]?.longMessage ||
          error.errors[0]?.message ||
          "Clerk update failed.",
      });
    }

    if (error?.code === 11000) {
      const duplicateField =
        Object.keys(error.keyPattern || {})[0];

      return res.status(409).json({
        success: false,
        message: duplicateField
          ? `Another user already uses this ${duplicateField}.`
          : "Another user already uses the same information.",
      });
    }

    return sendError(res, error, "Failed to update user.");
  }
};

// =====================================================
// UPDATE USER ROLE
// =====================================================

export const updateUserRole = async (
  req,
  res
) => {
  try {
    const {
      role,
    } = req.body;

    if (!ALL_ROLES.includes(role)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid role.",
      });
    }

    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // =================================================
    // LAST ADMIN PROTECTION
    // =================================================

    if (
      user.role === "admin" &&
      role !== "admin"
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be changed.",
        });
      }
    }

    user.role = role;

    await user.save();

    return res.status(200).json({
      success: true,
      message:
        "User role updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "UPDATE USER ROLE ERROR:",
      error
    );

    return sendError(res, error, "Failed to update user role.");
  }
};

// =====================================================
// TOGGLE USER STATUS
// =====================================================

export const toggleUserStatus = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    // =================================================
    // PREVENT SELF DEACTIVATION
    // =================================================

    if (
      req.user &&
      String(user._id) ===
        String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot change your own account status.",
      });
    }

    const newStatus =
      !user.isActive;

    // =================================================
    // LAST ADMIN PROTECTION
    // =================================================

    if (
      user.role === "admin" &&
      user.isActive &&
      !newStatus
    ) {
      const adminCount =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be deactivated.",
        });
      }
    }

    user.isActive =
      newStatus;

    await user.save();

    // =================================================
    // SYNC WITH CLERK
    // =================================================

    if (newStatus) {
      await clerkClient.users.unbanUser(
        user.clerkUserId
      );
    } else {
      await clerkClient.users.banUser(
        user.clerkUserId
      );
    }

    return res.status(200).json({
      success: true,
      message: newStatus
        ? "User activated successfully."
        : "User deactivated successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "TOGGLE USER STATUS ERROR:",
      error
    );

    return sendError(res, error, "Failed to change user status.");
  }
};
// =====================================================
// DELETE USER
//
// PERMANENT DELETE:
// 1. Delete user from Clerk
// 2. Delete user from MongoDB
//
// IMPORTANT:
// - Cannot delete own account
// - Cannot delete the last active admin
// =====================================================

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // =================================================
    // PREVENT SELF DELETE
    // =================================================

    if (
      req.user &&
      String(user._id) === String(req.user._id)
    ) {
      return res.status(400).json({
        success: false,
        message: "You cannot delete your own account.",
      });
    }

    // =================================================
    // LAST ADMIN PROTECTION
    // =================================================

    if (user.role === "admin" && user.isActive) {
      const adminCount = await User.countDocuments({
        role: "admin",
        isActive: true,
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          success: false,
          message:
            "The last active admin cannot be deleted.",
        });
      }
    }

    // =================================================
    // DELETE FROM CLERK
    // =================================================

    if (user.clerkUserId) {
      try {
        await clerkClient.users.deleteUser(
          user.clerkUserId
        );
      } catch (clerkError) {
        console.error(
          "CLERK DELETE ERROR:",
          clerkError
        );

        // If Clerk user is already deleted,
        // continue with MongoDB deletion.
        const clerkStatus =
          clerkError?.status ||
          clerkError?.statusCode;

        if (clerkStatus !== 404) {
          return res.status(500).json({
            success: false,
            message:
              "Failed to delete user from Clerk. MongoDB user was not deleted.",
          });
        }
      }
    }

    // =================================================
    // DELETE FROM MONGODB
    // =================================================

    await User.findByIdAndDelete(user._id);

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "User deleted successfully from Clerk and MongoDB.",
      data: {
        _id: user._id,
        clerkUserId: user.clerkUserId,
      },
    });

  } catch (error) {
    console.error(
      "DELETE USER ERROR:",
      error
    );

    return sendError(res, error, "Failed to delete user.");
  }
};


// =====================================================
// DELETE MULTIPLE USERS
//
// Deletes users from:
// 1. Clerk
// 2. MongoDB
//
// Body:
// {
//   userIds: ["mongoId1", "mongoId2"]
// }
// =====================================================

export const deleteMultipleUsers = async (req, res) => {
  try {
    const { userIds } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please select at least one user.",
      });
    }

    // Remove duplicate IDs
    const uniqueUserIds = [
      ...new Set(
        userIds.map((id) => String(id))
      ),
    ];

    // =================================================
    // GET USERS
    // =================================================

    const users = await User.find({
      _id: { $in: uniqueUserIds },
    });

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found.",
      });
    }

    // =================================================
    // PREVENT SELF DELETE
    // =================================================

    const currentUserId =
      req.user?._id
        ? String(req.user._id)
        : null;

    const tryingToDeleteSelf = users.some(
      (user) =>
        String(user._id) === currentUserId
    );

    if (tryingToDeleteSelf) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot delete your own account. Remove yourself from the selection.",
      });
    }

    // =================================================
    // LAST ADMIN PROTECTION
    // =================================================

    const selectedActiveAdmins = users.filter(
      (user) =>
        user.role === "admin" &&
        user.isActive
    ).length;

    if (selectedActiveAdmins > 0) {
      const totalActiveAdmins =
        await User.countDocuments({
          role: "admin",
          isActive: true,
        });

      if (
        totalActiveAdmins -
          selectedActiveAdmins <
        1
      ) {
        return res.status(400).json({
          success: false,
          message:
            "At least one active admin must remain. Remove the admin account from the selection.",
        });
      }
    }

    // =================================================
    // DELETE FROM CLERK
    // =================================================

    const clerkErrors = [];

    for (const user of users) {
      if (!user.clerkUserId) {
        continue;
      }

      try {
        await clerkClient.users.deleteUser(
          user.clerkUserId
        );
      } catch (clerkError) {
        const clerkStatus =
          clerkError?.status ||
          clerkError?.statusCode;

        // Already deleted in Clerk
        if (clerkStatus === 404) {
          continue;
        }

        console.error(
          `Failed to delete Clerk user ${user.clerkUserId}:`,
          clerkError
        );

        clerkErrors.push({
          userId: user._id,
          name: user.name,
          message:
            clerkError?.message ||
            "Failed to delete Clerk account.",
        });
      }
    }

    // =================================================
    // IF ANY CLERK DELETE FAILED
    // DO NOT DELETE THOSE USERS FROM MONGO
    // =================================================

    if (clerkErrors.length > 0) {
      return res.status(500).json({
        success: false,
        message:
          "Some users could not be deleted from Clerk. MongoDB records were kept.",
        errors: clerkErrors,
      });
    }

    // =================================================
    // DELETE FROM MONGODB
    // =================================================

    const deleteResult =
      await User.deleteMany({
        _id: {
          $in: users.map(
            (user) => user._id
          ),
        },
      });

    // =================================================
    // SUCCESS
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        `${deleteResult.deletedCount} user(s) deleted successfully from Clerk and MongoDB.`,
      deletedCount:
        deleteResult.deletedCount,
    });

  } catch (error) {
    console.error(
      "DELETE MULTIPLE USERS ERROR:",
      error
    );

    return sendError(res, error, "Failed to delete selected users.");
  }
};

// =====================================================
// RESTORE USER
// =====================================================

export const restoreUser = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.params.id
      );

    if (!user) {
      return res.status(404).json({
        success: false,
        message:
          "User not found.",
      });
    }

    user.isActive = true;

    await user.save();

    // =================================================
    // UNBAN CLERK
    // =================================================

    await clerkClient.users.unbanUser(
      user.clerkUserId
    );

    return res.status(200).json({
      success: true,
      message:
        "User restored successfully.",
      data: user,
    });
  } catch (error) {
    console.error(
      "RESTORE USER ERROR:",
      error
    );

    return sendError(res, error, "Failed to restore user.");
  }
};