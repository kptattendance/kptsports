"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ROLE_HOME = {
  admin: "/admin",
  sports_officer: "/sports-officer",
  college_coordinator: "/college",
  student: "/student",
};

// NOTE:
// This only decides what the browser shows.
// The real protection is on the backend, which checks
// the role again on every API request.

export default function RoleProtected({
  children,
  allowedRoles = [],
}) {
  const router = useRouter();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const [checking, setChecking] = useState(true);

  const allowedKey = allowedRoles.join(",");

  useEffect(() => {
    if (!isLoaded) return;

    const checkAccess = async () => {
      try {
        // Not logged in
        if (!isSignedIn) {
          router.replace("/");
          return;
        }

        const token = await getToken();

        if (!token) {
          router.replace("/");
          return;
        }

        // Get current user from backend
        const response = await axios.get(
          `${API_URL}/api/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const user = response.data?.data;

        // /auth/check creates the account if needed and
        // signs out deactivated users.
        if (!user || user.isActive === false) {
          router.replace("/auth/check");
          return;
        }

        // Role is not allowed for this section
        if (!allowedKey.split(",").includes(user.role)) {
          router.replace(
            ROLE_HOME[user.role] || "/auth/check"
          );
          return;
        }

        // Access allowed
        setChecking(false);
      } catch (error) {
        console.error(
          "Role protection error:",
          error?.response?.status || error.message
        );

        router.replace("/auth/check");
      }
    };

    checkAccess();
  }, [isLoaded, isSignedIn, getToken, router, allowedKey]);

  if (!isLoaded || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">
            Checking access...
          </p>
        </div>
      </div>
    );
  }

  return children;
}
