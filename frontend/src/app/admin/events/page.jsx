"use client";

import {
  Search,
  Plus,
  RefreshCw,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  CalendarDays,
  Trophy,
  Users,
  UserCheck,
  UserX,
  ChevronDown,
} from "lucide-react";

import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// =====================================================
// OPTIONS
// =====================================================

const categoryOptions = [
  {
    value: "athletics",
    label: "Athletics",
  },
  {
    value: "road_race",
    label: "Road Race",
  },
  {
    value: "relay",
    label: "Relay",
  },
  {
    value: "table_tennis",
    label: "Table Tennis",
  },
  {
    value: "chess",
    label: "Chess",
  },
  {
    value: "yoga",
    label: "Yoga",
  },
  {
    value: "physically_challenged",
    label: "Physically Challenged",
  },
  {
    value: "other",
    label: "Other",
  },
];

const genderOptions = [
  {
    value: "male",
    label: "Men",
  },
  {
    value: "female",
    label: "Women",
  },
  {
    value: "mixed",
    label: "Mixed",
  },
  {
    value: "open",
    label: "Open",
  },
];

const participationOptions = [
  {
    value: "regular",
    label: "Regular",
  },
  {
    value: "physically_challenged",
    label: "Physically Challenged",
  },
];

const eventTypeOptions = [
  {
    value: "individual",
    label: "Individual",
  },
  {
    value: "team",
    label: "Team",
  },
];

const resultTypeOptions = [
  {
    value: "time",
    label: "Time",
  },
  {
    value: "distance",
    label: "Distance",
  },
  {
    value: "points",
    label: "Points",
  },
  {
    value: "position",
    label: "Position",
  },
  {
    value: "win_loss",
    label: "Win / Loss",
  },
];

// =====================================================
// DEFAULT FORM
// =====================================================

const defaultForm = {
  meet: "",
  code: "",
  name: "",
  category: "athletics",
  gender: "male",
  participationCategory: "regular",
  eventType: "individual",
  maxParticipantsPerInstitution: "",
  teamSize: "",
  resultType: "position",
  unit: "",
  applicationOpen: true,
  isActive: true,
  displayOrder: 0,
};

// =====================================================
// PAGE
// =====================================================

