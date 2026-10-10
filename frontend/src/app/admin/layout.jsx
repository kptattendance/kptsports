import Navbar from "../components/Navbar";
import AdminSidebar from "./AdminSidebar";
import RoleProtected from "../components/RoleProtected";

export default function AdminLayout({ children }) {
  return (
    <RoleProtected allowedRoles={["admin"]}>
      <div className="min-h-screen bg-slate-50">

        {/* Public top navbar */}
        <Navbar />

        {/* Admin sidebar */}
        <AdminSidebar />

        {/* Main content */}
        <main className="min-h-[calc(100vh-4rem)] lg:ml-72">
          {children}
        </main>

      </div>
    </RoleProtected>
  );
}
