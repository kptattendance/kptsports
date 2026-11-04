"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  Award,
  CheckCircle2,
  Clock,
  Loader2,
  Pencil,
  Printer,
  RefreshCw,
  RotateCcw,
  Search,
  Trophy,
  X,
} from "lucide-react";
import {
  showError,
  showSuccess,
  showWarning,
} from "@/app/lib/alerts";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

// =====================================================
// CONSTANTS
// =====================================================

const PLACES = [
  {
    position: 1,
    label: "1st",
    badge: "bg-amber-100 text-amber-700 ring-amber-200",
  },
  {
    position: 2,
    label: "2nd",
    badge: "bg-slate-100 text-slate-600 ring-slate-200",
  },
  {
    position: 3,
    label: "3rd",
    badge: "bg-orange-100 text-orange-700 ring-orange-200",
  },
];

// Result types that have a measured value (time, distance...)
const MEASURED_RESULT_TYPES = [
  "time",
  "distance",
  "points",
];

// The meet picked when the page opens
const MEET_STATUS_PRIORITY = [
  "ongoing",
  "applications_closed",
  "completed",
  "applications_open",
  "draft",
];

// =====================================================
// HELPERS
// =====================================================

const toLabel = (value) =>
  String(value || "").replace(/_/g, " ");

const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pickDefaultMeet = (meets) => {
  const active = meets.filter(
    (meet) => meet.isActive !== false
  );

  const pool = active.length ? active : meets;

  for (const status of MEET_STATUS_PRIORITY) {
    const found = pool.find(
      (meet) => meet.status === status
    );

    if (found) {
      return found._id;
    }
  }

  return pool[0]?._id || "";
};

// Reads the message out of an API error, including
// errors returned for PDF (blob) requests.
const getErrorMessage = async (err, fallback) => {
  const data = err?.response?.data;

  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || fallback;
    } catch {
      return fallback;
    }
  }

  return data?.message || fallback;
};

// Must be called straight from a click, before any
// await, or the browser blocks the new tab.
const openPrintWindow = () => {
  const printWindow = window.open("", "_blank");

  if (printWindow) {
    printWindow.document.title = "Preparing certificates...";
    printWindow.document.body.innerHTML =
      '<p style="font-family:sans-serif;padding:24px;color:#475569">Preparing certificates, please wait...</p>';
  }

  return printWindow;
};

const getTeamSize = (event) =>
  event?.eventType === "team"
    ? Math.max(Number(event.teamSize) || 1, 1)
    : 1;

// =====================================================
// PAGE
// =====================================================