export default function AdminEventsPage() {
  const { getToken } = useAuth();

  // ===================================================
  // DATA
  // ===================================================

  const [events, setEvents] = useState([]);
  const [meets, setMeets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [meetLoading, setMeetLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");
  const [meetFilter, setMeetFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [participationFilter, setParticipationFilter] =
    useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [applicationFilter, setApplicationFilter] =
    useState("");
  const [activeFilter, setActiveFilter] = useState("");

  // ===================================================
  // MODAL
  // ===================================================

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const [form, setForm] = useState(defaultForm);

  // ===================================================
  // FETCH MEETS
  // ===================================================

  const fetchMeets = useCallback(async () => {
    try {
      setMeetLoading(true);

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const response = await axios.get(
        `${API_URL}/api/sports-meets`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        response.data?.sportsMeets ||
        response.data?.meets ||
        response.data?.data ||
        [];

      setMeets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch meets error:", err);

      setMeets([]);

      setError(
        err.response?.data?.message ||
          "Failed to load sports meets."
      );
    } finally {
      setMeetLoading(false);
    }
  }, [getToken]);

  // ===================================================
  // FETCH EVENTS
  // ===================================================

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const params = new URLSearchParams();

      if (meetFilter) {
        params.append("meet", meetFilter);
      }

      if (genderFilter) {
        params.append("gender", genderFilter);
      }

      if (categoryFilter) {
        params.append(
          "category",
          categoryFilter
        );
      }

      if (participationFilter) {
        params.append(
          "participationCategory",
          participationFilter
        );
      }

      if (eventTypeFilter) {
        params.append(
          "eventType",
          eventTypeFilter
        );
      }

      if (applicationFilter !== "") {
        params.append(
          "applicationOpen",
          applicationFilter
        );
      }

      if (activeFilter !== "") {
        params.append(
          "isActive",
          activeFilter
        );
      }

      const queryString = params.toString();

      const response = await axios.get(
        `${API_URL}/api/events${
          queryString ? `?${queryString}` : ""
        }`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data =
        response.data?.events ||
        response.data?.data ||
        [];

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Fetch events error:", err);

      setEvents([]);

      setError(
        err.response?.data?.message ||
          "Failed to load events."
      );
    } finally {
      setLoading(false);
    }
  }, [
    getToken,
    meetFilter,
    genderFilter,
    categoryFilter,
    participationFilter,
    eventTypeFilter,
    applicationFilter,
    activeFilter,
  ]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchMeets();
  }, [fetchMeets]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ===================================================
  // SEARCH
  // ===================================================

  const filteredEvents = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return events;
    }

    return events.filter((event) => {
      const code =
        event.code?.toLowerCase() || "";

      const name =
        event.name?.toLowerCase() || "";

      const meetName =
        event.meet?.name?.toLowerCase() || "";

      return (
        code.includes(value) ||
        name.includes(value) ||
        meetName.includes(value)
      );
    });
  }, [events, search]);

  // ===================================================
  // COUNTS
  // ===================================================

  const totalEvents = events.length;

  const activeEvents = events.filter(
    (event) => event.isActive
  ).length;

  const inactiveEvents = events.filter(
    (event) => !event.isActive
  ).length;

  const openEvents = events.filter(
    (event) => event.applicationOpen
  ).length;

  // ===================================================
  // FORM CHANGE
  // ===================================================

  const handleFormChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  };

  // ===================================================
  // RESET FORM
  // ===================================================

  const resetForm = () => {
    setForm({
      ...defaultForm,
      meet: meets[0]?._id || "",
    });

    setSelectedEvent(null);
    setIsEdit(false);
  };

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAddModal = () => {
    setError("");
    setSuccess("");

    setForm({
      ...defaultForm,
      meet: meets[0]?._id || "",
    });

    setSelectedEvent(null);
    setIsEdit(false);
    setShowModal(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditModal = (event) => {
    setError("");
    setSuccess("");

    setSelectedEvent(event);
    setIsEdit(true);

    setForm({
      meet:
        event.meet?._id ||
        event.meet ||
        "",

      code: event.code || "",

      name: event.name || "",

      category:
        event.category || "athletics",

      gender:
        event.gender || "male",

      participationCategory:
        event.participationCategory ||
        "regular",

      eventType:
        event.eventType ||
        "individual",

      maxParticipantsPerInstitution:
        event.maxParticipantsPerInstitution ??
        "",

      teamSize:
        event.teamSize ?? "",

      resultType:
        event.resultType ||
        "position",

      unit:
        event.unit || "",

      applicationOpen:
        event.applicationOpen ?? true,

      isActive:
        event.isActive ?? true,

      displayOrder:
        event.displayOrder ?? 0,
    });

    setShowModal(true);
  };

  // ===================================================
  // CLOSE MODAL
  // ===================================================

  const closeModal = () => {
    if (actionLoading) return;

    setShowModal(false);
    resetForm();
  };

  // ===================================================
  // CREATE EVENT
  // ===================================================

  const handleCreateEvent = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!form.meet) {
        setError("Please select a sports meet.");
        return;
      }

      if (!form.code.trim()) {
        setError("Event code is required.");
        return;
      }

      if (!form.name.trim()) {
        setError("Event name is required.");
        return;
      }

      if (!form.category) {
        setError("Category is required.");
        return;
      }

      if (!form.gender) {
        setError("Gender is required.");
        return;
      }

      if (!form.participationCategory) {
        setError(
          "Participation category is required."
        );
        return;
      }

      if (
        form.eventType === "team" &&
        (!form.teamSize ||
          Number(form.teamSize) < 2)
      ) {
        setError(
          "Team size must be at least 2."
        );
        return;
      }

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const payload = {
        meet: form.meet,

        code: form.code
          .trim()
          .toUpperCase(),

        name: form.name.trim(),

        category: form.category,

        gender: form.gender,

        participationCategory:
          form.participationCategory,

        eventType:
          form.eventType,

        maxParticipantsPerInstitution:
          form.maxParticipantsPerInstitution ===
          ""
            ? null
            : Number(
                form.maxParticipantsPerInstitution
              ),

        teamSize:
          form.eventType === "team"
            ? Number(form.teamSize)
            : null,

        resultType:
          form.resultType,

        unit:
          form.unit.trim() || null,

        applicationOpen:
          form.applicationOpen,

        isActive:
          form.isActive,

        displayOrder:
          Number(form.displayOrder) || 0,
      };

      await axios.post(
        `${API_URL}/api/events`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowModal(false);

      resetForm();

      setSuccess(
        "Event created successfully."
      );

      await fetchEvents();
    } catch (err) {
      console.error(
        "Create event error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create event."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // UPDATE EVENT
  // ===================================================

  const handleUpdateEvent = async (e) => {
    e.preventDefault();

    if (!selectedEvent) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      if (!form.meet) {
        setError("Please select a sports meet.");
        return;
      }

      if (!form.code.trim()) {
        setError("Event code is required.");
        return;
      }

      if (!form.name.trim()) {
        setError("Event name is required.");
        return;
      }

      if (
        form.eventType === "team" &&
        (!form.teamSize ||
          Number(form.teamSize) < 2)
      ) {
        setError(
          "Team size must be at least 2."
        );
        return;
      }

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const payload = {
        meet: form.meet,

        code: form.code
          .trim()
          .toUpperCase(),

        name: form.name.trim(),

        category: form.category,

        gender: form.gender,

        participationCategory:
          form.participationCategory,

        eventType:
          form.eventType,

        maxParticipantsPerInstitution:
          form.maxParticipantsPerInstitution ===
          ""
            ? null
            : Number(
                form.maxParticipantsPerInstitution
              ),

        teamSize:
          form.eventType === "team"
            ? Number(form.teamSize)
            : null,

        resultType:
          form.resultType,

        unit:
          form.unit.trim() || null,

        applicationOpen:
          form.applicationOpen,

        isActive:
          form.isActive,

        displayOrder:
          Number(form.displayOrder) || 0,
      };

      await axios.put(
        `${API_URL}/api/events/${selectedEvent._id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setShowModal(false);

      resetForm();

      setSuccess(
        "Event updated successfully."
      );

      await fetchEvents();
    } catch (err) {
      console.error(
        "Update event error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update event."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // DELETE EVENT
  // ===================================================

  const handleDeleteEvent = async (event) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${event.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      await axios.delete(
        `${API_URL}/api/events/${event._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        "Event deleted successfully."
      );

      await fetchEvents();
    } catch (err) {
      console.error(
        "Delete event error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete event."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // TOGGLE APPLICATION
  // ===================================================

  const handleToggleApplication = async (
    event
  ) => {
    const action = event.applicationOpen
      ? "close"
      : "open";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} applications for "${event.name}"?`
    );

    if (!confirmed) return;

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      await axios.patch(
        `${API_URL}/api/events/${event._id}/application-status`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        event.applicationOpen
          ? "Applications closed successfully."
          : "Applications opened successfully."
      );

      await fetchEvents();
    } catch (err) {
      console.error(
        "Toggle application error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update application status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setMeetFilter("");
    setGenderFilter("");
    setCategoryFilter("");
    setParticipationFilter("");
    setEventTypeFilter("");
    setApplicationFilter("");
    setActiveFilter("");
  };

  // ===================================================
  // LABEL HELPERS
  // ===================================================

  const getCategoryLabel = (value) => {
    return (
      categoryOptions.find(
        (item) => item.value === value
      )?.label || value
    );
  };

  const getGenderLabel = (value) => {
    return (
      genderOptions.find(
        (item) => item.value === value
      )?.label || value
    );
  };

  const getParticipationLabel = (value) => {
    return (
      participationOptions.find(
        (item) => item.value === value
      )?.label || value
    );
  };

  const getEventTypeLabel = (value) => {
    return (
      eventTypeOptions.find(
        (item) => item.value === value
      )?.label || value
    );
  };

  // ===================================================
  // RENDER
  // ===================================================

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-medium text-orange-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Events
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage sports meet events, categories and applications.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          disabled={meetLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus size={18} />
          Add Event
        </button>

      </div>

      {/* ================================================= */}
      {/* SUCCESS */}
      {/* ================================================= */}

      {success && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check size={18} />
          <span>{success}</span>

          <button
            type="button"
            onClick={() => setSuccess("")}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X size={17} />
          </button>
        </div>
      )}

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() => setError("")}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X size={17} />
          </button>
        </div>
      )}

  

      {/* ================================================= */}
      {/* FILTER PANEL */}
      {/* ================================================= */}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Event Filters
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Filter events by meet and event details.
            </p>
          </div>

          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-medium text-orange-600 hover:text-orange-700"
          >
            Clear Filters
          </button>

        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* SEARCH */}

          <div className="relative lg:col-span-2">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search code, event or meet..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

          </div>

          {/* MEET */}

          <FilterSelect
            value={meetFilter}
            onChange={(e) =>
              setMeetFilter(e.target.value)
            }
            placeholder="All Sports Meets"
            options={meets.map((meet) => ({
              value: meet._id,
              label:
                meet.shortName ||
                meet.name ||
                `Meet ${meet.year || ""}`,
            }))}
          />

          {/* GENDER */}

          <FilterSelect
            value={genderFilter}
            onChange={(e) =>
              setGenderFilter(e.target.value)
            }
            placeholder="All Gender"
            options={genderOptions}
          />

          {/* CATEGORY */}

          <FilterSelect
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value)
            }
            placeholder="All Categories"
            options={categoryOptions}
          />

          {/* PARTICIPATION */}

          <FilterSelect
            value={participationFilter}
            onChange={(e) =>
              setParticipationFilter(
                e.target.value
              )
            }
            placeholder="All Participation"
            options={participationOptions}
          />

          {/* EVENT TYPE */}

          <FilterSelect
            value={eventTypeFilter}
            onChange={(e) =>
              setEventTypeFilter(
                e.target.value
              )
            }
            placeholder="All Event Types"
            options={eventTypeOptions}
          />

          {/* APPLICATION */}

          <FilterSelect
            value={applicationFilter}
            onChange={(e) =>
              setApplicationFilter(
                e.target.value
              )
            }
            placeholder="Application Status"
            options={[
              {
                value: "true",
                label: "Applications Open",
              },
              {
                value: "false",
                label: "Applications Closed",
              },
            ]}
          />

          {/* ACTIVE */}

          <FilterSelect
            value={activeFilter}
            onChange={(e) =>
              setActiveFilter(
                e.target.value
              )
            }
            placeholder="Account Status"
            options={[
              {
                value: "true",
                label: "Active",
              },
              {
                value: "false",
                label: "Inactive",
              },
            ]}
          />

          {/* REFRESH */}

          <button
            type="button"
            onClick={() => {
              fetchMeets();
              fetchEvents();
            }}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh
          </button>

        </div>

      </div>

      {/* ================================================= */}
      {/* EVENT TABLE */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              Event List
            </h2>

            <p className="mt-0.5 text-xs text-slate-400">
              Showing {filteredEvents.length} of{" "}
              {events.length} events
            </p>
          </div>

        </div>

        {loading ? (
          <LoadingState />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            onAdd={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="min-w-[1150px] w-full">

              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70">

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    #
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Event
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Meet
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Category
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Gender
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Participation
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Application
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Actions
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {filteredEvents.map(
                  (event, index) => (
                    <tr
                      key={event._id}
                      className="transition hover:bg-orange-50/30"
                    >

                      {/* SL NO */}

                      <td className="px-4 py-4 text-sm font-medium text-slate-400">
                        {index + 1}
                      </td>

                      {/* EVENT */}

                      <td className="px-4 py-4">

                        <div className="flex items-start gap-3">

                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                            <Trophy size={17} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-900">
                              {event.name}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {event.code}
                            </p>
                          </div>

                        </div>

                      </td>

                      {/* MEET */}

                      <td className="px-4 py-4">

                        <div className="max-w-[190px]">

                          <p className="text-sm font-medium text-slate-700">
                            {event.meet?.shortName ||
                              event.meet?.name ||
                              "—"}
                          </p>

                          {event.meet?.year && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {event.meet.year}
                            </p>
                          )}

                        </div>

                      </td>

                      {/* CATEGORY */}

                      <td className="px-4 py-4">

                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                          {getCategoryLabel(
                            event.category
                          )}
                        </span>

                      </td>

                      {/* GENDER */}

                      <td className="px-4 py-4">

                        <span className="inline-flex rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                          {getGenderLabel(
                            event.gender
                          )}
                        </span>

                      </td>

                      {/* TYPE */}

                      <td className="px-4 py-4">

                        <div>
                          <span
                            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                              event.eventType ===
                              "team"
                                ? "bg-purple-50 text-purple-700"
                                : "bg-orange-50 text-orange-700"
                            }`}
                          >
                            {getEventTypeLabel(
                              event.eventType
                            )}
                          </span>

                          {event.eventType ===
                            "team" &&
                            event.teamSize && (
                              <p className="mt-1 text-xs text-slate-400">
                                {event.teamSize} members
                              </p>
                            )}
                        </div>

                      </td>

                      {/* PARTICIPATION */}

                      <td className="px-4 py-4">

                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-medium ${
                            event.participationCategory ===
                            "physically_challenged"
                              ? "bg-amber-50 text-amber-700"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {getParticipationLabel(
                            event.participationCategory
                          )}
                        </span>

                      </td>

                      {/* APPLICATION */}

                      <td className="px-4 py-4">

                        <button
                          type="button"
                          onClick={() =>
                            handleToggleApplication(
                              event
                            )
                          }
                          disabled={
                            actionLoading
                          }
                          className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                            event.applicationOpen
                              ? "bg-green-50 text-green-700 hover:bg-green-100"
                              : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {event.applicationOpen ? (
                            <>
                              <Check
                                size={13}
                              />
                              Open
                            </>
                          ) : (
                            <>
                              <X size={13} />
                              Closed
                            </>
                          )}
                        </button>

                      </td>

                      {/* STATUS */}

                      <td className="px-4 py-4">

                        {event.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                            Inactive
                          </span>
                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-4 py-4">

                        <div className="flex items-center justify-end gap-2">

                          <button
                            type="button"
                            onClick={() =>
                              openEditModal(
                                event
                              )
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                            title="Edit Event"
                          >
                            <Edit3 size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteEvent(
                                event
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            title="Delete Event"
                          >
                            <Trash2 size={16} />
                          </button>

                        </div>

                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>
        )}

      </div>

      {/* ================================================= */}
      {/* MODAL */}
      {/* ================================================= */}

      {showModal && (
        <EventModal
          title={
            isEdit
              ? "Edit Event"
              : "Add Event"
          }
          description={
            isEdit
              ? "Update event information and settings."
              : "Create a new event for a sports meet."
          }
          form={form}
          handleFormChange={
            handleFormChange
          }
          onSubmit={
            isEdit
              ? handleUpdateEvent
              : handleCreateEvent
          }
          onClose={closeModal}
          loading={actionLoading}
          isEdit={isEdit}
          meets={meets}
        />
      )}

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div>
          <p className="text-xs font-medium text-slate-400">
            {title}
          </p>

          <p className="mt-1 text-2xl font-bold text-slate-900">
            {value}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={19} />
        </div>

      </div>

    </div>
  );
}

// =====================================================
// FILTER SELECT
// =====================================================

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}) {
  return (
    <div className="relative">

      <select
        value={value}
        onChange={onChange}
        className="h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 pr-9 text-sm text-slate-600 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
      >

        <option value="">
          {placeholder}
        </option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}

      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />

    </div>
  );
}

// =====================================================
// EVENT MODAL
// =====================================================

function EventModal({
  title,
  description,
  form,
  handleFormChange,
  onSubmit,
  onClose,
  loading,
  isEdit,
  meets,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">

      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">

          <div>

            <div className="flex items-center gap-2">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <Trophy size={18} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {title}
                </h2>

                <p className="mt-0.5 text-sm text-slate-500">
                  {description}
                </p>
              </div>

            </div>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
          >
            <X size={19} />
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={onSubmit}
          className="max-h-[calc(92vh-90px)] overflow-y-auto px-6 py-5"
        >

          {/* BASIC DETAILS */}

          <div className="mb-6">

            <SectionTitle title="Basic Details" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* MEET */}

              <FormField
                label="Sports Meet"
                required
              >
                <select
                  name="meet"
                  value={form.meet}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="input-style"
                >

                  <option value="">
                    Select sports meet
                  </option>

                  {meets.map((meet) => (
                    <option
                      key={meet._id}
                      value={meet._id}
                    >
                      {meet.shortName ||
                        meet.name ||
                        `Meet ${meet.year || ""}`}
                    </option>
                  ))}

                </select>
              </FormField>

              {/* CODE */}

              <FormField
                label="Event Code"
                required
              >
                <input
                  type="text"
                  name="code"
                  value={form.code}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  placeholder="Example: 100M"
                  className="input-style uppercase"
                />
              </FormField>

              {/* NAME */}

              <div className="sm:col-span-2">

                <FormField
                  label="Event Name"
                  required
                >
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={
                      handleFormChange
                    }
                    disabled={loading}
                    placeholder="Example: 100 Metres"
                    className="input-style"
                  />
                </FormField>

              </div>

              {/* CATEGORY */}

              <FormField
                label="Category"
                required
              >
                <select
                  name="category"
                  value={form.category}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="input-style"
                >

                  {categoryOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>
              </FormField>

              {/* GENDER */}

              <FormField
                label="Gender"
                required
              >
                <select
                  name="gender"
                  value={form.gender}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="input-style"
                >

                  {genderOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>
              </FormField>

            </div>

          </div>

          {/* PARTICIPATION */}

          <div className="mb-6">

            <SectionTitle title="Participation & Event Type" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* PARTICIPATION */}

              <FormField
                label="Participation Category"
                required
              >
                <select
                  name="participationCategory"
                  value={
                    form.participationCategory
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="input-style"
                >

                  {participationOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>
              </FormField>

              {/* EVENT TYPE */}

              <FormField
                label="Event Type"
                required
              >
                <select
                  name="eventType"
                  value={form.eventType}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="input-style"
                >

                  {eventTypeOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>
              </FormField>

              {/* TEAM SIZE */}

              {form.eventType ===
                "team" && (
                <FormField
                  label="Team Size"
                  required
                >
                  <input
                    type="number"
                    name="teamSize"
                    min="2"
                    value={
                      form.teamSize
                    }
                    onChange={
                      handleFormChange
                    }
                    disabled={loading}
                    placeholder="Example: 4"
                    className="input-style"
                  />
                </FormField>
              )}

              {/* MAX PARTICIPANTS */}

              <FormField
                label="Max Participants / Institution"
              >
                <input
                  type="number"
                  name="maxParticipantsPerInstitution"
                  min="1"
                  value={
                    form.maxParticipantsPerInstitution
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  placeholder="Leave blank for no limit"
                  className="input-style"
                />
              </FormField>

            </div>

          </div>

          {/* RESULT */}

          <div className="mb-6">

            <SectionTitle title="Result Settings" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

              {/* RESULT TYPE */}

              <FormField
                label="Result Type"
              >
                <select
                  name="resultType"
                  value={form.resultType}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="input-style"
                >

                  {resultTypeOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </option>
                    )
                  )}

                </select>
              </FormField>

              {/* UNIT */}

              <FormField
                label="Unit"
              >
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  placeholder="Example: seconds, metres, points"
                  className="input-style"
                />
              </FormField>

              {/* DISPLAY ORDER */}

              <FormField
                label="Display Order"
              >
                <input
                  type="number"
                  name="displayOrder"
                  value={form.displayOrder}
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  min="0"
                  className="input-style"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Lower numbers appear first.
                </p>
              </FormField>

            </div>

          </div>

          {/* STATUS */}

          <div className="mb-6">

            <SectionTitle title="Event Status" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

              {/* APPLICATION */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50/50">

                <input
                  type="checkbox"
                  name="applicationOpen"
                  checked={
                    form.applicationOpen
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="h-4 w-4 accent-orange-500"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Applications Open
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Allow participants to apply for this event.
                  </p>

                </div>

              </label>

              {/* ACTIVE */}

              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50/50">

                <input
                  type="checkbox"
                  name="isActive"
                  checked={
                    form.isActive
                  }
                  onChange={
                    handleFormChange
                  }
                  disabled={loading}
                  className="h-4 w-4 accent-orange-500"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    Active Event
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Keep this event available in the system.
                  </p>

                </div>

              </label>

            </div>

          </div>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading && (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              )}

              {isEdit
                ? "Save Changes"
                : "Create Event"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

// =====================================================
// FORM FIELD
// =====================================================

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

// =====================================================
// SECTION TITLE
// =====================================================

function SectionTitle({ title }) {
  return (
    <div className="mb-3">

      <h3 className="text-sm font-semibold text-slate-900">
        {title}
      </h3>

      <div className="mt-2 h-px bg-slate-100" />

    </div>
  );
}

// =====================================================
// LOADING STATE
// =====================================================

function LoadingState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center">

      <div className="h-9 w-9 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

      <p className="mt-4 text-sm text-slate-500">
        Loading events...
      </p>

    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState({ onAdd }) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <Trophy size={25} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No events found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        No events match the current filters.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
      >
        <Plus size={16} />
        Add Event
      </button>

    </div>
  );
}