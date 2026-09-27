"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import * as XLSX from "xlsx";

import {
  Search,
  Download,
  RefreshCw,
  RotateCcw,
  Users,
  Eye,
  X,
  ChevronDown,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function AdminApplicationsPage() {
  const { isLoaded, isSignedIn, getToken } =
    useAuth();

  // =====================================================
  // STATE
  // =====================================================

  const [applications, setApplications] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [selectedApplication, setSelectedApplication] =
    useState(null);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [meetFilter, setMeetFilter] =
    useState("all");

  const [collegeFilter, setCollegeFilter] =
    useState("all");

  const [genderFilter, setGenderFilter] =
    useState("all");

  const [semesterFilter, setSemesterFilter] =
    useState("all");

  const [branchFilter, setBranchFilter] =
    useState("all");

  const [participationFilter, setParticipationFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [eventFilter, setEventFilter] =
    useState("all");

  const [sortBy, setSortBy] =
    useState("name");

  // =====================================================
  // LOAD APPLICATIONS
  // =====================================================

  const loadApplications =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          await getToken();

        const response =
          await axios.get(
            `${API_URL}/api/sports-applications`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const responseData =
          response.data;

        let list = [];

        // -------------------------------------------------
        // Support common response formats
        // -------------------------------------------------

        if (
          Array.isArray(
            responseData
          )
        ) {
          list =
            responseData;
        } else if (
          Array.isArray(
            responseData?.data
          )
        ) {
          list =
            responseData.data;
        } else if (
          Array.isArray(
            responseData?.data?.applications
          )
        ) {
          list =
            responseData.data
              .applications;
        } else if (
          Array.isArray(
            responseData?.applications
          )
        ) {
          list =
            responseData.applications;
        }

        setApplications(list);

      } catch (err) {
        console.error(
          "APPLICATION LOAD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load applications."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn
    ) {
      loadApplications();
    }
  }, [
    isLoaded,
    isSignedIn,
  ]);

  // =====================================================
  // NORMALIZE EVENT
  // =====================================================

  const getEventId =
    (event) => {
      if (!event) {
        return "";
      }

      if (
        typeof event ===
        "string"
      ) {
        return event;
      }

      return (
        event._id ||
        event.id ||
        ""
      );
    };

  const getEventCode =
    (event) => {
      if (!event) {
        return "";
      }

      if (
        typeof event ===
        "string"
      ) {
        return event;
      }

      return (
        event.code ||
        ""
      );
    };

  const getEventName =
    (event) => {
      if (!event) {
        return "";
      }

      if (
        typeof event ===
        "string"
      ) {
        return event;
      }

      return (
        event.name ||
        ""
      );
    };

  // =====================================================
  // APPLICATION EVENTS
  // =====================================================

  const getApplicationEvents =
    (application) => {
      if (
        !application
          ?.selectedEvents
      ) {
        return [];
      }

      if (
        Array.isArray(
          application.selectedEvents
        )
      ) {
        return application.selectedEvents;
      }

      return [];
    };

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const meets =
    useMemo(() => {

      const map =
        new Map();

      applications.forEach(
        (application) => {

          const meet =
            application.meet;

          if (
            meet &&
            typeof meet ===
              "object"
          ) {
            const id =
              meet._id;

            if (id) {
              map.set(
                String(id),
                meet
              );
            }
          }

        }
      );

      return [
        ...map.values(),
      ];

    }, [
      applications,
    ]);

  const colleges =
    useMemo(() => {

      return [
        ...new Set(
          applications
            .map(
              (application) =>
                application.collegeCode
            )
            .filter(Boolean)
        ),
      ].sort();

    }, [
      applications,
    ]);

  const branches =
    useMemo(() => {

      return [
        ...new Set(
          applications
            .map(
              (application) =>
                application.branch
            )
            .filter(Boolean)
        ),
      ].sort();

    }, [
      applications,
    ]);

  const semesters =
    useMemo(() => {

      return [
        ...new Set(
          applications
            .map(
              (application) =>
                application.semester
            )
            .filter(
              (value) =>
                value !==
                undefined &&
                value !== null &&
                value !== ""
            )
        ),
      ].sort(
        (a, b) =>
          Number(a) -
          Number(b)
      );

    }, [
      applications,
    ]);

  const events =
    useMemo(() => {

      const map =
        new Map();

      applications.forEach(
        (application) => {

          getApplicationEvents(
            application
          ).forEach(
            (event) => {

              const id =
                getEventId(
                  event
                );

              if (!id) {
                return;
              }

              if (
                !map.has(
                  String(id)
                )
              ) {
                map.set(
                  String(id),
                  event
                );
              }

            }
          );

        }
      );

      return [
        ...map.values(),
      ].sort(
        (a, b) =>
          getEventCode(a).localeCompare(
            getEventCode(b)
          )
      );

    }, [
      applications,
    ]);

  // =====================================================
  // FILTERED APPLICATIONS
  // =====================================================

  const filteredApplications =
    useMemo(() => {

      const text =
        search
          .trim()
          .toLowerCase();

      const result =
        applications.filter(
          (application) => {

            // ---------------------------------------------
            // SEARCH
            // ---------------------------------------------

            if (text) {

              const name =
                String(
                  application.name ||
                    ""
                ).toLowerCase();

              const registerNumber =
                String(
                  application.registerNumber ||
                    ""
                ).toLowerCase();

              const phone =
                String(
                  application.phone ||
                    ""
                ).toLowerCase();

              const email =
                String(
                  application.email ||
                    ""
                ).toLowerCase();

              const collegeCode =
                String(
                  application.collegeCode ||
                    ""
                ).toLowerCase();

              const matchesSearch =
                name.includes(text) ||
                registerNumber.includes(
                  text
                ) ||
                phone.includes(text) ||
                email.includes(text) ||
                collegeCode.includes(text);

              if (
                !matchesSearch
              ) {
                return false;
              }
            }

            // ---------------------------------------------
            // MEET
            // ---------------------------------------------

            if (
              meetFilter !==
                "all"
            ) {

              const applicationMeetId =
                application.meet?._id ||
                application.meet;

              if (
                String(
                  applicationMeetId
                ) !==
                String(
                  meetFilter
                )
              ) {
                return false;
              }
            }

            // ---------------------------------------------
            // COLLEGE
            // ---------------------------------------------

            if (
              collegeFilter !==
                "all" &&
              application.collegeCode !==
                collegeFilter
            ) {
              return false;
            }

            // ---------------------------------------------
            // GENDER
            // ---------------------------------------------

            if (
              genderFilter !==
                "all" &&
              application.gender !==
                genderFilter
            ) {
              return false;
            }

            // ---------------------------------------------
            // SEMESTER
            // ---------------------------------------------

            if (
              semesterFilter !==
                "all" &&
              String(
                application.semester
              ) !==
                String(
                  semesterFilter
                )
            ) {
              return false;
            }

            // ---------------------------------------------
            // BRANCH
            // ---------------------------------------------

            if (
              branchFilter !==
                "all" &&
              application.branch !==
                branchFilter
            ) {
              return false;
            }

            // ---------------------------------------------
            // PARTICIPATION
            // ---------------------------------------------

            if (
              participationFilter !==
                "all" &&
              application.participationCategory !==
                participationFilter
            ) {
              return false;
            }

            // ---------------------------------------------
            // STATUS
            // ---------------------------------------------

            if (
              statusFilter !==
                "all" &&
              application.status !==
                statusFilter
            ) {
              return false;
            }

            // ---------------------------------------------
            // EVENT
            // ---------------------------------------------

            if (
              eventFilter !==
                "all"
            ) {

              const hasEvent =
                getApplicationEvents(
                  application
                ).some(
                  (event) =>
                    String(
                      getEventId(
                        event
                      )
                    ) ===
                    String(
                      eventFilter
                    )
                );

              if (!hasEvent) {
                return false;
              }
            }

            return true;
          }
        );

      // ===================================================
      // SORT
      // ===================================================

      result.sort(
        (a, b) => {

          if (
            sortBy ===
            "registerNumber"
          ) {
            return String(
              a.registerNumber ||
                ""
            ).localeCompare(
              String(
                b.registerNumber ||
                  ""
              )
            );
          }

          if (
            sortBy ===
            "college"
          ) {
            return String(
              a.collegeCode ||
                ""
            ).localeCompare(
              String(
                b.collegeCode ||
                  ""
              )
            );
          }

          if (
            sortBy ===
            "semester"
          ) {
            return (
              Number(
                a.semester || 0
              ) -
              Number(
                b.semester || 0
              )
            );
          }

          if (
            sortBy ===
            "submitted"
          ) {
            return (
              new Date(
                b.submittedAt ||
                  b.createdAt ||
                  0
              ) -
              new Date(
                a.submittedAt ||
                  a.createdAt ||
                  0
              )
            );
          }

          return String(
            a.name ||
              ""
          ).localeCompare(
            String(
              b.name ||
                ""
            )
          );

        }
      );

      return result;

    }, [
      applications,
      search,
      meetFilter,
      collegeFilter,
      genderFilter,
      semesterFilter,
      branchFilter,
      participationFilter,
      statusFilter,
      eventFilter,
      sortBy,
    ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters =
    () => {

      setSearch("");
      setMeetFilter("all");
      setCollegeFilter("all");
      setGenderFilter("all");
      setSemesterFilter("all");
      setBranchFilter("all");
      setParticipationFilter("all");
      setStatusFilter("all");
      setEventFilter("all");
      setSortBy("name");

    };

  // =====================================================
  // VIEW APPLICATION
  // =====================================================

  const handleView =
    async (id) => {

      try {

        setLoadingDetails(
          true
        );

        const token =
          await getToken();

        const response =
          await axios.get(
            `${API_URL}/api/sports-applications/${id}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const responseData =
          response.data;

        const application =
          responseData?.data?.application ||
          responseData?.application ||
          responseData?.data ||
          responseData;

        setSelectedApplication(
          application
        );

      } catch (err) {

        console.error(
          "VIEW APPLICATION ERROR:",
          err
        );

        alert(
          err.response?.data?.message ||
            "Unable to load application."
        );

      } finally {

        setLoadingDetails(
          false
        );

      }

    };

  // =====================================================
  // EXCEL DOWNLOAD
  // =====================================================

  const downloadExcel =
    () => {

      if (
        filteredApplications.length ===
        0
      ) {
        alert(
          "No applications to download."
        );
        return;
      }

      const rows =
        filteredApplications.map(
          (
            application,
            index
          ) => {

            const selectedEvents =
              getApplicationEvents(
                application
              );

            const eventNames =
              selectedEvents
                .map(
                  (event) =>
                    `${getEventCode(
                      event
                    )} - ${getEventName(
                      event
                    )}`
                )
                .filter(Boolean)
                .join(", ");

            const meetName =
              typeof application.meet ===
              "object"
                ? application.meet?.name ||
                  ""
                : "";

            return {

              "Sl No":
                index + 1,

              "Student Name":
                application.name ||
                "",

              "Register Number":
                application.registerNumber ||
                "",

              "College Code":
                application.collegeCode ||
                "",

              "Father Name":
                application.fatherName ||
                "",

              "Mother Name":
                application.motherName ||
                "",

              "Date of Birth":
                formatDate(
                  application.dateOfBirth
                ),

              "Gender":
                application.gender ||
                "",

              "Semester":
                application.semester ||
                "",

              "Branch":
                application.branch ||
                "",

              "Phone":
                application.phone ||
                "",

              "Email":
                application.email ||
                "",

              "Participation":
                formatValue(
                  application.participationCategory
                ),

              "Status":
                formatValue(
                  application.status
                ),

              "Meet":
                meetName,

              "Selected Events":
                eventNames,

              "No. of Events":
                selectedEvents.length,

              "Submitted At":
                formatDateTime(
                  application.submittedAt ||
                    application.createdAt
                ),

            };

          }
        );

      const worksheet =
        XLSX.utils.json_to_sheet(
          rows
        );

      worksheet["!cols"] = [
        { wch: 8 },
        { wch: 28 },
        { wch: 18 },
        { wch: 12 },
        { wch: 25 },
        { wch: 25 },
        { wch: 14 },
        { wch: 10 },
        { wch: 10 },
        { wch: 18 },
        { wch: 15 },
        { wch: 30 },
        { wch: 22 },
        { wch: 15 },
        { wch: 30 },
        { wch: 60 },
        { wch: 14 },
        { wch: 22 },
      ];

      const workbook =
        XLSX.utils.book_new();

      XLSX.utils.book_append_sheet(
        workbook,
        worksheet,
        "Applications"
      );

      const date =
        new Date()
          .toISOString()
          .slice(
            0,
            10
          );

      XLSX.writeFile(
        workbook,
        `sports-meet-applications-${date}.xlsx`
      );

    };

  // =====================================================
  // LOADING
  // =====================================================

  if (
    !isLoaded ||
    loading
  ) {

    return (

      <main className="min-h-screen bg-[#fffaf5]">

        <div className="max-w-7xl mx-auto px-5 py-8">

          <div className="animate-pulse">

            <div className="h-8 w-72 bg-slate-200 rounded" />

            <div className="mt-3 h-4 w-96 max-w-full bg-slate-200 rounded" />

            <div className="mt-8 h-24 bg-white border border-slate-200 rounded-2xl" />

            <div className="mt-5 h-96 bg-white border border-slate-200 rounded-2xl" />

          </div>

        </div>

      </main>

    );

  }

  // =====================================================
  // NOT SIGNED IN
  // =====================================================

  if (!isSignedIn) {
    return null;
  }

  // =====================================================
  // MAIN
  // =====================================================

  return (

    <main className="min-h-screen bg-[#fffaf5]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-orange-100">

        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

          <div>

            <h1 className="font-bold text-slate-900">
              Sports Meet Applications
            </h1>

            <p className="text-[11px] text-slate-500">
              Admin Panel
            </p>

          </div>

          <button
            onClick={
              loadApplications
            }
            disabled={
              loading
            }
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-600 transition"
          >

            <RefreshCw
              size={15}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            <span className="hidden sm:inline">
              Refresh
            </span>

          </button>

        </div>

      </header>

      {/* =================================================
          CONTENT
      ================================================= */}

      <div className="max-w-7xl mx-auto px-5 py-7">

        {/* =================================================
            TOP
        ================================================= */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">

          <div>

            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
              Applications
            </p>

            <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
              Student Applications
            </h2>

          </div>

          <div className="flex items-center gap-2">

            <div className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-sm">

              <Users
                size={16}
                className="text-orange-500"
              />

              <span className="font-bold text-slate-900">
                {
                  filteredApplications.length
                }
              </span>

              <span className="text-slate-500">
                applications
              </span>

            </div>

            <button
              type="button"
              onClick={
                downloadExcel
              }
              disabled={
                filteredApplications.length ===
                0
              }
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >

              <Download
                size={16}
              />

              Excel

            </button>

          </div>

        </div>

        {/* =================================================
            FILTERS
        ================================================= */}

        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-4">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">

            {/* SEARCH */}

            <div className="relative xl:col-span-2">

              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search name, register no, phone..."
                className="w-full h-10 rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />

              {search && (

                <button
                  type="button"
                  onClick={() =>
                    setSearch("")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-500"
                >
                  ×
                </button>

              )}

            </div>

            {/* MEET */}

            <Select
              value={
                meetFilter
              }
              onChange={
                setMeetFilter
              }
              options={[
                [
                  "all",
                  "All Meets",
                ],
                ...meets.map(
                  (meet) => [
                    meet._id,
                    meet.name,
                  ]
                ),
              ]}
            />

            {/* COLLEGE */}

            <Select
              value={
                collegeFilter
              }
              onChange={
                setCollegeFilter
              }
              options={[
                [
                  "all",
                  "All Colleges",
                ],
                ...colleges.map(
                  (college) => [
                    college,
                    college,
                  ]
                ),
              ]}
            />

            {/* GENDER */}

            <Select
              value={
                genderFilter
              }
              onChange={
                setGenderFilter
              }
              options={[
                [
                  "all",
                  "All Gender",
                ],
                [
                  "male",
                  "Male",
                ],
                [
                  "female",
                  "Female",
                ],
                [
                  "other",
                  "Other",
                ],
              ]}
            />

            {/* SEMESTER */}

            <Select
              value={
                semesterFilter
              }
              onChange={
                setSemesterFilter
              }
              options={[
                [
                  "all",
                  "All Semester",
                ],
                ...semesters.map(
                  (semester) => [
                    semester,
                    `Semester ${semester}`,
                  ]
                ),
              ]}
            />

            {/* BRANCH */}

            <Select
              value={
                branchFilter
              }
              onChange={
                setBranchFilter
              }
              options={[
                [
                  "all",
                  "All Branches",
                ],
                ...branches.map(
                  (branch) => [
                    branch,
                    branch,
                  ]
                ),
              ]}
            />

            {/* PARTICIPATION */}

            <Select
              value={
                participationFilter
              }
              onChange={
                setParticipationFilter
              }
              options={[
                [
                  "all",
                  "All Participation",
                ],
                [
                  "regular",
                  "Regular",
                ],
                [
                  "physically_challenged",
                  "Physically Challenged",
                ],
              ]}
            />

            {/* STATUS */}

            <Select
              value={
                statusFilter
              }
              onChange={
                setStatusFilter
              }
              options={[
                [
                  "all",
                  "All Status",
                ],
                [
                  "submitted",
                  "Submitted",
                ],
                [
                  "approved",
                  "Approved",
                ],
                [
                  "rejected",
                  "Rejected",
                ],
              ]}
            />

            {/* EVENT */}

            <Select
              value={
                eventFilter
              }
              onChange={
                setEventFilter
              }
              options={[
                [
                  "all",
                  "All Events",
                ],
                ...events.map(
                  (event) => [
                    getEventId(
                      event
                    ),
                    `${getEventCode(
                      event
                    )} - ${getEventName(
                      event
                    )}`,
                  ]
                ),
              ]}
            />

            {/* SORT */}

            <Select
              value={
                sortBy
              }
              onChange={
                setSortBy
              }
              options={[
                [
                  "name",
                  "Sort: Name",
                ],
                [
                  "registerNumber",
                  "Sort: Register No",
                ],
                [
                  "college",
                  "Sort: College",
                ],
                [
                  "semester",
                  "Sort: Semester",
                ],
                [
                  "submitted",
                  "Sort: Submitted",
                ],
              ]}
            />

            {/* CLEAR */}

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-orange-600 transition"
            >

              <RotateCcw
                size={15}
              />

              Clear

            </button>

          </div>

          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-slate-400">

            <span>
              Showing{" "}
              <strong className="text-slate-700">
                {
                  filteredApplications.length
                }
              </strong>
              {" "}of{" "}
              <strong className="text-slate-700">
                {
                  applications.length
                }
              </strong>
              {" "}applications
            </span>

          </div>

        </div>

        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>

        )}

        {/* =================================================
            TABLE
        ================================================= */}

        <div className="mt-5 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[1250px] text-sm">

              <thead>

                <tr className="bg-slate-50 border-b border-slate-200">

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    S.No
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                    Student
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                    Register No
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                    College
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Sem
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-500">
                    Branch
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Gender
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Events
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-500">
                    View
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredApplications.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={10}
                      className="px-6 py-16 text-center"
                    >

                      <Users
                        size={32}
                        className="mx-auto text-slate-300 mb-3"
                      />

                      <p className="font-semibold text-slate-600">
                        No applications found
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredApplications.map(
                    (
                      application,
                      index
                    ) => {

                      const selectedEvents =
                        getApplicationEvents(
                          application
                        );

                      const photoUrl =
                        application.photo?.url ||
                        "";

                      return (

                        <tr
                          key={
                            application._id
                          }
                          className="border-b border-slate-100 last:border-0 hover:bg-orange-50/40 transition"
                        >

                          {/* S.NO */}

                          <td className="px-4 py-3 text-center text-slate-500">
                            {index + 1}
                          </td>

                          {/* STUDENT */}

                          <td className="px-4 py-3">

                            <div className="flex items-center gap-3">

                              {photoUrl ? (

                                <img
                                  src={
                                    photoUrl
                                  }
                                  alt={
                                    application.name ||
                                    "Student"
                                  }
                                  className="w-9 h-9 rounded-full object-cover border border-orange-100 shrink-0"
                                />

                              ) : (

                                <div className="w-9 h-9 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center font-bold shrink-0">
                                  {String(
                                    application.name ||
                                      "S"
                                  )
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                              )}

                              <div className="min-w-0">

                                <p className="font-semibold text-slate-800 truncate max-w-[220px]">
                                  {
                                    application.name
                                  }
                                </p>

                                <p className="text-xs text-slate-400">
                                  {
                                    application.phone ||
                                    "-"
                                  }
                                </p>

                              </div>

                            </div>

                          </td>

                          {/* REGISTER */}

                          <td className="px-4 py-3 font-semibold text-orange-600">
                            {
                              application.registerNumber
                            }
                          </td>

                          {/* COLLEGE */}

                          <td className="px-4 py-3">

                            <span className="font-semibold text-slate-700">
                              {
                                application.collegeCode
                              }
                            </span>

                          </td>

                          {/* SEM */}

                          <td className="px-4 py-3 text-center">
                            {
                              application.semester
                            }
                          </td>

                          {/* BRANCH */}

                          <td className="px-4 py-3 text-slate-600">
                            {
                              application.branch
                            }
                          </td>

                          {/* GENDER */}

                          <td className="px-4 py-3 text-center capitalize">
                            {
                              application.gender
                            }
                          </td>

                          {/* EVENTS */}

                          <td className="px-4 py-3 text-center">

                            <span className="inline-flex min-w-8 justify-center rounded-lg bg-orange-50 px-2 py-1 font-bold text-orange-600">

                              {
                                selectedEvents.length
                              }

                            </span>

                          </td>

                          {/* STATUS */}

                          <td className="px-4 py-3 text-center">

                            <StatusBadge
                              status={
                                application.status
                              }
                            />

                          </td>

                          {/* VIEW */}

                          <td className="px-4 py-3 text-center">

                            <button
                              type="button"
                              onClick={() =>
                                handleView(
                                  application._id
                                )
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition"
                            >

                              <Eye
                                size={14}
                              />

                              View

                            </button>

                          </td>

                        </tr>

                      );

                    }
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

      {/* =================================================
          VIEW APPLICATION MODAL
      ================================================= */}

      {selectedApplication && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white shadow-2xl">

            {/* MODAL HEADER */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">

              <div>

                <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                  Application
                </p>

                <h3 className="text-lg font-bold text-slate-900">
                  {
                    selectedApplication.name
                  }
                </h3>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedApplication(
                    null
                  )
                }
                className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:bg-slate-100"
              >

                <X
                  size={18}
                />

              </button>

            </div>

            {/* MODAL BODY */}

            <div className="p-5">

              <div className="flex flex-col sm:flex-row gap-5">

                {/* PHOTO */}

                <div className="shrink-0">

                  {selectedApplication.photo?.url ? (

                    <img
                      src={
                        selectedApplication.photo
                          .url
                      }
                      alt={
                        selectedApplication.name
                      }
                      className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl object-cover border border-orange-100"
                    />

                  ) : (

                    <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center text-3xl font-bold">
                      {String(
                        selectedApplication.name ||
                          "S"
                      )
                        .charAt(
                          0
                        )
                        .toUpperCase()}
                    </div>

                  )}

                </div>

                {/* DETAILS */}

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">

                  <Detail
                    label="Register Number"
                    value={
                      selectedApplication.registerNumber
                    }
                  />

                  <Detail
                    label="College"
                    value={
                      selectedApplication.collegeCode
                    }
                  />

                  <Detail
                    label="Father Name"
                    value={
                      selectedApplication.fatherName
                    }
                  />

                  <Detail
                    label="Mother Name"
                    value={
                      selectedApplication.motherName
                    }
                  />

                  <Detail
                    label="Date of Birth"
                    value={formatDate(
                      selectedApplication.dateOfBirth
                    )}
                  />

                  <Detail
                    label="Gender"
                    value={
                      selectedApplication.gender
                    }
                  />

                  <Detail
                    label="Semester"
                    value={
                      selectedApplication.semester
                    }
                  />

                  <Detail
                    label="Branch"
                    value={
                      selectedApplication.branch
                    }
                  />

                  <Detail
                    label="Phone"
                    value={
                      selectedApplication.phone
                    }
                  />

                  <Detail
                    label="Email"
                    value={
                      selectedApplication.email ||
                      "-"
                    }
                  />

                  <Detail
                    label="Participation"
                    value={formatValue(
                      selectedApplication.participationCategory
                    )}
                  />

                  <Detail
                    label="Status"
                    value={formatValue(
                      selectedApplication.status
                    )}
                  />

                </div>

              </div>

              {/* SELECTED EVENTS */}

              <div className="mt-6 border-t border-slate-100 pt-5">

                <h4 className="font-bold text-slate-900">
                  Selected Events
                </h4>

                <div className="mt-3 flex flex-wrap gap-2">

                  {getApplicationEvents(
                    selectedApplication
                  ).length ===
                  0 ? (

                    <span className="text-sm text-slate-400">
                      No events selected
                    </span>

                  ) : (

                    getApplicationEvents(
                      selectedApplication
                    ).map(
                      (
                        event,
                        index
                      ) => (

                        <span
                          key={
                            getEventId(
                              event
                            ) ||
                            index
                          }
                          className="rounded-xl bg-orange-50 border border-orange-100 px-3 py-2 text-xs font-semibold text-orange-700"
                        >

                          {getEventCode(
                            event
                          )}

                          {getEventName(
                            event
                          ) && (
                            <span className="ml-1 font-normal">
                              -
                              {" "}
                              {getEventName(
                                event
                              )}
                            </span>
                          )}

                        </span>

                      )
                    )

                  )}

                </div>

              </div>

              {/* SUBMITTED */}

              <div className="mt-5 text-xs text-slate-400">

                Submitted:{" "}

                {formatDateTime(
                  selectedApplication.submittedAt ||
                    selectedApplication.createdAt
                )}

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          DETAIL LOADING
      ================================================= */}

      {loadingDetails && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/20">

          <div className="rounded-2xl bg-white px-6 py-4 shadow-xl flex items-center gap-3">

            <RefreshCw
              size={18}
              className="animate-spin text-orange-500"
            />

            <span className="text-sm font-semibold text-slate-700">
              Loading application...
            </span>

          </div>

        </div>

      )}

    </main>

  );
}


/* =========================================================
   SELECT
========================================================= */

function Select({
  value,
  onChange,
  options,
}) {

  return (

    <div className="relative">

      <select
        value={
          value
        }
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >

        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (

            <option
              key={
                String(
                  optionValue
                )
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

      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

    </div>

  );
}


/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({
  status,
}) {

  const styles = {

    submitted:
      "bg-amber-50 text-amber-700 border-amber-200",

    approved:
      "bg-emerald-50 text-emerald-700 border-emerald-200",

    rejected:
      "bg-red-50 text-red-700 border-red-200",

  };

  return (

    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
        styles[status] ||
        "bg-slate-50 text-slate-600 border-slate-200"
      }`}
    >

      {formatValue(
        status
      )}

    </span>

  );
}


/* =========================================================
   DETAIL
========================================================= */

function Detail({
  label,
  value,
}) {

  return (

    <div>

      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-800 break-words">
        {value ||
          "-"}
      </p>

    </div>

  );
}


/* =========================================================
   VALUE FORMAT
========================================================= */

function formatValue(
  value
) {

  if (!value) {
    return "-";
  }

  return String(
    value
  )
    .replace(
      /_/g,
      " "
    )
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );

}


/* =========================================================
   DATE
========================================================= */

function formatDate(
  value
) {

  if (!value) {
    return "-";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

}


/* =========================================================
   DATE + TIME
========================================================= */

function formatDateTime(
  value
) {

  if (!value) {
    return "-";
  }

  const date =
    new Date(
      value
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return date.toLocaleString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }
  );

}