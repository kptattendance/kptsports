"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  RefreshCw,
  Save,
  Trophy,
} from "lucide-react";
import { useRouter } from "next/navigation";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

export default function AdminResultsPage() {
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  // =====================================================
  // DATA
  // =====================================================

  const [meets, setMeets] =
    useState([]);

  const [events, setEvents] =
    useState([]);

  const [applications, setApplications] =
    useState([]);

  const [results, setResults] =
    useState([]);

  // =====================================================
  // SELECTION
  // =====================================================

  const [meetId, setMeetId] =
    useState("");

  const [eventId, setEventId] =
    useState("");

  // =====================================================
  // LOADING
  // =====================================================

  const [loading, setLoading] =
    useState(true);

  const [loadingEvent, setLoadingEvent] =
    useState(false);

  const [savingPosition, setSavingPosition] =
    useState(null);

  const [finalizing, setFinalizing] =
    useState(false);

  // =====================================================
  // ERROR
  // =====================================================

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  // =====================================================
  // RESULT FORM
  // =====================================================

  const [positions, setPositions] =
    useState({
      1: {
        participants: [],
        resultValue: "",
        resultUnit: "",
        remarks: "",
      },

      2: {
        participants: [],
        resultValue: "",
        resultUnit: "",
        remarks: "",
      },

      3: {
        participants: [],
        resultValue: "",
        resultUnit: "",
        remarks: "",
      },
    });

  // =====================================================
  // LOAD INITIAL DATA
  // =====================================================

  useEffect(() => {
    if (
      isLoaded &&
      isSignedIn
    ) {
      loadInitialData();
    }
  }, [
    isLoaded,
    isSignedIn,
  ]);

  // =====================================================
  // LOAD MEETS / EVENTS / APPLICATIONS
  // =====================================================

  const loadInitialData =
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          await getToken();

        const headers = {
          Authorization:
            `Bearer ${token}`,
        };

        const [
          meetResponse,
          eventResponse,
          applicationResponse,
        ] = await Promise.all([
          axios.get(
            `${API_URL}/api/sports-meets`,
            { headers }
          ),

          axios.get(
            `${API_URL}/api/events`,
            { headers }
          ),

          axios.get(
            `${API_URL}/api/sports-applications`,
            { headers }
          ),
        ]);

        const meetData =
          extractArray(
            meetResponse.data,
            [
              "meets",
              "sportsMeets",
            ]
          );

        const eventData =
          extractArray(
            eventResponse.data,
            ["events"]
          );

        const applicationData =
          extractArray(
            applicationResponse.data,
            ["applications"]
          );

        setMeets(meetData);
        setEvents(eventData);
        setApplications(
          applicationData
        );

        // -------------------------------------------------
        // Select active meet first
        // -------------------------------------------------

        const activeMeet =
          meetData.find(
            (meet) =>
              meet.status ===
                "applications_open" ||
              meet.isActive === true
          );

        if (activeMeet) {
          setMeetId(
            String(
              activeMeet._id
            )
          );
        } else if (
          meetData.length > 0
        ) {
          setMeetId(
            String(
              meetData[0]._id
            )
          );
        }

      } catch (err) {

        console.error(
          "RESULT INITIAL LOAD ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load data."
        );

      } finally {

        setLoading(false);

      }
    };

  // =====================================================
  // EVENTS FOR SELECTED MEET
  // =====================================================

  const meetEvents =
    useMemo(() => {

      if (!meetId) {
        return [];
      }

      return events.filter(
        (event) =>
          String(
            event.meet?._id ||
              event.meet
          ) ===
          String(meetId)
      );

    }, [
      events,
      meetId,
    ]);

  // =====================================================
  // APPLICATIONS FOR SELECTED MEET
  // =====================================================

  const meetApplications =
    useMemo(() => {

      if (!meetId) {
        return [];
      }

      return applications.filter(
        (application) => {

          const applicationMeet =
            application.meet?._id ||
            application.meet;

          return (
            String(
              applicationMeet
            ) ===
            String(meetId)
          );

        }
      );

    }, [
      applications,
      meetId,
    ]);

  // =====================================================
  // SELECTED EVENT
  // =====================================================

  const selectedEvent =
    useMemo(() => {

      return meetEvents.find(
        (event) =>
          String(
            event._id
          ) ===
          String(eventId)
      );

    }, [
      meetEvents,
      eventId,
    ]);

