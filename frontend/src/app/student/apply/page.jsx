"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";

import axios from "axios";

import Link from "next/link";

import {
  Camera,
  Check,
  ChevronRight,
  Hash,
  Phone,
  Send,
  Trophy,
  Upload,
  UserRound,
  Loader2,
  ChevronDown,
  LogOut,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function StudentApplyPage() {
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const { user } = useUser();

  const fileInputRef =
    useRef(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [meet, setMeet] =
    useState(null);

  const [institutions, setInstitutions] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [application, setApplication] =
    useState(null);

  const [photoFile, setPhotoFile] =
    useState(null);

  const [photoPreview, setPhotoPreview] =
    useState("");

  const [selectedEvents, setSelectedEvents] =
    useState([]);

  const [form, setForm] = useState({
    collegeCode: "",
    registerNumber: "",
    name: "",
    fatherName: "",
    motherName: "",
    dateOfBirth: "",
    gender: "",
    semester: "",
    branch: "",
    phone: "",
    email: "",
    participationCategory: "regular",
  });

  const [error, setError] =
    useState("");

  const [profileOpen, setProfileOpen] =
    useState(false);

  const profileRef =
    useRef(null);

  // =====================================================
  // LOAD DATA
  // =====================================================

  useEffect(() => {
    if (!isLoaded || !isSignedIn)
      return;

    loadData();
  }, [
    isLoaded,
    isSignedIn,
  ]);

  // Close profile dropdown
  useEffect(() => {
    const handleClickOutside =
      (event) => {
        if (
          profileRef.current &&
          !profileRef.current.contains(
            event.target
          )
        ) {
          setProfileOpen(false);
        }
      };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  const loadData =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          await getToken();

        const config = {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        };

        // =================================================
        // INSTITUTIONS
        // =================================================

        const institutionResponse =
          await axios.get(
            `${API_URL}/api/institutions`,
            config
          );

        const institutionResponseData =
          institutionResponse.data;

        let loadedInstitutions =
          [];

        if (
          Array.isArray(
            institutionResponseData?.data
          )
        ) {
          loadedInstitutions =
            institutionResponseData.data;
        } else if (
          Array.isArray(
            institutionResponseData
              ?.data?.institutions
          )
        ) {
          loadedInstitutions =
            institutionResponseData
              .data.institutions;
        } else if (
          Array.isArray(
            institutionResponseData
              ?.institutions
          )
        ) {
          loadedInstitutions =
            institutionResponseData
              .institutions;
        }

        setInstitutions(
          loadedInstitutions.filter(
            (institution) =>
              institution.isActive !==
              false
          )
        );

        // =================================================
        // SPORTS MEET
        // =================================================

        const meetResponse =
          await axios.get(
            `${API_URL}/api/sports-meets`,
            config
          );

        const meetResponseData =
          meetResponse.data;

        let meets = [];

        if (
          Array.isArray(
            meetResponseData?.data
          )
        ) {
          meets =
            meetResponseData.data;
        } else if (
          Array.isArray(
            meetResponseData
              ?.data?.meets
          )
        ) {
          meets =
            meetResponseData
              .data.meets;
        } else if (
          Array.isArray(
            meetResponseData
              ?.meets
          )
        ) {
          meets =
            meetResponseData.meets;
        }

        const now =
          new Date();

        const activeMeet =
          meets.find(
            (item) => {
              if (
                item.isActive ===
                false
              ) {
                return false;
              }

              if (
                item.status !==
                "applications_open"
              ) {
                return false;
              }

              if (
                item.applicationStartDate &&
                now <
                  new Date(
                    item.applicationStartDate
                  )
              ) {
                return false;
              }

              if (
                item.applicationEndDate &&
                now >
                  new Date(
                    item.applicationEndDate
                  )
              ) {
                return false;
              }

              return true;
            }
          ) || null;

        if (!activeMeet) {
          setMeet(null);
          setLoading(false);
          return;
        }

        setMeet(activeMeet);

        // =================================================
        // EVENTS
        // =================================================

        const eventResponse =
          await axios.get(
            `${API_URL}/api/events?meet=${activeMeet._id}`,
            config
          );

        const eventResponseData =
          eventResponse.data;

        let loadedEvents =
          [];

        if (
          Array.isArray(
            eventResponseData?.data
          )
        ) {
          loadedEvents =
            eventResponseData.data;
        } else if (
          Array.isArray(
            eventResponseData
              ?.data?.events
          )
        ) {
          loadedEvents =
            eventResponseData
              .data.events;
        } else if (
          Array.isArray(
            eventResponseData
              ?.events
          )
        ) {
          loadedEvents =
            eventResponseData.events;
        }

        setEvents(
          loadedEvents.filter(
            (event) =>
              event.isActive !==
                false &&
              event.applicationOpen !==
                false
          )
        );

        // =================================================
        // EXISTING APPLICATION
        // =================================================

        try {
          const applicationResponse =
            await axios.get(
              `${API_URL}/api/sports-applications/my?meetId=${activeMeet._id}`,
              config
            );

          const existing =
            applicationResponse
              .data?.data;

          if (existing) {
            setApplication(
              existing
            );

            setForm({
              collegeCode:
                existing.collegeCode ||
                "",

              registerNumber:
                existing.registerNumber ||
                "",

              name:
                existing.name ||
                "",

              fatherName:
                existing.fatherName ||
                "",

              motherName:
                existing.motherName ||
                "",

              dateOfBirth:
                existing.dateOfBirth
                  ? new Date(
                      existing.dateOfBirth
                    )
                      .toISOString()
                      .split("T")[0]
                  : "",

              gender:
                existing.gender ||
                "",

              semester:
                existing.semester
                  ? String(
                      existing.semester
                    )
                  : "",

              branch:
                existing.branch ||
                "",

              phone:
                existing.phone ||
                "",

              email:
                existing.email ||
                "",

              participationCategory:
                existing.participationCategory ||
                "regular",
            });

            setPhotoPreview(
              existing.photo?.url ||
                ""
            );

            setSelectedEvents(
              (
                existing.selectedEvents ||
                []
              ).map((event) =>
                typeof event ===
                "object"
                  ? event._id
                  : event
              )
            );
          }
        } catch (err) {
          if (
            err.response?.status !==
            404
          ) {
            throw err;
          }
        }
      } catch (err) {
        console.error(
          "LOAD DATA ERROR:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            "Unable to load application."
        );
      } finally {
        setLoading(false);
      }
    };

  // =====================================================
  // UPDATE FIELD
  // =====================================================

  const updateField = (
    field,
    value
  ) => {
    setForm(
      (previous) => ({
        ...previous,
        [field]: value,
      })
    );
  };

  // =====================================================
  // PHOTO
  // =====================================================

  const handlePhoto = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please select a valid image."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Photo must be less than 5 MB."
      );
      return;
    }

    setPhotoFile(file);

    setPhotoPreview(
      URL.createObjectURL(file)
    );

    setError("");
  };

  // =====================================================
  // FILTER EVENTS
  // =====================================================

  const filteredEvents =
    useMemo(() => {
      return events.filter(
        (event) => {
          const participationMatch =
            event.participationCategory ===
            form.participationCategory;

          const genderMatch =
            event.gender === "open" ||
            event.gender === "mixed" ||
            event.gender ===
              form.gender;

          return (
            participationMatch &&
            genderMatch
          );
        }
      );
    }, [
      events,
      form.participationCategory,
      form.gender,
    ]);

  const handleEventSelection =
    (e) => {
      const eventId =
        e.target.value;

      if (!eventId) return;

      if (
        selectedEvents.includes(
          eventId
        )
      ) {
        setError(
          "This event is already added."
        );
        return;
      }

      setSelectedEvents(
        (previous) => [
          ...previous,
          eventId,
        ]
      );

      setError("");
    };

  // =====================================================
  // REMOVE EVENT
  // =====================================================

  const removeEvent = (
    eventId
  ) => {
    setSelectedEvents(
      (previous) =>
        previous.filter(
          (id) =>
            id !== eventId
        )
    );
  };

  // =====================================================
  // SUBMIT
  // =====================================================

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setError("");

      if (!form.collegeCode) {
        setError(
          "Select college."
        );
        return;
      }

      if (
        !form.registerNumber.trim()
      ) {
        setError(
          "Enter register number."
        );
        return;
      }

      if (!form.name.trim()) {
        setError(
          "Enter student name."
        );
        return;
      }

      if (
        !form.fatherName.trim()
      ) {
        setError(
          "Enter father's name."
        );
        return;
      }

      if (!form.dateOfBirth) {
        setError(
          "Select date of birth."
        );
        return;
      }

      if (!form.gender) {
        setError(
          "Select gender."
        );
        return;
      }

      if (!form.semester) {
        setError(
          "Select semester."
        );
        return;
      }

      if (!form.branch.trim()) {
        setError(
          "Enter branch."
        );
        return;
      }

      if (!form.phone.trim()) {
        setError(
          "Enter phone number."
        );
        return;
      }

      if (
        !application &&
        !photoFile
      ) {
        setError(
          "Student photo is required."
        );
        return;
      }

      if (
        selectedEvents.length ===
        0
      ) {
        setError(
          "Select at least one event."
        );
        return;
      }

      try {
        setSaving(true);

        const token =
          await getToken();

        const formData =
          new FormData();

        formData.append(
          "meetId",
          meet._id
        );

        formData.append(
          "collegeCode",
          form.collegeCode
        );

        formData.append(
          "registerNumber",
          form.registerNumber
            .trim()
            .toUpperCase()
        );

        formData.append(
          "name",
          form.name.trim()
        );

        formData.append(
          "fatherName",
          form.fatherName.trim()
        );

        formData.append(
          "motherName",
          form.motherName.trim()
        );

        formData.append(
          "dateOfBirth",
          form.dateOfBirth
        );

        formData.append(
          "gender",
          form.gender
        );

        formData.append(
          "semester",
          form.semester
        );

        formData.append(
          "branch",
          form.branch.trim()
        );

        formData.append(
          "phone",
          form.phone.trim()
        );

        formData.append(
          "email",
          form.email.trim()
        );

        formData.append(
          "participationCategory",
          form.participationCategory
        );

        formData.append(
          "eventIds",
          JSON.stringify(
            selectedEvents
          )
        );

        if (photoFile) {
          formData.append(
            "photo",
            photoFile
          );
        }

        let response;

        if (application) {
          response =
            await axios.put(
              `${API_URL}/api/sports-applications/my`,
              formData,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                  "Content-Type":
                    "multipart/form-data",
                },
              }
            );
        } else {
          response =
            await axios.post(
              `${API_URL}/api/sports-applications`,
              formData,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                  "Content-Type":
                    "multipart/form-data",
                },
              }
            );
        }

        if (
          !response.data?.success
        ) {
          throw new Error(
            "Application was not saved."
          );
        }

        window.location.href =
          "/student";

      } catch (err) {
        console.error(err);

        setError(
          err.response?.data
            ?.message ||
            "Unable to submit application."
        );
      } finally {
        setSaving(false);
      }
    };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    !isLoaded ||
    loading
  ) {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center">
        <Loader2
          size={32}
          className="text-orange-500 animate-spin"
        />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // =====================================================
  // NO ACTIVE MEET
  // =====================================================

  if (!meet) {
    return (
      <div className="min-h-screen bg-[#fffaf5]">

        <CommonHeader
          user={user}
          application={application}
          profileOpen={profileOpen}
          setProfileOpen={setProfileOpen}
          profileRef={profileRef}
          handleLogout={async () => {
            const { signOut } =
              await import(
                "@clerk/nextjs"
              );
          }}
        />

        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-5">

          <div className="bg-white rounded-3xl border border-orange-100 p-8 text-center shadow-sm">

            <Trophy
              size={40}
              className="text-orange-500 mx-auto"
            />

            <h2 className="text-xl font-bold mt-4 text-slate-900">
              Applications are closed
            </h2>

            <p className="text-sm text-slate-500 mt-2">
              There is currently no sports meet
              open for applications.
            </p>

            <Link
              href="/student"
              prefetch={true}
              className="inline-flex mt-5 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
            >
              Back
            </Link>

          </div>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf5] text-slate-800">

      {/* =================================================
          COMMON HEADER
      ================================================= */}

      <CommonHeader
        user={user}
        application={application}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
        profileRef={profileRef}
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

{/* =================================================
    BACK TO DASHBOARD
================================================= */}

<div className="pt-5 sm:pt-6">
  <Link
    href="/student"
    prefetch={true}
    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl text-sm font-semibold transition"
  >
    <span className="text-lg leading-none">←</span>
    Back to Dashboard
  </Link>
</div>

    

        {/* ERROR */}

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6"
        >

          {/* =================================================
              PARTICIPANT
          ================================================= */}

          <section className="bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">

            <div className="p-5 sm:p-6 border-b border-slate-100">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <UserRound size={20} />
                </div>

                <div>

                  <h2 className="font-bold text-slate-900">
                    Participant Details
                  </h2>

                  <p className="text-xs text-slate-500">
                    Enter the details as recorded by
                    the college.
                  </p>

                </div>

              </div>

            </div>

            <div className="p-5 sm:p-6">

              {/* PHOTO */}

              <div className="flex flex-col sm:flex-row items-center gap-5 bg-orange-50 rounded-2xl p-5">

                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Student"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-white border-2 border-dashed border-orange-300 flex items-center justify-center text-orange-400">
                    <Camera size={30} />
                  </div>
                )}

                <div className="text-center sm:text-left">

                  <div className="font-bold text-slate-900">
                    Student Photo
                  </div>

                  <p className="text-xs text-slate-500 mt-1">
                    JPG, PNG or WEBP.
                    Maximum 5 MB.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold"
                  >
                    <Upload size={16} />
                    Choose Photo
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhoto}
                    className="hidden"
                  />

                </div>

              </div>

              {/* FIELDS */}

              <div className="grid sm:grid-cols-2 gap-4 mt-6">

                <Select
                  label="College"
                  value={form.collegeCode}
                  onChange={(value) =>
                    updateField(
                      "collegeCode",
                      value
                    )
                  }
                  options={[...institutions]
                    .sort((a, b) =>
                      (a.code || "").localeCompare(
                        b.code || ""
                      )
                    )
                    .map((institution) => [
                      institution.code,
                      `${institution.code} - ${institution.name}`,
                    ])}
                  required
                />

                <Field
                  label="Register Number"
                  value={form.registerNumber}
                  onChange={(value) =>
                    updateField(
                      "registerNumber",
                      value.toUpperCase()
                    )
                  }
                  icon={<Hash size={16} />}
                  required
                />

                <Field
                  label="Student Name"
                  value={form.name}
                  onChange={(value) =>
                    updateField(
                      "name",
                      value
                    )
                  }
                  required
                />

                <Field
                  label="Father's Name"
                  value={form.fatherName}
                  onChange={(value) =>
                    updateField(
                      "fatherName",
                      value
                    )
                  }
                  required
                />

                <Field
                  label="Mother's Name"
                  value={form.motherName}
                  onChange={(value) =>
                    updateField(
                      "motherName",
                      value
                    )
                  }
                />

                <Field
                  label="Date of Birth"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(value) =>
                    updateField(
                      "dateOfBirth",
                      value
                    )
                  }
                  required
                />

                <Select
                  label="Gender"
                  value={form.gender}
                  onChange={(value) =>
                    updateField(
                      "gender",
                      value
                    )
                  }
                  options={[
                    ["male", "Male"],
                    ["female", "Female"],
                    ["other", "Other"],
                  ]}
                  required
                />

                <Select
                  label="Semester"
                  value={form.semester}
                  onChange={(value) =>
                    updateField(
                      "semester",
                      value
                    )
                  }
                  options={[
                    ["1", "Semester 1"],
                    ["2", "Semester 2"],
                    ["3", "Semester 3"],
                    ["4", "Semester 4"],
                    ["5", "Semester 5"],
                    ["6", "Semester 6"],
                  ]}
                  required
                />

                <Select
                  label="Department"
                  value={form.branch}
                  onChange={(value) =>
                    updateField(
                      "branch",
                      value
                    )
                  }
                  options={[
                    ["AE", "AE - Alternate Energy Technology"],
                    ["AI", "AI - Artificial Intelligence"],
                    ["AI&ML", "AI&ML - Artificial Intelligence and Machine Learning"],
                    ["AM", "AM - Automation & Robotics"],
                    ["AN", "AN - Aeronautical Engineering"],
                    ["AO", "AO - Automation Engineering"],
                    ["AR", "AR - Architecture Assistantship"],
                    ["AT", "AT - Automobile Engineering"],
                    ["AV", "AV - Film Technology (Animation and Visual Effects)"],
                    ["CC", "CC - Cloud Computing & Big Data"],
                    ["CE", "CE - Civil Engineering"],
                    ["CE&A", "CE&A - Computer Engineering and Applications"],
                    ["CG", "CG - Cloud Computing"],
                    ["CH", "CH - Chemical Engineering"],
                    ["CN", "CN - Cinematography"],
                    ["CP", "CP - Commercial Practice"],
                    ["CR", "CR - Ceramics"],
                    ["CS", "CS - Computer Science & Engineering"],
                    ["CS&IS", "CS&IS - Cyber System and Information Security"],
                    ["CY", "CY - Cyber Physical Systems & Security"],
                    ["EC", "EC - Electronics & Communication Engg."],
                    ["EE", "EE - Electrical & Electronics Engineering"],
                    ["EI", "EI - Electronic Instrumentation & Control Engg"],
                    ["EN", "EN - Civil Environmental Engineering"],
                    ["ES", "ES - Environmental Sustainability"],
                    ["EV", "EV - Electrical Engg & Electrical Vehicle Technology"],
                    ["FP", "FP - Food Processing & Preservation"],
                    ["FT", "FT - Apparel Design & Fabrication Technology"],
                    ["GA", "GA - Gaming & Animation"],
                    ["HP", "HP - Mechanical Engineering (HPE)"],
                    ["IC", "IC - Indian Constitution"],
                    ["ID", "ID - Interior Decoration / Interior Design"],
                    ["IS", "IS - Information Science & Engineering"],
                    ["LI", "LI - Library and Information Science"],
                    ["LT", "LT - Leather & Fashion Technology"],
                    ["MC", "MC - Mechatronics"],
                    ["ME", "ME - Mechanical Engineering"],
                    ["MI", "MI - Mechanical Engg. (Instruments)"],
                    ["MN", "MN - Mining & Mine Surveying"],
                    ["MT", "MT - Metallurgical Engineering"],
                    ["MY", "MY - Mechanical Engg. (Machine Tools & Technology)"],
                    ["PH", "PH - Civil (PH&E) Engineering"],
                    ["PDIS", "PDIS - Post Diploma in Industrial Safety"],
                    ["PO", "PO - Polymer Technology"],
                    ["PT", "PT - Printing Technology"],
                    ["SR", "SR - Sound Recording and Engineering"],
                    ["TT", "TT - Travel & Tourism"],
                    ["TX", "TX - Textile Technology"],
                    ["WS", "WS - Mechanical Engg. (WSM)"],
                    ["OTHER", "Other"],
                  ].sort((a, b) => {
                    if (a[0] === "OTHER")
                      return 1;

                    if (b[0] === "OTHER")
                      return -1;

                    return a[1].localeCompare(
                      b[1]
                    );
                  })}
                  required
                />

                <Field
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    updateField(
                      "phone",
                      value
                    )
                  }
                  icon={<Phone size={16} />}
                  required
                />

                <Field
                  label="Email"
                  value={form.email}
                  onChange={(value) =>
                    updateField(
                      "email",
                      value
                    )
                  }
                />

              </div>

              {/* PARTICIPATION */}

              <div className="mt-6">

                <label className="text-sm font-semibold text-slate-700">
                  Participation Category
                </label>

                <div className="grid sm:grid-cols-2 gap-3 mt-2">

                  <CategoryCard
                    selected={
                      form.participationCategory ===
                      "regular"
                    }
                    title="Regular"
                    onClick={() =>
                      updateField(
                        "participationCategory",
                        "regular"
                      )
                    }
                  />

                  <CategoryCard
                    selected={
                      form.participationCategory ===
                      "physically_challenged"
                    }
                    title="Physically Challenged"
                    onClick={() =>
                      updateField(
                        "participationCategory",
                        "physically_challenged"
                      )
                    }
                  />

                </div>

              </div>

            </div>

          </section>

          {/* =================================================
              EVENTS
          ================================================= */}

          <section className="mt-6 bg-white rounded-3xl border border-orange-100 shadow-sm overflow-hidden">

            <div className="p-5 sm:p-6 border-b border-slate-100">

              <h2 className="font-bold text-slate-900">
                Select Events
              </h2>

              <p className="text-xs text-slate-500 mt-1">
                Add as many events as required.
              </p>

            </div>

            <div className="p-5 sm:p-6">

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Event
                <span className="text-orange-500 ml-1">
                  *
                </span>
              </label>

              <div className="flex flex-col sm:flex-row gap-3">

                <select
                  id="sports-event-select"
                  defaultValue=""
                  onChange={
                    handleEventSelection
                  }
                  className="flex-1 h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
                >

                  <option value="">
                    Select Event
                  </option>

                  {filteredEvents.map(
                    (event) => (
                      <option
                        key={event._id}
                        value={event._id}
                        disabled={selectedEvents.includes(
                          event._id
                        )}
                      >
                        {event.code} -{" "}
                        {event.name}
                      </option>
                    )
                  )}

                </select>

                <button
                  type="button"
                  onClick={() => {
                    const select =
                      document.getElementById(
                        "sports-event-select"
                      );

                    const eventId =
                      select?.value;

                    if (!eventId) {
                      setError(
                        "Please select an event."
                      );
                      return;
                    }

                    if (
                      selectedEvents.includes(
                        eventId
                      )
                    ) {
                      setError(
                        "This event is already added."
                      );
                      return;
                    }

                    setSelectedEvents(
                      (previous) => [
                        ...previous,
                        eventId,
                      ]
                    );

                    select.value = "";

                    setError("");
                  }}
                  className="h-11 px-5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-bold whitespace-nowrap"
                >
                  + Add Event
                </button>

              </div>

              {/* SELECTED EVENTS */}

              {selectedEvents.length >
                0 && (
                <div className="mt-6">

                  <div className="flex items-center justify-between mb-3">

                    <div className="text-sm font-bold text-slate-800">
                      Selected Events
                    </div>

                    <div className="text-xs text-slate-500">
                      {selectedEvents.length}{" "}
                      event
                      {selectedEvents.length !==
                      1
                        ? "s"
                        : ""}
                    </div>

                  </div>

                  <div className="space-y-2">

                    {selectedEvents.map(
                      (
                        eventId,
                        index
                      ) => {

                        const event =
                          events.find(
                            (item) =>
                              item._id ===
                              eventId
                          );

                        if (!event)
                          return null;

                        return (
                          <div
                            key={
                              eventId
                            }
                            className="flex items-center justify-between gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100"
                          >

                            <div className="flex items-center gap-3 min-w-0">

                              <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                {index +
                                  1}
                              </div>

                              <div className="min-w-0">

                                <div className="text-xs font-bold text-orange-600">
                                  {
                                    event.code
                                  }
                                </div>

                                <div className="text-sm font-semibold text-slate-800 truncate">
                                  {
                                    event.name
                                  }
                                </div>

                              </div>

                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeEvent(
                                  eventId
                                )
                              }
                              className="w-8 h-8 rounded-lg bg-white border border-orange-200 text-red-500 hover:bg-red-50 hover:border-red-200 font-bold shrink-0"
                            >
                              ×
                            </button>

                          </div>
                        );
                      }
                    )}

                  </div>

                </div>
              )}

            </div>

          </section>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="sticky bottom-4 mt-6">

            <div className="bg-white border border-orange-100 shadow-xl rounded-2xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">

              <div className="text-sm">

                <span className="font-bold text-slate-900">
                  {
                    selectedEvents.length
                  }
                </span>{" "}

                <span className="text-slate-500">
                  events selected
                </span>

              </div>

