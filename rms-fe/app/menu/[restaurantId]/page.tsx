import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getBackendMenu } from "@/lib/api";
import { getRestaurantName } from "@/lib/utils";
import { MenuGrid } from "@/components/menu/menu-grid";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CustomerActions } from "@/components/menu/customer-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function RestaurantMenuPage({
  params,
}: {
  params: Promise<{ restaurantId: string }>;
}) {
  const { restaurantId } = await params;
  const payload = await getBackendMenu(restaurantId);
  const restaurantName = payload.venue?.name ?? getRestaurantName();

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="glass-panel flex flex-col gap-4 rounded-[34px] border border-white/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Badge className="bg-white text-slate-500">Restaurant Menu</Badge>
            <h1 className="font-display mt-3 text-5xl font-bold text-[#23233f]">{restaurantName}</h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              QR-specific menu route with the same customer flow, ingredients, allergens, mock payment, and tracking.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <CustomerActions />
            <Link href="/checkout">
              <Button>
                Continue To Checkout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        <MenuGrid items={payload.items} />
      </div>

      <CartDrawer />
    </main>
  );
}
