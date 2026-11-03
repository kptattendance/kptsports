"use client";

import { useEffect } from "react";
import Swal from "sweetalert2";

// =====================================================
// SWEET ALERT HELPERS
//
// Every message on the site goes through these, so all
// alerts look the same and appear in the centre of the
// screen. Messages are passed as `text` (not `html`),
// so names typed by users can never inject markup.
// =====================================================

const BRAND = "#f97316"; // orange-500

const base = {
  confirmButtonColor: BRAND,
  cancelButtonColor: "#94a3b8", // slate-400
  reverseButtons: true,
};

export const showSuccess = (text, title = "Success") =>
  Swal.fire({
    ...base,
    icon: "success",
    title,
    text,
    timer: 2500,
    timerProgressBar: true,
  });

export const showError = (text, title = "Error") =>
  Swal.fire({
    ...base,
    icon: "error",
    title,
    text,
  });

export const showWarning = (text, title = "Please check") =>
  Swal.fire({
    ...base,
    icon: "warning",
    title,
    text,
  });

// Resolves to true when the user clicks the confirm button.
// Accepts a plain message string, or an options object.
// Delete / permanent actions get a red confirm button.
export const confirmAction = async (options = {}) => {
  const {
    title = "Are you sure?",
    text = "",
    confirmText = "Yes",
    danger = /delete|permanent|cannot be undone|cannot be changed/i.test(
      typeof options === "string" ? options : options.text || ""
    ),
  } = typeof options === "string" ? { text: options } : options;

  const result = await Swal.fire({
    ...base,
    icon: danger ? "warning" : "question",
    title,
    text,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    confirmButtonColor: danger ? "#dc2626" : BRAND, // red-600
    focusCancel: danger,
  });

  return result.isConfirmed;
};

// =====================================================
// useAlertMessages
//
// Pages keep their existing error / success state.
// Whenever one is set, it is shown as a SweetAlert and
// then cleared, so nothing is printed inside the page.
// =====================================================

export const useAlertMessages = ({
  error,
  setError,
  success,
  setSuccess,
}) => {
  useEffect(() => {
    if (!error) return;

    showError(String(error));
    setError?.("");
  }, [error, setError]);

  useEffect(() => {
    if (!success) return;

    showSuccess(String(success));
    setSuccess?.("");
  }, [success, setSuccess]);
};
