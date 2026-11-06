"use client";

import { showSuccess } from "@/app/lib/alerts";

// =====================================================
// PIECES SHARED BY THE RESULTS AND ATTENDANCE BOARDS
// =====================================================

// The meet picked when a board opens
const MEET_STATUS_PRIORITY = [
  "ongoing",
  "applications_closed",
  "completed",
  "applications_open",
  "draft",
];

export const toLabel = (value) =>
  String(value || "").replace(/_/g, " ");

export const formatDateTime = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const pickDefaultMeet = (meets) => {
  const active = meets.filter(
    (meet) => meet.isActive !== false
  );

  const pool = active.length ? active : meets;

  for (const status of MEET_STATUS_PRIORITY) {
    const found = pool.find(
      (meet) => meet.status === status
    );

    if (found) {
      return found._id;
    }
  }

  return pool[0]?._id || "";
};

// Reads the message out of an API error, including
// errors returned for PDF (blob) requests.
export const getErrorMessage = async (err, fallback) => {
  const data = err?.response?.data;

  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text()).message || fallback;
    } catch {
      return fallback;
    }
  }

  return data?.message || fallback;
};

export const getTeamSize = (event) =>
  event?.eventType === "team"
    ? Math.max(Number(event.teamSize) || 1, 1)
    : 1;

// "M100 · Male · PC · Team event"
export function EventMeta({ event }) {
  return (
    <p className="mt-0.5 text-xs text-slate-500">
      {event.code} · <span className="capitalize">{event.gender}</span>
      {event.participationCategory === "physically_challenged" &&
        " · PC"}
      {event.eventType === "team" &&
        " · Team event"}
    </p>
  );
}

export function SummaryCard({
  icon: Icon,
  label,
  value,
  active,
  onClick,
  tone,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border bg-white p-3 text-left transition hover:border-orange-300 sm:p-4 ${
        active
          ? "border-orange-400 ring-2 ring-orange-100"
          : "border-slate-200"
      }`}
    >
      <span className="hidden rounded-xl bg-slate-50 p-2.5 sm:block">
        <Icon size={20} className={tone} />
      </span>

      <span>
        <span className={`block text-xl font-bold sm:text-2xl ${tone}`}>
          {value}
        </span>
        <span className="text-xs text-slate-500">{label}</span>
      </span>
    </button>
  );
}

export function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-base capitalize text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 sm:h-10 sm:text-sm"
    >
      {options.map(([optionValue, optionLabel]) => (
        <option key={optionValue} value={optionValue}>
          {optionLabel}
        </option>
      ))}
    </select>
  );
}

// =====================================================
// PDF: NEW TAB ON COMPUTERS, LOCAL FILE ON PHONES
//
// openPdfWindow() must be called straight from a click,
// before any await, or the browser blocks the new tab.
// Then showPdf() puts the downloaded PDF in that tab.
//
// Phones without a built-in PDF viewer (Android) would
// hand a tab over to Google Drive, so there the PDF is
// saved to Downloads instead, ready to open or share.
// =====================================================

const canShowPdfInTab = () =>
  navigator.pdfViewerEnabled ??
  !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);

export const openPdfWindow = (message = "Preparing PDF...") => {
  if (!canShowPdfInTab()) {
    return null;
  }

  const pdfWindow = window.open("", "_blank");

  if (pdfWindow) {
    const note = pdfWindow.document.createElement("p");
    note.textContent = message;
    note.style.cssText =
      "font-family:sans-serif;padding:24px;color:#475569";

    pdfWindow.document.title = message;
    pdfWindow.document.body.appendChild(note);
  }

  return pdfWindow;
};

export const showPdf = (pdfWindow, data, filename) => {
  const url = URL.createObjectURL(
    new Blob([data], { type: "application/pdf" })
  );

  if (pdfWindow && !pdfWindow.closed) {
    pdfWindow.location.href = url;
  } else {
    // Phone, or the new tab was blocked: save the file
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (!canShowPdfInTab()) {
      showSuccess(`${filename} saved to Downloads.`, "PDF saved");
    }
  }

  setTimeout(() => URL.revokeObjectURL(url), 60000);
};
