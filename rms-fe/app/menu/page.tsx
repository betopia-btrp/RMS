import Image from "next/image";
import Link from "next/link";
import { ArrowDown, Sparkles, Star } from "lucide-react";
import { sampleMenuItems } from "@/lib/data/menu";
import { getRestaurantName } from "@/lib/utils";
import { MenuGrid } from "@/components/menu/menu-grid";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { CustomerActions } from "@/components/menu/customer-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getBackendMenu } from "@/lib/api";

export default async function MenuPage() {
  const restaurantName = getRestaurantName();
  const backendMenu = await getBackendMenu();
  const menuItems = backendMenu.items.length ? backendMenu.items : sampleMenuItems;

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-10">
        <header className="glass-panel flex flex-col gap-5 rounded-[34px] border border-white/70 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="font-display text-4xl font-black tracking-tight text-[#23233f]">
              SAV<span className="text-[#ff7a1a]">OR.</span>
            </div>
            <Badge className="bg-white text-slate-500">QR Ordering Experience</Badge>
          </div>
          <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#discover">Home</a>
            <a href="#menu-list">Menu</a>
          </nav>
          <CustomerActions />
        </header>


        
        <section
          id="discover"
          className="hero-wave rounded-[42px] bg-white px-6 py-10 shadow-soft sm:px-8 lg:px-12 lg:py-14"
        >
          <div className="relative z-10 grid gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
            <div className="max-w-2xl">
              <Badge className="border-none bg-[#fff1e5] text-[#ff7a1a]">
                <Sparkles className="mr-2 h-3.5 w-3.5" /> A Product by Betopia Limited
              </Badge>
              <h1 className="font-display mt-5 text-5xl font-bold leading-[0.96] text-[#23233f] sm:text-6xl">
                Enjoy our delicious meal with a beautifully guided digital menu.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-7 text-slate-500 sm:text-lg">
                Browse chef-made dishes, customize each plate, pay at the table or online, and keep
                guests updated with live tracking from a frontend-only experience.
              </p>

              <div className="mt-7 flex flex-col gap-3 rounded-full bg-white p-3 shadow-soft sm:flex-row sm:items-center">
                <div className="rounded-full bg-[#fff5ea] px-5 py-3 text-sm font-semibold text-slate-500">
                  Table-side QR dining
                </div>
                <div className="rounded-full border border-dashed border-orange-200 px-5 py-3 text-sm text-slate-500">
                  Menu, cart, checkout, tracking, admin
                </div>
                <a href="#menu-list" className="sm:ml-auto">
                  <Button className="w-full sm:w-auto">
                    Find Favorites
                    <ArrowDown className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  ["30+", "Dishes crafted"],
                  ["2 sec", "Tracking refresh"],
                  ["100%", "Fresh Food"]
                ].map(([value, label]) => (
                  <div key={label} className="rounded-[28px] bg-[#fffaf6] p-5 shadow-soft">
                    <p className="text-3xl font-extrabold text-[#ff7a1a]">{value}</p>
                    <p className="mt-2 text-sm text-slate-500">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative flex items-center justify-center lg:justify-end">
              <div className="absolute -top-5 right-[18%] hidden h-10 w-10 rounded-full bg-[#ff8a25] shadow-soft md:block" />
              <div className="absolute left-[10%] top-[16%] hidden h-6 w-6 rounded-full bg-[#8bc34a] md:block" />
              <div className="absolute bottom-[14%] right-[8%] hidden h-8 w-8 rounded-full bg-[#8bc34a] md:block" />
              <div className="absolute bottom-[8%] left-[14%] hidden h-7 w-7 rounded-full bg-[#ff8a25] shadow-soft md:block" />
              <div className="relative h-[320px] w-[320px] rounded-full bg-white p-4 shadow-plate sm:h-[420px] sm:w-[420px]">
                <div className="relative h-full w-full overflow-hidden rounded-full border-[10px] border-[#d7d5df]">
                  <Image
                    src={menuItems[0]?.imageUrl ?? "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=1000&q=80"}
                    alt={restaurantName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 320px, 420px"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-4">
          {[
            ["Fast Food", "Burgers, bowls, sandwiches"],
            ["Main Course", "Signature chef plates"],
            ["Dessert", "Cakes and sweet endings"],
            ["Drinks", "Mocktails and coolers"]
          ].map(([title, copy], index) => (
            <div
              key={title}
              className={`rounded-full px-6 py-5 shadow-soft ${
                index === 1 ? "bg-[#fff3e7] text-[#ff7a1a]" : "bg-white text-[#23233f]"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-orange-200 bg-white text-sm font-extrabold text-[#ff7a1a]">
                  {index === 0 ? "FF" : index === 1 ? "MC" : index === 2 ? "DS" : "DR"}
                </div>
                <div>
                  <p className="text-lg font-extrabold">{title}</p>
                  <p className="text-sm text-slate-500">{copy}</p>
                </div>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <div className="relative">
            <div className="absolute left-0 top-8 h-[340px] w-[340px] rounded-full bg-[#ffe8d1]" />
            <div className="relative mx-auto flex max-w-[440px] justify-center">
              <div className="relative h-[360px] w-[360px] overflow-hidden rounded-full border-[12px] border-white shadow-plate">
                <Image
                  src={menuItems[1]?.imageUrl ?? menuItems[0]?.imageUrl}
                  alt="Balanced meal"
                  fill
                  className="object-cover"
                  sizes="360px"
                />
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-[#ff7a1a]">About The Experience</p>
            <h2 className="font-display mt-3 text-4xl font-bold leading-tight text-[#23233f] sm:text-5xl">
              Food is an important part of a polished ordering journey.
            </h2>
            <div className="mt-4 h-1 w-20 rounded-full bg-[#ff7a1a]" />
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-500">
              This prototype blends the warmth of a restaurant brand with a modern ordering flow.
              Customers move from QR discovery to checkout and live tracking, while admins monitor
              operations in a bright dashboard without any backend complexity.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["9874+", "Food delivered"],
                ["8956+", "Satisfied guests"],
                ["15+", "Years inspired"]
              ].map(([value, label]) => (
                <div key={label} className="rounded-[28px] bg-white p-6 text-center shadow-soft">
                  <p className="text-3xl font-extrabold text-[#ff7a1a]">{value}</p>
                  <p className="mt-2 text-sm text-slate-500">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section-pattern rounded-[38px] px-8 py-10 text-white shadow-soft">
          <div className="relative z-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-orange-100">Easy Order Steps</p>
              <h3 className="font-display mt-3 text-4xl font-bold leading-tight">
                Always hot food delivered to your table in a few smooth steps.
              </h3>
              <Button className="mt-6 bg-[#23233f] hover:bg-[#17172b]">Order Now</Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                ["1", "Scan QR", "Open the branded digital menu instantly."],
                ["2", "Choose items", "Filter dishes and add notes for the kitchen."],
                ["3", "Pay or confirm", "Use cash, card, or wallet demo payment."],
                ["4", "Track live", "Follow status from order taken to served."]
              ].map(([step, title, copy]) => (
                <div key={title} className="rounded-[30px] bg-white/12 p-5 backdrop-blur-sm">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-lg font-extrabold text-[#ff7a1a]">
                    {step}
                  </div>
                  <p className="mt-4 text-lg font-bold">{title}</p>
                  <p className="mt-2 text-sm leading-6 text-orange-50/90">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="menu-list" className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Curated Menu</p>
              <h2 className="font-display text-4xl font-bold text-[#23233f]">Choose what fits the table</h2>
            </div>
            <div className="max-w-xl text-sm leading-7 text-slate-500">
              Filter dishes by dietary needs, compare nutrition at a glance, and build a polished cart
              experience that feels close to a premium restaurant website.
            </div>
          </div>
          <MenuGrid items={menuItems} />
        </section>

        <footer className="overflow-hidden rounded-[36px] bg-[#26263f] text-white shadow-soft">
          <div className="section-pattern px-6 py-7">
            <div className="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-3xl">
                  @
                </div>
                <div>
                  <p className="font-display text-3xl font-bold">Subscribe To Our Newsletter</p>
                  <p className="text-sm text-orange-50/90">Stay updated with new specials and product updates.</p>
                </div>
              </div>
              <div className="flex w-full max-w-xl rounded-full bg-white p-2">
                <input
                  className="min-w-0 flex-1 rounded-full border-0 bg-transparent px-4 text-sm text-slate-600 outline-none"
                  placeholder="Your Email..."
                />
                <Button className="bg-[#23233f] hover:bg-[#17172b]">Subscribe Now</Button>
              </div>
            </div>
          </div>
          <div className="grid gap-8 px-6 py-10 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="font-display text-4xl font-black tracking-tight">
                SAV<span className="text-[#ff7a1a]">OR.</span>
              </div>
              <p className="mt-4 max-w-xs text-sm leading-7 text-slate-300">
                A frontend-only restaurant ordering prototype with menu discovery, checkout, tracking,
                and admin operations built for a polished SaaS presentation.
              </p>
            </div>
            <div>
              <p className="text-lg font-bold">Links</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <Link href="/menu">Home</Link>
                <Link href="/checkout">Checkout</Link>
                <Link href="/track">Track Order</Link>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold">Highlights</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>Order from any table</p>
                <p>Follow delivery status</p>
                <p>Get important notices</p>
                <p>Manage orders locally</p>
              </div>
            </div>
            <div>
              <p className="text-lg font-bold">Contact Us</p>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p>203 Demo Street, Dining City</p>
                <p>+1 934 759 8561</p>
                <p>hello@savoria.local</p>
                <div className="flex items-center gap-1 text-orange-300">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                  <span className="ml-2 text-sm text-slate-300">Guest rated experience</span>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>

      <CartDrawer />
    </main>
  );
}
