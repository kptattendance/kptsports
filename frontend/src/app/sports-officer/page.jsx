import Navbar from "@/components/Navbar";

export default function SportsOfficerDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">

        <p className="text-sm font-medium text-slate-500">
          Sports Department
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Sports Officer Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage Sports Meet activities, events and participants.
        </p>

      </main>

    </div>
  );
}