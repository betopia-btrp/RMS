import { sampleMenuItems } from "@/lib/data/menu";
import type { MenuItemDTO, NamedOptionDTO, OrderDTO, StaffUserDTO, VenueDTO } from "@/lib/types";
import { downloadAdminReportPdf, getRestaurantName } from "@/lib/utils";

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

export type BackendMenuPayload = {
  venue?: VenueDTO;
  categories?: Array<{ category_id: string; name: string }>;
  items: MenuItemDTO[];
};

export type KitchenOrdersPayload = {
  venue_id: string;
  groups: Record<string, OrderDTO[]>;
};

export type ReadyOrdersPayload = {
  venue_id: string;
  orders: OrderDTO[];
};

export type AdminDashboardPayload = {
  venue_id: string;
  venue?: VenueDTO;
  totalOrders: number;
  revenue: number;
  activeOrders: number;
  completed: number;
  cancelled: number;
  orders: OrderDTO[];
  menuItems: MenuItemDTO[];
  staff: StaffUserDTO[];
  categories: Array<{ category_id: string; name: string }>;
  dietaryTags: NamedOptionDTO[];
  ingredients: Array<{ ingredient_id: string; name: string }>;
  allergens: Array<{ allergen_id: string; name: string; icon_code?: string | null }>;
};

export type AdminAnalyticsPayload = {
  venue_id: string;
  totalOrders: number;
  revenue: number;
  popularItems: Array<{
    menuItemId: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
};

export type AdminSettingsPayload = {
  venue: VenueDTO;
  staff: StaffUserDTO[];
};

export type AdminOrdersPayload = {
  venue_id: string;
  filters: {
    status?: string | null;
    table?: string | null;
    date?: string | null;
    payment_method?: string | null;
  };
  orders: OrderDTO[];
};

export type AdminReportPayload = {
  venue_id: string;
  venue?: VenueDTO | null;
  period: "daily" | "weekly" | "monthly";
  generated_at: string;
  date_from: string;
  date_to: string;
  totalOrders: number;
  activeOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  revenue: number;
  orders: OrderDTO[];
};

function authHeaders() {
  if (typeof window === "undefined") {
    return {} as HeadersInit;
  }

  try {
    const rawValue = window.sessionStorage.getItem("restaurant-staff-auth");
    if (!rawValue) {
      return {} as HeadersInit;
    }

    const parsed = JSON.parse(rawValue) as { state?: { token?: string | null } };
    const token = parsed.state?.token;

    return token ? ({ Authorization: `Bearer ${token}` } as HeadersInit) : ({} as HeadersInit);
  } catch {
    return {} as HeadersInit;
  }
}

async function safeJsonFetch<T>(endpoint: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...init,
      headers: {
        ...authHeaders(),
        ...(init?.headers ?? {})
      }
    });
    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export function normalizeImageUrl(input: string | undefined | null): string {
  const value = (input ?? "").trim();
  if (!value) return "";

  const duplicatedAbsolute = value.match(/^(https?:\/\/[^/]+)(https?:\/\/.+)$/i);
  const cleaned = duplicatedAbsolute ? duplicatedAbsolute[2] : value;

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    try {
      const parsed = new URL(cleaned);
      const apiOrigin = new URL(API_ORIGIN);

      // Fix previously saved localhost URLs without a port so they resolve to the active backend origin.
      if (parsed.hostname === "localhost" && !parsed.port && parsed.pathname.startsWith("/storage/")) {
        return `${apiOrigin.origin}${parsed.pathname}${parsed.search}`;
      }
    } catch {
      return cleaned;
    }

    return cleaned;
  }

  if (cleaned.startsWith("//")) {
    return `http:${cleaned}`;
  }

  if (cleaned.startsWith("/")) {
    return `${API_ORIGIN}${cleaned}`;
  }

  return cleaned;
}

function normalizeMenuItems(items: MenuItemDTO[]) {
  return items.map((item) => {
    const normalizedImage = normalizeImageUrl(item.imageUrl || item.image);
    const normalizedGallery = (item.imageUrls ?? [item.imageUrl || item.image].filter(Boolean)).map((value) =>
      normalizeImageUrl(value)
    );

    return {
      ...item,
      ingredients: item.ingredients ?? [],
      ingredientIds: item.ingredientIds ?? [],
      allergens: item.allergens ?? [],
      allergenIds: item.allergenIds ?? [],
      image: normalizedImage,
      imageUrl: normalizedImage,
      imageUrls: normalizedGallery
    };
  });
}

