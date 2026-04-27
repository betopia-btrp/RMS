import { StaffReadyBoard } from "@/components/staff/staff-ready-board";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";

export default function StaffPage() {
  return (
    <StaffRouteGuard allowedRoles={["ADMIN", "WAITER"]}>
      <StaffReadyBoard />
    </StaffRouteGuard>
  );
}
