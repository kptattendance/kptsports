"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { SignInButton } from "@clerk/nextjs";

import Navbar from "./components/Navbar";

import {
  Trophy,
  Search,
  Filter,
  RefreshCw,
  CalendarDays,
  MapPin,
  RotateCcw,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function HomePage() {
  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [data, setData] =
    useState(null);

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [institutionFilter, setInstitutionFilter] =
    useState("all");

  const [genderFilter, setGenderFilter] =
    useState("all");

  const [participationFilter, setParticipationFilter] =
    useState("all");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [eventFilter, setEventFilter] =
    useState("all");

    const [eventSearch, setEventSearch] =
  useState("");
  // =====================================================
  // LOAD STATISTICS
  // =====================================================

  const loadStatistics =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await axios.get(
            `${API_URL}/api/sports-statistics/public`
          );

        if (
          !response.data?.success
        ) {
          throw new Error(
            "Unable to load statistics."
          );
        }

        setData(
          response.data.data
        );
      } catch (err) {
        console.error(
          "STATISTICS ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load Sports Meet statistics."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    loadStatistics();
  }, []);

  // =====================================================
  // DATA
  // =====================================================

  const statistics =
    data?.statistics || {
      participants: 0,
      institutions: 0,
      events: 0,
      eventEntries: 0,
    };

  const institutes =
    data?.institutes || [];

  const eventStatistics =
    data?.eventStatistics || [];

  // =====================================================
  // FILTER OPTIONS
  // =====================================================

  const categories =
    useMemo(() => {
      return [
        ...new Set(
          eventStatistics
            .map(
              (event) =>
                event.category
            )
            .filter(Boolean)
        ),
      ];
    }, [eventStatistics]);

  // =====================================================
  // FILTERED INSTITUTIONS
  // =====================================================

  const filteredInstitutes =
    useMemo(() => {
      const text =
        search
          .trim()
          .toLowerCase();

      return institutes.filter(
        (institute) => {
          if (
            institutionFilter !==
              "all" &&
            institute.code !==
              institutionFilter
          ) {
            return false;
          }

          if (text) {
            const name =
              (
                institute.name ||
                ""
              ).toLowerCase();

            const code =
              (
                institute.code ||
                ""
              ).toLowerCase();

            if (
              !name.includes(text) &&
              !code.includes(text)
            ) {
              return false;
            }
          }

          return true;
        }
      );
    }, [
      institutes,
      institutionFilter,
      search,
    ]);
// =====================================================
// FILTERED EVENTS
// =====================================================

const filteredEvents =
  useMemo(() => {

    const searchText =
      eventSearch
        .trim()
        .toLowerCase();

    return eventStatistics.filter(
      (event) => {

        // -----------------------------------------------
        // EVENT SEARCH
        // -----------------------------------------------

        if (searchText) {

          const eventName =
            (
              event.name ||
              ""
            ).toLowerCase();

          const eventCode =
            (
              event.code ||
              ""
            ).toLowerCase();

          if (
            !eventName.includes(
              searchText
            ) &&
            !eventCode.includes(
              searchText
            )
          ) {
            return false;
          }
        }

        // -----------------------------------------------
        // CATEGORY
        // -----------------------------------------------

        if (
          categoryFilter !==
            "all" &&
          event.category !==
            categoryFilter
        ) {
          return false;
        }

        // -----------------------------------------------
        // EVENT
        // -----------------------------------------------

        if (
          eventFilter !==
            "all" &&
          String(event._id) !==
            String(eventFilter)
        ) {
          return false;
        }

        // -----------------------------------------------
        // PARTICIPATION
        // -----------------------------------------------

        if (
          participationFilter !==
            "all" &&
          event.participationCategory !==
            participationFilter
        ) {
          return false;
        }

        // -----------------------------------------------
        // GENDER
        // -----------------------------------------------

        if (
          genderFilter !==
            "all"
        ) {

          const matchesGender =
            event.gender ===
              "open" ||
            event.gender ===
              "mixed" ||
            event.gender ===
              genderFilter;

          if (!matchesGender) {
            return false;
          }
        }

        return true;
      }
    );

  }, [
    eventStatistics,
    eventSearch,
    categoryFilter,
    eventFilter,
    participationFilter,
    genderFilter,
  ]);
// =====================================================
// CLEAR FILTERS
// =====================================================

const clearFilters =
  () => {

    setSearch("");

    setInstitutionFilter(
      "all"
    );

    setGenderFilter(
      "all"
    );

    setParticipationFilter(
      "all"
    );

    setCategoryFilter(
      "all"
    );

    setEventFilter(
      "all"
    );

    setEventSearch("");
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    return new Date(
      value
    ).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT CATEGORY
  // =====================================================

  const formatCategory = (
    value
  ) => {
    if (!value) {
      return "-";
    }

    return value
      .replace(/_/g, " ")
      .replace(
        /\b\w/g,
        (letter) =>
          letter.toUpperCase()
      );
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white">

        <Navbar />

        <section className="max-w-7xl mx-auto px-6 py-16">

          <div className="animate-pulse">

            <div className="h-8 w-40 bg-orange-100 rounded-full" />

            <div className="mt-6 h-14 w-full max-w-2xl bg-slate-100 rounded-xl" />

            <div className="mt-3 h-14 w-full max-w-3xl bg-orange-100 rounded-xl" />

            <div className="mt-5 h-5 w-full max-w-2xl bg-slate-100 rounded" />

            <div className="mt-2 h-5 w-full max-w-xl bg-slate-100 rounded" />

            <div className="mt-10 h-40 bg-slate-100 rounded-3xl" />

          </div>

        </section>

      </main>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <main className="min-h-screen bg-white">

      <Navbar />

      {/* =================================================
          HERO
      ================================================= */}

      <section className="mx-auto max-w-7xl px-6 pt-12 pb-10">

        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-center">

          {/* LEFT */}

          <div>

            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">

              <Trophy size={16} />

              KPT Sports Meet

            </div>

            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">

              Sports Meet

              <span className="block text-orange-500">
                Management System
              </span>

            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">

              Online registration, event
              management, participation
              tracking, results and
              certificates for the Sports Meet.

            </p>

            {/* BUTTONS */}

            <div className="mt-8 flex flex-wrap gap-3">

              {/* CLERK LOGIN */}

              <SignInButton
                mode="modal"
                forceRedirectUrl="/student"
              >

                <button
                  type="button"
                  className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
                >
                  Login / Register
                </button>

              </SignInButton>

              <Link
                href="/events"
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
              >
                View Events
              </Link>

            </div>

          </div>

          {/* CURRENT MEET */}

          <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6">

            <div className="flex items-center gap-3">

              <div className="w-12 h-12 rounded-2xl bg-orange-500 text-white flex items-center justify-center">

                <Trophy size={24} />

              </div>

              <div>

                <p className="text-xs font-semibold uppercase tracking-wider text-orange-600">
                  Current Meet
                </p>

                <h2 className="font-bold text-slate-900">
                  {data?.meet?.name ||
                    "Sports Meet"}
                </h2>

              </div>

            </div>

            {data?.meet && (
              <div className="mt-6 space-y-3 text-sm text-slate-600">

                <div className="flex items-center gap-3">

                  <CalendarDays
                    size={17}
                    className="text-orange-500"
                  />

                  <span>
                    {formatDate(
                      data.meet.startDate
                    )}

                    {" - "}

                    {formatDate(
                      data.meet.endDate
                    )}
                  </span>

                </div>

                <div className="flex items-center gap-3">

                  <MapPin
                    size={17}
                    className="text-orange-500"
                  />

                  <span>
                    {data.meet.venue}
                  </span>

                </div>

              </div>
            )}

          </div>

        </div>

      </section>

   {/* =================================================
    INSTITUTE-WISE EVENT PARTICIPATION TABLE
================================================= */}

<section className="max-w-7xl mx-auto px-6 pb-12">

  <div className="mb-5">

    <div className="text-sm font-semibold text-orange-600">
      PARTICIPATION
    </div>

    <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
      Institute-wise Participant List
    </h2>

    <p className="mt-2 text-sm text-slate-500">
      Number of participants registered from each
      institute for every event.
    </p>

  </div>

  {/* =================================================
      TABLE CONTAINER
  ================================================= */}


    <div className="mb-3 flex flex-wrap items-center gap-2">

      <div className="relative w-full sm:w-[320px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search institution..."
          className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600"
          >
            ×
          </button>
        )}
      </div>

      <div className="w-full sm:w-[210px]">
        <FilterSelect
          value={institutionFilter}
          onChange={setInstitutionFilter}
          options={[
            ["all", "All Institutions"],
            ...institutes.map((item) => [item.code, item.code]),
          ]}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setSearch("");
          setInstitutionFilter("all");
        }}
        className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
      >
        <RotateCcw size={13} />
        Clear
      </button>

    </div>

  <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

    {/* =================================================
        HORIZONTAL SCROLL AREA
    ================================================= */}

    <div className="overflow-x-auto">

      <table
        className="text-xs border-separate border-spacing-0"
        style={{
          minWidth: `${112 + 300 + eventStatistics.length * 34}px`,
        }}
      >

        {/* =================================================
            TABLE HEADER
        ================================================= */}

        <thead>

          <tr>

            {/* =================================================
                SNO
            ================================================= */}

            <th
              className="sticky left-0 top-0 z-40 w-[48px] min-w-[48px] max-w-[48px] h-[96px] px-1 bg-orange-50 border-r border-b border-orange-200 text-center align-middle font-bold text-orange-700"
            >
              SNO
            </th>

            {/* =================================================
                INST
            ================================================= */}

            <th
              className="sticky left-[48px] top-0 z-40 w-[64px] min-w-[64px] max-w-[64px] h-[96px] px-1 bg-orange-50 border-r border-b border-orange-200 text-center align-middle font-bold text-orange-700"
            >
              INST
            </th>

            {/* =================================================
                SNAME
            ================================================= */}

            <th
              className="sticky left-[112px] top-0 z-40 w-[300px] min-w-[300px] max-w-[300px] h-[96px] px-3 bg-orange-50 border-r border-b border-orange-200 text-left align-middle font-bold text-orange-700 shadow-[4px_0_6px_-5px_rgba(0,0,0,0.25)]"
            >
              SNAME
            </th>

            {/* =================================================
                EVENT COLUMNS
            ================================================= */}

            {eventStatistics.map(
              (event) => (
                <th
                  key={event._id}
                  title={event.name}
                  className="w-[34px] min-w-[34px] max-w-[34px] h-[96px] p-0 bg-orange-50 border-r border-b border-orange-200 text-center align-middle font-bold text-orange-700"
                >

                  <div
                    className="mx-auto flex items-center justify-center h-[88px] w-[34px]"
                    style={{
                      writingMode:
                        "vertical-rl",
                      transform:
                        "rotate(180deg)",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {event.code}
                  </div>

                </th>
              )
            )}

          </tr>

        </thead>

        {/* =================================================
            TABLE BODY
        ================================================= */}

        <tbody>

          {filteredInstitutes.length ===
          0 ? (
            <tr>

              <td
                colSpan={
                  3 +
                  eventStatistics.length
                }
                className="px-6 py-12 text-center text-slate-500"
              >
                No institute data found
                for the selected filters.
              </td>

            </tr>
          ) : (
            filteredInstitutes.map(
              (
                institute,
                index
              ) => (
                <tr
                  key={
                    institute.code
                  }
                  className="group"
                >

                  {/* =================================================
                      SNO
                  ================================================= */}

                  <td
                    className="sticky left-0 z-30 w-[48px] min-w-[48px] max-w-[48px] px-1 py-2.5 text-center text-slate-500 font-medium bg-white border-r border-b border-slate-100 group-hover:bg-orange-50 transition-colors"
                  >
                    {index + 1}
                  </td>

                  {/* =================================================
                      INST
                  ================================================= */}

                  <td
                    className="sticky left-[48px] z-30 w-[64px] min-w-[64px] max-w-[64px] px-1 py-2.5 text-center font-bold text-orange-600 bg-white border-r border-b border-slate-100 group-hover:bg-orange-50 transition-colors"
                  >
                    {institute.code}
                  </td>

                  {/* =================================================
                      SNAME
                  ================================================= */}

                  <td
                    className="sticky left-[112px] z-30 w-[300px] min-w-[300px] max-w-[300px] px-3 py-2.5 font-medium text-slate-800 bg-white border-r border-b border-slate-100 shadow-[4px_0_6px_-5px_rgba(0,0,0,0.25)] group-hover:bg-orange-50 transition-colors"
                  >
                    <div
                      className="truncate"
                      title={
                        institute.name
                      }
                    >
                      {institute.name}
                    </div>
                  </td>

                  {/* =================================================
                      EVENT COUNTS
                  ================================================= */}

                  {eventStatistics.map(
                    (event) => {

                      const count =
                        institute
                          .events?.[
                          String(
                            event._id
                          )
                        ] || 0;

                      return (
                        <td
                          key={
                            event._id
                          }
                          className={`w-[34px] min-w-[34px] max-w-[34px] px-0 py-2.5 text-center border-r border-b border-slate-100 font-medium group-hover:bg-orange-50 transition-colors ${
                            count > 0
                              ? "text-slate-800"
                              : "text-slate-300"
                          }`}
                          title={`${event.name} - ${count} participant${
                            count === 1
                              ? ""
                              : "s"
                          }`}
                        >
                          {count}
                        </td>
                      );
                    }
                  )}

                </tr>
              )
            )
          )}

        </tbody>

      </table>

    </div>

    {/* =================================================
        TABLE FOOTER
    ================================================= */}

    <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">

      <p className="text-xs text-slate-500">

        Showing{" "}

        <span className="font-semibold text-slate-700">
          {filteredInstitutes.length}
        </span>

        {" "}institutions

      </p>

      <p className="text-xs text-slate-400">
        Scroll horizontally to view all events
      </p>

    </div>

  </div>

</section>



{/* =================================================
    EVENT-WISE STATISTICS TABLE
================================================= */}

<section className="bg-orange-50/40 border-y border-orange-100">

  <div className="max-w-7xl mx-auto px-6 py-12">

    {/* =================================================
        TITLE
    ================================================= */}

    <div className="mb-5">

      <div className="text-sm font-semibold text-orange-600">
        EVENTS
      </div>

      <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">
        Event-wise Statistics
      </h2>

    </div>

    <div className="mb-4 flex flex-wrap items-center gap-2">

      <div className="relative w-full sm:w-[320px]">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={eventSearch}
          onChange={(e) => setEventSearch(e.target.value)}
          placeholder="Search event..."
          className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
        />
        {eventSearch && (
          <button
            type="button"
            onClick={() => setEventSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600"
          >
            ×
          </button>
        )}
      </div>

      <div className="w-full sm:w-[150px]">
        <FilterSelect
          value={genderFilter}
          onChange={setGenderFilter}
          options={[
            ["all", "All Gender"],
            ["male", "Male"],
            ["female", "Female"],
            ["other", "Other"],
          ]}
        />
      </div>

      <div className="w-full sm:w-[190px]">
        <FilterSelect
          value={participationFilter}
          onChange={setParticipationFilter}
          options={[
            ["all", "All Participation"],
            ["regular", "Regular"],
            ["physically_challenged", "Physically Challenged"],
          ]}
        />
      </div>

      <div className="w-full sm:w-[160px]">
        <FilterSelect
          value={categoryFilter}
          onChange={setCategoryFilter}
          options={[
            ["all", "All Categories"],
            ...categories.map((item) => [item, formatCategory(item)]),
          ]}
        />
      </div>

      <div className="w-full sm:w-[240px]">
        <FilterSelect
          value={eventFilter}
          onChange={setEventFilter}
          options={[
            ["all", "All Events"],
            ...eventStatistics.map((event) => [event._id, `${event.code} - ${event.name}`]),
          ]}
        />
      </div>

      <button
        type="button"
        onClick={() => {
          setGenderFilter("all");
          setParticipationFilter("all");
          setCategoryFilter("all");
          setEventFilter("all");
          setEventSearch("");
        }}
        className="h-9 inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
      >
        <RotateCcw size={13} />
        Clear
      </button>

    </div>
{/* =================================================
        TABLE
    ================================================= */}

    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

      <div className="overflow-x-auto">

        <table className="w-full min-w-[1050px] text-sm">

          {/* =================================================
              HEADER
          ================================================= */}

          <thead className="bg-orange-50 border-b border-orange-100">

            <tr>

              <th className="px-4 py-3 text-left font-bold text-orange-700">
                S.No
              </th>

              <th className="px-4 py-3 text-left font-bold text-orange-700">
                CODE
              </th>

              <th className="px-4 py-3 text-left font-bold text-orange-700 min-w-[260px]">
                EVENT
              </th>

              <th className="px-4 py-3 text-left font-bold text-orange-700">
                CATEGORY
              </th>

              <th className="px-4 py-3 text-center font-bold text-orange-700">
                GENDER
              </th>

              <th className="px-4 py-3 text-center font-bold text-orange-700">
                PARTICIPANTS
              </th>

              <th className="px-4 py-3 text-center font-bold text-orange-700">
                MALE
              </th>

              <th className="px-4 py-3 text-center font-bold text-orange-700">
                FEMALE
              </th>

              <th className="px-4 py-3 text-center font-bold text-orange-700">
                REGULAR
              </th>

              <th className="px-4 py-3 text-center font-bold text-orange-700">
                PH
              </th>

            </tr>

          </thead>

          {/* =================================================
              BODY
          ================================================= */}

          <tbody>

            {filteredEvents.length ===
            0 ? (

              <tr>

                <td
                  colSpan={10}
                  className="px-6 py-14 text-center"
                >

                  <div className="text-slate-400">

                    <Search
                      size={28}
                      className="mx-auto mb-3 opacity-50"
                    />

                    <p className="font-medium text-slate-600">
                      No events found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Try changing the filters
                      or search text.
                    </p>

                  </div>

                </td>

              </tr>

            ) : (

              filteredEvents.map(
                (
                  event,
                  index
                ) => (

                  <tr
                    key={
                      event._id
                    }
                    className="border-b border-slate-100 last:border-0 hover:bg-orange-50/40 transition"
                  >

                    {/* S.NO */}

                    <td className="px-4 py-3 text-slate-500 font-medium">
                      {index + 1}
                    </td>

                    {/* CODE */}

                    <td className="px-4 py-3 font-bold text-orange-600">
                      {event.code}
                    </td>

                    {/* EVENT */}

                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {event.name}
                    </td>

                    {/* CATEGORY */}

                    <td className="px-4 py-3 text-slate-600">
                      {formatCategory(
                        event.category
                      )}
                    </td>

                    {/* GENDER */}

                    <td className="px-4 py-3 text-center capitalize">
                      {event.gender}
                    </td>

                    {/* PARTICIPANTS */}

                    <td className="px-4 py-3 text-center font-black text-slate-900">
                      {event.total}
                    </td>

                    {/* MALE */}

                    <td className="px-4 py-3 text-center">
                      {event.male}
                    </td>

                    {/* FEMALE */}

                    <td className="px-4 py-3 text-center">
                      {event.female}
                    </td>

                    {/* REGULAR */}

                    <td className="px-4 py-3 text-center">
                      {event.regular}
                    </td>

                    {/* PH */}

                    <td className="px-4 py-3 text-center">
                      {
                        event.physicallyChallenged
                      }
                    </td>

                  </tr>

                )
              )

            )}

          </tbody>

        </table>

      </div>

    </div>

  </div>

</section>

        

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <section className="max-w-7xl mx-auto px-6 py-8">

          <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>

        </section>
      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-orange-100 bg-white">

        <div className="max-w-7xl mx-auto px-6 py-8 text-center">

          <div className="flex items-center justify-center gap-2 text-orange-600">

            <Trophy size={18} />

            <span className="font-bold">
              KPT Sports Meet
            </span>

          </div>

          <p className="mt-2 text-xs text-slate-500">
            Sports Meet Management System
          </p>

        </div>

      </footer>

    </main>
  );
}


/*
=========================================================
FILTER SELECT
=========================================================
*/

function FilterSelect({
  value,
  onChange,
  options,
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value
          )
        }
        className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
      >

        {options.map(
          ([
            optionValue,
            optionLabel,
          ]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}

      </select>

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        ▼
      </span>

    </div>
  );
}