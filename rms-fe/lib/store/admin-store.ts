"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { API_BASE_URL } from "@/lib/api";
import type { StaffUserDTO } from "@/lib/types";

export const STAFF_AUTH_STORAGE_KEY = "restaurant-staff-auth";
type StaffRole = "ADMIN" | "KITCHEN" | "WAITER";

type AdminStore = {
  hydrated: boolean;
  restoring: boolean;
  isAuthenticated: boolean;
  token: string | null;
  staff: (StaffUserDTO & { role: StaffRole }) | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string; role?: StaffRole }>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      hydrated: false,
      restoring: false,
      isAuthenticated: false,
      token: null,
      staff: null,
      login: async (email, password) => {
        try {
          const response = await fetch(`${API_BASE_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
          });

          if (!response.ok) {
            const payload = (await response.json().catch(() => null)) as { message?: string } | null;
            return { success: false, message: payload?.message ?? "Invalid credentials." };
          }

          const payload = (await response.json()) as {
            token: string;
            staff: StaffUserDTO & { role: StaffRole };
          };

          set({
            hydrated: true,
            restoring: false,
            isAuthenticated: true,
            token: payload.token,
            staff: payload.staff
          });

          return { success: true, role: payload.staff.role };
        } catch {
          return { success: false, message: "Could not reach the authentication server." };
        }
      },
      logout: async () => {
        const { token } = get();

        try {
          if (token) {
            await fetch(`${API_BASE_URL}/logout`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`
              }
            });
          }
        } catch {
          // Clear local auth state even if API logout fails.
        }

        set({ isAuthenticated: false, token: null, staff: null, restoring: false, hydrated: true });
      },
      restoreSession: async () => {
        const { token, restoring } = get();
        if (restoring) {
          return;
        }

        set({ restoring: true, hydrated: true });

        if (!token) {
          set({ isAuthenticated: false, staff: null, restoring: false });
          return;
        }

        try {
          const response = await fetch(`${API_BASE_URL}/me`, {
            headers: {
              Authorization: `Bearer ${token}`
            },
            cache: "no-store"
          });

          if (!response.ok) {
            set({ isAuthenticated: false, token: null, staff: null, restoring: false });
            return;
          }

          const payload = (await response.json()) as {
            staff: StaffUserDTO & { role: StaffRole };
          };

          set({ staff: payload.staff, isAuthenticated: true, restoring: false });
        } catch {
          set({ isAuthenticated: false, token: null, staff: null, restoring: false });
        }
      }
    }),
    {
      name: STAFF_AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        token: state.token
      }),
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<AdminStore> | undefined;

        return {
          ...currentState,
          token: typedPersistedState?.token ?? null,
          isAuthenticated: false,
          staff: null,
          restoring: false,
          hydrated: true
        };
      },
      onRehydrateStorage: () => (state) => {
        state?.restoreSession();
      }
    }
  )
);
