"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useAdminStore } from "@/lib/store/admin-store";

type StaffRouteGuardProps = {
  allowedRoles: Array<"ADMIN" | "KITCHEN" | "WAITER">;
  children: ReactNode;
};

function defaultDestination(role: string | undefined) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "KITCHEN") return "/kitchen";
  if (role === "WAITER") return "/staff";
  return "/login";
}

export function StaffRouteGuard({ allowedRoles, children }: StaffRouteGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const hydrated = useAdminStore((state) => state.hydrated);
  const restoring = useAdminStore((state) => state.restoring);
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated);
  const staff = useAdminStore((state) => state.staff);
  const restoreSession = useAdminStore((state) => state.restoreSession);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (!clientReady || hydrated) {
      return;
    }

    void restoreSession();
  }, [clientReady, hydrated, restoreSession]);

  useEffect(() => {
    if (!clientReady || !hydrated || restoring) {
      return;
    }

    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      return;
    }

    if (staff?.role && !allowedRoles.includes(staff.role)) {
      router.replace(defaultDestination(staff.role));
    }
  }, [allowedRoles, clientReady, hydrated, isAuthenticated, pathname, restoring, router, staff?.role]);

  if (!clientReady || !hydrated || restoring || !isAuthenticated || !staff || !allowedRoles.includes(staff.role)) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Card className="h-48 animate-pulse bg-orange-100/70" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
