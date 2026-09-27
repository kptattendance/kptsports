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
  Award,
  UserCog,
  BarChart3,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";

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
        label: "Results",
        href: "/admin/results",
        icon: Medal,
      },
    ],
  },

  {
    title: "CERTIFICATES",
    items: [
      {
        label: "Certificates",
        href: "/admin/certificates",
        icon: Award,
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

  return (
    <>
      {/* ================================================= */}
      {/* MOBILE MENU BUTTON */}
      {/* ================================================= */}

      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-20 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-orange-100 bg-white text-slate-700 shadow-sm lg:hidden"
        aria-label="Open admin menu"
      >
        <Menu size={20} />
      </button>

      {/* ================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================================= */}

      {mobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-72 flex-col
          border-r border-orange-100
          bg-white
          transition-transform duration-300
          lg:translate-x-0
          ${
            mobileOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
        `}
      >

      

        {/* ================================================= */}
        {/* ADMIN PROFILE */}
        {/* ================================================= */}

        <div className="mx-4 mt-5 rounded-2xl border border-orange-100 bg-orange-50/70 p-3">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-500 text-sm font-bold text-white">
              A
            </div>

            <div className="min-w-0">

              <p className="truncate text-sm font-semibold text-slate-900">
                Administrator
              </p>

              <p className="text-xs text-orange-600">
                System Administrator
              </p>

            </div>

          </div>

        </div>

        {/* ================================================= */}
        {/* NAVIGATION */}
        {/* ================================================= */}

        <div className="flex-1 overflow-y-auto px-4 py-5">

          {menuGroups.map((group) => (
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