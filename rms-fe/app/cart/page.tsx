"use client";

import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/store/cart-store";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const items = useCart((state) => state.items);
  const total = useCart((state) => state.total);
  const updateQuantity = useCart((state) => state.updateQuantity);
  const removeItem = useCart((state) => state.removeItem);

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Card className="hero-wave overflow-hidden bg-white p-8 sm:p-10">
          <div className="relative z-10">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Cart</p>
            <h1 className="font-display mt-3 text-5xl font-bold text-[#23233f]">Review everything before checkout.</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Adjust quantities, keep kitchen notes visible, and move straight into payment when the table is ready.
            </p>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="bg-white p-6 sm:p-8">
            <div className="space-y-4">
              {items.map((item) => {
                const key = `${item.id}-${item.specialInstructions ?? ""}`;

                return (
                  <div key={key} className="rounded-[28px] bg-[#fffaf6] p-4 shadow-soft">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 overflow-hidden rounded-[22px]">
                        <Image src={item.imageUrl} alt={item.name} fill className="object-cover" sizes="96px" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-display text-2xl font-bold text-[#23233f]">{item.name}</p>
                            {item.specialInstructions ? (
                              <p className="mt-2 text-sm text-slate-500">Note: {item.specialInstructions}</p>
                            ) : null}
                          </div>
                          <p className="font-semibold text-[#23233f]">{formatCurrency(item.price * item.quantity)}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-3">
                          <Button variant="secondary" onClick={() => updateQuantity(key, item.quantity - 1)}>-</Button>
                          <span className="min-w-8 text-center font-semibold text-[#23233f]">{item.quantity}</span>
                          <Button variant="secondary" onClick={() => updateQuantity(key, item.quantity + 1)}>+</Button>
                          <Button variant="danger" className="ml-auto" onClick={() => removeItem(key)}>
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!items.length ? (
                <div className="rounded-[28px] bg-[#fff7f0] p-10 text-center text-slate-500">
                  Your cart is empty. Head back to the menu and add a few dishes first.
                </div>
              ) : null}
            </div>
          </Card>

          <Card className="h-fit bg-white p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Summary</p>
            <h2 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Ready to place</h2>
            <div className="mt-6 rounded-[28px] bg-[#fffaf6] p-5">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Items</span>
                <span>{items.reduce((sum, item) => sum + item.quantity, 0)}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-lg font-bold text-[#23233f]">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/checkout">
                <Button className="w-full" disabled={!items.length}>Continue To Checkout</Button>
              </Link>
              <Link href="/menu">
                <Button variant="secondary" className="w-full">Back To Menu</Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
