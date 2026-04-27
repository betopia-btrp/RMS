"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAdminStore } from "@/lib/store/admin-store";
import { useToastStore } from "@/lib/store/toast-store";

function getRoleHome(role: string | undefined) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "KITCHEN") return "/kitchen";
  if (role === "WAITER") return "/staff";
  return "/login";
}

export function StaffSessionBar() {
  const router = useRouter();
  const logout = useAdminStore((state) => state.logout);
  const staff = useAdminStore((state) => state.staff);
  const pushToast = useToastStore((state) => state.pushToast);

  if (!staff) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-[28px] bg-white px-5 py-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3">
        <Badge className="bg-[#23233f] text-white">{staff.role}</Badge>
        <p className="text-sm text-slate-500">
          Signed in as <span className="font-semibold text-[#23233f]">{staff.name}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link href={getRoleHome(staff.role)}>
          <Button variant="secondary">Dashboard</Button>
        </Link>
        <Button
          variant="secondary"
          onClick={async () => {
            await logout();
            pushToast({
              title: "Logged out successfully",
              description: "Staff access has been closed on this device.",
              tone: "info"
            });
            router.push("/login");
          }}
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
      </div>
    </div>
  );
}