export default function AdminResultsPage() {
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

  // Which print is running, e.g. "<eventId>-winner-all"
  const [printing, setPrinting] = useState("");

  // Board row whose result is being entered
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

  const authHeaders = useCallback(
    async () => ({
      Authorization: `Bearer ${await getToken()}`,
    }),
    [getToken]
  );

  // Stable, because the entry form reloads when it changes
  const closeEditor = useCallback(() => setEditing(null), []);

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
  // LOAD RESULT BOARD
  // ===================================================

  // Bumped to load the board again (after a save / refresh)
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!meetId) {
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/sports-results/board`,
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
            await getErrorMessage(err, "Unable to load results.")
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
  // PRINT CERTIFICATES
  // ===================================================

  const printCertificates = async ({
    eventId,
    type = "winner",
    applicationId,
    printWindow,
  }) => {
    const target = printWindow || openPrintWindow();

    try {
      setPrinting(`${eventId}-${type}-${applicationId || "all"}`);

      const response = await axios.get(
        `${API_URL}/api/certificates/event/${eventId}/print`,
        {
          params: { meetId, type, applicationId },
          headers: await authHeaders(),
          responseType: "blob",
        }
      );

      const url = URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );

      if (target && !target.closed) {
        target.location.href = url;
      } else {
        // New tab was blocked: download the file instead
        const link = document.createElement("a");
        link.href = url;
        link.download = `${type}-certificates.pdf`;
        link.click();
      }

      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      target?.close();

      showError(
        await getErrorMessage(err, "Unable to print certificates.")
      );
    } finally {
      setPrinting("");
    }
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

      if (
        onlyWithStudents &&
        row.participantCount === 0 &&
        !row.entered
      ) {
        return false;
      }

      if (statusFilter === "pending" && row.entered) {
        return false;
      }

      if (statusFilter === "entered" && !row.entered) {
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

      if (!term) {
        return true;
      }

      return [
        event.code,
        event.name,
        ...row.results.flatMap((result) =>
          result.participants.flatMap((student) => [
            student.name,
            student.registerNumber,
          ])
        ),
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
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

  // Counts cover events that have students or a result
  const counts = useMemo(() => {
    const relevant = rows.filter(
      (row) => row.participantCount > 0 || row.entered
    );

    const entered = relevant.filter((row) => row.entered).length;

    return {
      total: relevant.length,
      entered,
      pending: relevant.length - entered,
    };
  }, [rows]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setGenderFilter("all");
    setParticipationFilter("all");
    setCategoryFilter("all");
    setOnlyWithStudents(true);
  };

  const selectedMeet = meets.find((meet) => meet._id === meetId);

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
            Results &amp; Certificates
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Enter the winners of an event and print their certificates, all from this page.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <select
            value={meetId}
            onChange={(e) => changeMeet(e.target.value)}
            aria-label="Sports meet"
            className="h-11 min-w-[240px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
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
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

        </div>

      </div>

      {/* SUMMARY */}

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

        <SummaryCard
          icon={Trophy}
          label="Events with students"
          value={counts.total}
          active={statusFilter === "all"}
          onClick={() => setStatusFilter("all")}
          tone="text-slate-900"
        />

        <SummaryCard
          icon={CheckCircle2}
          label="Result entered"
          value={counts.entered}
          active={statusFilter === "entered"}
          onClick={() => setStatusFilter("entered")}
          tone="text-emerald-600"
        />

        <SummaryCard
          icon={Clock}
          label="Result pending"
          value={counts.pending}
          active={statusFilter === "pending"}
          onClick={() => setStatusFilter("pending")}
          tone="text-amber-600"
        />

      </div>

      {/* FILTERS */}

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">

          <div className="relative lg:col-span-2">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search event, code or winner..."
              className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />
          </div>

          <FilterSelect
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              ["all", "All status"],
              ["pending", "Pending"],
              ["entered", "Entered"],
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

      {/* TABLE */}

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="overflow-x-auto">

          <table className="w-full min-w-[1100px] text-sm">

            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500">
                <th className="px-4 py-3 text-center">#</th>
                <th className="px-4 py-3 text-left">Event</th>
                <th className="px-4 py-3 text-center">Students</th>
                {PLACES.map((place) => (
                  <th key={place.position} className="px-4 py-3 text-left">
                    {place.label} Place
                  </th>
                ))}
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>

            <tbody>

              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-slate-500">
                    <Loader2 size={26} className="mx-auto mb-2 animate-spin text-orange-500" />
                    Loading results...
                  </td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Trophy size={32} className="mx-auto mb-3 text-slate-300" />
                    <p className="font-semibold text-slate-600">
                      No events found
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {selectedMeet
                        ? "Try clearing the filters."
                        : "Select a sports meet."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => (
                  <ResultRow
                    key={row.event._id}
                    row={row}
                    index={index}
                    printing={printing}
                    onEnter={() => setEditing(row)}
                    onPrint={printCertificates}
                  />
                ))
              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* ENTER RESULT */}

      {editing && (
        <ResultEntryModal
          row={editing}
          meetId={meetId}
          authHeaders={authHeaders}
          onClose={closeEditor}
          onSaved={() => {
            setEditing(null);
            reloadBoard();
          }}
          onPrint={printCertificates}
        />
      )}

    </div>
  );
}

// =====================================================
// TABLE ROW
// =====================================================

function ResultRow({
  row,
  index,
  printing,
  onEnter,
  onPrint,
}) {
  const { event } = row;

  const resultByPosition = new Map(
    row.results.map((result) => [result.position, result])
  );

  const isPrinting = (type, applicationId = "all") =>
    printing === `${event._id}-${type}-${applicationId}`;

  return (
    <tr className="border-b border-slate-100 align-top transition last:border-0 hover:bg-orange-50/40">

      <td className="px-4 py-3 text-center text-slate-500">
        {index + 1}
      </td>

      {/* EVENT */}

      <td className="px-4 py-3">
        <p className="font-semibold text-slate-900">
          {event.name}
        </p>

        <p className="mt-0.5 text-xs capitalize text-slate-500">
          {event.code} · {event.gender}
          {event.participationCategory === "physically_challenged" &&
            " · PC"}
          {event.eventType === "team" &&
            ` · Team of ${getTeamSize(event)}`}
        </p>
      </td>

      {/* STUDENTS */}

      <td className="px-4 py-3 text-center">
        <span className="inline-flex min-w-8 justify-center rounded-lg bg-orange-50 px-2 py-1 font-bold text-orange-600">
          {row.participantCount}
        </span>
      </td>

      {/* 1ST / 2ND / 3RD */}

      {PLACES.map((place) => {
        const result = resultByPosition.get(place.position);

        return (
          <td key={place.position} className="px-4 py-3">
            {result ? (
              <div className="space-y-1">
                {result.participants.map((student) => (
                  <div
                    key={student._id}
                    className="group flex items-start gap-1.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-800">
                        {student.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {student.registerNumber}
                      </p>
                    </div>

                    <button
                      type="button"
                      title={`Reprint ${student.name}'s certificate`}
                      aria-label={`Reprint certificate of ${student.name}`}
                      onClick={() =>
                        onPrint({
                          eventId: event._id,
                          type: "winner",
                          applicationId: student._id,
                        })
                      }
                      disabled={Boolean(printing)}
                      className="mt-0.5 rounded-md p-1 text-slate-300 transition hover:bg-orange-100 hover:text-orange-600 disabled:opacity-40"
                    >
                      {isPrinting("winner", student._id) ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Printer size={13} />
                      )}
                    </button>
                  </div>
                ))}

                {result.resultValue && (
                  <p className="text-xs font-semibold text-orange-600">
                    {result.resultValue} {event.unit || ""}
                  </p>
                )}
              </div>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </td>
        );
      })}

      {/* STATUS */}

      <td className="px-4 py-3 text-center">
        {row.entered ? (
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              <CheckCircle2 size={12} />
              Entered
            </span>

            <p className="mt-1 text-[11px] text-slate-400">
              {formatDateTime(row.enteredAt)}
            </p>
          </div>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
            <Clock size={12} />
            Pending
          </span>
        )}
      </td>

      {/* ACTIONS */}

      <td className="px-4 py-3">
        <div className="flex flex-col items-stretch gap-1.5">

          {row.entered ? (
            <>
              <button
                type="button"
                onClick={() =>
                  onPrint({ eventId: event._id, type: "winner" })
                }
                disabled={Boolean(printing)}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
              >
                {isPrinting("winner") ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Printer size={14} />
                )}
                Print Winners
              </button>

              <button
                type="button"
                onClick={onEnter}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
              >
                <Pencil size={14} />
                Edit Result
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onEnter}
              disabled={row.participantCount === 0}
              title={
                row.participantCount === 0
                  ? "Nobody registered for this event"
                  : ""
              }
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trophy size={14} />
              Enter Result
            </button>
          )}

          {row.participantCount > 0 && (
            <button
              type="button"
              onClick={() =>
                onPrint({
                  eventId: event._id,
                  type: "participation",
                })
              }
              disabled={Boolean(printing)}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
            >
              {isPrinting("participation") ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Award size={13} />
              )}
              Participation
            </button>
          )}

        </div>
      </td>

    </tr>
  );
}