export async function getBackendMenu(venueId?: string): Promise<BackendMenuPayload> {
  try {
    const demoVenueId = venueId ?? process.env.NEXT_PUBLIC_DEMO_VENUE_ID;
    const endpoint = demoVenueId ? `/venues/${demoVenueId}/menu` : "/menu";

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      next: { revalidate: 15 }
    });

    if (!response.ok) {
      return { items: sampleMenuItems };
    }

    const payload = (await response.json()) as BackendMenuPayload;

    return {
      ...payload,
      items: normalizeMenuItems(payload.items)
    };
  } catch {
    return { items: sampleMenuItems };
  }
}

export async function fetchMenuSnapshot(venueId?: string) {
  const demoVenueId = venueId ?? process.env.NEXT_PUBLIC_DEMO_VENUE_ID;
  const endpoint = demoVenueId ? `/venues/${demoVenueId}/menu` : "/menu";
  const payload = await safeJsonFetch<BackendMenuPayload>(endpoint, { cache: "no-store" });
  if (!payload) {
    return null;
  }

  return {
    ...payload,
    items: normalizeMenuItems(payload.items),
  };
}

export async function createBackendOrder(payload: {
  client_request_id?: string;
  venue_id: string;
  table_label?: string;
  payment_method: string;
  payment_status: string;
  items: Array<{ item_id: string; quantity: number; special_instruction?: string }>;
}) {
  return safeJsonFetch<OrderDTO>("/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchBackendOrder(orderId: string) {
  return safeJsonFetch<OrderDTO>(`/orders/${orderId}`, { cache: "no-store" });
}

export async function cancelBackendOrder(orderId: string) {
  return safeJsonFetch<OrderDTO>(`/orders/${orderId}/cancel`, {
    method: "POST",
  });
}

export async function updateBackendOrderStatus(orderId: string, status: string) {
  return safeJsonFetch<OrderDTO>(`/orders/${orderId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export async function serveBackendOrder(orderId: string) {
  return safeJsonFetch<OrderDTO>(`/orders/${orderId}/serve`, {
    method: "PATCH",
  });
}

export async function fetchKitchenOrders() {
  return safeJsonFetch<KitchenOrdersPayload>("/kitchen/orders", { cache: "no-store" });
}

export async function fetchReadyOrders() {
  return safeJsonFetch<ReadyOrdersPayload>("/staff/ready-orders", { cache: "no-store" });
}

export async function fetchAdminDashboard() {
  const payload = await safeJsonFetch<AdminDashboardPayload>("/admin/dashboard", { cache: "no-store" });
  if (!payload) return null;

  return {
    ...payload,
    menuItems: normalizeMenuItems(payload.menuItems),
  };
}

export async function fetchAdminAnalytics() {
  return safeJsonFetch<AdminAnalyticsPayload>("/admin/analytics", { cache: "no-store" });
}

export async function fetchAdminSettings() {
  return safeJsonFetch<AdminSettingsPayload>("/admin/settings", { cache: "no-store" });
}

export async function fetchAdminOrders(filters?: {
  status?: string;
  table?: string;
  date?: string;
  payment_method?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.table) params.set("table", filters.table);
  if (filters?.date) params.set("date", filters.date);
  if (filters?.payment_method) params.set("payment_method", filters.payment_method);

  return safeJsonFetch<AdminOrdersPayload>(`/admin/orders${params.size ? `?${params.toString()}` : ""}`, {
    cache: "no-store"
  });
}

export async function downloadAdminReport(period: "daily" | "weekly" | "monthly") {
  const payload = await safeJsonFetch<AdminReportPayload>(`/admin/reports/export?period=${period}&format=json`, {
    cache: "no-store"
  });

  if (!payload) {
    return false;
  }

  downloadAdminReportPdf({
    restaurantName: payload.venue?.name ?? getRestaurantName(),
    period: payload.period,
    generatedAt: new Date(payload.generated_at).toLocaleString(),
    fromLabel: payload.date_from,
    toLabel: payload.date_to,
    totalOrders: payload.totalOrders,
    activeOrders: payload.activeOrders,
    completedOrders: payload.completedOrders,
    cancelledOrders: payload.cancelledOrders,
    revenue: payload.revenue,
    orders: payload.orders
  });

  return true;
}

export async function inviteStaffUser(data: {
  email: string;
  role: "ADMIN" | "KITCHEN" | "WAITER";
  password: string;
  name?: string;
}) {
  return safeJsonFetch<StaffUserDTO>("/admin/staff/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}
