"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";


export default function AdminCertificatesPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [meets, setMeets] = useState([]);
  const [events, setEvents] = useState([]);
  const [certificates, setCertificates] = useState([]);

  const [selectedMeet, setSelectedMeet] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");

  const [search, setSearch] = useState("");
  const [certificateType, setCertificateType] =
    useState("all");

  const [loading, setLoading] = useState(true);
  const [loadingCertificates, setLoadingCertificates] =
    useState(false);
  const [generating, setGenerating] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const { getToken } = useAuth();
  // =====================================================
  // LOAD INITIAL DATA
  // =====================================================

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getTokenSafely();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [meetResponse, eventResponse] =
        await Promise.all([
          axios.get(
            `${API_URL}/api/sports-meets`,
            { headers }
          ),

          axios.get(
            `${API_URL}/api/events`,
            { headers }
          ),
        ]);

      const meetData =
        meetResponse.data?.meets ||
        meetResponse.data?.data ||
        (Array.isArray(meetResponse.data)
          ? meetResponse.data
          : []);

      const eventData =
        eventResponse.data?.events ||
        eventResponse.data?.data ||
        (Array.isArray(eventResponse.data)
          ? eventResponse.data
          : []);

      setMeets(meetData);
      setEvents(eventData);

      const activeMeet = meetData.find(
        (meet) =>
          meet.isActive === true
      );

      if (activeMeet) {
        setSelectedMeet(activeMeet._id);
      } else if (meetData.length > 0) {
        setSelectedMeet(meetData[0]._id);
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Failed to load certificate data."
      );
    } finally {
      setLoading(false);
    }
  };

 const getTokenSafely = async () => {
  return await getToken();
};



