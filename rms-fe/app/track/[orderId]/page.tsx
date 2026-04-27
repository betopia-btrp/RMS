import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function TrackOrderPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;

  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-[36px] bg-white p-8 shadow-soft sm:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Track Order</p>
        <h1 className="font-display mt-3 text-5xl font-bold text-[#23233f]">Open live tracking for {orderId}</h1>
        <p className="mt-4 text-base leading-7 text-slate-500">
          This route keeps restaurant-specific links clean while reusing the existing live tracking board.
        </p>
        <Link href={`/track?orderId=${encodeURIComponent(orderId)}`} className="mt-6 inline-block">
          <Button>Open Live Tracking</Button>
        </Link>
      </div>
    </main>
  );
}
