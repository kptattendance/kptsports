import User from "../models/User.js";
import Student from "../models/Student.js";
import Institution from "../models/Institution.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.js";

// =====================================================
// CREATE STUDENT PROFILE
// POST /api/students/profile
// =====================================================

export const createStudentProfile = async (req, res) => {
  try {
    // -------------------------------------------------
    // AUTHENTICATION
    // -------------------------------------------------

    if (!req.clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // -------------------------------------------------
    // PHOTO REQUIRED
    // -------------------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Student photo is required",
      });
    }

    // -------------------------------------------------
    // GET DATA
    // -------------------------------------------------

    const {
      name,
      registerNumber,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      semester,
      branch,
      institution,
      phone,
      email,
      participationCategory,
    } = req.body;

    // -------------------------------------------------
    // REQUIRED FIELDS
    // -------------------------------------------------

    if (
      !name ||
      !registerNumber ||
      !fatherName ||
      !dateOfBirth ||
      !gender ||
      !semester ||
      !branch ||
      !institution ||
      !phone ||
      !participationCategory
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All required student details must be provided",
      });
    }

    // -------------------------------------------------
    // VALIDATE PARTICIPATION CATEGORY
    // -------------------------------------------------

    if (
      ![
        "regular",
        "physically_challenged",
      ].includes(participationCategory)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid participation category",
      });
    }

    // -------------------------------------------------
    // VALIDATE GENDER
    // -------------------------------------------------

    if (
      !["male", "female", "other"].includes(gender)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid gender",
      });
    }

    // -------------------------------------------------
    // VALIDATE SEMESTER
    // -------------------------------------------------

    const semesterNumber = Number(semester);

    if (
      ![1, 2, 3, 4, 5, 6].includes(
        semesterNumber
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid semester",
      });
    }

    // -------------------------------------------------
    // FIND INSTITUTION
    // -------------------------------------------------

    const institutionData =
      await Institution.findById(institution);

    if (!institutionData) {
      return res.status(404).json({
        success: false,
        message: "Institution not found",
      });
    }

    if (!institutionData.isActive) {
      return res.status(400).json({
        success: false,
        message: "Selected institution is inactive",
      });
    }

    // -------------------------------------------------
    // CHECK CLERK USER
    // -------------------------------------------------

    let user = await User.findOne({
      clerkUserId: req.clerkUserId,
    });

    // -------------------------------------------------
    // CHECK EXISTING STUDENT PROFILE
    // -------------------------------------------------

    if (user) {
      const existingStudent =
        await Student.findOne({
          user: user._id,
        });

      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: "Student profile already exists",
          student: existingStudent,
        });
      }
    }

    // -------------------------------------------------
    // CHECK REGISTER NUMBER
    // -------------------------------------------------

    const formattedRegisterNumber =
      registerNumber.trim().toUpperCase();

    const existingRegisterNumber =
      await Student.findOne({
        registerNumber: formattedRegisterNumber,
      });

    if (existingRegisterNumber) {
      return res.status(409).json({
        success: false,
        message:
          "A student with this register number already exists",
      });
    }

    // -------------------------------------------------
    // CREATE USER
    // -------------------------------------------------

    if (!user) {
      user = await User.create({
        clerkUserId: req.clerkUserId,

        name: name.trim(),

        email:
          email?.trim().toLowerCase() || "",

        phone: phone.trim(),

        role: "student",

        isActive: true,
      });
    } else {
      user.name = name.trim();

      user.phone = phone.trim();

      if (email) {
        user.email =
          email.trim().toLowerCase();
      }

      await user.save();
    }

    // -------------------------------------------------
    // UPLOAD PHOTO TO CLOUDINARY
    // -------------------------------------------------

    let cloudinaryResult;

    try {
      cloudinaryResult =
        await uploadToCloudinary(
          req.file.buffer,
          "sports-meet/students"
        );
    } catch (uploadError) {
      console.error(
        "Cloudinary upload error:",
        uploadError
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to upload student photo",
      });
    }

    // -------------------------------------------------
    // CREATE STUDENT
    // -------------------------------------------------

    const student =
      await Student.create({
        user: user._id,

        registerNumber:
          formattedRegisterNumber,

        name: name.trim(),

        fatherName:
          fatherName.trim(),

        motherName:
          motherName?.trim() || "",

        dateOfBirth,

        gender,

        semester: semesterNumber,

        branch: branch.trim(),

        institution:
          institutionData._id,

        phone: phone.trim(),

        email:
          email?.trim().toLowerCase() ||
          "",

        participationCategory,

        photo: {
          url: cloudinaryResult.secure_url,
          publicId:
            cloudinaryResult.public_id,
        },

        isProfileComplete: true,

        isActive: true,
      });

    // -------------------------------------------------
    // RESPONSE
    // -------------------------------------------------

    const populatedStudent =
      await Student.findById(
        student._id
      )
        .populate(
          "institution",
          "code name shortName district"
        )
        .populate(
          "user",
          "name email phone role"
        );

    return res.status(201).json({
      success: true,
      message:
        "Student profile created successfully",
      student: populatedStudent,
    });
  } catch (error) {
    console.error(
      "Create student profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create student profile",
      error: error.message,
    });
  }
};

