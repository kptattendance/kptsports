import Navbar from "../components/Navbar";
import AdminSidebar from "./AdminSidebar";
import AdminAccessGuard from "./AdminAccessGuard";
import RoleProtected from "../components/RoleProtected";
import { STAFF_ROLES } from "../lib/roles";

export default function AdminLayout({ children }) {
  return (
    <RoleProtected allowedRoles={STAFF_ROLES}>
      <div className="min-h-screen bg-slate-50">

        {/* Public top navbar */}
        <Navbar />

        {/* Sidebar shows only the pages this role can open */}
        <AdminSidebar />

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] lg:ml-72">
          <AdminAccessGuard>{children}</AdminAccessGuard>
        </main>

      </div>
    </RoleProtected>
  );
}
