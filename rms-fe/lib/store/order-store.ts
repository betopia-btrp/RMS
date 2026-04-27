"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartItem, OrderDTO, OrderStatus, PaymentMethod, PaymentStatus } from "@/lib/types";

const ORDER_STORAGE_KEY = "restaurant-orders";
const CANCELLATION_WINDOW_MS = 5 * 60 * 1000;

type OrderStore = {
  orders: OrderDTO[];
  createOrder: (input: {
    tableNumber: string;
    items: CartItem[];
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentLast4?: string;
    paymentAccount?: string;
  }) => OrderDTO;
  upsertOrder: (order: OrderDTO) => void;
  getOrderById: (id: string) => OrderDTO | undefined;
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  cancelOrder: (id: string) => boolean;
};

type PersistedOrderStore = {
  state?: {
    orders?: OrderDTO[];
  };
  version?: number;
};

function fakeOrderId() {
  return `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
}

function isClient() {
  return typeof window !== "undefined";
}

function getOrdersSnapshot(orders: OrderDTO[]) {
  if (orders.length) {
    return orders;
  }

  return getStoredOrders();
}

export function getStoredOrders() {
  if (!isClient()) {
    return [] as OrderDTO[];
  }

  try {
    const rawValue = window.localStorage.getItem(ORDER_STORAGE_KEY);
    if (!rawValue) {
      return [] as OrderDTO[];
    }

    const parsed = JSON.parse(rawValue) as PersistedOrderStore;
    return parsed.state?.orders ?? [];
  } catch {
    return [] as OrderDTO[];
  }
}

export function getStoredOrderById(id: string) {
  return getStoredOrders().find((order) => order.id === id);
}

export function canCancelOrder(order: OrderDTO | null | undefined) {
  if (!order) {
    return false;
  }

  if (order.status !== "ORDER_TAKEN") {
    return false;
  }

  return Date.now() - new Date(order.createdAt).getTime() <= CANCELLATION_WINDOW_MS;
}

export function getCancellationTimeRemaining(order: OrderDTO | null | undefined) {
  if (!order || order.status !== "ORDER_TAKEN") {
    return 0;
  }

  return Math.max(0, CANCELLATION_WINDOW_MS - (Date.now() - new Date(order.createdAt).getTime()));
}

export function getLiveOrder(order: OrderDTO | null | undefined) {
  if (!order) {
    return null;
  }

  return order;
}

export const useOrderStore = create<OrderStore>()(
  persist(
    (set, get) => ({
      orders: [],
      createOrder: ({
        tableNumber,
        items,
        paymentMethod,
        paymentStatus,
        paymentLast4,
        paymentAccount
      }) => {
        const order: OrderDTO = {
          id: fakeOrderId(),
          tableNumber,
          total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
          status: "ORDER_TAKEN",
          paymentStatus,
          paymentMethod,
          paymentLast4,
          paymentAccount,
          estimatedReadyAt: new Date(Date.now() + 18 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          items: items.map((item, index) => ({
            id: `${item.id}-${index}-${Date.now()}`,
            menuItemId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            specialInstructions: item.specialInstructions ?? null
          }))
        };

        set((state) => ({ orders: [order, ...getOrdersSnapshot(state.orders)] }));
        return order;
      },
      upsertOrder: (order) =>
        set((state) => {
          const snapshot = getOrdersSnapshot(state.orders);
          const existing = snapshot.some((item) => item.id === order.id);
          return {
            orders: existing ? snapshot.map((item) => (item.id === order.id ? order : item)) : [order, ...snapshot]
          };
        }),
      getOrderById: (id) => {
        const localStorageOrder = getStoredOrderById(id);
        if (localStorageOrder) {
          return localStorageOrder;
        }

        return get().orders.find((item) => item.id === id);
      },
      updateOrderStatus: (id, status) =>
        set((state) => ({
          orders: getOrdersSnapshot(state.orders).map((order) =>
            order.id === id ? { ...order, status } : order
          )
        })),
      cancelOrder: (id) => {
        const order = getStoredOrderById(id) ?? get().orders.find((item) => item.id === id);
        if (!order) return false;

        if (!canCancelOrder(order)) {
          return false;
        }

        set((state) => ({
          orders: getOrdersSnapshot(state.orders).map((item) =>
            item.id === id ? { ...item, status: "CANCELLED" } : item
          )
        }));
        return true;
      }
    }),
    {
      name: ORDER_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage)
    }
  )
);

export function getOrderStats(orders: OrderDTO[]) {
  const liveOrders = orders.map((order) => getLiveOrder(order) ?? order);

  return {
    orders: liveOrders,
    totalOrders: liveOrders.length,
    revenue: liveOrders
      .filter((order) => order.status !== "CANCELLED")
      .reduce((sum, order) => sum + order.total, 0),
    activeOrders: liveOrders.filter((order) =>
      ["ORDER_TAKEN", "IN_KITCHEN", "READY"].includes(order.status)
    ).length,
    completed: liveOrders.filter((order) => order.status === "SERVED").length,
    cancelled: liveOrders.filter((order) => order.status === "CANCELLED").length
  };
}
