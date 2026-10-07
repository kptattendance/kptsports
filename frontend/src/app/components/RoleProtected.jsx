"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";

import { getCurrentUser } from "@/lib/getCurrentUser";

const ROLE_HOME = {
  admin: "/admin",
  sports_officer: "/sports-officer",
  college_coordinator: "/college",
  student: "/student",
};

export default function RoleProtected({
  allowedRoles = [],
  children,
}) {
  const router = useRouter();
  const pathname = usePathname();

  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let cancelled = false;

    const verifyAccess = async () => {
      try {
        // ============================================
        // NOT SIGNED IN
        // ============================================

        if (!isSignedIn) {
          router.replace("/");
          return;
        }

        // ============================================
        // GET CLERK TOKEN
        // ============================================

        const token = await getToken();

        if (!token) {
          router.replace("/");
          return;
        }

        // ============================================
        // GET MONGO USER
        // ============================================

        const data = await getCurrentUser(getToken);

        const user = data?.user;

        if (!user) {
          router.replace("/");
          return;
        }

        // ============================================
        // ACTIVE CHECK
        // ============================================

        if (user.isActive === false) {
          router.replace("/");
          return;
        }

        // ============================================
        // ROLE
        // ============================================

        const role = String(user.role || "")
          .trim()
          .toLowerCase();

        if (!role) {
          router.replace("/");
          return;
        }

        // ============================================
        // ALLOWED ROLES
        // ============================================

        const normalizedAllowedRoles =
          allowedRoles.map((item) =>
            String(item)
              .trim()
              .toLowerCase()
          );

        const isAllowed =
          normalizedAllowedRoles.includes(role);

        // ============================================
        // USER DOES NOT HAVE ACCESS
        // ============================================

        if (!isAllowed) {
          const correctHome =
            ROLE_HOME[role];

          if (correctHome) {
            router.replace(correctHome);
          } else {
            router.replace("/");
          }

          return;
        }

        // ============================================
        // ACCESS GRANTED
        // ============================================

        if (!cancelled) {
          setChecking(false);
        }
      } catch (error) {
        console.error(
          "ROLE PROTECTION ERROR:",
          error
        );

        console.error(
          "Status:",
          error?.response?.status
        );

        console.error(
          "Response:",
          error?.response?.data
        );

        router.replace("/");
      }
    };

    verifyAccess();

    return () => {
      cancelled = true;
    };
  }, [
    isLoaded,
    isSignedIn,
    getToken,
    router,
    pathname,
    allowedRoles,
  ]);

  // ============================================
  // LOADING
  // ============================================

  if (!isLoaded || checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-orange-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-8 text-center shadow-sm">

          <div className="mx-auto mb-6 h-11 w-11 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

          <h1 className="text-xl font-semibold text-slate-900">
            Checking access
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            Verifying account permissions...
          </p>

        </div>
      </main>
    );
  }

  return children;
}