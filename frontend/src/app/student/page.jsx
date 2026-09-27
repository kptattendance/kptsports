"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import axios from "axios";
import Link from "next/link";
import {
  Trophy,
  CalendarDays,
  MapPin,
  LogOut,
  UserRound,
  Pencil,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StudentPage() {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  const [loading, setLoading] = useState(true);
  const [meet, setMeet] = useState(null);
  const [application, setApplication] = useState(null);
  const [error, setError] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    loadDashboard();
  }, [isLoaded, isSignedIn]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
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

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // =====================================================
      // GET ACTIVE SPORTS MEET
      // =====================================================

      const meetResponse = await axios.get(
        `${API_URL}/api/sports-meets`,
        config
      );

      const rawData = meetResponse.data?.data;

      const meets = Array.isArray(rawData)
        ? rawData
        : rawData?.meets || [];

      const now = new Date();

      const activeMeet =
        meets.find((item) => {
          if (item.isActive === false) return false;

          if (item.status !== "applications_open") {
            return false;
          }

          if (
            item.applicationStartDate &&
            now < new Date(item.applicationStartDate)
          ) {
            return false;
          }

          if (
            item.applicationEndDate &&
            now > new Date(item.applicationEndDate)
          ) {
            return false;
          }

          return true;
        }) || null;

      setMeet(activeMeet);

      // =====================================================
      // GET MY APPLICATION
      // =====================================================

      if (activeMeet) {
        try {
          const response = await axios.get(
            `${API_URL}/api/sports-applications/my?meetId=${activeMeet._id}`,
            config
          );

          setApplication(
            response.data?.data || null
          );
        } catch (err) {
          if (err.response?.status === 404) {
            setApplication(null);
          } else {
            throw err;
          }
        }
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.message ||
          "Unable to load Sports Meet."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({
      redirectUrl: "/",
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const deadlinePassed =
    meet?.applicationEndDate &&
    new Date() >
      new Date(meet.applicationEndDate);

  // =====================================================
  // LOADING
  // =====================================================

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#fffaf5] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-14 h-14 bg-orange-500 text-white rounded-2xl flex items-center justify-center mx-auto">
            <Trophy size={28} />
          </div>

          <p className="mt-4 text-sm text-slate-500">
            Loading Sports Meet...
          </p>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fffaf5] text-slate-800">


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">

        {/* ERROR */}

        {error && (
          <div className="mt-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 flex gap-2">
            <AlertCircle size={18} />

            <span className="text-sm">
              {error}
            </span>
          </div>
        )}

        {!meet ? (
          <div className="max-w-2xl mx-auto py-10 sm:py-16">

            <div className="bg-white rounded-3xl border border-orange-100 p-7 sm:p-10 text-center shadow-sm">

              <div className="w-16 h-16 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center mx-auto">
                <Trophy size={30} />
              </div>

              <h1 className="text-2xl font-bold text-slate-900 mt-5">
                No Sports Meet Applications Open
              </h1>

              <p className="text-sm text-slate-500 mt-2">
                There is currently no Sports Meet
                open for registration.
              </p>

              <button
                onClick={loadDashboard}
                className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold"
              >
                <RefreshCw size={16} />
                Refresh
              </button>

            </div>

          </div>
        ) : (
          <>

            {/* =================================================
                MEET HERO
            ================================================= */}

            <section className="pt-6 sm:pt-8">

              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 text-white shadow-xl">

                <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/10" />

                <div className="absolute right-20 -bottom-32 w-80 h-80 rounded-full bg-white/5" />

                <div className="relative p-6 sm:p-8 lg:p-10">

                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-7">

                    <div className="max-w-2xl">

                      <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 rounded-full px-3 py-1.5 text-xs font-medium">
                        <Trophy size={14} />
                        Student Registration
                      </div>

                      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mt-5">
                        {meet.name}
                      </h1>

                      <p className="text-orange-50 mt-4 text-sm sm:text-base leading-7">
                        Choose the events you want to
                        participate in and represent your
                        institution.
                      </p>

                      <div className="flex flex-wrap gap-3 mt-6">

                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm">
                          <CalendarDays size={16} />

                          {formatDate(meet.startDate)}
                          {" - "}
                          {formatDate(meet.endDate)}
                        </div>

                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-xl px-3 py-2 text-sm">
                          <MapPin size={16} />

                          <span className="max-w-[220px] truncate">
                            {meet.venue}
                          </span>
                        </div>

                      </div>

                    </div>

                    {/* DEADLINE */}

                    <div className="w-full lg:w-auto lg:min-w-[255px]">

                      <div className="bg-white text-slate-800 rounded-2xl p-5 shadow-xl">

                        <div className="text-xs text-orange-600 font-bold uppercase tracking-wide">
                          Application Deadline
                        </div>

                        <div className="font-bold mt-2">
                          {formatDateTime(
                            meet.applicationEndDate
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1">
                          {deadlinePassed
                            ? "Applications closed"
                            : "Applications open"}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>

              </div>

            </section>

            {/* =================================================
                APPLICATION
            ================================================= */}

            <div className="mt-6 bg-white border border-orange-100 rounded-3xl p-5 sm:p-6">

              {!application ? (
                <>

                  <div className="flex items-center gap-3">

                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                      <UserRound size={23} />
                    </div>

                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Sports Meet Application
                      </h2>

                      <p className="text-sm text-slate-500">
                        Apply for the events of your choice.
                      </p>
                    </div>

                  </div>

                  {!deadlinePassed && (
                    <Link
                      href="/student/apply"
                      prefetch={true}
                      className="mt-6 inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition"
                    >
                      Click here to Apply for Sports Meet
                    </Link>
                  )}

                </>
              ) : (
                <>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    <div className="flex items-center gap-3">

                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={24} />
                      </div>

                      <div>
                        <h2 className="text-xl font-bold text-slate-900">
                          Application Submitted
                        </h2>

                        <p className="text-sm text-slate-500">
                          {application.name}
                        </p>
                      </div>

                    </div>

                    {!deadlinePassed && (
                      <Link
                        href="/student/apply"
                        prefetch={true}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-orange-200 text-orange-600 hover:bg-orange-50 rounded-xl font-semibold transition"
                      >
                        <Pencil size={16} />
                        Edit Application
                      </Link>
                    )}

                  </div>

                  {/* STUDENT PHOTO + DETAILS */}

                  <div className="mt-6 flex flex-col sm:flex-row gap-5">

                    {application.photo?.url && (
                      <div className="shrink-0">
                        <img
                          src={application.photo.url}
                          alt={application.name || "Student"}
                          className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border border-orange-100 shadow-sm"
                        />
                      </div>
                    )}

                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">

                      <Info
                        label="Register Number"
                        value={
                          application.registerNumber
                        }
                      />

                      <Info
                        label="College"
                        value={
                          application.collegeCode
                        }
                      />

                      <Info
                        label="Branch"
                        value={
                          application.branch
                        }
                      />

                      <Info
                        label="Semester"
                        value={
                          `Semester ${application.semester}`
                        }
                      />

                      <Info
                        label="Gender"
                        value={
                          application.gender
                        }
                      />

                      <Info
                        label="Date of Birth"
                        value={
                          formatDate(
                            application.dateOfBirth
                          )
                        }
                      />

                      <Info
                        label="Father"
                        value={
                          application.fatherName
                        }
                      />

                      <Info
                        label="Mother"
                        value={
                          application.motherName
                        }
                      />

                      <Info
                        label="Phone"
                        value={
                          application.phone
                        }
                      />

                      <Info
                        label="Email"
                        value={
                          application.email
                        }
                      />

                      <Info
                        label="Participation"
                        value={
                          application.participationCategory ===
                          "physically_challenged"
                            ? "Physically Challenged"
                            : "Regular"
                        }
                      />

                    </div>

                  </div>

                  {/* SELECTED EVENTS */}

                  <div className="mt-6 p-4 rounded-2xl bg-orange-50 border border-orange-100">

                    <div className="flex items-center justify-between">

                      <div className="text-sm font-bold text-orange-700">
                        Selected Events
                      </div>

                      <div className="text-xs text-slate-500">
                        {application.selectedEvents
                          ?.length || 0}{" "}
                        event
                        {(application.selectedEvents
                          ?.length || 0) !== 1
                          ? "s"
                          : ""}
                      </div>

                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">

                      {application.selectedEvents
                        ?.length > 0 ? (
                        application.selectedEvents.map(
                          (event) => (
                            <span
                              key={
                                event._id ||
                                event
                              }
                              className="px-3 py-2 rounded-xl bg-white border border-orange-200 text-sm font-medium text-slate-700"
                            >
                              {event.name ||
                                event}
                            </span>
                          )
                        )
                      ) : (
                        <span className="text-sm text-slate-500">
                          No events selected
                        </span>
                      )}

                    </div>

                  </div>

                  {application.submittedAt && (
                    <p className="text-xs text-slate-400 mt-5">
                      Submitted on{" "}
                      {formatDateTime(
                        application.submittedAt
                      )}
                    </p>
                  )}

                  {deadlinePassed && (
                    <div className="mt-5 bg-slate-50 rounded-xl p-3 text-sm text-slate-500">
                      Applications are closed. The
                      application can no longer be
                      modified.
                    </div>
                  )}

                </>
              )}

            </div>

          </>
        )}

      </main>

      {/* FOOTER */}

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

function Info({ label, value }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3 min-w-0">
      <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
        {label}
      </div>

      <div className="text-sm font-semibold text-slate-700 mt-1 break-words">
        {value || "-"}
      </div>
    </div>
  );
}