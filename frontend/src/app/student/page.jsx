import Navbar from "../components/Navbar"

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">

      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-8">

        <p className="text-sm font-medium text-slate-500">
          Participant
        </p>

        <h1 className="mt-1 text-3xl font-bold text-slate-950">
          Student Dashboard
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Complete the profile and apply for Sports Meet events.
        </p>

      </main>

    </div>
  );
}