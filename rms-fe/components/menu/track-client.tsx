"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CircleDashed, CookingPot, PartyPopper, ReceiptText, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PaymentSlipCard } from "@/components/order/payment-slip-card";
import { cancelBackendOrder, fetchBackendOrder } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";
import {
  canCancelOrder,
  getCancellationTimeRemaining,
  getLiveOrder,
  getStoredOrderById,
  useOrderStore
} from "@/lib/store/order-store";
import { useToastStore } from "@/lib/store/toast-store";
import { openInvoicePdf } from "@/lib/utils";

const steps = [
  { key: "ORDER_TAKEN", label: "Order Taken", icon: ReceiptText },
  { key: "IN_KITCHEN", label: "In Kitchen", icon: CookingPot },
  { key: "READY", label: "Ready", icon: CircleDashed },
  { key: "SERVED", label: "Served", icon: PartyPopper }
] as const;

export function TrackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upsertOrder = useOrderStore((state) => state.upsertOrder);
  const pushToast = useToastStore((state) => state.pushToast);
  const [orderId, setOrderId] = useState(searchParams.get("orderId") ?? "");
  const [searchValue, setSearchValue] = useState(searchParams.get("orderId") ?? "");
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState("");
  const [timeRemainingMs, setTimeRemainingMs] = useState(0);
  const lastStatusRef = useRef<string | null>(null);

  useEffect(() => {
    if (!orderId) return;

    function poll() {
      void (async () => {
        const backendOrder = await fetchBackendOrder(orderId);
        if (backendOrder) {
          upsertOrder(backendOrder);
        }

        const nextOrder = getLiveOrder(backendOrder ?? getStoredOrderById(orderId));
        if (!nextOrder) {
          setOrder(null);
          setTimeRemainingMs(0);
          lastStatusRef.current = null;
          setError("Order not found.");
          return;
        }

        if (lastStatusRef.current && lastStatusRef.current !== nextOrder.status) {
          pushToast({
            title: `Order ${nextOrder.status.replaceAll("_", " ").toLowerCase()}`,
            description: `Tracking for ${nextOrder.id} just moved to ${nextOrder.status.replaceAll("_", " ")}.`,
            tone: nextOrder.status === "SERVED" ? "success" : "info"
          });
        }

        lastStatusRef.current = nextOrder.status;
        setOrder(nextOrder);
        setTimeRemainingMs(getCancellationTimeRemaining(nextOrder));
        setError("");
      })();
    }

    poll();
    const interval = window.setInterval(poll, 2000);

    return () => {
      window.clearInterval(interval);
    };
  }, [orderId, pushToast, upsertOrder]);

  const canCancel = canCancelOrder(order);
  const cancellationMinutesLeft = Math.max(1, Math.ceil(timeRemainingMs / 60000));

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <Card className="hero-wave overflow-hidden bg-white p-8 sm:p-10">
          <div className="relative z-10">
            <Button
              variant="ghost"
              className="mb-6 rounded-full bg-[#23233f] px-5 py-3 text-sm font-semibold text-white shadow-soft hover:bg-[#17172b] hover:text-white"
              onClick={() => {
                if (window.history.length > 1) {
                  router.back();
                  return;
                }

                router.push("/menu");
              }}
            >
              Back
            </Button>
            <p className="text-sm uppercase tracking-[0.25em] text-orange-500">Live Tracking</p>
            <h1 className="font-display mt-2 text-5xl font-bold leading-[0.98] text-[#23233f]">
              Follow your order in real time.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500">
              This screen polls the backend every 2 seconds so kitchen, admin, and staff updates stay aligned.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Input
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Enter your order ID"
              />
              <Button onClick={() => setOrderId(searchValue.trim())}>Track</Button>
            </div>
            {error ? <p className="mt-3 text-sm text-rose-500">{error}</p> : null}
          </div>
        </Card>

        {order ? (
          <Card className="p-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Tracking Status</p>
                <h2 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Order {order.id}</h2>
                <p className="mt-2 text-sm text-slate-500">Table {order.tableNumber}</p>
              </div>
              <div className="rounded-full bg-[#fff2e6] px-4 py-2 text-sm font-bold text-[#ff7a1a]">
                {order.status.replaceAll("_", " ")}
              </div>
            </div>

            {order.status === "CANCELLED" ? (
              <div className="mt-8 rounded-[30px] border border-rose-100 bg-rose-50 p-6">
                <div className="flex items-center gap-4">
                  <div className="rounded-3xl bg-rose-500 p-3 text-white">
                    <XCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display text-3xl font-bold text-[#23233f]">This order has been cancelled</p>
                    <p className="mt-2 text-sm text-slate-500">
                      The cancellation was saved to the shared order record.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-4">
                {steps.map((step, index) => {
                  const orderIndex = steps.findIndex((item) => item.key === order.status);
                  const active = index <= orderIndex;
                  const Icon = step.icon;

                  return (
                    <div
                      key={step.key}
                      className={`rounded-[30px] p-5 shadow-soft ${
                        active ? "bg-[#fff3e7]" : "bg-white"
                      }`}
                    >
                      <div
                        className={`inline-flex rounded-3xl p-3 ${
                          active ? "bg-[#ff7a1a] text-white" : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="font-display mt-4 text-2xl font-bold text-[#23233f]">{step.label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <PaymentSlipCard
              order={order}
              onDownload={() => {
                openInvoicePdf(order);
                pushToast({
                  title: "Payment slip ready",
                  description: "The payment slip is ready to print or save as PDF.",
                  tone: "info"
                });
              }}
            />

            <div className="mt-8 flex flex-col gap-4 border-t border-orange-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">Tracking refreshes automatically every 2 seconds.</p>
                {canCancel ? (
                  <p className="mt-1 text-sm text-amber-700">
                    You can still cancel this order for about {cancellationMinutesLeft} minute
                    {cancellationMinutesLeft === 1 ? "" : "s"}.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-3">
                {canCancel ? (
                  <Button
                    variant="danger"
                    onClick={() => {
                      void (async () => {
                        const cancelled = await cancelBackendOrder(order.id);
                        if (cancelled) {
                          upsertOrder(cancelled);
                          setTimeRemainingMs(0);
                          setOrder(cancelled);
                          lastStatusRef.current = "CANCELLED";
                          pushToast({
                            title: "Order cancelled",
                            description: "The order status has been updated in the backend.",
                            tone: "warning"
                          });
                          return;
                        }

                        setTimeRemainingMs(0);
                      })();
                    }}
                  >
                    Cancel Order
                  </Button>
                ) : null}
              </div>
            </div>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
