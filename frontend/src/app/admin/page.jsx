"use client";

import Navbar from "../components/Navbar"

export default function AdminDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">

        <div>
          <p className="text-sm font-medium text-slate-500">
            Administration
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Admin Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage the Sports Meet system.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <DashboardCard
            title="Sports Meets"
            value="—"
          />

          <DashboardCard
            title="Institutions"
            value="—"
          />

          <DashboardCard
            title="Participants"
            value="—"
          />

          <DashboardCard
            title="Events"
            value="—"
          />

        </div>

      </main>

    </div>
  );
}

function DashboardCard({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}