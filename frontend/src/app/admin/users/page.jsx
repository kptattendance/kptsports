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
  Users,
  Trash2,
} from "lucide-react";

import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL;

// =====================================================
// ROLE OPTIONS
// =====================================================

const userRoleOptions = [
  {
    value: "admin",
    label: "Admin",
  },
  {
    value: "sports_officer",
    label: "Sports Officer",
  },
  {
    value: "college_coordinator",
    label: "College Coordinator",
  },
];

// =====================================================
// PAGE
// =====================================================

export default function AdminUsersPage() {
  const { getToken } = useAuth();

  // ===================================================
  // DATA
  // ===================================================

  const [users, setUsers] = useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  // ===================================================
  // FILTERS
  // ===================================================

  const [search, setSearch] =
    useState("");

  const [role, setRole] =
    useState("");

  const [isActive, setIsActive] =
    useState("");

  const [page, setPage] =
    useState(1);

  const [pagination, setPagination] =
    useState({
      page: 1,
      limit: 20,
      totalUsers: 0,
      totalPages: 0,
    });

  // ===================================================
  // MODALS
  // ===================================================

  const [showAddModal, setShowAddModal] =
    useState(false);

  const [showEditModal, setShowEditModal] =
    useState(false);

  const [selectedUser, setSelectedUser] =
    useState(null);

  // ===================================================
  // ACTION LOADING
  // ===================================================

  const [actionLoading, setActionLoading] =
    useState(false);

const [selectedUserIds, setSelectedUserIds] =
  useState([]);

  // ===================================================
  // FORM
  // ===================================================

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "sports_officer",
    isActive: true,
  });

  // ===================================================
  // FETCH USERS
  // ===================================================

  const fetchUsers = useCallback(
    async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          await getToken();

        if (!token) {
          throw new Error(
            "Authentication token not available."
          );
        }

        const params =
          new URLSearchParams();

        if (search.trim()) {
          params.append(
            "search",
            search.trim()
          );
        }

        if (role) {
          params.append(
            "role",
            role
          );
        }

        if (isActive !== "") {
          params.append(
            "isActive",
            isActive
          );
        }

        params.append(
          "page",
          page
        );

        params.append(
          "limit",
          20
        );

        const response =
          await axios.get(
            `${API_URL}/api/users?${params.toString()}`,
            {
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        setUsers(
          response.data?.data ||
            []
        );

        setPagination(
          response.data
            ?.pagination || {
            page,
            limit: 20,
            totalUsers: 0,
            totalPages: 0,
          }
        );
      } catch (err) {
        console.error(
          "Failed to fetch users:",
          err
        );

        setError(
          err.response?.data
            ?.message ||
            err.message ||
            "Failed to load users."
        );

        setUsers([]);
      } finally {
        setLoading(false);
      }
    },
    [
      getToken,
      search,
      role,
      isActive,
      page,
    ]
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ===================================================
  // RESET PAGE WHEN FILTER CHANGES
  // ===================================================

  useEffect(() => {
    setPage(1);
  }, [role, isActive]);

  // ===================================================
  // CLEAR FILTERS
  // ===================================================

  const clearFilters = () => {
    setSearch("");
    setRole("");
    setIsActive("");
    setPage(1);
  };

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
      name: "",
      email: "",
      phone: "",
      role: "sports_officer",
      isActive: true,
    });

  };

  // ===================================================
  // OPEN ADD MODAL
  // ===================================================

  const openAddModal = () => {
    resetForm();

    setError("");
    setSuccess("");

    setShowAddModal(true);
  };

  // ===================================================
  // OPEN EDIT MODAL
  // ===================================================

  const openEditModal = (user) => {
    setSelectedUser(user);

    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role:
        user.role === "student"
          ? "sports_officer"
          : user.role ||
            "sports_officer",
      isActive:
        user.isActive ?? true,
    });


    setError("");
    setSuccess("");

    setShowEditModal(true);
  };

  // ===================================================
  // CLOSE MODALS
  // ===================================================

  const closeAddModal = () => {
    if (actionLoading) return;

    setShowAddModal(false);
    resetForm();
  };

  const closeEditModal = () => {
    if (actionLoading) return;

    setShowEditModal(false);
    setSelectedUser(null);
    resetForm();
  };

  // ===================================================
  // CREATE USER
  // ===================================================

  const handleCreateUser = async (
    e
  ) => {
    e.preventDefault();

    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      // -----------------------------------------------
      // VALIDATION
      // -----------------------------------------------

      if (!form.name.trim()) {
        setError(
          "Name is required."
        );
        return;
      }

      if (!form.email.trim()) {
        setError(
          "Email is required."
        );
        return;
      }

      

      if (
        !userRoleOptions.some(
          (item) =>
            item.value ===
            form.role
        )
      ) {
        setError(
          "Please select a valid user role."
        );
        return;
      }

      // -----------------------------------------------
      // TOKEN
      // -----------------------------------------------

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      // -----------------------------------------------
      // CREATE USER
      // -----------------------------------------------

      await axios.post(
  `${API_URL}/api/users`,
  {
    name: form.name.trim(),

    email: form.email
      .trim()
      .toLowerCase(),

    phone: form.phone.trim(),

    role: form.role,

    isActive: form.isActive,
  },
  {
    headers: {
      Authorization:
        `Bearer ${token}`,
    },
  }
);
      // -----------------------------------------------
      // SUCCESS
      // -----------------------------------------------

      setShowAddModal(false);

      resetForm();

      setSuccess(
        "User created successfully in Clerk and MongoDB."
      );

      setPage(1);

      await fetchUsers();
    } catch (err) {
      console.error(
        "Create user error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          "Failed to create user."
      );
    } finally {
      setActionLoading(false);
    }
  };


  // ===================================================
