"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, CircleDashed, CookingPot, PartyPopper, ReceiptText, XCircle } from "lucide-react";
import { useOrderStore } from "@/lib/store/order-store";
import { fetchBackendOrder } from "@/lib/api";
import type { OrderDTO } from "@/lib/types";
import { formatCurrency, getPaymentLabel, openInvoicePdf } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToastStore } from "@/lib/store/toast-store";
import { PaymentSlipCard } from "@/components/order/payment-slip-card";

const steps = [
  { key: "ORDER_TAKEN", label: "Order Taken", icon: ReceiptText },
  { key: "IN_KITCHEN", label: "In Kitchen", icon: CookingPot },
  { key: "READY", label: "Ready", icon: CircleDashed },
  { key: "SERVED", label: "Served", icon: PartyPopper }
] as const;

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const upsertOrder = useOrderStore((state) => state.upsertOrder);
  const pushToast = useToastStore((state) => state.pushToast);
  const [hydrated, setHydrated] = useState(false);
  const [order, setOrder] = useState<OrderDTO | null>(null);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || !params.id) {
      return;
    }

    let active = true;

    async function syncOrder() {
      const payload = await fetchBackendOrder(params.id);
      if (!active || !payload) {
        return;
      }

      upsertOrder(payload);
      setOrder(payload);
    }

    void syncOrder();
    const interval = window.setInterval(() => {
      void syncOrder();
    }, 4000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hydrated, params.id, upsertOrder]);

  if (hydrated && !order) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-xl p-8 text-center">
          <p className="text-sm uppercase tracking-[0.25em] text-orange-500">Order Missing</p>
          <h1 className="font-display mt-3 text-5xl font-bold text-[#23233f]">We could not find this order</h1>
          <p className="mt-3 text-slate-500">It may not exist in the backend anymore or the server is unavailable.</p>
          <Link href="/menu" className="mt-6 inline-block">
            <Button>Back To Menu</Button>
          </Link>
        </Card>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-8">
          <Card className="h-48 animate-pulse bg-orange-100/70" />
          <Card className="h-80 animate-pulse bg-orange-100/70" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        <Card className="hero-wave overflow-hidden bg-white p-8 text-center sm:p-10">
          <div className="relative z-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff1e5] text-[#ff7a1a] shadow-soft">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <p className="mt-6 text-sm uppercase tracking-[0.25em] text-orange-500">Order Confirmed</p>
            <h1 className="font-display mt-3 text-5xl font-bold text-[#23233f]">Thank you for your order</h1>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-500">
              Your meal is in motion. Keep this page handy while the kitchen prepares everything for your table.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Badge>Order ID {order.id}</Badge>
              {order.paymentMethod === "CASH" ? (
                <Badge className="bg-amber-50 text-amber-700">Cash payment at table</Badge>
              ) : order.paymentMethod === "CARD" ? (
                <Badge className="bg-emerald-50 text-emerald-700">
                  Paid with demo card ending in {order.paymentLast4}
                </Badge>
              ) : (
                <Badge className="bg-emerald-50 text-emerald-700">
                  Paid via {getPaymentLabel(order.paymentMethod)} ending in {order.paymentAccount}
                </Badge>
              )}
              <Badge className="bg-[#23233f] text-white">
                Ready around{" "}
                {new Date(order.estimatedReadyAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit"
                })}
              </Badge>
            </div>
          </div>
        </Card>

        <Card className="p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Order Details</p>
              <h2 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Ordered Items</h2>
              <p className="mt-2 text-sm text-slate-500">
                Table {order.tableNumber} | {getPaymentLabel(order.paymentMethod)} |{" "}
                {order.paymentStatus === "PAY_ON_TABLE" ? "Pay At Table" : "Paid"}
              </p>
            </div>
            <Badge className="bg-[#fff2e6] text-[#ff7a1a]">{order.status.replaceAll("_", " ")}</Badge>
          </div>

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

          {order.status === "CANCELLED" ? (
            <div className="mt-6 rounded-[28px] border border-rose-100 bg-rose-50 p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-500 p-3 text-white">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-2xl font-bold text-[#23233f]">This order was cancelled</p>
                  <p className="mt-1 text-sm text-slate-500">The cancellation has been saved in the shared order record.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-4">
              {steps.map((step, index) => {
                const liveIndex = steps.findIndex((item) => item.key === order.status);
                const active = index <= liveIndex;
                const Icon = step.icon;

                return (
                  <div
                    key={step.key}
                    className={`rounded-[28px] p-5 shadow-soft ${
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

          <div className="mt-6 space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-[28px] bg-[#fffaf6] px-5 py-5 shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-display text-2xl font-bold text-[#23233f]">
                      {item.quantity}x {item.name}
                    </p>
                    {item.specialInstructions ? (
                      <p className="mt-2 text-sm text-slate-500">Note: {item.specialInstructions}</p>
                    ) : null}
                  </div>
                  <p className="font-bold text-[#23233f]">{formatCurrency(item.price * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col gap-4 border-t border-orange-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-slate-400">Order Total</p>
              <p className="text-3xl font-extrabold text-[#23233f]">{formatCurrency(order.total)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/menu">
                <Button variant="secondary">Back To Menu</Button>
              </Link>
              <Link href={`/track?orderId=${order.id}`}>
                <Button>Track Order</Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
