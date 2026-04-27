"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAdminStore } from "@/lib/store/admin-store";
import { useToastStore } from "@/lib/store/toast-store";

export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAdminStore((state) => state.login);
  const pushToast = useToastStore((state) => state.pushToast);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="space-y-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const result = await login(email, password);
        setLoading(false);

        if (!result.success) {
          setError(result.message ?? "Invalid credentials.");
          return;
        }

        pushToast({
          title: "Staff login successful",
          description: "Your role access has been activated for this device.",
          tone: "success"
        });

        const next = searchParams.get("next");
        if (next) {
          router.push(next);
          return;
        }

        router.push(
          result.role === "ADMIN" ? "/admin/dashboard" : result.role === "KITCHEN" ? "/kitchen" : "/staff"
        );
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Email</label>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
      </div>
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Password</label>
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          required
        />
      </div>
      <div className="rounded-[24px] bg-[#fff7f0] px-4 py-4 text-sm text-slate-500">
        Demo credentials: <span className="font-semibold text-[#23233f]">admin@savoria.local</span> / <span className="font-semibold text-[#23233f]">admin123</span>,{" "}
        <span className="font-semibold text-[#23233f]">kitchen@savoria.local</span> / <span className="font-semibold text-[#23233f]">kitchen123</span>,{" "}
        <span className="font-semibold text-[#23233f]">waiter1@savoria.local</span>, <span className="font-semibold text-[#23233f]">waiter2@savoria.local</span>,{" "}
        <span className="font-semibold text-[#23233f]">waiter3@savoria.local</span> / <span className="font-semibold text-[#23233f]">waiter123</span>
      </div>
      {error ? <p className="text-sm text-rose-500">{error}</p> : null}
      <Button className="w-full" disabled={loading}>
        {loading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