// =====================================================
// ELIGIBLE PARTICIPANTS
// FROM SPORTS APPLICATIONS
// =====================================================

const eligibleParticipants =
  useMemo(() => {

    if (!selectedEvent) {
      return [];
    }

    return meetApplications
      .filter((application) => {

        // ---------------------------------------------
        // APPLICATION MUST HAVE SELECTED THIS EVENT
        // ---------------------------------------------

        const selectedEvents =
          Array.isArray(
            application.selectedEvents
          )
            ? application.selectedEvents
            : [];

        const hasSelectedEvent =
          selectedEvents.some(
            (event) => {

              const eventId =
                typeof event ===
                "object"
                  ? event?._id
                  : event;

              return (
                String(eventId) ===
                String(
                  selectedEvent._id
                )
              );

            }
          );

        if (!hasSelectedEvent) {
          return false;
        }

        // ---------------------------------------------
        // DO NOT REQUIRE STUDENT MODEL
        // DO NOT REQUIRE APPROVED STATUS
        // APPLICATION ITSELF IS THE PARTICIPANT
        // ---------------------------------------------

        return true;

      })
      .sort(
        (a, b) =>
          String(
            a.name || ""
          ).localeCompare(
            String(
              b.name || ""
            )
          )
      );

  }, [
    meetApplications,
    selectedEvent,
  ]);

  // =====================================================
  // EVENT CHANGE
  // =====================================================

  const handleEventChange =
    async (value) => {

      setEventId(value);

      setMessage("");
      setError("");

      setPositions({
        1: emptyPosition(),
        2: emptyPosition(),
        3: emptyPosition(),
      });

      setResults([]);

      if (!value) {
        return;
      }

      await loadEventResults(
        value,
        meetId
      );

    };

  // =====================================================
  // LOAD RESULTS
  // =====================================================

  const loadEventResults =
    async (
      selectedEventId,
      selectedMeetId
    ) => {

      try {

        setLoadingEvent(true);

        const token =
          await getToken();

        const response =
          await axios.get(
            `${API_URL}/api/sports-results/event/${selectedEventId}?meetId=${selectedMeetId}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          response.data;

        const loadedResults =
          Array.isArray(
            data?.results
          )
            ? data.results
            : Array.isArray(
                data?.data?.results
              )
            ? data.data.results
            : [];

        setResults(
          loadedResults
        );

        // -------------------------------------------------
        // Fill existing results
        // -------------------------------------------------

        const nextPositions = {
          1: emptyPosition(),
          2: emptyPosition(),
          3: emptyPosition(),
        };

        loadedResults.forEach(
          (result) => {

            const position =
              Number(
                result.position
              );

            if (
              [1, 2, 3].includes(
                position
              )
            ) {

              nextPositions[
                position
              ] = {
                participants:
                  Array.isArray(
                    result.participants
                  )
                    ? result.participants.map(
                        (participant) =>
                          String(
                            participant._id ||
                              participant
                          )
                      )
                    : [],

                resultValue:
                  result.resultValue ||
                  "",

                resultUnit:
                  result.resultUnit ||
                  "",

                remarks:
                  result.remarks ||
                  "",
              };

            }

          }
        );

        setPositions(
          nextPositions
        );

      } catch (err) {

        console.error(
          "LOAD RESULTS ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to load results."
        );

      } finally {

        setLoadingEvent(
          false
        );

      }

    };

  // =====================================================
  // POSITION PARTICIPANT COUNT
  // =====================================================

  const participantCount =
    selectedEvent?.eventType ===
    "team"
      ? Number(
          selectedEvent.teamSize ||
            1
        )
      : 1;

  // =====================================================
  // UPDATE POSITION PARTICIPANT
  // =====================================================

  const updateParticipant =
    (
      position,
      index,
      value
    ) => {

      setPositions(
        (current) => {

          const next = {
            ...current,
            [position]: {
              ...current[position],
              participants: [
                ...current[
                  position
                ].participants,
              ],
            },
          };

          next[position].participants[
            index
          ] = value;

          return next;

        }
      );

    };

  // =====================================================
  // UPDATE RESULT VALUE
  // =====================================================

  const updatePositionField =
    (
      position,
      field,
      value
    ) => {

      setPositions(
        (current) => ({
          ...current,

          [position]: {
            ...current[position],
            [field]: value,
          },
        })
      );

    };

  // =====================================================
  // CHECK DUPLICATE PARTICIPANT
  // =====================================================

  const isParticipantUsed =
    (
      participantId,
      currentPosition,
      currentIndex
    ) => {

      if (!participantId) {
        return false;
      }

      for (
        const position of [
          1,
          2,
          3,
        ]
      ) {

        const participants =
          positions[
            position
          ].participants;

        for (
          let index = 0;
          index <
          participants.length;
          index++
        ) {

          if (
            position ===
              currentPosition &&
            index ===
              currentIndex
          ) {
            continue;
          }

          if (
            String(
              participants[index]
            ) ===
            String(
              participantId
            )
          ) {
            return true;
          }

        }

      }

      return false;

    };

  // =====================================================
  // SAVE POSITION
  // =====================================================

  const savePosition =
    async (position) => {

      if (!selectedEvent) {
        return;
      }

      const positionData =
        positions[position];

      const participants =
        positionData.participants.filter(
          Boolean
        );

      if (
        participants.length !==
        participantCount
      ) {

        setError(
          position === 1
            ? `Select ${participantCount} participant${
                participantCount > 1
                  ? "s"
                  : ""
              } for 1st place.`
            : position === 2
            ? `Select ${participantCount} participant${
                participantCount > 1
                  ? "s"
                  : ""
              } for 2nd place.`
            : `Select ${participantCount} participant${
                participantCount > 1
                  ? "s"
                  : ""
              } for 3rd place.`
        );

        return;
      }

      const duplicate =
        new Set(
          participants.map(
            String
          )
        ).size !==
        participants.length;

      if (duplicate) {

        setError(
          "The same participant cannot be selected twice."
        );

        return;
      }

      // --------------------------------------------------
      // Check across positions
      // --------------------------------------------------

      for (
        const otherPosition of [
          1,
          2,
          3,
        ]
      ) {

        if (
          otherPosition ===
          position
        ) {
          continue;
        }

        const existing =
          positions[
            otherPosition
          ].participants;

        const duplicateAcrossPosition =
          participants.some(
            (participantId) =>
              existing.some(
                (existingId) =>
                  String(
                    existingId
                  ) ===
                  String(
                    participantId
                  )
              )
          );

        if (
          duplicateAcrossPosition
        ) {

          setError(
            "A participant cannot be assigned to more than one position."
          );

          return;
        }

      }

      try {

        setSavingPosition(
          position
        );

        setError("");
        setMessage("");

        const token =
          await getToken();

        const response =
          await axios.post(
            `${API_URL}/api/sports-results`,
            {
              meetId,
              eventId,
              position,
              participants,
              resultValue:
                positionData.resultValue,
              resultUnit:
                positionData.resultUnit ||
                selectedEvent.unit ||
                "",
              remarks:
                positionData.remarks,
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
                "Content-Type":
                  "application/json",
              },
            }
          );

        setMessage(
          response.data?.message ||
            "Result saved successfully."
        );

        await loadEventResults(
          eventId,
          meetId
        );

      } catch (err) {

        console.error(
          "SAVE RESULT ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to save result."
        );

      } finally {

        setSavingPosition(
          null
        );

      }

    };

  // =====================================================
  // FINALIZE EVENT
  // =====================================================

  const finalizeEvent =
    async () => {

      if (!selectedEvent) {
        return;
      }

      const enteredPositions =
        [
          1,
          2,
          3,
        ].filter(
          (position) =>
            positions[
              position
            ].participants.some(
              Boolean
            )
        );

      if (
        enteredPositions.length ===
        0
      ) {

        setError(
          "Enter at least one result before finalizing."
        );

        return;
      }

      const confirmed =
        window.confirm(
          "Finalize this event result? Finalized results cannot be changed."
        );

      if (!confirmed) {
        return;
      }

      try {

        setFinalizing(true);

        setError("");
        setMessage("");

        const token =
          await getToken();

        const response =
          await axios.post(
            `${API_URL}/api/sports-results/event/${eventId}/finalize`,
            {
              meetId,
            },
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setMessage(
          response.data?.message ||
            "Result finalized successfully."
        );

        await loadEventResults(
          eventId,
          meetId
        );

      } catch (err) {

        console.error(
          "FINALIZE RESULT ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            "Unable to finalize result."
        );

      } finally {

        setFinalizing(
          false
        );

      }

    };

  // =====================================================
  // FINAL RESULT CHECK
  // =====================================================

  const isFinal =
    results.length > 0 &&
    results.every(
      (result) =>
        result.isFinal === true
    );

  // =====================================================
  // LOADING
  // =====================================================

  if (
    !isLoaded ||
    loading
  ) {

    return (
      <main className="min-h-screen bg-[#fffaf5] flex items-center justify-center">

        <Loader2
          size={30}
          className="animate-spin text-orange-500"
        />

      </main>
    );

  }

  // =====================================================
  // PAGE
  // =====================================================

  return (

    <main className="min-h-screen bg-[#fffaf5]">

      {/* =================================================
          HEADER
      ================================================= */}

      <header className="sticky top-0 z-40 border-b border-orange-100 bg-white/95 backdrop-blur">

        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">

          <div className="flex items-center gap-3">

            <button
              type="button"
              onClick={() =>
                router.back()
              }
              className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition"
            >

              <ArrowLeft
                size={17}
              />

            </button>

            <div>

              <h1 className="font-bold text-slate-900">
                Results
              </h1>

              <p className="text-[11px] text-slate-500">
                Sports Meet
              </p>

            </div>

          </div>

          <button
            type="button"
            onClick={() => {

              if (
                eventId
              ) {
                loadEventResults(
                  eventId,
                  meetId
                );
              } else {
                loadInitialData();
              }

            }}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600 transition"
          >

            <RefreshCw
              size={16}
              className={
                loadingEvent
                  ? "animate-spin"
                  : ""
              }
            />

          </button>

        </div>

      </header>

      <div className="max-w-7xl mx-auto px-5 py-6">

        {/* =================================================
            SELECT MEET / EVENT
        ================================================= */}

        <div className="bg-white border border-slate-200 rounded-2xl p-4">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* MEET */}

            <div>

              <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                Sports Meet
              </label>

              <div className="relative">

                <select
                  value={meetId}
                  onChange={(e) => {

                    setMeetId(
                      e.target.value
                    );

                    setEventId("");
                    setResults([]);

                    setPositions({
                      1: emptyPosition(),
                      2: emptyPosition(),
                      3: emptyPosition(),
                    });

                    setError("");
                    setMessage("");

                  }}
                  className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >

                  <option value="">
                    Select Meet
                  </option>

                  {meets.map(
                    (meet) => (

                      <option
                        key={
                          meet._id
                        }
                        value={
                          meet._id
                        }
                      >
                        {meet.name}
                      </option>

                    )
                  )}

                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

            {/* EVENT */}

            <div>

              <label className="block mb-1.5 text-xs font-semibold text-slate-500">
                Event
              </label>

              <div className="relative">

                <select
                  value={eventId}
                  onChange={(e) =>
                    handleEventChange(
                      e.target.value
                    )
                  }
                  disabled={
                    !meetId
                  }
                  className="w-full h-11 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                >

                  <option value="">
                    Select Event
                  </option>

                  {meetEvents.map(
                    (event) => (

                      <option
                        key={
                          event._id
                        }
                        value={
                          event._id
                        }
                      >
                        {event.code} -{" "}
                        {event.name}
                      </option>

                    )
                  )}

                </select>

                <ChevronDown
                  size={16}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

              </div>

            </div>

          </div>

        </div>

        {/* =================================================
            MESSAGES
        ================================================= */}

        {error && (

          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>

        )}

        {message && (

          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 flex items-center gap-2">

            <Check
              size={16}
            />

            {message}

          </div>

        )}

        {/* =================================================
            EVENT INFORMATION
        ================================================= */}

        {selectedEvent && (

          <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

            <div>

              <div className="flex items-center gap-2">

                <Trophy
                  size={20}
                  className="text-orange-500"
                />

                <h2 className="text-xl font-bold text-slate-900">
                  {selectedEvent.name}
                </h2>

              </div>

              <div className="mt-1 text-xs text-slate-500">

                {selectedEvent.code}

                {" • "}

                {formatValue(
                  selectedEvent.category
                )}

                {" • "}

                {formatValue(
                  selectedEvent.gender
                )}

                {" • "}

                {selectedEvent.eventType ===
                "team"
                  ? `Team of ${participantCount}`
                  : "Individual"}

              </div>

            </div>

            <div className="text-xs">

              {isFinal ? (

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 font-semibold text-emerald-700">

                  <Check
                    size={14}
                  />

                  Finalized

                </span>

              ) : (

                <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 font-semibold text-amber-700">
                  Draft
                </span>

              )}

            </div>

          </div>

        )}

        {/* =================================================
            RESULT ENTRY
        ================================================= */}

        {selectedEvent && (

          <div className="mt-5 space-y-3">

            {[1, 2, 3].map(
              (position) => (

                <PositionCard
                  key={
                    position
                  }
                  position={
                    position
                  }
                  participantCount={
                    participantCount
                  }
                  participants={
                    eligibleParticipants
                  }
                  data={
                    positions[
                      position
                    ]
                  }
                  disabled={
                    isFinal
                  }
                  saving={
                    savingPosition ===
                    position
                  }
                  onParticipantChange={
                    updateParticipant
                  }
                  onFieldChange={
                    updatePositionField
                  }
                  isParticipantUsed={
                    isParticipantUsed
                  }
                  onSave={
                    savePosition
                  }
                  unit={
                    selectedEvent.unit ||
                    ""
                  }
                />

              )
            )}

          </div>

        )}

        {/* =================================================
            FINALIZE
        ================================================= */}

        {selectedEvent &&
          !isFinal && (

            <div className="mt-5 flex justify-end">

              <button
                type="button"
                onClick={
                  finalizeEvent
                }
                disabled={
                  finalizing ||
                  loadingEvent
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >

                {finalizing ? (

                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                ) : (

                  <Check
                    size={17}
                  />

                )}

                Finalize Result

              </button>

            </div>

          )}

        {/* =================================================
            NO EVENT
        ================================================= */}

        {!selectedEvent && (

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">

            <Trophy
              size={32}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 font-semibold text-slate-600">
              Select an event
            </p>

          </div>

        )}

      </div>

    </main>

  );
}


/* =========================================================
   POSITION CARD
========================================================= */

function PositionCard({
  position,
  participantCount,
  participants,
  data,
  disabled,
  saving,
  onParticipantChange,
  onFieldChange,
  isParticipantUsed,
  onSave,
  unit,
}) {

  const label =
    position === 1
      ? "1st Place"
      : position === 2
      ? "2nd Place"
      : "3rd Place";

  const badge =
    position === 1
      ? "bg-amber-50 text-amber-700 border-amber-200"
      : position === 2
      ? "bg-slate-50 text-slate-600 border-slate-200"
      : "bg-orange-50 text-orange-700 border-orange-200";

  return (

    <div className="bg-white border border-slate-200 rounded-2xl p-4">

      <div className="flex flex-col lg:flex-row lg:items-start gap-4">

        {/* POSITION */}

        <div className="lg:w-28 shrink-0">

          <span
            className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-bold ${badge}`}
          >
            {label}
          </span>

        </div>

        {/* PARTICIPANTS */}

        <div className="flex-1">

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">

            {Array.from({
              length:
                participantCount,
            }).map(
              (
                _,
                index
              ) => (

                <div
                  key={
                    index
                  }
                  className="relative"
                >

                  <select
                    value={
                      data.participants[
                        index
                      ] || ""
                    }
                    disabled={
                      disabled
                    }
                    onChange={(e) => {

                      const value =
                        e.target
                          .value;

                      if (
                        value &&
                        isParticipantUsed(
                          value,
                          position,
                          index
                        )
                      ) {

                        return;

                      }

                      onParticipantChange(
                        position,
                        index,
                        value
                      );

                    }}
                    className="w-full h-10 appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-8 text-sm text-slate-700 outline-none disabled:bg-slate-50 disabled:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
                  >

                    <option value="">
                      {participantCount >
                      1
                        ? `Participant ${
                            index +
                            1
                          }`
                        : "Select student"}
                    </option>

                    {participants.map(
                      (
                        participant
                      ) => {

                        const alreadyUsed =
                          isParticipantUsed(
                            participant._id,
                            position,
                            index
                          );

                        return (

                          <option
                            key={
                              participant._id
                            }
                            value={
                              participant._id
                            }
                            disabled={
                              alreadyUsed
                            }
                          >
                            {
                              participant.name
                            }
                            {" - "}
                            {
                              participant.registerNumber
                            }

                          </option>

                        );

                      }
                    )}

                  </select>

                  <ChevronDown
                    size={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              )
            )}

          </div>

        </div>

        {/* RESULT */}

        <div className="flex gap-2 lg:w-64 shrink-0">

          <input
            value={
              data.resultValue
            }
            disabled={
              disabled
            }
            onChange={(e) =>
              onFieldChange(
                position,
                "resultValue",
                e.target.value
              )
            }
            placeholder="Result"
            className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

          <input
            value={
              data.resultUnit ||
              unit
            }
            disabled={
              disabled
            }
            onChange={(e) =>
              onFieldChange(
                position,
                "resultUnit",
                e.target.value
              )
            }
            placeholder="Unit"
            className="w-24 h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none disabled:bg-slate-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
          />

        </div>

        {/* SAVE */}

        <button
          type="button"
          disabled={
            disabled ||
            saving
          }
          onClick={() =>
            onSave(position)
          }
          className="h-10 lg:w-24 shrink-0 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >

          {saving ? (

            <Loader2
              size={15}
              className="animate-spin"
            />

          ) : (

            <Save
              size={15}
            />

          )}

          Save

        </button>

      </div>

      {/* REMARKS */}

      <div className="mt-3 lg:ml-28">

        <input
          value={
            data.remarks
          }
          disabled={
            disabled
          }
          onChange={(e) =>
            onFieldChange(
              position,
              "remarks",
              e.target.value
            )
          }
          placeholder="Remarks"
          className="w-full h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none disabled:bg-slate-50 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
        />

      </div>

    </div>

  );
}


/* =========================================================
   EMPTY POSITION
========================================================= */

function emptyPosition() {
  return {
    participants: [],
    resultValue: "",
    resultUnit: "",
    remarks: "",
  };
}


/* =========================================================
   EXTRACT ARRAY
========================================================= */

function extractArray(
  response,
  keys = []
) {

  if (
    Array.isArray(
      response
    )
  ) {
    return response;
  }

  if (
    Array.isArray(
      response?.data
    )
  ) {
    return response.data;
  }

  for (
    const key of keys
  ) {

    if (
      Array.isArray(
        response?.[key]
      )
    ) {
      return response[key];
    }

  }

  if (
    response?.data
  ) {

    for (
      const key of keys
    ) {

      if (
        Array.isArray(
          response.data?.[key]
        )
      ) {
        return response
          .data[key];
      }

    }

  }

  return [];
}


/* =========================================================
   FORMAT VALUE
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