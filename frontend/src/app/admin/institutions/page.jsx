"use client";

import {
  Search,
  Plus,
  RefreshCw,
  Edit3,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  Building2,
  MapPin,
  Phone,
  Mail,
  Trash2,
} from "lucide-react";

import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// =====================================================
// PAGE
// =====================================================

export default function AdminInstitutionsPage() {
  const { getToken } = useAuth();

  // ===================================================
  // DATA
  // ===================================================

  const [institutions, setInstitutions] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] = useState("");

  const [district, setDistrict] = useState("");

  const [isActive, setIsActive] = useState("");

  // ===================================================
  // MODALS
  // ===================================================

  const [showAddModal, setShowAddModal] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedInstitution, setSelectedInstitution] =
    useState(null);

  // ===================================================
  // ACTION LOADING
  // ===================================================

  const [actionLoading, setActionLoading] = useState(false);

  // ===================================================
  // FORM
  // ===================================================

  const emptyForm = {
    code: "",
    name: "",
    shortName: "",
    district: "",
    address: "",
    contactPerson: "",
    contactPhone: "",
    contactEmail: "",
    isActive: true,
  };

  const [form, setForm] = useState(emptyForm);

  // ===================================================
  // FETCH INSTITUTIONS
  // ===================================================

  const fetchInstitutions = useCallback(async () => {
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

      if (search.trim()) {
        params.append("search", search.trim());
      }

      if (district) {
        params.append("district", district);
      }

      if (isActive !== "") {
        params.append("isActive", isActive);
      }

      const response = await axios.get(
        `${API_URL}/api/institutions?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const sortedInstitutions = (response.data.institutions || []).sort(
  (a, b) => Number(a.code) - Number(b.code)
);

setInstitutions(sortedInstitutions);
    } catch (err) {
      console.error(
        "Failed to fetch institutions:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load institutions."
      );

      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, search, district, isActive]);

  // ===================================================
  // INITIAL LOAD
  // ===================================================

  useEffect(() => {
    fetchInstitutions();
  }, [fetchInstitutions]);

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
      code: "",
      name: "",
      shortName: "",
      district: "",
      address: "",
      contactPerson: "",
      contactPhone: "",
      contactEmail: "",
      isActive: true,
    });
  };

  // ===================================================
  // OPEN ADD
  // ===================================================

  const openAddModal = () => {
    resetForm();

    setSelectedInstitution(null);

    setError("");
    setSuccess("");

    setShowAddModal(true);
  };

  // ===================================================
  // OPEN EDIT
  // ===================================================

  const openEditModal = (institution) => {
    setSelectedInstitution(institution);

    setForm({
      code: institution.code || "",
      name: institution.name || "",
      shortName: institution.shortName || "",
      district: institution.district || "",
      address: institution.address || "",
      contactPerson:
        institution.contactPerson || "",
      contactPhone:
        institution.contactPhone || "",
      contactEmail:
        institution.contactEmail || "",
      isActive:
        institution.isActive ?? true,
    });

    setError("");
    setSuccess("");

    setShowEditModal(true);
  };

  // ===================================================
  // CLOSE ADD
  // ===================================================

  const closeAddModal = () => {
    if (actionLoading) return;

    setShowAddModal(false);

    resetForm();
  };

  // ===================================================
  // CLOSE EDIT
  // ===================================================

  const closeEditModal = () => {
    if (actionLoading) return;

    setShowEditModal(false);

    setSelectedInstitution(null);

    resetForm();
  };

  // ===================================================
  // VALIDATE FORM
  // ===================================================

  const validateForm = () => {
    if (!form.code.trim()) {
      setError("Institution code is required.");
      return false;
    }

    if (!form.name.trim()) {
      setError("Institution name is required.");
      return false;
    }

    if (
      form.contactEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.contactEmail.trim()
      )
    ) {
      setError(
        "Please enter a valid contact email."
      );
      return false;
    }

    return true;
  };

  // ===================================================
  // CREATE INSTITUTION
  // ===================================================

  const handleCreateInstitution = async (e) => {
    e.preventDefault();

    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      if (!validateForm()) {
        return;
      }

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      await axios.post(
        `${API_URL}/api/institutions`,
        {
          code: form.code.trim().toUpperCase(),

          name: form.name.trim(),

          shortName:
            form.shortName.trim(),

          district:
            form.district.trim(),

          address:
            form.address.trim(),

          contactPerson:
            form.contactPerson.trim(),

          contactPhone:
            form.contactPhone.trim(),

          contactEmail:
            form.contactEmail
              .trim()
              .toLowerCase(),
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setShowAddModal(false);

      resetForm();

      setSuccess(
        "Institution created successfully."
      );

      await fetchInstitutions();
    } catch (err) {
      console.error(
        "Create institution error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to create institution."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // UPDATE INSTITUTION
  // ===================================================

  const handleUpdateInstitution = async (e) => {
    e.preventDefault();

    if (!selectedInstitution) {
      return;
    }

    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      if (!validateForm()) {
        return;
      }

      const token = await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      await axios.put(
        `${API_URL}/api/institutions/${selectedInstitution._id}`,
        {
          code:
            form.code
              .trim()
              .toUpperCase(),

          name:
            form.name.trim(),

          shortName:
            form.shortName.trim(),

          district:
            form.district.trim(),

          address:
            form.address.trim(),

          contactPerson:
            form.contactPerson.trim(),

          contactPhone:
            form.contactPhone.trim(),

          contactEmail:
            form.contactEmail
              .trim()
              .toLowerCase(),
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setShowEditModal(false);

      setSelectedInstitution(null);

      resetForm();

      setSuccess(
        "Institution updated successfully."
      );

      await fetchInstitutions();
    } catch (err) {
      console.error(
        "Update institution error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update institution."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // TOGGLE STATUS
  // ===================================================

  const handleToggleStatus = async (
    institution
  ) => {
    const action = institution.isActive
      ? "deactivate"
      : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${institution.name}?`
    );

    if (!confirmed) {
      return;
    }

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
        `${API_URL}/api/institutions/${institution._id}/status`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        institution.isActive
          ? "Institution deactivated successfully."
          : "Institution activated successfully."
      );

      await fetchInstitutions();
    } catch (err) {
      console.error(
        "Toggle institution status error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to update institution status."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // DELETE
  // ===================================================

  const handleDelete = async (
    institution
  ) => {
    const confirmed = window.confirm(
      `Delete "${institution.name}"?\n\nThis action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

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
        `${API_URL}/api/institutions/${institution._id}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        "Institution deleted successfully."
      );

      await fetchInstitutions();
    } catch (err) {
      console.error(
        "Delete institution error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to delete institution."
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
    setDistrict("");
    setIsActive("");
  };

  // ===================================================
  // DISTRICTS
  // ===================================================

  const districts = useMemo(() => {
    const values = institutions
      .map((item) => item.district)
      .filter(Boolean);

    return [...new Set(values)].sort(
      (a, b) => a.localeCompare(b)
    );
  }, [institutions]);

  // ===================================================
  // SUMMARY
  // ===================================================

  const totalInstitutions =
    institutions.length;

  const activeInstitutions =
    institutions.filter(
      (item) => item.isActive
    ).length;

  const inactiveInstitutions =
    institutions.filter(
      (item) => !item.isActive
    ).length;

  // ===================================================
  // RETURN
  // ===================================================

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-medium text-orange-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Institutions
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage participating institutions
            and their contact information.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
        >
          <Plus size={18} />
          Add Institution
        </button>

      </div>

      {/* ================================================= */}
      {/* SUCCESS */}
      {/* ================================================= */}

      {success && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">

          <Check size={18} />

          <span>{success}</span>

          <button
            type="button"
            onClick={() =>
              setSuccess("")
            }
            className="ml-auto rounded-lg p-1 hover:bg-green-100"
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* ================================================= */}
      {/* ERROR */}
      {/* ================================================= */}

      {error && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">

          <AlertCircle size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
            className="ml-auto rounded-lg p-1 hover:bg-red-100"
          >
            <X size={16} />
          </button>

        </div>
      )}

   
      {/* ================================================= */}
      {/* FILTERS */}
      {/* ================================================= */}

      <div className="mt-6 rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">

          {/* SEARCH */}

          <div className="relative flex-1">

            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Search institution, code or short name..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

          </div>

          {/* DISTRICT */}

          <select
            value={district}
            onChange={(e) =>
              setDistrict(e.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >

            <option value="">
              All Districts
            </option>

            {districts.map((item) => (
              <option
                key={item}
                value={item}
              >
                {item}
              </option>
            ))}

          </select>

          {/* STATUS */}

          <select
            value={isActive}
            onChange={(e) =>
              setIsActive(e.target.value)
            }
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >

            <option value="">
              All Status
            </option>

            <option value="true">
              Active
            </option>

            <option value="false">
              Inactive
            </option>

          </select>

          {/* REFRESH */}

          <button
            type="button"
            onClick={fetchInstitutions}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 text-sm font-medium text-orange-600 transition hover:bg-orange-50 disabled:opacity-50"
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>

          {/* CLEAR */}

          {(search ||
            district ||
            isActive) && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-lg px-3 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              Clear
            </button>
          )}

        </div>

      </div>

      {/* ================================================= */}
      {/* TABLE SUMMARY */}
      {/* ================================================= */}

      <div className="mt-5 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <Building2 size={16} />
          </div>

          <p className="text-sm text-slate-500">

            Showing{" "}

            <span className="font-semibold text-slate-800">
              {institutions.length}
            </span>{" "}

            institutions

          </p>

        </div>

      </div>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="mt-3 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">

        {loading ? (
          <LoadingState />
        ) : institutions.length === 0 ? (
          <EmptyState
            onAdd={openAddModal}
          />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[1000px]">

              <thead>

                <tr className="border-b border-orange-100 bg-orange-50/50">

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    #
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Code
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Institution
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    District
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-slate-100">

                {institutions.map(
                  (institution, index) => (
                    <tr
                      key={institution._id}
                      className="transition hover:bg-orange-50/30"
                    >

                      {/* SL NO */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {index + 1}
                      </td>

                      {/* CODE */}

                      <td className="px-5 py-4">

                        <span className="inline-flex rounded-lg bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-600">
                          {institution.code}
                        </span>

                      </td>

                      {/* INSTITUTION */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                            <Building2
                              size={18}
                            />
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {institution.name}
                            </p>

                            {institution.shortName && (
                              <p className="mt-0.5 text-xs text-slate-400">
                                {
                                  institution.shortName
                                }
                              </p>
                            )}

                          </div>

                        </div>

                      </td>

                      {/* DISTRICT */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-1.5 text-sm text-slate-600">

                          <MapPin
                            size={15}
                            className="text-orange-400"
                          />

                          {institution.district ||
                            "—"}

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4">

                        <div className="space-y-1">

                          {institution.contactPerson && (
                            <p className="text-sm font-medium text-slate-700">
                              {
                                institution.contactPerson
                              }
                            </p>
                          )}

                          {institution.contactPhone && (
                            <p className="flex items-center gap-1.5 text-xs text-slate-400">

                              <Phone
                                size={13}
                              />

                              {
                                institution.contactPhone
                              }

                            </p>
                          )}

                          {!institution.contactPerson &&
                            !institution.contactPhone && (
                              <span className="text-sm text-slate-400">
                                —
                              </span>
                            )}

                        </div>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        {institution.isActive ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">

                            <span className="h-1.5 w-1.5 rounded-full bg-green-500" />

                            Active

                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600">

                            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />

                            Inactive

                          </span>
                        )}

                      </td>

                      {/* ACTIONS */}

                      <td className="px-5 py-4">

                        <div className="flex justify-end gap-1">

                          {/* EDIT */}

                          <button
                            type="button"
                            title="Edit institution"
                            onClick={() =>
                              openEditModal(
                                institution
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
                          >
                            <Edit3
                              size={17}
                            />
                          </button>

                          {/* STATUS */}

                          {institution.isActive ? (
                            <button
                              type="button"
                              title="Deactivate institution"
                              onClick={() =>
                                handleToggleStatus(
                                  institution
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                            >
                              <UserX
                                size={17}
                              />
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Activate institution"
                              onClick={() =>
                                handleToggleStatus(
                                  institution
                                )
                              }
                              disabled={
                                actionLoading
                              }
                              className="rounded-lg p-2 text-slate-400 transition hover:bg-green-50 hover:text-green-600 disabled:opacity-50"
                            >
                              <UserCheck
                                size={17}
                              />
                            </button>
                          )}

                          {/* DELETE */}

                          <button
                            type="button"
                            title="Delete institution"
                            onClick={() =>
                              handleDelete(
                                institution
                              )
                            }
                            disabled={
                              actionLoading
                            }
                            className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                          >
                            <Trash2
                              size={17}
                            />
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
      {/* ADD MODAL */}
      {/* ================================================= */}

      {showAddModal && (
        <InstitutionModal
          title="Add Institution"
          description="Add a participating institution to the sports meet system."
          form={form}
          handleFormChange={
            handleFormChange
          }
          onSubmit={
            handleCreateInstitution
          }
          onClose={closeAddModal}
          loading={actionLoading}
          isEdit={false}
        />
      )}

      {/* ================================================= */}
      {/* EDIT MODAL */}
      {/* ================================================= */}

      {showEditModal &&
        selectedInstitution && (
          <InstitutionModal
            title="Edit Institution"
            description="Update institution information and contact details."
            form={form}
            handleFormChange={
              handleFormChange
            }
            onSubmit={
              handleUpdateInstitution
            }
            onClose={closeEditModal}
            loading={actionLoading}
            isEdit={true}
          />
        )}

    </div>
  );
}

// =====================================================
// SUMMARY CARD
// =====================================================

function SummaryCard({
  icon,
  label,
  value,
  valueClass = "text-slate-900",
}) {
  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <p
          className={`text-2xl font-bold ${valueClass}`}
        >
          {value}
        </p>

      </div>

      <p className="mt-3 text-sm text-slate-500">
        {label}
      </p>

    </div>
  );
}

// =====================================================
// INSTITUTION MODAL
// =====================================================

function InstitutionModal({
  title,
  description,
  form,
  handleFormChange,
  onSubmit,
  onClose,
  loading,
  isEdit,
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-start justify-between border-b border-orange-100 px-6 py-5">

          <div>

            <h2 className="text-lg font-bold text-slate-900">
              {title}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {description}
            </p>

          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-2 text-slate-400 hover:bg-orange-50 hover:text-orange-600 disabled:opacity-50"
          >
            <X size={19} />
          </button>

        </div>

        {/* FORM */}

        <form
          onSubmit={onSubmit}
          className="space-y-5 px-6 py-6"
        >

          {/* CODE + SHORT NAME */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <FormField
              label="Institution Code"
              name="code"
              value={form.code}
              onChange={handleFormChange}
              placeholder="Example: KPTM"
              required
              disabled={loading}
            />

            <FormField
              label="Short Name"
              name="shortName"
              value={form.shortName}
              onChange={handleFormChange}
              placeholder="Example: KPT Mangalore"
              disabled={loading}
            />

          </div>

          {/* NAME */}

          <FormField
            label="Institution Name"
            name="name"
            value={form.name}
            onChange={handleFormChange}
            placeholder="Enter full institution name"
            required
            disabled={loading}
          />

          {/* DISTRICT */}

          <FormField
            label="District"
            name="district"
            value={form.district}
            onChange={handleFormChange}
            placeholder="Example: Mangaluru"
            disabled={loading}
          />

          {/* ADDRESS */}

          <div>

            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Address
            </label>

            <textarea
              name="address"
              value={form.address}
              onChange={handleFormChange}
              disabled={loading}
              rows={3}
              placeholder="Enter institution address"
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
            />

          </div>

          {/* CONTACT PERSON */}

          <FormField
            label="Contact Person"
            name="contactPerson"
            value={form.contactPerson}
            onChange={handleFormChange}
            placeholder="Principal / Sports Coordinator"
            disabled={loading}
          />

          {/* PHONE + EMAIL */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

            <div>

              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Contact Phone
              </label>

              <div className="relative">

                <Phone
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="tel"
                  name="contactPhone"
                  value={form.contactPhone}
                  onChange={handleFormChange}
                  disabled={loading}
                  placeholder="10 digit phone number"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                />

              </div>

            </div>

            <div>

              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Contact Email
              </label>

              <div className="relative">

                <Mail
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  name="contactEmail"
                  value={form.contactEmail}
                  onChange={handleFormChange}
                  disabled={loading}
                  placeholder="institution@example.com"
                  className="h-11 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
                />

              </div>

            </div>

          </div>

          {/* ACTIVE */}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-orange-200 hover:bg-orange-50/50">

            <input
              type="checkbox"
              name="isActive"
              checked={form.isActive}
              onChange={handleFormChange}
              disabled={loading}
              className="h-4 w-4 accent-orange-500"
            />

            <div>

              <p className="text-sm font-medium text-slate-700">
                Active institution
              </p>

              <p className="text-xs text-slate-400">
                Allow this institution to participate in the system.
              </p>

            </div>

          </label>

          {/* BUTTONS */}

          <div className="flex justify-end gap-3 border-t border-orange-100 pt-5">

            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading && (
                <RefreshCw
                  size={16}
                  className="animate-spin"
                />
              )}

              {isEdit
                ? "Save Changes"
                : "Create Institution"}

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
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <div>

      <label className="mb-1.5 block text-sm font-medium text-slate-700">

        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
      />

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
        Loading institutions...
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
        <Building2 size={25} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No institutions found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Add an institution or change the search and filters.
      </p>

      <button
        type="button"
        onClick={onAdd}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
      >
        <Plus size={17} />
        Add Institution
      </button>

    </div>
  );
}