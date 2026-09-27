"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useClerk, useUser } from "@clerk/nextjs";
import { UserRound, LogOut, ChevronDown, Trophy } from "lucide-react";

export default function StudentLayout({ children }) {
  const { user } = useUser();
  const { signOut } = useClerk();

  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const studentName =
    user?.fullName ||
    user?.firstName ||
    user?.username ||
    "Student";

  const studentImage = user?.imageUrl;

  const handleLogout = async () => {
    setProfileOpen(false);

    await signOut({
      redirectUrl: "/",
    });
  };

  return (
    <div className="min-h-screen bg-orange-50/30">
      {/* =====================================================
          COMMON STUDENT HEADER
      ===================================================== */}
      <header className="sticky top-0 z-50 bg-white border-b border-orange-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

          {/* LEFT - SPORTS MEET */}
          <Link
            href="/"
            prefetch={true}
            className="flex items-center gap-3 group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center shadow-sm group-hover:bg-orange-600 transition">
              <Trophy className="w-5 h-5 text-white" />
            </div>

            <div className="hidden sm:block">
              <div className="font-bold text-gray-900 leading-tight">
                Sports Meet
              </div>

              <div className="text-xs text-gray-500">
                Student Portal
              </div>
            </div>
          </Link>

          {/* RIGHT - PROFILE */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full hover:bg-orange-50 p-1.5 transition"
            >
              {/* STUDENT IMAGE */}
              {studentImage ? (
                <img
                  src={studentImage}
                  alt={studentName}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border-2 border-orange-200"
                />
              ) : (
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center">
                  <UserRound className="w-5 h-5 text-orange-600" />
                </div>
              )}

              {/* NAME - HIDDEN ON SMALL MOBILE */}
              <span className="hidden sm:block max-w-[180px] truncate text-sm font-semibold text-gray-700">
                {studentName}
              </span>

              <ChevronDown
                className={`hidden sm:block w-4 h-4 text-gray-400 transition-transform ${
                  profileOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* PROFILE DROPDOWN */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-orange-100 rounded-2xl shadow-xl overflow-hidden">

                {/* PROFILE INFO */}
                <div className="px-4 py-4 border-b border-orange-100">
                  <div className="flex items-center gap-3">

                    {studentImage ? (
                      <img
                        src={studentImage}
                        alt={studentName}
                        className="w-11 h-11 rounded-full object-cover border-2 border-orange-200"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                        <UserRound className="w-5 h-5 text-orange-600" />
                      </div>
                    )}

                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {studentName}
                      </p>

                      {user?.primaryEmailAddress?.emailAddress && (
                        <p className="text-xs text-gray-500 truncate">
                          {user.primaryEmailAddress.emailAddress}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* LOGOUT */}
                <div className="p-2">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================
          PAGE CONTENT
      ===================================================== */}
      <main>{children}</main>
    </div>
  );
}