<div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">

  {/* CANCEL */}
  <Link
    href="/student"
    prefetch={true}
    className="w-full sm:w-auto h-12 px-6 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold flex items-center justify-center transition"
  >
    Cancel
  </Link>
              <button
                type="submit"
                disabled={
                  saving ||
                  selectedEvents.length ===
                    0
                }
                className="w-full sm:w-auto px-7 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-40"
              >

                {saving ? (
                  <>
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />

                    Saving...
                  </>
                ) : (
                  <>
                    <Send size={17} />

                    {application
                      ? "Update Application"
                      : "Submit Application"}

                    <ChevronRight
                      size={17}
                    />
                  </>
                )}

              </button>
              </div>

            </div>

          </div>

        </form>

      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 text-center">

        <div className="border-t border-orange-100 pt-6">

          <p className="text-xs text-slate-400">
            Sports Meet Student Portal
          </p>

        </div>

      </footer>

    </div>
  );
}

/* =========================================================
   COMMON HEADER
========================================================= */

function CommonHeader({
  user,
  application,
  profileOpen,
  setProfileOpen,
  profileRef,
}) {
  const { signOut } =
    useClerk();

  const handleLogout =
    async () => {
      await signOut({
        redirectUrl: "/",
      });
    };

  
}

/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  value,
  onChange,
  type = "text",
  icon,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-semibold text-slate-700 mb-1.5">

        {label}

        {required && (
          <span className="text-orange-500 ml-1">
            *
          </span>
        )}

      </label>

      <div className="relative">

        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value
            )
          }
          className={`w-full h-11 rounded-xl border border-slate-200 outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50 text-sm ${
            icon
              ? "pl-9 pr-3"
              : "px-3"
          }`}
        />

      </div>

    </div>
  );
}

