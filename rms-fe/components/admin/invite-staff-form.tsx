"use client";

import { useState } from "react";
import { inviteStaffUser } from "@/lib/api";
import { useToastStore } from "@/lib/store/toast-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export interface InviteStaffFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function InviteStaffForm({ onSuccess, onCancel }: InviteStaffFormProps) {
  const pushToast = useToastStore((state) => state.pushToast);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"ADMIN" | "KITCHEN" | "WAITER">("WAITER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!name.trim()) {
      setError("Name is required");
      return;
    }

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!password.trim()) {
      setError("Password is required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const result = await inviteStaffUser({
        name: name.trim(),
        email: email.trim(),
        role,
        password,
      });

      if (!result) {
        setError("Failed to invite staff member. Please try again.");
        pushToast({
          title: "Invitation Failed",
          description: "Could not invite staff member. Check email format.",
          tone: "danger",
        });
        setLoading(false);
        return;
      }

      pushToast({
        title: "Staff Invited Successfully",
        description: `${result.name} (${result.role}) has been invited and can now log in.`,
        tone: "success",
      });

      // Reset form
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setRole("WAITER");
      setError("");

      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      pushToast({
        title: "Error",
        description: errorMessage,
        tone: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Name</label>
        <Input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Email</label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="staff@example.com"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Role</label>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value as "ADMIN" | "KITCHEN" | "WAITER")}
          disabled={loading}
        >
          <option value="WAITER">Waiter</option>
          <option value="KITCHEN">Kitchen Staff</option>
          <option value="ADMIN">Admin</option>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter password"
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-slate-700">Confirm Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm password"
          disabled={loading}
          required
        />
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={loading}
          className="flex-1"
        >
          {loading ? "Inviting..." : "Send Invite"}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
