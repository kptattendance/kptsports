"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Trophy,
  CalendarDays,
  Users,
  Building2,
  ClipboardList,
  UserCheck,
  Medal,
  UserCog,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";
import { useCurrentUser } from "../components/RoleProtected";
import { canOpenPage, ROLE_LABELS } from "../lib/roles";

const menuGroups = [
  {
    title: "MAIN",
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
      },
    ],
  },

  {
    title: "SPORTS MEET",
    items: [
      {
        label: "Meets",
        href: "/admin/meets",
        icon: CalendarDays,
      },
      {
        label: "Events",
        href: "/admin/events",
        icon: Trophy,
      },
    ],
  },

  {
    title: "PARTICIPANTS",
    items: [
     
      {
        label: "Institutions",
        href: "/admin/institutions",
        icon: Building2,
      },
    ],
  },

  {
    title: "REGISTRATION",
    items: [
      {
        label: "Applications",
        href: "/admin/applications",
        icon: ClipboardList,
      },
    ],
  },

  {
    title: "COMPETITION",
    items: [
      {
        label: "Attendance",
        href: "/admin/attendance",
        icon: UserCheck,
      },
      {
        // Results and certificates are on the same page
        label: "Results",
        href: "/admin/results",
        icon: Medal,
      },
    ],
  },

  {
    title: "ADMINISTRATION",
    items: [
      {
        label: "Users",
        href: "/admin/users",
        icon: UserCog,
      },
      {
        label: "Reports",
        href: "/admin/reports",
        icon: BarChart3,
      },
    ],
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const closeMobile = () => {
    setMobileOpen(false);
  };

  const user = useCurrentUser();
  const role = user?.role;

  // Only the pages this role can open
  const visibleGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        canOpenPage(role, item.href)
      ),
    }))
    .filter((group) => group.items.length > 0);

  const displayName =
    role === "admin"
      ? "Administrator"
      : user?.name || ROLE_LABELS[role] || "Staff";

  const currentItem = visibleGroups
    .flatMap((group) => group.items)
    .find((item) => isActive(item.href));

  return (
    <>
      {/* ================================================= */}
      {/* MOBILE MENU BAR                                   */}
      {/* Sits in the page flow under the navbar, so it     */}
      {/* never covers page content.                        */}
      {/* ================================================= */}

      <div className="sticky top-16 z-30 flex items-center gap-3 border-b border-orange-100 bg-white/95 px-4 py-2 backdrop-blur lg:hidden">

        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-10 items-center gap-2 rounded-xl border border-orange-100 bg-white px-3 text-sm font-semibold text-slate-700 shadow-sm"
          aria-label="Open admin menu"
        >
          <Menu size={18} />
          Menu
        </button>

        <span className="truncate text-sm font-semibold text-slate-500">
          {currentItem?.label || "Admin"}
        </span>

      </div>

      {/* ================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================================= */}

      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-[60] bg-slate-900/30 lg:hidden"
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR                                           */}
      {/* Mobile: drawer over everything.                   */}
      {/* Desktop: fixed column below the navbar.           */}
      {/* ================================================= */}

      <aside
        className={`
          fixed left-0 top-0 z-[70]
          flex h-dvh w-72 max-w-[85vw] flex-col
          border-r border-orange-100
          bg-white
          transition-transform duration-300
          lg:top-16 lg:z-40 lg:h-[calc(100vh-4rem)] lg:max-w-none lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

        {/* MOBILE DRAWER HEADER */}

        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">

          <span className="text-sm font-bold text-slate-900">
            Menu
          </span>

          <button
            type="button"
            onClick={closeMobile}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Close admin menu"
          >
            <X size={18} />
          </button>

        </div>

        {/* ================================================= */}
        {/* ADMIN PROFILE */}
        {/* ================================================= */}

        <div className="mx-4 mt-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-3">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-slate-900">
                {displayName}
              </p>

              <p className="text-xs text-orange-600">
                {role === "admin"
                  ? "System Administrator"
                  : ROLE_LABELS[role] || ""}
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div className="flex-1 overflow-y-auto px-4 py-5">

          {visibleGroups.map((group) => (
            <div
              key={group.title}
              className="mb-6"
            >

              <div className="mb-2 px-3 text-[10px] font-bold tracking-[0.16em] text-slate-400">
                {group.title}
              </div>

              <div className="space-y-1">

                {group.items.map((item) => {

                  const Icon = item.icon;
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMobile}
                      className={`
                        group flex items-center gap-3
                        rounded-xl px-3 py-2.5
                        text-sm font-medium
                        transition-all
                        ${
                          active
                            ? "bg-orange-500 text-white shadow-sm"
                            : "text-slate-600 hover:bg-orange-50 hover:text-orange-600"
                        }
                      `}
                    >

                      <Icon
                        size={18}
                        strokeWidth={active ? 2.2 : 1.9}
                      />

                      <span>
                        {item.label}
                      </span>

                      {active && (
                        <ChevronRight
                          size={15}
                          className="ml-auto"
                        />
                      )}

                    </Link>
                  );
                })}

              </div>

            </div>
          ))}

        </div>

        {/* ================================================= */}
        {/* FOOTER */}
        {/* ================================================= */}

        <div className="border-t border-slate-100 p-4">

          <div className="rounded-xl bg-slate-50 px-3 py-3">

            <p className="text-xs font-medium text-slate-700">
              KPT Sports Meet
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              Management System
            </p>

          </div>

        </div>

      </aside>
    </>
  );
}