const downloadCertificate = async (
  certificate
) => {
  try {
    setError("");

    const token = await getTokenSafely();

    const response = await axios.get(
      `${API_URL}/api/certificates/${certificate._id}/pdf`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: "blob",
      }
    );

    const blob = new Blob(
      [response.data],
      {
        type: "application/pdf",
      }
    );

    const url =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    const safeName =
      String(
        certificate.studentName || "certificate"
      )
        .replace(
          /[^a-zA-Z0-9]+/g,
          "_"
        )
        .replace(/^_+|_+$/g, "");

    link.download =
      `${certificate.certificateNumber}_${safeName}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error(err);

    setError(
      err?.response?.data?.message ||
        "Failed to download certificate."
    );
  }
};
  // =====================================================
  // FILTER EVENTS BY MEET
  // =====================================================

  const meetEvents = useMemo(() => {
    if (!selectedMeet) {
      return [];
    }

    return events
      .filter((event) => {
        const eventMeet =
          event.meet?._id ||
          event.meet;

        return (
          String(eventMeet) ===
          String(selectedMeet)
        );
      })
      .sort(
        (a, b) =>
          Number(a.displayOrder || 0) -
          Number(b.displayOrder || 0)
      );
  }, [events, selectedMeet]);

  // =====================================================
  // LOAD CERTIFICATES
  // =====================================================

  const loadCertificates = async () => {
    if (!selectedMeet) {
      setCertificates([]);
      return;
    }

    try {
      setLoadingCertificates(true);
      setError("");

      const token = await getTokenSafely();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const params = {
        meetId: selectedMeet,
      };

      if (selectedEvent) {
        params.eventId = selectedEvent;
      }

      if (
        certificateType !== "all"
      ) {
        params.certificateType =
          certificateType;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await axios.get(
        `${API_URL}/api/certificates`,
        {
          headers,
          params,
        }
      );

      const data =
        response.data?.certificates ||
        response.data?.data ||
        (Array.isArray(response.data)
          ? response.data
          : []);

      setCertificates(data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Failed to load certificates."
      );

      setCertificates([]);
    } finally {
      setLoadingCertificates(false);
    }
  };

  // =====================================================
  // LOAD CERTIFICATES WHEN FILTER CHANGES
  // =====================================================

  useEffect(() => {
    if (!selectedMeet) {
      return;
    }

    loadCertificates();
  }, [
    selectedMeet,
    selectedEvent,
    certificateType,
  ]);

  // =====================================================
  // SEARCH
  // =====================================================

  const handleSearch = async () => {
    await loadCertificates();
  };

  // =====================================================
  // GENERATE CERTIFICATES
  // =====================================================

  const generateCertificates = async () => {
    if (!selectedEvent) {
      setError(
        "Please select an event first."
      );
      return;
    }

    const event = events.find(
      (item) =>
        String(item._id) ===
        String(selectedEvent)
    );

    if (!event) {
      setError("Event not found.");
      return;
    }

    const confirmed = window.confirm(
      `Generate certificates for "${event.name}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setGenerating(true);
      setError("");
      setSuccess("");

      const token = await getTokenSafely();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const response = await axios.post(
        `${API_URL}/api/certificates/event/${selectedEvent}/generate`,
        {},
        {
          headers,
        }
      );

      const data = response.data || {};

      setSuccess(
        data.message ||
          "Certificates generated successfully."
      );

      await loadCertificates();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Failed to generate certificates."
      );
    } finally {
      setGenerating(false);
    }
  };

  // =====================================================
  // DELETE CERTIFICATE
  // =====================================================

  const deleteCertificate = async (
    certificateId
  ) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this certificate?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const token = await getTokenSafely();

      const headers = {
        Authorization: `Bearer ${token}`,
      };

      await axios.delete(
        `${API_URL}/api/certificates/${certificateId}`,
        {
          headers,
        }
      );

      setSuccess(
        "Certificate deleted successfully."
      );

      await loadCertificates();
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.message ||
          "Failed to delete certificate."
      );
    }
  };

  // =====================================================
  // STATISTICS
  // =====================================================

  const winnerCount = certificates.filter(
    (certificate) =>
      certificate.certificateType ===
      "winner"
  ).length;

  const participationCount =
    certificates.filter(
      (certificate) =>
        certificate.certificateType ===
        "participation"
    ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

            <p className="mt-4 text-sm text-slate-500">
              Loading certificates...
            </p>
          </div>
        </div>
      </main>
    );
  }

  // =====================================================
  // MAIN UI
  // =====================================================

  return (
    <main className="min-h-screen bg-white">
      {/* HEADER */}

      <header className="border-b border-orange-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
              Certificates
            </h1>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Generate and manage sports meet
              certificates
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-lg border border-orange-200 px-4 py-2 text-sm font-medium text-orange-600 transition hover:bg-orange-50"
          >
            Back
          </Link>
        </div>
      </header>

      {/* CONTENT */}

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* MESSAGES */}

        {error && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* FILTER CARD */}

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* MEET */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Sports Meet
              </label>

              <select
                value={selectedMeet}
                onChange={(e) => {
                  setSelectedMeet(
                    e.target.value
                  );
                  setSelectedEvent("");
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  Select Meet
                </option>

                {meets.map((meet) => (
                  <option
                    key={meet._id}
                    value={meet._id}
                  >
                    {meet.name}
                    {meet.year
                      ? ` - ${meet.year}`
                      : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* EVENT */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Event
              </label>

              <select
                value={selectedEvent}
                onChange={(e) =>
                  setSelectedEvent(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="">
                  All Events
                </option>

                {meetEvents.map((event) => (
                  <option
                    key={event._id}
                    value={event._id}
                  >
                    {event.code
                      ? `${event.code} - `
                      : ""}
                    {event.name}
                  </option>
                ))}
              </select>
            </div>

            {/* TYPE */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Certificate Type
              </label>

              <select
                value={certificateType}
                onChange={(e) =>
                  setCertificateType(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              >
                <option value="all">
                  All Certificates
                </option>

                <option value="winner">
                  Winner
                </option>

                <option value="participation">
                  Participation
                </option>
              </select>
            </div>

            {/* SEARCH */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">
                Search
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  placeholder="Name / Reg. No. / Certificate No."
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />

                <button
                  type="button"
                  onClick={handleSearch}
                  className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
                >
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* STATISTICS */}

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Total Certificates
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {certificates.length}
            </p>
          </div>

          <div className="rounded-2xl border border-orange-100 bg-orange-50 p-5">
            <p className="text-xs font-medium text-orange-700">
              Winner Certificates
            </p>

            <p className="mt-2 text-3xl font-bold text-orange-600">
              {winnerCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium text-slate-500">
              Participation Certificates
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-900">
              {participationCount}
            </p>
          </div>
        </div>

        {/* GENERATE */}

        {selectedEvent && (
          <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 sm:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-semibold text-orange-800">
                  Generate Certificates
                </p>

                <p className="mt-1 text-xs leading-5 text-orange-700">
                  Generate winner certificates for
                  1st, 2nd and 3rd place and
                  participation certificates for
                  the remaining participants.
                </p>
              </div>

              <button
                type="button"
                onClick={generateCertificates}
                disabled={generating}
                className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {generating
                  ? "Generating..."
                  : "Generate Certificates"}
              </button>
            </div>
          </div>
        )}

        {/* TABLE */}

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 sm:px-5">
            <div>
              <h2 className="font-semibold text-slate-900">
                Generated Certificates
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {certificates.length} certificate
                {certificates.length !== 1
                  ? "s"
                  : ""}
              </p>
            </div>

            <button
              type="button"
              onClick={loadCertificates}
              disabled={loadingCertificates}
              className="rounded-lg border border-orange-200 px-3 py-2 text-xs font-semibold text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
            >
              {loadingCertificates
                ? "Loading..."
                : "Refresh"}
            </button>
          </div>

          {loadingCertificates ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />
            </div>
          ) : certificates.length === 0 ? (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-xl">
                🏆
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No certificates found
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                Select an event and generate
                certificates after its results have
                been finalized.
              </p>
            </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                    <tr>
                      <th className="px-5 py-3">
                        Sl. No.
                      </th>

                      <th className="px-5 py-3">
                        Certificate No.
                      </th>

                      <th className="px-5 py-3">
                        Student
                      </th>

                      <th className="px-5 py-3">
                        Register No.
                      </th>

                      <th className="px-5 py-3">
                        Event
                      </th>

                      <th className="px-5 py-3">
                        Type
                      </th>

                      <th className="px-5 py-3">
                        Position
                      </th>

                      <th className="px-5 py-3 text-right">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {certificates.map(
                      (
                        certificate,
                        index
                      ) => (
                        <tr
                          key={
                            certificate._id
                          }
                          className="transition hover:bg-orange-50/40"
                        >
                          <td className="px-5 py-4 text-slate-500">
                            {index + 1}
                          </td>

                          <td className="px-5 py-4 font-medium text-slate-700">
                            {
                              certificate.certificateNumber
                            }
                          </td>

                          <td className="px-5 py-4">
                            <div className="font-medium text-slate-900">
                              {
                                certificate.studentName
                              }
                            </div>

                            <div className="text-xs text-slate-500">
                              {
                                certificate.collegeCode
                              }
                            </div>
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {
                              certificate.registerNumber
                            }
                          </td>

                          <td className="px-5 py-4 text-slate-600">
                            {
                              certificate.eventName
                            }
                          </td>

                          <td className="px-5 py-4">
                            {certificate.certificateType ===
                            "winner" ? (
                              <span className="inline-flex rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                                Winner
                              </span>
                            ) : (
                              <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                Participation
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4">
                            {certificate.position ? (
                              <span className="font-semibold text-orange-600">
                                {certificate.position ===
                                1
                                  ? "1st"
                                  : certificate.position ===
                                    2
                                  ? "2nd"
                                  : "3rd"}
                              </span>
                            ) : (
                              <span className="text-slate-400">
                                —
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-right">
                            <div className="flex justify-end gap-2">
                           <button
  type="button"
  onClick={() =>
    downloadCertificate(
      certificate
    )
  }
  className="rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600"
>
  PDF
</button>

                              <button
                                type="button"
                                onClick={() =>
                                  deleteCertificate(
                                    certificate._id
                                  )
                                }
                                className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>

              {/* MOBILE CARDS */}

              <div className="divide-y divide-slate-100 md:hidden">
                {certificates.map(
                  (
                    certificate,
                    index
                  ) => (
                    <div
                      key={certificate._id}
                      className="p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-400">
                            #{index + 1}
                          </p>

                          <h3 className="mt-1 truncate font-semibold text-slate-900">
                            {
                              certificate.studentName
                            }
                          </h3>

                          <p className="text-xs text-slate-500">
                            {
                              certificate.registerNumber
                            }
                          </p>
                        </div>

                        {certificate.certificateType ===
                        "winner" ? (
                          <span className="shrink-0 rounded-full bg-orange-100 px-2.5 py-1 text-xs font-semibold text-orange-700">
                            Winner
                          </span>
                        ) : (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            Participation
                          </span>
                        )}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-slate-400">
                            Certificate No.
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              certificate.certificateNumber
                            }
                          </p>
                        </div>

                        <div>
                          <p className="text-slate-400">
                            Position
                          </p>

                          <p className="mt-1 font-medium text-orange-600">
                            {certificate.position
                              ? certificate.position ===
                                1
                                ? "1st"
                                : certificate.position ===
                                  2
                                ? "2nd"
                                : "3rd"
                              : "—"}
                          </p>
                        </div>

                        <div className="col-span-2">
                          <p className="text-slate-400">
                            Event
                          </p>

                          <p className="mt-1 font-medium text-slate-700">
                            {
                              certificate.eventName
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                       <button
  type="button"
  onClick={() =>
    downloadCertificate(
      certificate
    )
  }
  className="flex-1 rounded-lg bg-orange-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-orange-600"
>
  Download PDF
</button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteCertificate(
                              certificate._id
                            )
                          }
                          className="flex-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}