import { KitchenBoard } from "@/components/kitchen/kitchen-board";
import { StaffRouteGuard } from "@/components/auth/staff-route-guard";

export default function KitchenPage() {
  return (
    <StaffRouteGuard allowedRoles={["ADMIN", "KITCHEN"]}>
      <KitchenBoard />
    </StaffRouteGuard>
  );
}
