"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCurrentUser } from "../components/RoleProtected";
import { canOpenPage, ROLE_HOME } from "../lib/roles";

// Staff who open an admin page their role cannot use
// are sent to their own home page.
export default function AdminAccessGuard({ children }) {
  const user = useCurrentUser();
  const pathname = usePathname();
  const router = useRouter();

  const allowed = canOpenPage(user?.role, pathname);

  useEffect(() => {
    if (user && !allowed) {
      router.replace(ROLE_HOME[user.role] || "/auth/check");
    }
  }, [user, allowed, router]);

  return allowed ? children : null;
}