// =====================================================
// ENTER / EDIT RESULT
// =====================================================

function ResultEntryModal({
  row,
  meetId,
  authHeaders,
  onClose,
  onSaved,
  onPrint,
}) {
  const { event } = row;
  const teamSize = getTeamSize(event);

  const showValue = MEASURED_RESULT_TYPES.includes(event.resultType);

  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentSearch, setStudentSearch] = useState("");

  // { 1: [id, id], 2: [...], 3: [...] } - one id per team slot
  const [places, setPlaces] = useState(() => emptyPlaces(teamSize));
  const [values, setValues] = useState({ 1: "", 2: "", 3: "" });

  // ---------------------------------------------------
  // LOAD STUDENTS + SAVED RESULT
  // ---------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/sports-results/event/${event._id}`,
          {
            params: { meetId },
            headers: await authHeaders(),
          }
        );

        if (cancelled) {
          return;
        }

        const nextPlaces = emptyPlaces(teamSize);
        const nextValues = { 1: "", 2: "", 3: "" };

        for (const result of response.data?.results || []) {
          result.participants.forEach((student, slot) => {
            if (slot < teamSize) {
              nextPlaces[result.position][slot] = student._id;
            }
          });

          nextValues[result.position] = result.resultValue || "";
        }

        setParticipants(response.data?.participants || []);
        setPlaces(nextPlaces);
        setValues(nextValues);
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
  }, [event._id, meetId, teamSize, authHeaders, onClose]);

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

  // ---------------------------------------------------
  // OPTIONS
  // ---------------------------------------------------

  const chosenIds = new Set(
    Object.values(places).flat().filter(Boolean)
  );

  const term = studentSearch.trim().toLowerCase();

  // Students for one slot: not already chosen elsewhere,
  // matching the search, and always the current choice.
  const optionsFor = (currentId) =>
    participants.filter(
      (student) =>
        student._id === currentId ||
        (!chosenIds.has(student._id) &&
          (!term ||
            `${student.name} ${student.registerNumber} ${student.collegeCode}`
              .toLowerCase()
              .includes(term)))
    );

  const setSlot = (position, slot, studentId) => {
    setPlaces((previous) => ({
      ...previous,
      [position]: previous[position].map((id, index) =>
        index === slot ? studentId : id
      ),
    }));
  };

  const clearPlace = (position) => {
    setPlaces((previous) => ({
      ...previous,
      [position]: Array(teamSize).fill(""),
    }));

    setValues((previous) => ({ ...previous, [position]: "" }));
  };

  // ---------------------------------------------------
  // SAVE (and optionally print)
  // ---------------------------------------------------

  const save = async (print) => {
    // A team place must be complete or left empty
    const halfFilled = PLACES.find((place) => {
      const filled = places[place.position].filter(Boolean).length;
      return filled > 0 && filled < teamSize;
    });

    if (halfFilled) {
      showWarning(
        `Select all ${teamSize} team members for ${halfFilled.label} place, or clear it.`
      );
      return;
    }

    const positions = PLACES.map((place) => ({
      position: place.position,
      participants: places[place.position].filter(Boolean),
      resultValue: values[place.position],
    }));

    const hasWinner = positions.some(
      (item) => item.participants.length > 0
    );

    if (!hasWinner && !row.entered) {
      showWarning("Select at least the 1st place winner.");
      return;
    }

    // Opened now (inside the click) so it is not blocked
    const printWindow =
      print && hasWinner ? openPrintWindow() : null;

    try {
      setSaving(true);

      const response = await axios.put(
        `${API_URL}/api/sports-results/event/${event._id}`,
        { meetId, positions },
        { headers: await authHeaders() }
      );

      if (printWindow) {
        await onPrint({
          eventId: event._id,
          type: "winner",
          printWindow,
        });
      } else {
        showSuccess(response.data?.message || "Result saved.");
      }

      onSaved();
    } catch (err) {
      printWindow?.close();

      showError(
        await getErrorMessage(err, "Unable to save the result.")
      );
    } finally {
      setSaving(false);
    }
  };

  const noStudentsLeft =
    !loading && participants.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">

      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">
              {row.entered ? "Edit Result" : "Enter Result"}
            </p>

            <h3 className="text-lg font-bold text-slate-900">
              {event.name}
            </h3>

            <p className="text-xs capitalize text-slate-500">
              {event.code} · {event.gender} · {participants.length} students
              {event.eventType === "team" && ` · Team of ${teamSize}`}
            </p>
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

        {/* BODY */}

        <div className="flex-1 overflow-y-auto px-5 py-4">

          {row.entered && (
            <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs text-sky-800">
              This result was already entered on{" "}
              <strong>{formatDateTime(row.enteredAt)}</strong>. Saving
              replaces it. Students keep their certificate numbers, so a
              reprint is the same certificate.
            </div>
          )}

          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 size={24} className="mx-auto mb-2 animate-spin text-orange-500" />
              Loading students...
            </div>
          ) : noStudentsLeft ? (
            <p className="py-12 text-center text-slate-500">
              Nobody is registered for this event.
            </p>
          ) : (
            <>
              {participants.length > 8 && (
                <div className="relative mb-4">
                  <Search
                    size={15}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Type a name or register number to narrow the lists..."
                    className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                  />
                </div>
              )}

              <div className="space-y-3">
                {PLACES.map((place) => (
                  <div
                    key={place.position}
                    className="rounded-xl border border-slate-200 p-3"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${place.badge}`}
                      >
                        <Trophy size={12} />
                        {place.label} Place
                      </span>

                      {places[place.position].some(Boolean) && (
                        <button
                          type="button"
                          onClick={() => clearPlace(place.position)}
                          className="text-xs font-medium text-slate-400 hover:text-red-600"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div
                      className={`grid gap-2 ${
                        showValue ? "sm:grid-cols-[1fr_140px]" : ""
                      }`}
                    >
                      <div className="space-y-2">
                        {places[place.position].map((studentId, slot) => (
                          <select
                            key={slot}
                            value={studentId}
                            onChange={(e) =>
                              setSlot(place.position, slot, e.target.value)
                            }
                            aria-label={`${place.label} place${
                              teamSize > 1 ? `, member ${slot + 1}` : ""
                            }`}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                          >
                            <option value="">
                              {teamSize > 1
                                ? `Member ${slot + 1} - select student`
                                : "Select student"}
                            </option>

                            {optionsFor(studentId).map((student) => (
                              <option key={student._id} value={student._id}>
                                {student.name} - {student.registerNumber} ({student.collegeCode})
                              </option>
                            ))}
                          </select>
                        ))}
                      </div>

                      {showValue && (
                        <input
                          value={values[place.position]}
                          onChange={(e) =>
                            setValues((previous) => ({
                              ...previous,
                              [place.position]: e.target.value,
                            }))
                          }
                          maxLength={50}
                          placeholder={`${toLabel(event.resultType)}${
                            event.unit ? ` (${event.unit})` : ""
                          }`}
                          aria-label={`${place.label} place ${event.resultType}`}
                          className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm capitalize outline-none placeholder:normal-case focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-slate-400">
                Leave a place empty if there is no winner for it. Made a
                mistake later? Open this event again, correct it and
                print again.
              </p>
            </>
          )}

        </div>

        {/* FOOTER */}

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3 sm:flex-row sm:justify-end">

          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving || loading || noStudentsLeft}
            className="rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
          >
            Save Only
          </button>

          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving || loading || noStudentsLeft}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Printer size={16} />
            )}
            Save &amp; Print
          </button>

        </div>

      </div>

    </div>
  );
}

// =====================================================
// SMALL COMPONENTS
// =====================================================

function emptyPlaces(teamSize) {
  return {
    1: Array(teamSize).fill(""),
    2: Array(teamSize).fill(""),
    3: Array(teamSize).fill(""),
  };
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  active,
  onClick,
  tone,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border bg-white p-4 text-left transition hover:border-orange-300 ${
        active
          ? "border-orange-400 ring-2 ring-orange-100"
          : "border-slate-200"
      }`}
    >
      <span className="rounded-xl bg-slate-50 p-2.5">
        <Icon size={20} className={tone} />
      </span>

      <span>
        <span className={`block text-2xl font-bold ${tone}`}>
          {value}
        </span>
        <span className="text-xs text-slate-500">{label}</span>
      </span>
    </button>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm capitalize text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
    >
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}
