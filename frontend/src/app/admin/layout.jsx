"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import axios from "axios";

import Navbar from "../components/Navbar";
import AdminSidebar from "./AdminSidebar";

export default function AdminLayout({ children }) {
  const {
    isLoaded,
    isSignedIn,
    getToken,
  } = useAuth();

  const router = useRouter();

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    const verifyAdmin = async () => {
      try {
        const token = await getToken();

        if (!token) {
          router.replace("/");
          return;
        }

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const user = response.data?.data;

        if (!user) {
          router.replace("/auth/check");
          return;
        }

        if (user.role !== "admin") {
          router.replace("/auth/check");
          return;
        }

        if (user.isActive === false) {
          router.replace("/");
          return;
        }

        setChecking(false);
      } catch (error) {
        console.error(
          "Admin authentication failed:",
          error
        );

        router.replace("/auth/check");
      }
    };

    verifyAdmin();
  }, [
    isLoaded,
    isSignedIn,
    getToken,
    router,
  ]);

  if (
    !isLoaded ||
    checking
  ) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-orange-50">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-100 border-t-orange-500" />

          <p className="mt-4 text-sm font-medium text-slate-600">
            Verifying administrator access...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Public top navbar */}
      <Navbar />

      {/* Admin sidebar */}
      <AdminSidebar />

      {/* Main content */}
      <main className="min-h-[calc(100vh-4rem)] lg:ml-72">
        {children}
      </main>

    </div>
  );
}