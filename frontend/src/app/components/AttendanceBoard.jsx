"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  CheckCircle2,
  Circle,
  ClipboardCheck,
  Clock,
  Loader2,
  Pencil,
  RefreshCw,
  RotateCcw,
  Search,
  SlidersHorizontal,
  UserCheck,
  X,
} from "lucide-react";
import {
  showError,
  showSuccess,
} from "@/app/lib/alerts";
import {
  EventMeta,
  FilterSelect,
  SummaryCard,
  formatDateTime,
  getErrorMessage,
  pickDefaultMeet,
  toLabel,
} from "./boardParts";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

// =====================================================
// PAGE
// =====================================================

export default function AttendanceBoard() {
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  // ===================================================
  // DATA
  // ===================================================

  const [meets, setMeets] = useState([]);
  const [meetId, setMeetId] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // Bumped to load the board again (after a save / refresh)
  const [reloadKey, setReloadKey] = useState(0);

  // Board row whose attendance is being taken
  const [editing, setEditing] = useState(null);

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [participationFilter, setParticipationFilter] =
    useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyWithStudents, setOnlyWithStudents] =
    useState(true);

  // Phones: filters fold away behind a button
  const [showFilters, setShowFilters] = useState(false);

  const authHeaders = useCallback(
    async () => ({
      Authorization: `Bearer ${await getToken()}`,
    }),
    [getToken]
  );

  // Stable, because the attendance sheet reloads when it changes
  const closeSheet = useCallback(() => setEditing(null), []);

  // ===================================================
  // LOAD MEETS
  // ===================================================

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/sports-meets`,
          { headers: await authHeaders() }
        );

        if (cancelled) {
          return;
        }

        const list = response.data?.data || [];

        setMeets(list);
        setMeetId((current) => current || pickDefaultMeet(list));

        if (list.length === 0) {
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setLoading(false);
          showError(
            await getErrorMessage(err, "Unable to load sports meets.")
          );
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, authHeaders]);

  // ===================================================
  // LOAD ATTENDANCE BOARD
  // ===================================================

  useEffect(() => {
    if (!meetId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/attendance/board`,
          {
            params: { meetId },
            headers: await authHeaders(),
          }
        );

        if (!cancelled) {
          setRows(response.data?.rows || []);
        }
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          showError(
            await getErrorMessage(err, "Unable to load attendance.")
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meetId, reloadKey, authHeaders]);

  const reloadBoard = () => setReloadKey((key) => key + 1);

  const refresh = () => {
    setLoading(true);
    reloadBoard();
  };

  const changeMeet = (value) => {
    setLoading(true);
    setRows([]);
    setMeetId(value);
  };

  // ===================================================
  // FILTERED ROWS
  // ===================================================

  const categories = useMemo(
    () =>
      [
        ...new Set(
          rows.map((row) => row.event.category).filter(Boolean)
        ),
      ].sort(),
    [rows]
  );

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();

    return rows.filter((row) => {
      const { event } = row;

      if (onlyWithStudents && row.participantCount === 0) {
        return false;
      }

      if (statusFilter === "pending" && row.taken) {
        return false;
      }

      if (statusFilter === "taken" && !row.taken) {
        return false;
      }

      if (genderFilter !== "all" && event.gender !== genderFilter) {
        return false;
      }

      if (
        participationFilter !== "all" &&
        event.participationCategory !== participationFilter
      ) {
        return false;
      }

      if (
        categoryFilter !== "all" &&
        event.category !== categoryFilter
      ) {
        return false;
      }

      return (
        !term ||
        `${event.code} ${event.name}`.toLowerCase().includes(term)
      );
    });
  }, [
    rows,
    search,
    statusFilter,
    genderFilter,
    participationFilter,
    categoryFilter,
    onlyWithStudents,
  ]);

  // Counts cover events that have students
  const counts = useMemo(() => {
    const relevant = rows.filter((row) => row.participantCount > 0);
    const taken = relevant.filter((row) => row.taken).length;

    return {
      total: relevant.length,
      taken,
      pending: relevant.length - taken,
    };
  }, [rows]);

  const activeFilterCount = [
    statusFilter,
    genderFilter,
    participationFilter,
    categoryFilter,
  ].filter((value) => value !== "all").length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setGenderFilter("all");
    setParticipationFilter("all");
    setCategoryFilter("all");
    setOnlyWithStudents(true);
  };

  // ===================================================
  // UI
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6">

      {/* HEADER */}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
            Competition
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Attendance
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Mark who turned up for each event. Participation certificates
            go only to students marked present.
          </p>
        </div>

        <div className="flex items-center gap-2">

          <select
            value={meetId}
            onChange={(e) => changeMeet(e.target.value)}
            aria-label="Sports meet"
            className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:w-auto sm:min-w-[240px] sm:flex-none"
          >
            {meets.length === 0 && (
              <option value="">No sports meets</option>
            )}

            {meets.map((meet) => (
              <option key={meet._id} value={meet._id}>
                {meet.name}
                {meet.year ? ` (${meet.year})` : ""}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={refresh}
            disabled={loading || !meetId}
            aria-label="Refresh"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50 sm:px-4"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3">

        <SummaryCard
          icon={ClipboardCheck}
          label="Events"
          value={counts.total}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          tone="text-slate-900"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Taken"
          value={counts.taken}
          active={statusFilter === "taken"}
          onClick={() => setStatusFilter("taken")}
          tone="text-emerald-600"
        />

        <SummaryCard
          icon={Clock}
          label="Pending"
          value={counts.pending}
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
          tone="text-amber-600"
        />

      </div>

      {/* FILTERS */}

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-3 sm:mt-5 sm:p-4">

        <div className="flex gap-2">

          <div className="relative min-w-0 flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event or code..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-base text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:h-10 sm:text-sm"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((open) => !open)}
            aria-expanded={showFilters}
            className={`inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition lg:hidden ${
              showFilters || activeFilterCount > 0
                ? "border-orange-300 bg-orange-50 text-orange-600"
                : "border-slate-200 bg-white text-slate-600"
            }`}
          >
            <SlidersHorizontal size={16} />
            Filters
            {activeFilterCount > 0 && ` (${activeFilterCount})`}
          </button>

        </div>

        <div
          className={`${
            showFilters ? "grid" : "hidden"
          } mt-3 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid lg:grid-cols-4`}
        >

          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              ["all", "All status"],
              ["pending", "Pending"],
              ["taken", "Taken"],
            ]}
          />

          <FilterSelect
            value={genderFilter}
            onChange={setGenderFilter}
            options={[
              ["all", "All gender"],
              ["male", "Male"],
              ["female", "Female"],
              ["mixed", "Mixed"],
              ["open", "Open"],
            ]}
          />

          <FilterSelect
            value={participationFilter}
            onChange={setParticipationFilter}
            options={[
              ["all", "All participation"],
              ["regular", "Regular"],
              ["physically_challenged", "Physically challenged"],
            ]}
          />

          <FilterSelect
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={[
              ["all", "All categories"],
              ...categories.map((category) => [
                category,
                toLabel(category),
              ]),
            ]}
          />

        </div>

        <div className="mt-3 flex flex-col gap-2 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">

          <label className="inline-flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={onlyWithStudents}
              onChange={(e) => setOnlyWithStudents(e.target.checked)}
              className="h-4 w-4 accent-orange-500"
            />
            Hide events nobody registered for
          </label>

          <div className="flex items-center gap-3">
            <span>
              Showing{" "}
              <strong className="text-slate-700">{filteredRows.length}</strong>{" "}
              of{" "}
              <strong className="text-slate-700">{rows.length}</strong>{" "}
              events
            </span>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 font-semibold text-orange-600 hover:text-orange-700"
            >
              <RotateCcw size={13} />
              Clear
            </button>
          </div>

        </div>

      </div>

      {/* EVENTS: cards on phones, table on larger screens */}

      {loading ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-slate-500">
          <Loader2 size={26} className="mx-auto mb-2 animate-spin text-orange-500" />
          Loading attendance...
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
          <ClipboardCheck size={32} className="mx-auto mb-3 text-slate-300" />
          <p className="font-semibold text-slate-600">
            No events found
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {meetId ? "Try clearing the filters." : "Select a sports meet."}
          </p>
        </div>
      ) : (
        <>
          {/* PHONES */}

          <div className="mt-4 space-y-3 lg:hidden">
            {filteredRows.map((row) => (
              <div
                key={row.event._id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">
                      {row.event.name}
                    </p>
                    <EventMeta event={row.event} />
                  </div>

                  <div className="shrink-0 text-right">
                    <AttendanceStatus row={row} />
                    <p className="mt-1 text-[11px] text-slate-400">
                      {row.participantCount} students
                    </p>
                  </div>
                </div>

                {row.taken && (
                  <p className="mt-3 border-t border-slate-100 pt-3 text-sm text-slate-600">
                    <strong className="text-emerald-600">{row.present}</strong> present ·{" "}
                    <strong className="text-red-500">{row.absent}</strong> absent
                    <span className="block text-[11px] text-slate-400">
                      Taken {formatDateTime(row.markedAt)}
                    </span>
                  </p>
                )}

                <div className="mt-3">
                  <AttendanceAction
                    row={row}
                    onOpen={() => setEditing(row)}
                    large
                  />
                </div>
              </div>
            ))}
          </div>

          {/* TABLETS / DESKTOP */}

          <div className="mt-5 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:block">

            <table className="w-full text-sm">

              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                  <th className="px-4 py-3 text-center">#</th>
                  <th className="px-4 py-3 text-left">Event</th>
                  <th className="px-4 py-3 text-center">Students</th>
                  <th className="px-4 py-3 text-center">Present</th>
                  <th className="px-4 py-3 text-center">Absent</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRows.map((row, index) => (
                  <tr
                    key={row.event._id}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-orange-50/40"
                  >
                    <td className="px-4 py-3 text-center text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">
                        {row.event.name}
                      </p>
                      <EventMeta event={row.event} />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-8 justify-center rounded-lg bg-orange-50 px-2 py-1 font-bold text-orange-600">
                        {row.participantCount}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">
                      {row.taken ? row.present : "—"}
                    </td>

                    <td className="px-4 py-3 text-center font-semibold text-red-500">
                      {row.taken ? row.absent : "—"}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <AttendanceStatus row={row} />
                      {row.taken && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatDateTime(row.markedAt)}
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3 text-center">
                      <AttendanceAction
                        row={row}
                        onOpen={() => setEditing(row)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>

          </div>
        </>
      )}

      {/* TAKE ATTENDANCE */}

      {editing && (
        <AttendanceSheet
          row={editing}
          meetId={meetId}
          authHeaders={authHeaders}
          onClose={closeSheet}
          onSaved={() => {
            setEditing(null);
            reloadBoard();
          }}
        />
      )}

    </div>
  );
}

// =====================================================
// SMALL PIECES
// =====================================================

function AttendanceStatus({ row }) {
  return row.taken ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
      <CheckCircle2 size={12} />
      Taken
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
      <Clock size={12} />
      Pending
    </span>
  );
}

