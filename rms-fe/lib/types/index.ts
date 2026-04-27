export const categories = ["Food", "Drinks", "Desserts"] as const;
export type MenuCategory = (typeof categories)[number];

export const dietaryFilters = [
  "Vegetarian",
  "Vegan",
  "Halal",
  "Gluten-Free",
  "Spicy"
] as const;
export type DietaryFilter = (typeof dietaryFilters)[number];

export const orderStatuses = [
  "ORDER_TAKEN",
  "IN_KITCHEN",
  "READY",
  "SERVED",
  "CANCELLED"
] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = ["CASH", "CARD", "BKASH", "NAGAD", "ROCKET"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentStatuses = ["PAID", "PAY_ON_TABLE"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export type MenuItemDTO = {
  id: string;
  venueId?: string;
  categoryId?: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory | string;
  image?: string;
  imageUrl: string;
  imageUrls?: string[];
  tags: string[];
  dietaryLabels: string[];
  ingredients: string[];
  ingredientIds?: string[];
  allergens: string[];
  allergenIds?: string[];
  nutritionCalories: number;
  nutritionProtein: number;
  nutritionCarbs: number;
  nutritionFat?: number;
  spicy: boolean;
  vegetarian: boolean;
  vegan: boolean;
  halal: boolean;
  glutenFree: boolean;
  available: boolean;
  healthScore: number;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  specialInstructions?: string;
};

export type OrderItemDTO = {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions: string | null;
};

export type OrderDTO = {
  id: string;
  venueId?: string;
  tableId?: string | null;
  tableNumber: string;
  total: number;
  status: OrderStatus;
  workflowStatus?: "PENDING" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  paymentLast4?: string;
  paymentAccount?: string;
  estimatedReadyAt: string;
  createdAt: string;
  servedAt?: string;
  cancelledAt?: string;
  items: OrderItemDTO[];
};

export type VenueDTO = {
  venue_id: string;
  name: string;
  currency: string;
  welcome_banner?: string | null;
  service_charge_pct?: number | string;
};

export type StaffUserDTO = {
  id: string;
  venueId: string;
  name: string;
  email: string;
  role: string;
  invitedAt?: string;
  lastLoginAt?: string;
};

export type NamedOptionDTO = {
  ingredient_id?: string;
  allergen_id?: string;
  category_id?: string;
  tag_id?: string;
  name: string;
  icon_code?: string | null;
  color_code?: string | null;
};
