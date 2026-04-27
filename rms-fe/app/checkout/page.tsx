"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/store/cart-store";
import { useTableStore } from "@/lib/store/table-store";
import { useToastStore } from "@/lib/store/toast-store";
import { createBackendOrder, fetchMenuSnapshot } from "@/lib/api";
import { paymentMethods, type PaymentMethod } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const items = useCart((state) => state.items);
  const total = useCart((state) => state.total);
  const clearCart = useCart((state) => state.clearCart);
  const joinedTable = useTableStore((state) => state.joinedTable);
  const joinTable = useTableStore((state) => state.joinTable);
  const pushToast = useToastStore((state) => state.pushToast);
  const [tableNumber, setTableNumber] = useState(joinedTable);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [cardholderName, setCardholderName] = useState("Alex Carter");
  const [cardNumber, setCardNumber] = useState("4242 4242 4242 4242");
  const [expiryDate, setExpiryDate] = useState("12/28");
  const [cvv, setCvv] = useState("123");
  const [mobileWalletNumber, setMobileWalletNumber] = useState("01700000000");
  const [walletReference, setWalletReference] = useState("TXN12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (joinedTable && !tableNumber) {
      setTableNumber(joinedTable);
    }
  }, [joinedTable, tableNumber]);

  useEffect(() => {
    const qrTable = searchParams.get("table") ?? searchParams.get("qr");
    if (!qrTable?.trim()) {
      return;
    }

    const normalizedTable = qrTable.trim().toUpperCase();
    joinTable(normalizedTable);
    setTableNumber(normalizedTable);
  }, [joinTable, searchParams]);

  async function handleSubmit() {
    setLoading(true);
    setError("");

    if (!items.length) {
      setError("Your cart is empty.");
      setLoading(false);
      return;
    }

    const sanitizedCard = cardNumber.replace(/\D/g, "");
    const sanitizedWalletNumber = mobileWalletNumber.replace(/\D/g, "");

    if (paymentMethod === "CARD") {
      if (!cardholderName.trim()) {
        setError("Enter the cardholder name.");
        setLoading(false);
        return;
      }

      if (sanitizedCard.length !== 16) {
        setError("Enter a valid 16-digit demo card number.");
        setLoading(false);
        return;
      }

      if (!/^\d{2}\/\d{2}$/.test(expiryDate)) {
        setError("Enter expiry as MM/YY.");
        setLoading(false);
        return;
      }

      if (cvv.replace(/\D/g, "").length < 3) {
        setError("Enter a valid CVV.");
        setLoading(false);
        return;
      }
    }

    if (paymentMethod === "BKASH" || paymentMethod === "NAGAD" || paymentMethod === "ROCKET") {
      if (sanitizedWalletNumber.length < 11) {
        setError("Enter a valid mobile wallet number.");
        setLoading(false);
        return;
      }

      if (!walletReference.trim()) {
        setError("Enter the demo transaction reference.");
        setLoading(false);
        return;
      }
    }

    try {
      await new Promise((resolve) =>
        window.setTimeout(resolve, paymentMethod === "CASH" ? 500 : 1200)
      );

      const menuSnapshot = await fetchMenuSnapshot();
      const backendOrder = menuSnapshot?.venue?.venue_id
        ? await createBackendOrder({
            client_request_id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            venue_id: menuSnapshot.venue.venue_id,
            table_label: tableNumber,
            payment_method: paymentMethod,
            payment_status: paymentMethod === "CASH" ? "PAY_ON_TABLE" : "PAID",
            items: items.map((item) => ({
              item_id: item.id,
              quantity: item.quantity,
              special_instruction: item.specialInstructions
            }))
          })
        : null;

      if (!backendOrder) {
        setError("Unable to place your order right now. Please try again once the server is available.");
        return;
      }

      window.localStorage.setItem("latest-order-id", backendOrder.id);
      pushToast({
        title: "Order placed successfully",
        description: `Your order ID is ${backendOrder.id}. You can now follow it live.`,
        tone: "success"
      });
      clearCart();
      router.push(`/order/${backendOrder.id}`);
    } catch {
      setError("Unable to place your order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="hero-wave rounded-[40px] bg-white px-6 py-10 shadow-soft sm:px-8">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Checkout</p>
              <h1 className="font-display mt-3 text-5xl font-bold leading-[0.98] text-[#23233f]">
                Review and place your order with a warm, polished checkout flow.
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-slate-500">
                Confirm your table, choose a demo payment method, and send the order straight into the
                live tracking experience.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Table", tableNumber || "A12"],
                ["Items", String(items.length)],
                ["Total", formatCurrency(total)]
              ].map(([label, value]) => (
                <div key={label} className="rounded-[28px] bg-[#fffaf6] p-5 shadow-soft">
                  <p className="text-sm text-slate-400">{label}</p>
                  <p className="mt-3 text-2xl font-extrabold text-[#23233f]">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Order Summary</p>
                <h2 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Your selected dishes</h2>
              </div>
            </div>
            <div className="mt-6 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.id}-${item.specialInstructions ?? ""}`}
                  className="rounded-[30px] bg-[#fffaf6] p-4 shadow-soft"
                >
                  <div className="flex gap-4">
                    <div className="relative h-24 w-24 overflow-hidden rounded-[24px]">
                      <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="96px" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-display text-2xl font-bold text-[#23233f]">{item.name}</p>
                          <p className="text-sm text-slate-500">Qty {item.quantity}</p>
                        </div>
                        <p className="font-bold text-[#23233f]">{formatCurrency(item.price * item.quantity)}</p>
                      </div>
                      {item.specialInstructions ? (
                        <p className="mt-2 text-sm text-slate-500">Note: {item.specialInstructions}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
              {!items.length ? (
                <div className="rounded-[30px] bg-[#fff7f0] p-8 text-center text-slate-500">
                  Your cart is empty. Return to the menu to add items before checkout.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="h-fit p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Payment & Table</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Complete your order</h2>

            <div className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-600">Table Number</label>
                <Input
                  value={tableNumber}
                  onChange={(event) => {
                    const nextValue = event.target.value.toUpperCase();
                    setTableNumber(nextValue);
                    if (nextValue.trim()) {
                      joinTable(nextValue);
                    }
                  }}
                  placeholder="From QR or type e.g. A12"
                />
                <p className="mt-2 text-xs text-slate-400">
                  Table number can be prefilled from a QR link like `?table=A12` or entered manually.
                </p>
              </div>

              <div className="rounded-[30px] bg-[#fff7f0] p-5">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-lg font-bold text-[#23233f]">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>

              <div className="rounded-[30px] bg-white shadow-soft">
                <div className="border-b border-orange-100 px-5 py-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-display text-2xl font-bold text-[#23233f]">Payment Method</h3>
                      <p className="text-sm text-slate-500">Choose cash or a demo online payment option.</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Secure Demo
                    </span>
                  </div>
                </div>

                <div className="space-y-4 px-5 py-5">
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => {
                      const active = method === paymentMethod;
                      const icon =
                        method === "CASH" ? (
                          <Landmark className="h-4 w-4" />
                        ) : method === "CARD" ? (
                          <CreditCard className="h-4 w-4" />
                        ) : (
                          <Wallet className="h-4 w-4" />
                        );

                      return (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex items-center gap-2 rounded-[22px] border px-4 py-3 text-sm font-semibold transition ${
                            active
                              ? "border-orange-300 bg-[#fff3e7] text-[#ff7a1a]"
                              : "border-[rgba(255,133,36,0.14)] bg-white text-slate-600"
                          }`}
                        >
                          {icon}
                          {method === "BKASH" ? "bKash" : method}
                        </button>
                      );
                    })}
                  </div>

                  {paymentMethod === "CASH" ? (
                    <div className="rounded-[24px] bg-amber-50 px-4 py-4 text-sm text-amber-800">
                      Cash payment selected. The order will be confirmed now and payment will be collected at the table.
                    </div>
                  ) : null}

                  {paymentMethod === "CARD" ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">Cardholder Name</label>
                        <Input
                          value={cardholderName}
                          onChange={(event) => setCardholderName(event.target.value)}
                          placeholder="Alex Carter"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">Card Number</label>
                        <Input
                          value={cardNumber}
                          onChange={(event) => setCardNumber(formatCardNumber(event.target.value))}
                          placeholder="4242 4242 4242 4242"
                          inputMode="numeric"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-600">Expiry</label>
                          <Input
                            value={expiryDate}
                            onChange={(event) => setExpiryDate(formatExpiry(event.target.value))}
                            placeholder="12/28"
                            inputMode="numeric"
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-600">CVV</label>
                          <Input
                            value={cvv}
                            onChange={(event) => setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="123"
                            inputMode="numeric"
                            type="password"
                          />
                        </div>
                      </div>
                    </>
                  ) : null}

                  {paymentMethod === "BKASH" || paymentMethod === "NAGAD" || paymentMethod === "ROCKET" ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">
                          {paymentMethod === "BKASH"
                            ? "bKash Number"
                            : paymentMethod === "NAGAD"
                              ? "Nagad Number"
                              : "Rocket Number"}
                        </label>
                        <Input
                          value={mobileWalletNumber}
                          onChange={(event) =>
                            setMobileWalletNumber(event.target.value.replace(/\D/g, "").slice(0, 11))
                          }
                          placeholder="01700000000"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-600">Transaction Reference</label>
                        <Input
                          value={walletReference}
                          onChange={(event) => setWalletReference(event.target.value.toUpperCase())}
                          placeholder="TXN12345"
                        />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>

              {error ? <p className="text-sm text-rose-500">{error}</p> : null}

              <Button
                className="w-full"
                disabled={!items.length || !tableNumber?.trim() || loading}
                onClick={handleSubmit}
              >
                {loading
                  ? paymentMethod === "CASH"
                    ? "Confirming Cash Order..."
                    : "Processing Demo Payment..."
                  : paymentMethod === "CASH"
                    ? "Confirm Cash Order"
                    : `Pay ${formatCurrency(total)} And Place Order`}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="h-[640px] animate-pulse rounded-[40px] bg-orange-100/70" />
          </div>
        </main>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