function AttendanceAction({ row, onOpen, large = false }) {
  const size = large
    ? "w-full px-4 py-3 text-sm"
    : "px-3 py-2 text-xs";

  return row.taken ? (
    <button
      type="button"
      onClick={onOpen}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 ${size}`}
    >
      <Pencil size={15} />
      Edit Attendance
    </button>
  ) : (
    <button
      type="button"
      onClick={onOpen}
      disabled={row.participantCount === 0}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40 ${size}`}
    >
      <UserCheck size={15} />
      Take Attendance
    </button>
  );
}

// =====================================================
// ATTENDANCE SHEET (one event)
// Tap a student to switch between present and absent.
// =====================================================

function AttendanceSheet({
  row,
  meetId,
  authHeaders,
  onClose,
  onSaved,
}) {
  const { event } = row;

  const [students, setStudents] = useState([]);
  const [present, setPresent] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // ---------------------------------------------------
  // LOAD STUDENTS + SAVED ATTENDANCE
  // ---------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/attendance/event/${event._id}`,
          {
            params: { meetId },
            headers: await authHeaders(),
          }
        );

        if (cancelled) {
          return;
        }

        const list = response.data?.participants || [];

        setStudents(list);
        setPresent(
          new Set(
            list
              .filter((student) => student.present === true)
              .map((student) => student._id)
          )
        );
      } catch (err) {
        if (!cancelled) {
          showError(
            await getErrorMessage(err, "Unable to load students.")
          );
          onClose();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [event._id, meetId, authHeaders, onClose]);

  // ---------------------------------------------------
  // CLOSE WITH ESC
  // ---------------------------------------------------

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, saving]);

  const toggle = (id) => {
    setPresent((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  };

  const term = studentSearch.trim().toLowerCase();

  const visibleStudents = term
    ? students.filter((student) =>
        `${student.name} ${student.registerNumber} ${student.collegeCode}`
          .toLowerCase()
          .includes(term)
      )
    : students;

  const save = async () => {
    try {
      setSaving(true);

      const response = await axios.put(
        `${API_URL}/api/attendance/event/${event._id}`,
        { meetId, presentIds: [...present] },
        { headers: await authHeaders() }
      );

      showSuccess(response.data?.message || "Attendance saved.");
      onSaved();
    } catch (err) {
      showError(
        await getErrorMessage(err, "Unable to save attendance.")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4">

      {/* Full screen on phones, centred card on larger screens */}
      <div className="flex h-dvh w-full max-w-2xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[92vh] sm:rounded-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-4 py-4 sm:px-5">

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
              {row.taken ? "Edit Attendance" : "Take Attendance"}
            </p>

            <h3 className="text-lg font-bold text-slate-900">
              {event.name}
            </h3>

            <EventMeta event={event} />
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={18} />
          </button>

        </div>

        {/* TOOLS */}

        {!loading && students.length > 0 && (
          <div className="space-y-3 border-b border-slate-100 px-4 py-3 sm:px-5">

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600">
                <strong className="text-emerald-600">{present.size}</strong>{" "}
                of {students.length} present
              </p>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPresent(
                      new Set(students.map((student) => student._id))
                    )
                  }
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                >
                  All present
                </button>

                <button
                  type="button"
                  onClick={() => setPresent(new Set())}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                >
                  Clear
                </button>
              </div>
            </div>

            {students.length > 8 && (
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Find a student..."
                  className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-base outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:h-10 sm:text-sm"
                />
              </div>
            )}

          </div>
        )}

        {/* STUDENTS */}

        <div className="flex-1 overflow-y-auto px-4 py-3 sm:px-5">

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 size={24} className="mx-auto mb-2 animate-spin text-orange-500" />
              Loading students...
            </div>
          ) : students.length === 0 ? (
            <p className="py-12 text-center text-slate-500">
              Nobody is registered for this event.
            </p>
          ) : (
            <div className="space-y-2">
              {visibleStudents.map((student) => {
                const isPresent = present.has(student._id);

                return (
                  <button
                    key={student._id}
                    type="button"
                    onClick={() => toggle(student._id)}
                    aria-pressed={isPresent}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                      isPresent
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    {isPresent ? (
                      <CheckCircle2 size={22} className="shrink-0 text-emerald-600" />
                    ) : (
                      <Circle size={22} className="shrink-0 text-slate-300" />
                    )}

                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-slate-900">
                        {student.name}
                      </span>
                      <span className="block text-xs text-slate-500">
                        {student.registerNumber} · College {student.collegeCode}
                      </span>
                    </span>

                    <span
                      className={`shrink-0 text-xs font-bold ${
                        isPresent ? "text-emerald-700" : "text-slate-400"
                      }`}
                    >
                      {isPresent ? "Present" : "Absent"}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

        </div>

        {/* FOOTER */}

        <div className="grid grid-cols-2 gap-2 border-t border-slate-100 bg-slate-50 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex sm:justify-end sm:px-5 sm:pb-3">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50 sm:py-2.5"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading || students.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50 sm:py-2.5"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <UserCheck size={16} />
            )}
            Save Attendance
          </button>

        </div>

      </div>

    </div>
  );
}
