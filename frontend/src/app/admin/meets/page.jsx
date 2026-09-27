"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  X,
  CalendarDays,
  MapPin,
  Power,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const initialForm = {
  name: "",
  shortName: "",
  year: new Date().getFullYear(),
  startDate: "",
  endDate: "",
  venue: "",
  applicationStartDate: "",
  applicationEndDate: "",
  status: "draft",
  isActive: true,
};

export default function MeetsPage() {
  const { getToken } = useAuth();

  const [meets, setMeets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editingMeet, setEditingMeet] = useState(null);
  const [form, setForm] = useState(initialForm);

  // =========================================================
  // FETCH MEETS
  // =========================================================

  const fetchMeets = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      const response = await axios.get(`${API_URL}/api/sports-meets`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = response.data;

      setMeets(
        data.sportsMeets ||
          data.meets ||
          data.data ||
          []
      );
    } catch (error) {
      console.error("Error fetching sports meets:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to load sports meets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeets();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredMeets = meets.filter((meet) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      meet.name?.toLowerCase().includes(searchText) ||
      meet.shortName?.toLowerCase().includes(searchText) ||
      String(meet.year || "").includes(searchText) ||
      meet.venue?.toLowerCase().includes(searchText);

    const matchesStatus =
      statusFilter === "all" ||
      meet.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // =========================================================
  // FORM
  // =========================================================

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const openAddModal = () => {
    setEditingMeet(null);

    setForm({
      ...initialForm,
      year: new Date().getFullYear(),
    });

    setShowModal(true);
  };

  const openEditModal = (meet) => {
    setEditingMeet(meet);

    setForm({
      name: meet.name || "",
      shortName: meet.shortName || "",
      year: meet.year || new Date().getFullYear(),
      startDate: formatDateForInput(meet.startDate),
      endDate: formatDateForInput(meet.endDate),
      venue: meet.venue || "",
      applicationStartDate: formatDateForInput(
        meet.applicationStartDate
      ),
      applicationEndDate: formatDateForInput(
        meet.applicationEndDate
      ),
      status: meet.status || "draft",
      isActive:
        meet.isActive !== undefined
          ? meet.isActive
          : true,
    });

    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;

    setShowModal(false);
    setEditingMeet(null);
    setForm(initialForm);
  };

  // =========================================================
  // SAVE
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Enter the meet name.");
      return;
    }

    if (!form.year) {
      alert("Enter the year.");
      return;
    }

    if (!form.startDate || !form.endDate) {
      alert("Select the meet start and end dates.");
      return;
    }

    if (new Date(form.endDate) < new Date(form.startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    if (
      !form.applicationStartDate ||
      !form.applicationEndDate
    ) {
      alert("Select the application period.");
      return;
    }

    if (
      new Date(form.applicationEndDate) <
      new Date(form.applicationStartDate)
    ) {
      alert(
        "Application end date cannot be before application start date."
      );
      return;
    }

    if (!form.venue.trim()) {
      alert("Enter the venue.");
      return;
    }

    try {
      setSaving(true);

      const token = await getToken();

      const payload = {
        name: form.name.trim(),
        shortName: form.shortName.trim(),
        year: Number(form.year),
        startDate: form.startDate,
        endDate: form.endDate,
        venue: form.venue.trim(),
        applicationStartDate:
          form.applicationStartDate,
        applicationEndDate:
          form.applicationEndDate,
        status: form.status,
        isActive: form.isActive,
      };

      if (editingMeet) {
        await axios.put(
          `${API_URL}/api/sports-meets/${editingMeet._id}`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        await axios.post(
          `${API_URL}/api/sports-meets`,
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      closeModal();
      await fetchMeets();

      alert(
        editingMeet
          ? "Sports meet updated successfully."
          : "Sports meet created successfully."
      );
    } catch (error) {
      console.error("Error saving sports meet:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to save sports meet."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // DELETE
  // =========================================================

  const handleDelete = async (meet) => {
    const confirmed = window.confirm(
      `Delete "${meet.name}"?\n\nThis should only be done if the meet has no related events or registrations.`
    );

    if (!confirmed) return;

    try {
      setActionLoading(meet._id);

      const token = await getToken();

      await axios.delete(
        `${API_URL}/api/sports-meets/${meet._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchMeets();
    } catch (error) {
      console.error("Error deleting meet:", error);

      alert(
        error?.response?.data?.message ||
          "Failed to delete sports meet."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // STATUS
  // =========================================================

  const handleStatusChange = async (meet) => {
    const statusOptions = [
      "draft",
      "applications_open",
      "applications_closed",
      "ongoing",
      "completed",
    ];

    const currentIndex = statusOptions.indexOf(
      meet.status
    );

    const nextStatus =
      statusOptions[
        currentIndex >= 0
          ? (currentIndex + 1) % statusOptions.length
          : 0
      ];

    const confirmed = window.confirm(
      `Change "${meet.name}" status from "${formatStatus(
        meet.status
      )}" to "${formatStatus(nextStatus)}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(`status-${meet._id}`);

      const token = await getToken();

      await axios.patch(
        `${API_URL}/api/sports-meets/${meet._id}/status`,
        {
          status: nextStatus,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await fetchMeets();
    } catch (error) {
      console.error(
        "Error changing meet status:",
        error
      );

      alert(
        error?.response?.data?.message ||
          "Failed to change meet status."
      );
    } finally {
      setActionLoading("");
    }
  };

  // =========================================================
  // HELPERS
  // =========================================================

  function formatDateForInput(date) {
    if (!date) return "";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return "";

    return d.toISOString().split("T")[0];
  }

  function formatDate(date) {
    if (!date) return "-";

    const d = new Date(date);

    if (Number.isNaN(d.getTime())) return "-";

    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatStatus(status) {
    if (!status) return "-";

    return status
      .split("_")
      .map(
        (word) =>
          word.charAt(0).toUpperCase() +
          word.slice(1)
      )
      .join(" ");
  }

  function getStatusStyle(status) {
    switch (status) {
      case "draft":
        return "bg-slate-100 text-slate-700";

      case "applications_open":
        return "bg-green-100 text-green-700";

      case "applications_closed":
        return "bg-orange-100 text-orange-700";

      case "ongoing":
        return "bg-blue-100 text-blue-700";

      case "completed":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Sports Meets
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create and manage sports meets.
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600"
          >
            <Plus size={18} />
            Add Sports Meet
          </button>
        </div>

        {/* FILTER BAR */}
        <div className="mb-5 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row">
            {/* SEARCH */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                placeholder="Search meet, year or venue..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
              />
            </div>

            {/* STATUS */}
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value)
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="applications_open">
                Applications Open
              </option>
              <option value="applications_closed">
                Applications Closed
              </option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">
                Completed
              </option>
            </select>

            {/* REFRESH */}
            <button
              onClick={fetchMeets}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-orange-400 hover:text-orange-600 disabled:opacity-50"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />
              Refresh
            </button>
          </div>
        </div>

        {/* TABLE */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <div className="flex min-h-[250px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <RefreshCw
                  size={18}
                  className="animate-spin text-orange-500"
                />
                Loading sports meets...
              </div>
            </div>
          ) : filteredMeets.length === 0 ? (
            <div className="flex min-h-[250px] flex-col items-center justify-center px-4 text-center">
              <CalendarDays
                size={42}
                className="mb-3 text-slate-300"
              />

              <h3 className="text-base font-semibold text-slate-700">
                No sports meets found
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Add a sports meet to get started.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[950px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      #
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Meet
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Dates
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Venue
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Applications
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredMeets.map((meet, index) => (
                    <tr
                      key={meet._id}
                      className="border-b border-slate-100 transition hover:bg-orange-50/40"
                    >
                      {/* NUMBER */}
                      <td className="px-4 py-4 text-sm font-medium text-slate-500">
                        {index + 1}
                      </td>

                      {/* MEET */}
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {meet.name}
                          </p>

                          <div className="mt-1 flex items-center gap-2">
                            {meet.shortName && (
                              <span className="text-xs text-slate-500">
                                {meet.shortName}
                              </span>
                            )}

                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-600">
                              {meet.year}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* DATES */}
                      <td className="px-4 py-4">
                        <div className="flex items-start gap-2">
                          <CalendarDays
                            size={16}
                            className="mt-0.5 shrink-0 text-orange-500"
                          />

                          <div className="text-sm text-slate-600">
                            <div>
                              {formatDate(
                                meet.startDate
                              )}
                            </div>

                            <div className="text-xs text-slate-400">
                              to{" "}
                              {formatDate(
                                meet.endDate
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* VENUE */}
                      <td className="px-4 py-4">
                        <div className="flex max-w-[230px] items-start gap-2">
                          <MapPin
                            size={16}
                            className="mt-0.5 shrink-0 text-orange-500"
                          />

                          <span className="text-sm text-slate-600">
                            {meet.venue || "-"}
                          </span>
                        </div>
                      </td>

                      {/* APPLICATION PERIOD */}
                      <td className="px-4 py-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-700">
                            {formatDate(
                              meet.applicationStartDate
                            )}
                          </div>

                          <div className="text-xs text-slate-400">
                            to{" "}
                            {formatDate(
                              meet.applicationEndDate
                            )}
                          </div>
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="px-4 py-4">
                        <button
                          onClick={() =>
                            handleStatusChange(meet)
                          }
                          disabled={
                            actionLoading ===
                            `status-${meet._id}`
                          }
                          title="Change status"
                          className="group"
                        >
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              meet.status
                            )}`}
                          >
                            {formatStatus(meet.status)}

                            <Power
                              size={12}
                              className="opacity-50 group-hover:opacity-100"
                            />
                          </span>
                        </button>

                        {!meet.isActive && (
                          <div className="mt-1 text-xs text-red-500">
                            Inactive
                          </div>
                        )}
                      </td>

                      {/* ACTIONS */}
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() =>
                              openEditModal(meet)
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(meet)
                            }
                            disabled={
                              actionLoading === meet._id
                            }
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-red-500 transition hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
                            title="Delete"
                          >
                            {actionLoading ===
                            meet._id ? (
                              <RefreshCw
                                size={16}
                                className="animate-spin"
                              />
                            ) : (
                              <Trash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RESULT COUNT */}
        {!loading && meets.length > 0 && (
          <div className="mt-3 text-xs text-slate-500">
            Showing {filteredMeets.length} of{" "}
            {meets.length} sports meets
          </div>
        )}
      </div>

      {/* =====================================================
          ADD / EDIT MODAL
          ===================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* MODAL HEADER */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingMeet
                    ? "Edit Sports Meet"
                    : "Add Sports Meet"}
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Enter the meet details below.
                </p>
              </div>

              <button
                onClick={closeModal}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-6 p-5"
            >
              {/* BASIC INFORMATION */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-orange-600">
                  Basic Information
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Meet Name"
                    required
                  >
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Sports Meet 2026"
                      className="input"
                      required
                    />
                  </FormField>

                  <FormField label="Short Name">
                    <input
                      name="shortName"
                      value={form.shortName}
                      onChange={handleChange}
                      placeholder="SM 2026"
                      className="input"
                    />
                  </FormField>

                  <FormField label="Year" required>
                    <input
                      type="number"
                      name="year"
                      value={form.year}
                      onChange={handleChange}
                      min="2000"
                      max="2100"
                      className="input"
                      required
                    />
                  </FormField>

                  <FormField
                    label="Venue"
                    required
                  >
                    <input
                      name="venue"
                      value={form.venue}
                      onChange={handleChange}
                      placeholder="Enter venue"
                      className="input"
                      required
                    />
                  </FormField>
                </div>
              </div>

              {/* MEET DATES */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-orange-600">
                  Meet Dates
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Start Date"
                    required
                  >
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </FormField>

                  <FormField
                    label="End Date"
                    required
                  >
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </FormField>
                </div>
              </div>

              {/* APPLICATION PERIOD */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-orange-600">
                  Application Period
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    label="Application Start Date"
                    required
                  >
                    <input
                      type="date"
                      name="applicationStartDate"
                      value={
                        form.applicationStartDate
                      }
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </FormField>

                  <FormField
                    label="Application End Date"
                    required
                  >
                    <input
                      type="date"
                      name="applicationEndDate"
                      value={
                        form.applicationEndDate
                      }
                      onChange={handleChange}
                      className="input"
                      required
                    />
                  </FormField>
                </div>
              </div>

              {/* STATUS */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-orange-600">
                  Status
                </h3>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField label="Meet Status">
                    <select
                      name="status"
                      value={form.status}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="draft">
                        Draft
                      </option>

                      <option value="applications_open">
                        Applications Open
                      </option>

                      <option value="applications_closed">
                        Applications Closed
                      </option>

                      <option value="ongoing">
                        Ongoing
                      </option>

                      <option value="completed">
                        Completed
                      </option>
                    </select>
                  </FormField>

                  <div className="flex items-end">
                    <label className="flex h-[42px] w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-300 px-3">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={form.isActive}
                        onChange={handleChange}
                        className="h-4 w-4 accent-orange-500"
                      />

                      <span className="text-sm font-medium text-slate-700">
                        Active Meet
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* BUTTONS */}
              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw
                      size={16}
                      className="animate-spin"
                    />
                  )}

                  {editingMeet
                    ? "Update Meet"
                    : "Create Meet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INPUT STYLE */}
      <style jsx>{`
        .input {
          width: 100%;
          height: 42px;
          border: 1px solid rgb(203 213 225);
          border-radius: 0.5rem;
          padding: 0 0.75rem;
          font-size: 0.875rem;
          color: rgb(51 65 85);
          outline: none;
          background: white;
        }

        .input:focus {
          border-color: rgb(249 115 22);
          box-shadow: 0 0 0 3px
            rgb(255 237 213);
        }
      `}</style>
    </div>
  );
}

// =========================================================
// FORM FIELD
// =========================================================

function FormField({
  label,
  required = false,
  children,
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-orange-500">
            *
          </span>
        )}
      </label>

      {children}
    </div>
  );
}