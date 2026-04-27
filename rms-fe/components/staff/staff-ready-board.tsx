"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ConciergeBell } from "lucide-react";
import { fetchReadyOrders, serveBackendOrder } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StaffSessionBar } from "@/components/auth/staff-session-bar";
import { useToastStore } from "@/lib/store/toast-store";
import { formatCurrency } from "@/lib/utils";

function canServe(order: OrderDTO) {
  return order.workflowStatus === "READY";
}

export function StaffReadyBoard() {
  const pushToast = useToastStore((state) => state.pushToast);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const payload = await fetchReadyOrders();
      if (!active) return;
      setOrders(payload?.orders ?? []);
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

  async function serve(orderId: string) {
    const updated = await serveBackendOrder(orderId);
    if (!updated) {
      pushToast({
        title: "Serve action failed",
        description: "Could not mark the order as served.",
        tone: "warning"
      });
      return;
    }

    setOrders((current) => current.filter((order) => order.id !== orderId));
    pushToast({
      title: "Order served",
      description: `${updated.id} is now completed.`,
      tone: "success"
    });
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <StaffSessionBar />

        <Card className="hero-wave overflow-hidden bg-white p-8 sm:p-10">
          <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Floor Staff</p>
              <h1 className="font-display mt-3 text-5xl font-bold leading-[0.98] text-[#23233f]">
                Ready orders lined up for table delivery.
              </h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
                Watch for ready plates, confirm the table number, and close service with one tap.
              </p>
            </div>
            <Badge className="bg-[#23233f] text-white">
              <ConciergeBell className="mr-2 h-4 w-4" /> Auto-refresh every 4 seconds
            </Badge>
          </div>
        </Card>

        {loading ? (
          <Card className="h-52 animate-pulse bg-orange-100/70" />
        ) : orders.length ? (
          <div className="grid gap-6 md:grid-cols-2">
            {orders.map((order) => (
              <Card key={order.id} className="bg-white p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Ready Order</p>
                    <h2 className="font-display mt-2 text-3xl font-bold text-[#23233f]">{order.id}</h2>
                    <p className="mt-2 text-sm text-slate-500">Table {order.tableNumber}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{order.workflowStatus ?? order.status}</Badge>
                    <Badge>{formatCurrency(order.total)}</Badge>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <Badge key={item.id} className="bg-[#fff7f0] text-slate-700">
                      {item.quantity}x {item.name}
                    </Badge>
                  ))}
                </div>

                <Button className="mt-6 w-full" disabled={!canServe(order)} onClick={() => void serve(order.id)}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark As Served
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="bg-white p-12 text-center text-slate-500">
            No ready orders are waiting for floor staff right now.
          </Card>
        )}
      </div>
    </main>
  );
}
