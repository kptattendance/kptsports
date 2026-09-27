"use client";

import {
  Show,
  SignInButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

import Link from "next/link";
import { useEffect, useState } from "react";
import axios from "axios";

export default function Navbar() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [dashboard, setDashboard] = useState("/auth/check");
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  useEffect(() => {
    const getDashboard = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setDashboard("/auth/check");
        setLoadingDashboard(false);
        return;
      }

      try {
        const token = await getToken();

        if (!token) {
          setDashboard("/auth/check");
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

        const role = response.data?.data?.role;

        switch (role) {
          case "admin":
            setDashboard("/admin");
            break;

          case "sports_officer":
            setDashboard("/sports-officer");
            break;

          case "college_coordinator":
            setDashboard("/college");
            break;

          case "student":
            setDashboard("/student");
            break;

          default:
            setDashboard("/auth/check");
        }
      } catch (error) {
        console.error(
          "Failed to determine dashboard:",
          error
        );

        setDashboard("/auth/check");
      } finally {
        setLoadingDashboard(false);
      }
    };

    getDashboard();
  }, [isLoaded, isSignedIn, getToken]);

  return (
    <nav className="sticky top-0 z-50 border-b border-orange-100 bg-white/95 backdrop-blur">

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

        {/* ================================================= */}
        {/* LOGO */}
        {/* ================================================= */}

        <Link
          href="/"
          className="flex items-center gap-3"
        >
          {/* Orange Logo */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-sm font-bold text-white shadow-sm">
            KPT
          </div>

          <div className="leading-tight">

            <div className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
              KPT Sports Meet
            </div>

            <div className="hidden text-[9px] font-semibold uppercase tracking-[0.18em] text-orange-500 sm:block">
              Sports Meet Management System
            </div>

          </div>
        </Link>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div className="flex items-center gap-1 sm:gap-2">

          {/* HOME */}

          <Link
            href="/"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600 sm:block"
          >
            Home
          </Link>

          {/* ================================================= */}
          {/* SIGNED IN */}
          {/* ================================================= */}

          <Show when="signed-in">

            <Link
              href={dashboard}
              className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-orange-50 hover:text-orange-600"
            >
              Dashboard
            </Link>

            <div className="ml-1 border-l border-orange-100 pl-2 sm:ml-2 sm:pl-3">

              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-9 w-9",
                  },
                }}
              />

            </div>

          </Show>

          {/* ================================================= */}
          {/* SIGNED OUT */}
          {/* ================================================= */}

          <Show when="signed-out">

            <SignInButton mode="modal">

              <button
                type="button"
                className="ml-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-600 hover:shadow-md sm:ml-2 sm:px-5"
              >
                Login
              </button>

            </SignInButton>

          </Show>

        </div>
      </div>
    </nav>
  );
}