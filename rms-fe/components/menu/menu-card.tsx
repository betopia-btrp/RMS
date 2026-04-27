"use client";

import Image from "next/image";
import { useState } from "react";
import { Flame, Leaf, ShieldCheck } from "lucide-react";
import type { MenuItemDTO } from "@/lib/types";
import { normalizeImageUrl } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCart } from "@/lib/store/cart-store";
import { useToastStore } from "@/lib/store/toast-store";

export function MenuCard({ item }: { item: MenuItemDTO }) {
  const addItem = useCart((state) => state.addItem);
  const openCart = useCart((state) => state.openCart);
  const pushToast = useToastStore((state) => state.pushToast);
  const [notes, setNotes] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const imageUrl = normalizeImageUrl(item.imageUrl);

  return (
    <Card className="overflow-hidden rounded-[34px] bg-white p-0">
      <div className="relative h-64">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#23233f]/70 via-transparent to-transparent" />
        <div className="absolute left-4 top-4">
          <Badge className="border-none bg-white text-[#23233f]">{item.category}</Badge>
        </div>
        <div className="absolute right-4 top-4">
          <Badge className="border-none bg-[#23233f] text-white">{formatCurrency(item.price)}</Badge>
        </div>
      </div>

      <div className="space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-3xl font-bold leading-tight text-[#23233f]">{item.name}</h3>
          </div>
          <div className="rounded-[22px] bg-[#fff4e8] px-4 py-3 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Health</p>
            <p className="mt-1 text-xl font-extrabold text-[#ff7a1a]">{item.healthScore}</p>
          </div>
        </div>

        {showDetails ? (
          <>
            <p className="text-sm leading-7 text-slate-500">{item.description}</p>

            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge key={tag} className="bg-[#fff7f0] text-slate-600">
                  {tag}
                </Badge>
              ))}
              {item.vegetarian ? (
                <Badge className="bg-emerald-50 text-emerald-700">
                  <Leaf className="mr-1 h-3.5 w-3.5" /> Vegetarian
                </Badge>
              ) : null}
              {item.halal ? (
                <Badge className="bg-sky-50 text-sky-700">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Halal
                </Badge>
              ) : null}
              {item.spicy ? (
                <Badge className="bg-rose-50 text-rose-700">
                  <Flame className="mr-1 h-3.5 w-3.5" /> Spicy
                </Badge>
              ) : null}
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-[28px] bg-[#fffaf6] p-4 text-sm shadow-soft">
              <div>
                <p className="text-slate-400">Calories</p>
                <p className="mt-1 font-bold text-[#23233f]">{item.nutritionCalories}</p>
              </div>
              <div>
                <p className="text-slate-400">Protein</p>
                <p className="mt-1 font-bold text-[#23233f]">{item.nutritionProtein}g</p>
              </div>
              <div>
                <p className="text-slate-400">Carbs</p>
                <p className="mt-1 font-bold text-[#23233f]">{item.nutritionCarbs}g</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-[28px] bg-[#fffaf6] p-4 text-sm shadow-soft">
              <div>
                <p className="text-slate-400">Ingredients</p>
                <p className="mt-1 font-medium text-[#23233f]">
                  {item.ingredients.length ? item.ingredients.join(", ") : "Prepared fresh daily."}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Allergens</p>
                <p className="mt-1 font-medium text-[#23233f]">
                  {item.allergens.length ? item.allergens.join(", ") : "No declared allergens"}
                </p>
              </div>
            </div>

            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Special instructions"
              className="w-full rounded-[22px] border border-[rgba(255,133,36,0.14)] bg-white px-4 py-3 text-sm outline-none focus:border-orange-300"
            />

            <Button
              type="button"
              className="w-full"
              onClick={() => {
                addItem(
                  {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    imageUrl,
                    specialInstructions: notes.trim() || undefined
                  },
                  1
                );
                setNotes("");
                openCart();
                pushToast({
                  title: `${item.name} added to cart`,
                  description: "Review it in your drawer or keep browsing the menu.",
                  tone: "success"
                });
              }}
            >
              Add To Cart
            </Button>
          </>
        ) : (
          <p className="text-sm leading-7 text-slate-500">
            Tap <span className="font-semibold text-slate-700">Show More</span> to view full details.
          </p>
        )}

        <Button
          type="button"
          variant="secondary"
          className="w-full"
          onClick={() => setShowDetails((current) => !current)}
        >
          {showDetails ? "Show Less" : "Show More"}
        </Button>
      </div>
    </Card>
  );
}
