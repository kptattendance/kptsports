"use client";

export default function AdminDashboard() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="mb-8">

        <p className="text-sm font-medium text-orange-500">
          Administration
        </p>

        <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
          Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Manage Sports Meet activities, participants,
          events, applications and results.
        </p>

      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

        <StatCard
          title="Sports Meets"
          value="0"
          description="Active meets"
        />

        <StatCard
          title="Institutions"
          value="0"
          description="Registered institutions"
        />

        <StatCard
          title="Students"
          value="0"
          description="Registered participants"
        />

        <StatCard
          title="Events"
          value="0"
          description="Available events"
        />

      </div>

      {/* ================================================= */}
      {/* QUICK MANAGEMENT */}
      {/* ================================================= */}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Sports Meet Management
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Configure meets and events.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <QuickLink
              href="/admin/meets"
              title="Manage Meets"
              description="Create and manage sports meets"
            />

            <QuickLink
              href="/admin/events"
              title="Manage Events"
              description="Configure sports events"
            />

          </div>

        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-semibold text-slate-900">
            Participants
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Manage institutions and student participation.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">

            <QuickLink
              href="/admin/institutions"
              title="Institutions"
              description="Manage participating institutions"
            />

            <QuickLink
              href="/admin/students"
              title="Students"
              description="Manage student profiles"
            />

          </div>

        </div>

      </div>

    </div>
  );
}

function StatCard({
  title,
  value,
  description,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-3xl font-bold text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}) {
  return (
    <a
      href={href}
      className="rounded-xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50"
    >
      <p className="text-sm font-semibold text-slate-900">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>
    </a>
  );
}