/* =========================================================
   SELECT
========================================================= */

function Select({
  label,
  value,
  onChange,
  options,
  required = false,
}) {
  return (
    <div>

      <label className="block text-sm font-semibold text-slate-700 mb-1.5">

        {label}

        {required && (
          <span className="text-orange-500 ml-1">
            *
          </span>
        )}

      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full h-11 rounded-xl border border-slate-200 px-3 text-sm bg-white outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50"
      >

        <option value="">
          Select {label}
        </option>

        {options.map(
          (
            [
              optionValue,
              optionLabel,
            ]
          ) => (
            <option
              key={
                optionValue
              }
              value={
                optionValue
              }
            >
              {optionLabel}
            </option>
          )
        )}

      </select>

    </div>
  );
}

/* =========================================================
   CATEGORY CARD
========================================================= */

function CategoryCard({
  selected,
  title,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-4 rounded-2xl border-2 text-left ${
        selected
          ? "border-orange-500 bg-orange-50"
          : "border-slate-200 hover:border-orange-200"
      }`}
    >

      <div className="flex items-center justify-between">

        <span className="font-semibold text-slate-800">
          {title}
        </span>

        <span
          className={`w-6 h-6 rounded-full flex items-center justify-center ${
            selected
              ? "bg-orange-500 text-white"
              : "border border-slate-300"
          }`}
        >

          {selected && (
            <Check size={14} />
          )}

        </span>

      </div>

    </button>
  );
}