"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";

import Navbar from "../components/Navbar";

import {
  ArrowLeft,
  Search,
  Filter,
  Trophy,
  RotateCcw,
  Users,
} from "lucide-react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function EventsPage() {

  const [events, setEvents] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // =====================================================
  // FILTERS
  // =====================================================

  const [search, setSearch] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState("all");

  const [genderFilter, setGenderFilter] =
    useState("all");

  const [participationFilter, setParticipationFilter] =
    useState("all");

  // =====================================================
  // LOAD EVENTS
  // =====================================================

  const loadEvents =
    async () => {

      try {

        setLoading(true);
        setError("");

        const response =
          await axios.get(
            `${API_URL}/api/events`
          );

        let eventData =
          response.data;

        // -------------------------------------------------
        // Handle different backend response formats
        // -------------------------------------------------

        if (
          eventData?.data?.events
        ) {
          eventData =
            eventData.data.events;
        } else if (
          Array.isArray(
            eventData?.data
          )
        ) {
          eventData =
            eventData.data;
        } else if (
          Array.isArray(
            eventData?.events
          )
        ) {
          eventData =
            eventData.events;
        } else if (
          Array.isArray(
            eventData
          )
        ) {
          eventData =
            eventData;
        } else {
          eventData = [];
        }

        setEvents(eventData);

      } catch (err) {

        console.error(
          "EVENT LOAD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load events."
        );

      } finally {

        setLoading(false);

      }

    };

  useEffect(() => {

    loadEvents();

  }, []);

  // =====================================================
  // CATEGORY OPTIONS
  // =====================================================

  const categories =
    useMemo(() => {

      return [
        ...new Set(
          events
            .map(
              (event) =>
                event.category
            )
            .filter(Boolean)
        ),
      ];

    }, [events]);

  // =====================================================
  // FILTER EVENTS
  // =====================================================

  const filteredEvents =
    useMemo(() => {

      const text =
        search
          .trim()
          .toLowerCase();

      return events.filter(
        (event) => {

          // -----------------------------------------------
          // SEARCH
          // -----------------------------------------------

          if (text) {

            const name =
              (
                event.name ||
                ""
              ).toLowerCase();

            const code =
              (
                event.code ||
                ""
              ).toLowerCase();

            if (
              !name.includes(text) &&
              !code.includes(text)
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
          // GENDER
          // -----------------------------------------------

          if (
            genderFilter !==
              "all"
          ) {

            if (
              event.gender !==
                genderFilter &&
              event.gender !==
                "open" &&
              event.gender !==
                "mixed"
            ) {
              return false;
            }

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

          return true;

        }
      );

    }, [
      events,
      search,
      categoryFilter,
      genderFilter,
      participationFilter,
    ]);

  // =====================================================
  // CLEAR FILTERS
  // =====================================================

  const clearFilters =
    () => {

      setSearch("");

      setCategoryFilter(
        "all"
      );

      setGenderFilter(
        "all"
      );

      setParticipationFilter(
        "all"
      );

    };

  // =====================================================
  // FORMAT CATEGORY
  // =====================================================

  const formatCategory =
    (value) => {

      if (!value) {
        return "-";
      }

      return value
        .replace(
          /_/g,
          " "
        )
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

        <div className="max-w-7xl mx-auto px-6 py-10">

          <div className="animate-pulse">

            <div className="h-10 w-28 bg-slate-100 rounded-xl" />

            <div className="mt-8 h-8 w-72 bg-slate-100 rounded" />

            <div className="mt-3 h-4 w-96 max-w-full bg-slate-100 rounded" />

            <div className="mt-8 h-16 bg-slate-100 rounded-2xl" />

            <div className="mt-5 h-72 bg-slate-100 rounded-2xl" />

          </div>

        </div>

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
          TOP BACK BUTTON
      ================================================= */}

      <div className="max-w-7xl mx-auto px-6 pt-6">

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
        >

          <ArrowLeft
            size={17}
          />

          Back

        </Link>

      </div>

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="max-w-7xl mx-auto px-6 pt-8 pb-7">

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">

          <div>

            <div className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600">

              <Trophy
                size={18}
              />

              KPT Sports Meet

            </div>

            <h1 className="mt-2 text-3xl sm:text-4xl font-bold text-slate-900">

              Sports Meet Events

            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-500">

              View all events available for
              participation.

            </p>

          </div>

          <div className="inline-flex items-center gap-2 rounded-xl bg-orange-50 border border-orange-100 px-4 py-3 text-sm">

            <Users
              size={17}
              className="text-orange-500"
            />

            <span className="text-slate-500">
              Showing
            </span>

            <span className="font-bold text-orange-600">
              {filteredEvents.length}
            </span>

            <span className="text-slate-500">
              of
            </span>

            <span className="font-bold text-slate-700">
              {events.length}
            </span>

            <span className="text-slate-500">
              events
            </span>

          </div>

        </div>

      </section>

      {/* =================================================
          FILTERS
      ================================================= */}

      <section className="max-w-7xl mx-auto px-6 pb-7">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* SEARCH */}

          <div className="relative lg:col-span-1">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search event..."
              className="w-full h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
            />

            {search && (

              <button
                type="button"
                onClick={() =>
                  setSearch("")
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-600"
              >
                ×
              </button>

            )}

          </div>

          {/* CATEGORY */}

          <EventSelect
            value={
              categoryFilter
            }
            onChange={
              setCategoryFilter
            }
            options={[
              [
                "all",
                "All Categories",
              ],

              ...categories.map(
                (category) => [
                  category,
                  formatCategory(
                    category
                  ),
                ]
              ),
            ]}
          />

          {/* GENDER */}

          <EventSelect
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
                "mixed",
                "Mixed",
              ],
              [
                "open",
                "Open",
              ],
            ]}
          />

          {/* PARTICIPATION */}

          <EventSelect
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

        </div>

        {/* CLEAR */}

        {(search ||
          categoryFilter !==
            "all" ||
          genderFilter !==
            "all" ||
          participationFilter !==
            "all") && (

          <div className="mt-3">

            <button
              type="button"
              onClick={
                clearFilters
              }
              className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >

              <RotateCcw
                size={15}
              />

              Clear filters

            </button>

          </div>

        )}

      </section>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <section className="max-w-7xl mx-auto px-6 pb-6">

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

            {error}

          </div>

        </section>

      )}

      {/* =================================================
          EVENTS TABLE
      ================================================= */}

      <section className="max-w-7xl mx-auto px-6 pb-10">

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px] text-sm">

              <thead className="bg-orange-50 border-b border-orange-100">

                <tr>

                  <th className="px-4 py-3 text-center font-bold text-orange-700">
                    S.No
                  </th>

                  <th className="px-4 py-3 text-left font-bold text-orange-700">
                    CODE
                  </th>

                  <th className="px-4 py-3 text-left font-bold text-orange-700 min-w-[280px]">
                    EVENT
                  </th>

                  <th className="px-4 py-3 text-left font-bold text-orange-700">
                    CATEGORY
                  </th>

                  <th className="px-4 py-3 text-center font-bold text-orange-700">
                    GENDER
                  </th>

                  <th className="px-4 py-3 text-center font-bold text-orange-700">
                    PARTICIPATION
                  </th>

                  <th className="px-4 py-3 text-center font-bold text-orange-700">
                    TYPE
                  </th>

                  <th className="px-4 py-3 text-center font-bold text-orange-700">
                    LIMIT
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredEvents.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={8}
                      className="px-6 py-16 text-center"
                    >

                      <Search
                        size={30}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-semibold text-slate-600">
                        No events found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        Try changing the search
                        or filters.
                      </p>

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

                        <td className="px-4 py-3 text-center text-slate-500">
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

                        <td className="px-4 py-3 text-center capitalize text-slate-700">
                          {event.gender}
                        </td>

                        {/* PARTICIPATION */}

                        <td className="px-4 py-3 text-center">

                          <span className="inline-flex rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">

                            {formatCategory(
                              event.participationCategory
                            )}

                          </span>

                        </td>

                        {/* TYPE */}

                        <td className="px-4 py-3 text-center capitalize text-slate-600">
                          {event.eventType ||
                            "-"}
                        </td>

                        {/* LIMIT */}

                        <td className="px-4 py-3 text-center text-slate-600">

                          {event.maxParticipantsPerInstitution ||
                            event.teamSize ||
                            "-"}

                        </td>

                      </tr>

                    )
                  )

                )}

              </tbody>

            </table>

          </div>

        </div>

      </section>

      {/* =================================================
          BOTTOM BACK BUTTON
      ================================================= */}

      <div className="max-w-7xl mx-auto px-6 pb-10">

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
        >

          <ArrowLeft
            size={17}
          />

          Back

        </Link>

      </div>

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="border-t border-orange-100 bg-white">

        <div className="max-w-7xl mx-auto px-6 py-7 text-center">

          <div className="flex items-center justify-center gap-2 text-orange-600">

            <Trophy
              size={17}
            />

            <span className="font-bold">
              KPT Sports Meet
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-500">
            Sports Meet Management System
          </p>

        </div>

      </footer>

    </main>

  );
}


/* =========================================================
   EVENT SELECT
========================================================= */

function EventSelect({
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

      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        ▼
      </span>

    </div>

  );

}