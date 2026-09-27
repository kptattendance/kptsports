import Navbar from "./components/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">

      <Navbar />

      <section className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center px-6 py-16">

        <div className="max-w-3xl">

          {/* Badge */}
          <div className="mb-5 inline-flex rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-medium text-orange-700">
            KPT Sports Meet
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Sports Meet
            <span className="block text-orange-500">
              Management System
            </span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
            Online registration, event management,
            participation tracking, results and
            certificates for the Sports Meet.
          </p>

          {/* Buttons */}
          <div className="mt-8 flex flex-wrap gap-3">

            <a
              href="/auth/check"
              className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md"
            >
              Login / Register
            </a>

            <a
              href="/events"
              className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700"
            >
              View Events
            </a>

          </div>

        </div>

      </section>

    </main>
  );
}