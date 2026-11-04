// =====================================================
// ROLES AND PAGE ACCESS
//
// One place that decides which staff role can open which
// admin page. The sidebar, the page guard and the login
// redirect all read from here.
//
// This only decides what the browser shows. The backend
// checks the role again on every API request.
// =====================================================

export const ROLE_LABELS = {
  admin: "Admin",
  sports_officer: "Sports Officer",
  sports_coordinator: "Sports Coordinator",
  office_staff: "Office Staff",
  college_coordinator: "College Coordinator",
  student: "Student",
};

// Roles that work inside the /admin area
export const STAFF_ROLES = [
  "admin",
  "sports_officer",
  "sports_coordinator",
  "office_staff",
];

// Admin pages open to roles other than admin.
// Admin can open every page.
export const PAGE_ROLES = {
  "/admin/applications": ["sports_officer"],
  "/admin/attendance": ["sports_officer", "sports_coordinator"],
  "/admin/results": [
    "sports_officer",
    "sports_coordinator",
    "office_staff",
  ],
};

// Where each role lands after logging in
export const ROLE_HOME = {
  admin: "/admin",
  sports_officer: "/admin/applications",
  sports_coordinator: "/admin/attendance",
  office_staff: "/admin/results",
  college_coordinator: "/college",
  student: "/student",
};

export const canOpenPage = (role, pathname) => {
  if (role === "admin") {
    return true;
  }

  return Object.entries(PAGE_ROLES).some(
    ([page, roles]) =>
      (pathname === page || pathname.startsWith(`${page}/`)) &&
      roles.includes(role)
  );
};
