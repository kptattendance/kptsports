"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { usePathname, useRouter } from "next/navigation";
import axios from "axios";

const ROLE_HOME = {
  admin: "/admin",
  sports_officer: "/sports-officer",
  college_coordinator: "/college",
  student: "/student",
};

export default function RoleProtected({
  children,
  allowedRoles = [],
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
    if (!isLoaded) return;

    const checkAccess = async () => {
      try {
        // Not logged in
        if (!isSignedIn) {
          router.replace("/sign-in");
          return;
        }

        // Get Clerk token
        const token = await getToken();

        if (!token) {
          router.replace("/unauthorized");
          return;
        }

        // Backend URL
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL ||
          "http://localhost:5000";

        // Get current user directly from backend
        const response = await axios.get(
          `${API_URL}/api/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const user = response.data?.user;

        if (!user) {
          router.replace("/unauthorized");
          return;
        }

        // Check active status if backend provides it
        if (user.isActive === false) {
          router.replace("/unauthorized");
          return;
        }

        const role = user.role;

        // Role is not allowed for this section
        if (!allowedRoles.includes(role)) {
          const correctHome = ROLE_HOME[role];

          if (correctHome) {
            router.replace(correctHome);
          } else {
            router.replace("/unauthorized");
          }

          return;
        }

        // Special protection for club-specific pages
        if (
          (role === "club_incharge" ||
            role === "club_officer") &&
          pathname
        ) {
          const pathParts = pathname.split("/");

          const urlRole = pathParts[1];
          const urlClubCode = pathParts[2];

          if (
            (urlRole === "club-incharge" ||
              urlRole === "club-officer") &&
            urlClubCode
          ) {
            const userClubCode =
              user.clubId?.code?.toLowerCase();

            if (
              !userClubCode ||
              userClubCode !== urlClubCode.toLowerCase()
            ) {
              const correctPath =
                role === "club_incharge"
                  ? `/club-incharge/${userClubCode}`
                  : `/club-officer/${userClubCode}`;

              if (userClubCode) {
                router.replace(correctPath);
              } else {
                router.replace("/unauthorized");
              }

              return;
            }
          }
        }

        // Access allowed
        setChecking(false);
      } catch (error) {
        console.error(
          "Role protection error:",
          error?.response?.data || error.message
        );

        if (error?.response?.status === 401) {
          router.replace("/sign-in");
          return;
        }

        router.replace("/unauthorized");
      }
    };

    checkAccess();
  }, [isLoaded, isSignedIn, getToken, router, pathname]);

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