// SELECTION
// ===================================================

const toggleUserSelection = (userId) => {
  setSelectedUserIds((prev) => {
    if (prev.includes(userId)) {
      return prev.filter(
        (id) => id !== userId
      );
    }

    return [...prev, userId];
  });
};

const toggleSelectAll = () => {
  const currentPageIds = users.map(
    (user) => user._id
  );

  const allSelected =
    currentPageIds.length > 0 &&
    currentPageIds.every((id) =>
      selectedUserIds.includes(id)
    );

  if (allSelected) {
    setSelectedUserIds((prev) =>
      prev.filter(
        (id) => !currentPageIds.includes(id)
      )
    );
  } else {
    setSelectedUserIds((prev) => [
      ...new Set([
        ...prev,
        ...currentPageIds,
      ]),
    ]);
  }
};

const clearSelection = () => {
  setSelectedUserIds([]);
};

  // ===================================================
  // UPDATE USER
  // ===================================================

  const handleUpdateUser = async (
    e
  ) => {
    e.preventDefault();

    if (!selectedUser) {
      return;
    }

    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      if (!form.name.trim()) {
        setError(
          "Name is required."
        );
        return;
      }

      if (!form.email.trim()) {
        setError(
          "Email is required."
        );
        return;
      }

   

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      const payload = {
        name:
          form.name.trim(),

        email:
          form.email
            .trim()
            .toLowerCase(),

        phone:
          form.phone.trim(),

        role:
          form.role,

        isActive:
          form.isActive,
      };

      await axios.put(
        `${API_URL}/api/users/${selectedUser._id}`,
        payload,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setShowEditModal(false);

      setSelectedUser(null);

      resetForm();

      setSuccess(
        "User updated successfully."
      );

      await fetchUsers();
    } catch (err) {
      console.error(
        "Update user error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          "Failed to update user."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // TOGGLE STATUS
  // ===================================================

  const handleToggleStatus = async (
    user
  ) => {
    const action = user.isActive
      ? "deactivate"
      : "activate";

    const confirmed =
      window.confirm(
        `Are you sure you want to ${action} ${user.name}?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      await axios.patch(
        `${API_URL}/api/users/${user._id}/status`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        user.isActive
          ? "User deactivated successfully."
          : "User activated successfully."
      );

      await fetchUsers();
    } catch (err) {
      console.error(
        "Toggle status error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          "Failed to update user status."
      );
    } finally {
      setActionLoading(false);
    }
  };


  // ===================================================
// DELETE SINGLE USER
// ===================================================

const handleDeleteUser = async (user) => {
  const confirmed = window.confirm(
    `Are you sure you want to permanently delete ${user.name}?\n\nThis will delete the user from both Clerk and MongoDB. This action cannot be undone.`
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
      `${API_URL}/api/users/${user._id}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

    setSelectedUserIds((prev) =>
      prev.filter(
        (id) => id !== user._id
      )
    );

    setSuccess(
      "User deleted successfully from Clerk and MongoDB."
    );

    await fetchUsers();

  } catch (err) {
    console.error(
      "Delete user error:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Failed to delete user."
    );
  } finally {
    setActionLoading(false);
  }
};

// ===================================================
// DELETE MULTIPLE USERS
// ===================================================

const handleDeleteSelected = async () => {
  if (selectedUserIds.length === 0) {
    return;
  }

  const selectedUsers = users.filter(
    (user) =>
      selectedUserIds.includes(user._id)
  );

  const confirmed = window.confirm(
    `Are you sure you want to permanently delete ${selectedUsers.length} selected user(s)?\n\nAll selected users will be deleted from both Clerk and MongoDB.\n\nThis action cannot be undone.`
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

    const response =
      await axios.post(
        `${API_URL}/api/users/bulk-delete`,
        {
          userIds: selectedUserIds,
        },
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

    setSelectedUserIds([]);

    setSuccess(
      response.data?.message ||
        "Selected users deleted successfully."
    );

    await fetchUsers();

  } catch (err) {
    console.error(
      "Bulk delete error:",
      err
    );

    setError(
      err.response?.data?.message ||
        "Failed to delete selected users."
    );
  } finally {
    setActionLoading(false);
  }
};
  // ===================================================
  // RESTORE USER
  // ===================================================

  const handleRestore = async (
    user
  ) => {
    try {
      setActionLoading(true);

      setError("");
      setSuccess("");

      const token =
        await getToken();

      if (!token) {
        throw new Error(
          "Authentication token not available."
        );
      }

      await axios.patch(
        `${API_URL}/api/users/${user._id}/restore`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      setSuccess(
        "User restored successfully."
      );

      await fetchUsers();
    } catch (err) {
      console.error(
        "Restore user error:",
        err
      );

      setError(
        err.response?.data
          ?.message ||
          "Failed to restore user."
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ===================================================
  // ROLE LABEL
  // ===================================================

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Admin";

      case "sports_officer":
        return "Sports Officer";

      case "college_coordinator":
        return "College Coordinator";

      case "student":
        return "Student";

      default:
        return role;
    }
  };

  // ===================================================
  // ROLE CLASS
  // ===================================================

  const getRoleClass = (role) => {
    switch (role) {
      case "admin":
        return "bg-orange-100 text-orange-700";

      case "sports_officer":
        return "bg-blue-50 text-blue-700";

      case "college_coordinator":
        return "bg-purple-50 text-purple-700";

      case "student":
        return "bg-slate-100 text-slate-600";

      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  // ===================================================
  // RETURN
  // ===================================================

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">

      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

        <div>
          <p className="text-sm font-medium text-orange-500">
            Administration
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage system users, roles and account access.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
        >
          <Plus size={18} />
          Add User
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
      {/* FILTER CARD */}
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
              onChange={(e) => {
                setSearch(
                  e.target.value
                );
                setPage(1);
              }}
              placeholder="Search name, email or phone..."
              className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
            />

          </div>

          {/* ROLE */}

          <select
            value={role}
            onChange={(e) => {
              setRole(
                e.target.value
              );
              setPage(1);
            }}
            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-600 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
          >
            <option value="">
              All Roles
            </option>

            <option value="admin">
              Admin
            </option>

            <option value="sports_officer">
              Sports Officer
            </option>

            <option value="college_coordinator">
              College Coordinator
            </option>

            <option value="student">
              Student
            </option>
          </select>

          {/* STATUS */}

          <select
            value={isActive}
            onChange={(e) => {
              setIsActive(
                e.target.value
              );
              setPage(1);
            }}
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
            onClick={fetchUsers}
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


{selectedUserIds.length > 0 && (
  <button
    type="button"
    onClick={handleDeleteSelected}
    disabled={actionLoading}
    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 text-sm font-semibold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
  >
    <Trash2 size={17} />

    Delete Selected

    <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs">
      {selectedUserIds.length}
    </span>
  </button>
)}
          {/* CLEAR */}

          {(search ||
            role ||
            isActive) && (
            <button
              type="button"
              onClick={clearFilters}
              className="h-11 rounded-xl px-3 text-sm font-medium text-orange-600 hover:bg-orange-50"
            >
              Clear
            </button>
          )}

        </div>
      </div>

      {/* ================================================= */}
      {/* SUMMARY */}
      {/* ================================================= */}

      <div className="mt-5 flex items-center justify-between">

        <div className="flex items-center gap-2">

          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
            <Users size={16} />
          </div>

          <p className="text-sm text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-800">
              {users.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-800">
              {pagination.totalUsers ||
                0}
            </span>{" "}
            users
          </p>

        </div>

        {pagination.totalPages >
          0 && (
          <p className="text-xs text-slate-400">
            Page{" "}
            <span className="font-semibold text-slate-600">
              {pagination.page}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-slate-600">
              {
                pagination.totalPages
              }
            </span>
          </p>
        )}

      </div>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <div className="mt-3 overflow-hidden rounded-2xl border border-orange-100 bg-white shadow-sm">

        {loading ? (
          <LoadingState />
        ) : users.length ===
          0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto">

            <table className="w-full min-w-[900px]">

              <thead>
                <tr className="border-b border-orange-100 bg-orange-50/50">

               <th className="w-12 px-4 py-3 text-center">
  <input
    type="checkbox"
    checked={
      users.length > 0 &&
      users.every((user) =>
        selectedUserIds.includes(
          user._id
        )
      )
    }
    onChange={toggleSelectAll}
    disabled={
      loading || actionLoading
    }
    className="h-4 w-4 cursor-pointer accent-orange-500"
  />
</th>

<th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
  #
</th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    User
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Contact
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Role
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

                {users.map(
                  (
                    user,
                    index
                  ) => (
                    <tr
                      key={
                        user._id
                      }
                      className="transition hover:bg-orange-50/30"
                    >

{/* SELECT */}

<td className="px-4 py-4 text-center">
  <input
    type="checkbox"
    checked={selectedUserIds.includes(
      user._id
    )}
    onChange={() =>
      toggleUserSelection(
        user._id
      )
    }
    disabled={actionLoading}
    className="h-4 w-4 cursor-pointer accent-orange-500"
  />
</td>

                      {/* SL NO */}

                      <td className="px-5 py-4 text-sm text-slate-400">
                        {(pagination.page -
                          1) *
                          pagination.limit +
                          index +
                          1}
                      </td>

                      {/* USER */}

                      <td className="px-5 py-4">

                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                            {user.name
                              ?.charAt(
                                0
                              )
                              ?.toUpperCase() ||
                              "U"}
                          </div>

                          <div className="min-w-0">

                            <p className="truncate text-sm font-semibold text-slate-900">
                              {
                                user.name
                              }
                            </p>

                            <p className="mt-0.5 text-xs text-slate-400">
                              {
                                user.email
                              }
                            </p>

                          </div>

                        </div>

                      </td>

                      {/* CONTACT */}

                      <td className="px-5 py-4">

                        <p className="text-sm text-slate-700">
                          {user.phone ||
                            "—"}
                        </p>

                      </td>

                      {/* ROLE */}

                      <td className="px-5 py-4">

                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getRoleClass(
                            user.role
                          )}`}
                        >
                          {getRoleLabel(
                            user.role
                          )}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-5 py-4">

                        {user.isActive ? (
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
                            title="Edit user"
                            onClick={() =>
                              openEditModal(
                                user
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

                          {user.isActive ? (
                            <button
                              type="button"
                              title="Deactivate user"
                              onClick={() =>
                                handleToggleStatus(
                                  user
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
                              title="Restore user"
                              onClick={() =>
                                handleRestore(
                                  user
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
  title="Delete user permanently"
  onClick={() =>
    handleDeleteUser(user)
  }
  disabled={actionLoading}
  className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
>
  <Trash2 size={17} />
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
      {/* PAGINATION */}
      {/* ================================================= */}

      {!loading &&
        pagination.totalPages >
          0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-orange-100 bg-white px-4 py-3 shadow-sm">

            <p className="text-xs text-slate-500">
              Page{" "}
              <span className="font-semibold text-slate-700">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {
                  pagination.totalPages
                }
              </span>
            </p>

            <div className="flex items-center gap-2">

              <button
                type="button"
                disabled={
                  pagination.page <=
                    1 ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (prev) =>
                      prev - 1
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  size={17}
                />
              </button>

              <button
                type="button"
                disabled={
                  pagination.page >=
                    pagination.totalPages ||
                  loading
                }
                onClick={() =>
                  setPage(
                    (prev) =>
                      prev + 1
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight
                  size={17}
                />
              </button>

            </div>

          </div>
        )}

      {/* ================================================= */}
      {/* ADD USER MODAL */}
      {/* ================================================= */}

      {showAddModal && (
     <UserModal
  title="Add User"
  description="Create a Clerk account and application user."
  form={form}
  handleFormChange={handleFormChange}
  onSubmit={handleCreateUser}
  onClose={closeAddModal}
  loading={actionLoading}
  isEdit={false}
/>
      )}

      {/* ================================================= */}
      {/* EDIT USER MODAL */}
      {/* ================================================= */}

      {showEditModal &&
        selectedUser && (
         <UserModal
  title="Edit User"
  description="Update user information and access."
  form={form}
  handleFormChange={handleFormChange}
  onSubmit={handleUpdateUser}
  onClose={closeEditModal}
  loading={actionLoading}
  isEdit={true}
/>
        )}

    </div>
  );
}

// =====================================================
// USER MODAL
// =====================================================

function UserModal({
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

      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">

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
          className="space-y-4 px-6 py-6"
        >

          {/* NAME */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Name
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              name="name"
              value={form.name}
              onChange={
                handleFormChange
              }
              disabled={loading}
              placeholder="Enter full name"
              autoComplete="name"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
            />
          </div>

          {/* EMAIL */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Email
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <input
              type="email"
              name="email"
              value={form.email}
              onChange={
                handleFormChange
              }
              disabled={loading}
              placeholder="name@example.com"
              autoComplete="email"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
            />
          </div>

          {/* PHONE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Phone
            </label>

            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={
                handleFormChange
              }
              disabled={loading}
              placeholder="Enter phone number"
              autoComplete="tel"
              className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
            />
          </div>

          {/* ROLE */}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">
              Role
              <span className="ml-1 text-red-500">
                *
              </span>
            </label>

            <select
              name="role"
              value={form.role}
              onChange={
                handleFormChange
              }
              disabled={loading}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:bg-slate-50"
            >
              {userRoleOptions.map(
                (item) => (
                  <option
                    key={
                      item.value
                    }
                    value={
                      item.value
                    }
                  >
                    {item.label}
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-slate-400">
              Student accounts are created from the Students section.
            </p>
          </div>


          {/* ACTIVE */}

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-orange-200 hover:bg-orange-50/50">

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
              <p className="text-sm font-medium text-slate-700">
                Active account
              </p>

              <p className="text-xs text-slate-400">
                Allow this user to access the system.
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
                : "Create User"}
            </button>

          </div>

        </form>

      </div>

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
        Loading users...
      </p>

    </div>
  );
}

// =====================================================
// EMPTY STATE
// =====================================================

function EmptyState() {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">

      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
        <Users size={25} />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-900">
        No users found
      </h3>

      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Try changing the search or filters to find users.
      </p>

    </div>
  );
}