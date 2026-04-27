import { Suspense } from "react";
import { Shield } from "lucide-react";
import { AdminLoginForm } from "@/components/admin/login-form";
import { Card } from "@/components/ui/card";

export default function StaffLoginPage() {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-7xl gap-8 lg:grid-cols-[1fr_0.92fr] lg:items-center">
        <section className="hero-wave rounded-[42px] bg-white px-8 py-12 shadow-soft sm:px-10">
          <div className="relative z-10 max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Staff Access</p>
            <h1 className="font-display mt-4 text-5xl font-bold leading-[0.98] text-[#23233f] sm:text-6xl">
              Login to access restaurant operations by role.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-slate-500">
              Admins get the full control panel, kitchen staff get the production board, and waitstaff get the ready-order handoff view.
            </p>
          </div>
        </section>

        <Card className="w-full max-w-xl justify-self-center p-8 sm:p-10">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[28px] bg-[#fff2e6] text-[#ff7a1a]">
            <Shield className="h-8 w-8" />
          </div>
          <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Secure Login</p>
          <h2 className="font-display mt-3 text-5xl font-bold text-[#23233f]">Staff Login</h2>
          <p className="mt-3 text-sm leading-7 text-slate-500">
            Sign in once to unlock the routes allowed for your staff role.
          </p>
          <div className="mt-8">
            <Suspense fallback={<div className="h-56 animate-pulse rounded-[24px] bg-orange-100/70" />}>
              <AdminLoginForm />
            </Suspense>
          </div>
        </Card>
      </div>
    </main>
  );
}
