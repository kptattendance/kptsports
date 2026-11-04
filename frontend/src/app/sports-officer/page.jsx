import Navbar from "../components/Navbar";
import ResultsBoard from "../components/ResultsBoard";

// Sports officers / office staff: enter results and
// print certificates. Nothing else in the admin area.
export default function SportsOfficerDashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-7xl">
        <ResultsBoard />
      </main>
    </div>
  );
}
