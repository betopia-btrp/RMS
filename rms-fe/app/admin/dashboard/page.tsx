import { DashboardClient } from "@/components/admin/dashboard-client";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";

export default function AdminDashboardPage() {
  return (
    <StaffRouteGuard allowedRoles={["ADMIN"]}>
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <DashboardClient />
        </div>
      </main>
    </StaffRouteGuard>
  );
}
