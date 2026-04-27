"use client";

import { useEffect, useState } from "react";
import { CookingPot, TimerReset } from "lucide-react";
import { fetchKitchenOrders, updateBackendOrderStatus } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffSessionBar } from "@/components/auth/staff-session-bar";
import { useToastStore } from "@/lib/store/toast-store";
import { formatCurrency } from "@/lib/utils";

function canKitchenMove(order: OrderDTO, target: "PREPARING" | "READY") {
  if (target === "PREPARING") {
    return order.workflowStatus === "PENDING";
  }

  return order.workflowStatus === "PREPARING";
}

export function KitchenBoard() {
  const pushToast = useToastStore((state) => state.pushToast);
  const [groups, setGroups] = useState<Record<string, OrderDTO[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const payload = await fetchKitchenOrders();
      if (!active) return;
      setGroups(payload?.groups ?? {});
      setLoading(false);
    }

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  async function move(orderId: string, status: "PREPARING" | "READY") {
    const updated = await updateBackendOrderStatus(orderId, status);
    if (!updated) {
      pushToast({
        title: "Kitchen update failed",
        description: "Could not sync the order with backend.",
        tone: "warning"
      });
      return;
    }

    const payload = await fetchKitchenOrders();
    setGroups(payload?.groups ?? {});
    pushToast({
      title: `Order moved to ${status}`,
      description: `Kitchen status for ${updated.id} is now ${status}.`,
      tone: "success"
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <StaffSessionBar />

        <Card className="hero-wave overflow-hidden bg-white p-8 sm:p-10">
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Kitchen Dashboard</p>
              <h1 className="font-display mt-3 text-5xl font-bold leading-[0.98] text-[#23233f]">
                Orders grouped by table, refreshed for the line.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                Track new tickets, move them from pending to preparing, and mark dishes ready for floor staff.
              </p>
            </div>
            <Badge className="bg-[#23233f] text-white">
              <TimerReset className="mr-2 h-4 w-4" /> Polling every 4 seconds
            </Badge>
          </div>
        </Card>

        {loading ? (
          <Card className="h-60 animate-pulse bg-orange-100/70" />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {Object.entries(groups).map(([table, orders]) => (
              <Card key={table} className="bg-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Table</p>
                    <h2 className="font-display mt-2 text-4xl font-bold text-[#23233f]">{table}</h2>
                  </div>
                  <Badge>{orders.length} active</Badge>
                </div>

                <div className="mt-6 space-y-4">
                  {orders.map((order) => (
                    <div key={order.id} className="rounded-[28px] bg-[#fffaf6] p-5 shadow-soft">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="font-semibold text-[#23233f]">{order.id}</p>
                          <p className="mt-1 text-sm text-slate-500">
                            {new Date(order.createdAt).toLocaleString()} | {order.workflowStatus ?? order.status}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className="bg-white text-slate-700">{order.workflowStatus ?? order.status}</Badge>
                          <Badge className="bg-white text-slate-700">{formatCurrency(order.total)}</Badge>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {order.items.map((item) => (
                          <Badge key={item.id} className="bg-white text-slate-700">
                            {item.quantity}x {item.name}
                          </Badge>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button
                          variant="secondary"
                          disabled={!canKitchenMove(order, "PREPARING")}
                          onClick={() => void move(order.id, "PREPARING")}
                        >
                          <CookingPot className="mr-2 h-4 w-4" /> Move To Preparing
                        </Button>
                        <Button
                          disabled={!canKitchenMove(order, "READY")}
                          onClick={() => void move(order.id, "READY")}
                        >
                          Mark Ready
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}

            {!Object.keys(groups).length ? (
              <Card className="bg-white p-12 text-center text-slate-500 lg:col-span-2">
                No pending kitchen orders right now.
              </Card>
            ) : null}
          </div>
        )}
      </div>
    </main>
  );
}