// =====================================================
// GET MY STUDENT PROFILE
// GET /api/students/me
// =====================================================

export const getMyStudentProfile = async (
  req,
  res
) => {
  try {
    if (!req.clerkUserId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const user = await User.findOne({
      clerkUserId: req.clerkUserId,
      isActive: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found",
      });
    }

    const student =
      await Student.findOne({
        user: user._id,
      })
        .populate(
          "institution",
          "code name shortName district"
        )
        .populate(
          "user",
          "name email phone role"
        );

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error(
      "Get my student profile error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get student profile",
      error: error.message,
    });
  }
};

// =====================================================
// GET SINGLE STUDENT
// GET /api/students/:id
// =====================================================

export const getStudentById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const student =
      await Student.findById(id)
        .populate(
          "institution",
          "code name shortName district"
        )
        .populate(
          "user",
          "name email phone role"
        );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    return res.status(200).json({
      success: true,
      student,
    });
  } catch (error) {
    console.error(
      "Get student by ID error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to get student",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL STUDENTS
// GET /api/students
//
// Query:
// ?search=raj
// ?gender=male
// ?semester=4
// ?institution=ID
// ?participationCategory=regular
// ?isActive=true
// =====================================================

export const getAllStudents = async (
  req,
  res
) => {
  try {
    const {
      search,
      gender,
      semester,
      institution,
      participationCategory,
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
      ];
    }

    // -------------------------------------------------
    // GENDER
    // -------------------------------------------------

    if (gender) {
      filter.gender = gender;
    }

    // -------------------------------------------------
    // SEMESTER
    // -------------------------------------------------

    if (semester) {
      filter.semester = Number(semester);
    }

    // -------------------------------------------------
    // INSTITUTION
    // -------------------------------------------------

    if (institution) {
      filter.institution = institution;
    }

    // -------------------------------------------------
    // PARTICIPATION CATEGORY
    // -------------------------------------------------

    if (participationCategory) {
      filter.participationCategory =
        participationCategory;
    }

    // -------------------------------------------------
    // ACTIVE STATUS
    // -------------------------------------------------

    if (isActive !== undefined) {
      filter.isActive =
        isActive === "true";
    }

    const students =
      await Student.find(filter)
        .populate(
          "institution",
          "code name shortName district"
        )
        .sort({
          name: 1,
        });

    return res.status(200).json({
      success: true,
      count: students.length,
      students,
    });
  } catch (error) {
    console.error(
      "Get all students error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to get students",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE STUDENT
// PUT /api/students/:id
//
// Register number and email are intentionally NOT
// updated through this endpoint.
// =====================================================

export const updateStudent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const student =
      await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    const {
      name,
      fatherName,
      motherName,
      dateOfBirth,
      gender,
      semester,
      branch,
      institution,
      phone,
      participationCategory,
    } = req.body;

    // -------------------------------------------------
    // UPDATE BASIC DETAILS
    // -------------------------------------------------

    if (name !== undefined) {
      student.name = name.trim();
    }

    if (fatherName !== undefined) {
      student.fatherName =
        fatherName.trim();
    }

    if (motherName !== undefined) {
      student.motherName =
        motherName.trim();
    }

    if (dateOfBirth !== undefined) {
      student.dateOfBirth =
        dateOfBirth;
    }

    if (gender !== undefined) {
      if (
        ![
          "male",
          "female",
          "other",
        ].includes(gender)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid gender",
        });
      }

      student.gender = gender;
    }

    if (semester !== undefined) {
      const semesterNumber =
        Number(semester);

      if (
        ![1, 2, 3, 4, 5, 6].includes(
          semesterNumber
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid semester",
        });
      }

      student.semester =
        semesterNumber;
    }

    if (branch !== undefined) {
      student.branch =
        branch.trim();
    }

    // -------------------------------------------------
    // INSTITUTION
    // -------------------------------------------------

    if (institution !== undefined) {
      const institutionData =
        await Institution.findById(
          institution
        );

      if (!institutionData) {
        return res.status(404).json({
          success: false,
          message:
            "Institution not found",
        });
      }

      if (!institutionData.isActive) {
        return res.status(400).json({
          success: false,
          message:
            "Institution is inactive",
        });
      }

      student.institution =
        institutionData._id;
    }

    // -------------------------------------------------
    // PHONE
    // -------------------------------------------------

    if (phone !== undefined) {
      student.phone =
        phone.trim();
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

      student.participationCategory =
        participationCategory;
    }

    await student.save();

    const updatedStudent =
      await Student.findById(
        student._id
      )
        .populate(
          "institution",
          "code name shortName district"
        )
        .populate(
          "user",
          "name email phone role"
        );

    return res.status(200).json({
      success: true,
      message:
        "Student updated successfully",
      student: updatedStudent,
    });
  } catch (error) {
    console.error(
      "Update student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update student",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE STUDENT PHOTO
// PUT /api/students/:id/photo
// =====================================================

export const updateStudentPhoto = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Photo is required",
      });
    }

    const student =
      await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // -------------------------------------------------
    // DELETE OLD CLOUDINARY IMAGE
    // -------------------------------------------------

    const cloudinary =
      (await import(
        "../config/cloudinary.js"
      )).default;

    if (
      student.photo?.publicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          student.photo.publicId,
          {
            resource_type: "image",
          }
        );
      } catch (deleteError) {
        console.error(
          "Old Cloudinary image deletion failed:",
          deleteError
        );
      }
    }

    // -------------------------------------------------
    // UPLOAD NEW PHOTO
    // -------------------------------------------------

    const result =
      await uploadToCloudinary(
        req.file.buffer,
        "sports-meet/students"
      );

    student.photo = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await student.save();

    return res.status(200).json({
      success: true,
      message:
        "Student photo updated successfully",
      photo: student.photo,
    });
  } catch (error) {
    console.error(
      "Update student photo error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update student photo",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE STUDENT
// DELETE /api/students/:id
// =====================================================

export const deleteStudent = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const student =
      await Student.findById(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // -------------------------------------------------
    // DELETE CLOUDINARY PHOTO
    // -------------------------------------------------

    const cloudinary =
      (await import(
        "../config/cloudinary.js"
      )).default;

    if (
      student.photo?.publicId
    ) {
      try {
        await cloudinary.uploader.destroy(
          student.photo.publicId,
          {
            resource_type: "image",
          }
        );
      } catch (deleteError) {
        console.error(
          "Cloudinary image deletion failed:",
          deleteError
        );
      }
    }

    // -------------------------------------------------
    // DELETE STUDENT
    // -------------------------------------------------

    const userId = student.user;

    await Student.findByIdAndDelete(id);

    // -------------------------------------------------
    // DELETE ASSOCIATED USER
    // -------------------------------------------------

    if (userId) {
      await User.findByIdAndDelete(
        userId
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "Student deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete student error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to delete student",
      error: error.message,
    });
  }
};