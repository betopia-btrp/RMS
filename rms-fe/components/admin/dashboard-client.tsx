"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MenuItemDTO, NamedOptionDTO, OrderDTO, StaffUserDTO, VenueDTO } from "@/lib/types";
import { categories } from "@/lib/types";
import { API_BASE_URL, downloadAdminReport, fetchAdminAnalytics, fetchAdminDashboard, fetchAdminOrders, updateBackendOrderStatus } from "@/lib/api";
import { useAdminStore } from "@/lib/store/admin-store";
import { useMenuStore } from "@/lib/store/menu-store";
import { useToastStore } from "@/lib/store/toast-store";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "Food",
  healthScore: "75",
  imageUrls: [] as string[],
  tags: "Balanced, Healthy",
  dietaryLabels: "Halal",
  ingredients: "",
  allergens: "",
  nutritionCalories: "450",
  nutritionProtein: "20",
  nutritionCarbs: "30",
  nutritionFat: "12",
  vegetarian: false,
  vegan: false,
  halal: true,
  glutenFree: false,
  spicy: false
};

function canAdminMove(order: OrderDTO, target: "IN_KITCHEN" | "READY" | "SERVED") {
  if (target === "IN_KITCHEN") {
    return order.status === "ORDER_TAKEN" || order.status === "READY";
  }

  if (target === "READY") {
    return order.status === "IN_KITCHEN" || order.status === "SERVED";
  }

  return order.status === "READY";
}

function getStatusBadgeClass(status: string) {
  if (status === "SERVED") return "bg-emerald-50 text-emerald-700";
  if (status === "READY") return "bg-sky-50 text-sky-700";
  if (status === "IN_KITCHEN") return "bg-amber-50 text-amber-700";
  if (status === "ORDER_TAKEN") return "bg-orange-50 text-orange-700";
  return "bg-slate-100 text-slate-700";
}

export function DashboardClient() {
  const router = useRouter();
  const isAuthenticated = useAdminStore((state) => state.isAuthenticated);
  const staff = useAdminStore((state) => state.staff);
  const token = useAdminStore((state) => state.token);
  const logout = useAdminStore((state) => state.logout);
  const menuItems = useMenuStore((state) => state.items);
  const setMenuItems = useMenuStore((state) => state.setItems);
  const upsertItem = useMenuStore((state) => state.upsertItem);
  const deleteMenuItem = useMenuStore((state) => state.deleteItem);
  const pushToast = useToastStore((state) => state.pushToast);
  const [hydrated, setHydrated] = useState(false);
  const [period, setPeriod] = useState("Daily");
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [venueId, setVenueId] = useState("");
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});
  const [ingredientOptions, setIngredientOptions] = useState<Array<{ ingredient_id: string; name: string }>>([]);
  const [allergenOptions, setAllergenOptions] = useState<Array<{ allergen_id: string; name: string }>>([]);
  const [dietaryTagOptions, setDietaryTagOptions] = useState<NamedOptionDTO[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffUserDTO[]>([]);
  const [venue, setVenue] = useState<VenueDTO | null>(null);
  const [popularItems, setPopularItems] = useState<Array<{ name: string; quantity: number; revenue: number }>>([]);
  const [adminOrders, setAdminOrders] = useState<OrderDTO[]>([]);
  const [orderFilters, setOrderFilters] = useState({
    status: "",
    table: "",
    date: "",
    payment_method: ""
  });

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && (!isAuthenticated || staff?.role !== "ADMIN")) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, router, staff?.role]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || staff?.role !== "ADMIN") {
      return;
    }

    let mounted = true;

    async function loadMenuData() {
      try {
        const [dashboardPayload, analyticsPayload] = await Promise.all([
          fetchAdminDashboard(),
          fetchAdminAnalytics()
        ]);

        if (!mounted) return;

        if (dashboardPayload?.venue?.venue_id) {
          setVenueId(dashboardPayload.venue.venue_id);
          setVenue(dashboardPayload.venue);
        }

        if (dashboardPayload?.categories?.length) {
          setCategoryIds(
            Object.fromEntries(
              dashboardPayload.categories.map((category) => [category.name, category.category_id] as const)
            )
          );
        }

        if (dashboardPayload?.menuItems?.length) {
          setMenuItems(dashboardPayload.menuItems);
        }

        if (dashboardPayload?.ingredients?.length) {
          setIngredientOptions(dashboardPayload.ingredients);
        }

        if (dashboardPayload?.allergens?.length) {
          setAllergenOptions(dashboardPayload.allergens);
        }

        if (dashboardPayload?.dietaryTags?.length) {
          setDietaryTagOptions(dashboardPayload.dietaryTags);
        }

        if (dashboardPayload?.staff?.length) {
          setStaffMembers(dashboardPayload.staff);
        }

        if (dashboardPayload?.orders) {
          setAdminOrders(dashboardPayload.orders);
        }

        if (analyticsPayload?.popularItems?.length) {
          setPopularItems(analyticsPayload.popularItems);
        }
      } catch {
        // Keep local state as fallback.
      }
    }

    void loadMenuData();

    return () => {
      mounted = false;
    };
  }, [hydrated, isAuthenticated, setMenuItems, staff?.role]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated || staff?.role !== "ADMIN") {
      return;
    }

    let active = true;

    async function loadOrders() {
      const payload = await fetchAdminOrders({
        status: orderFilters.status || undefined,
        table: orderFilters.table || undefined,
        date: orderFilters.date || undefined,
        payment_method: orderFilters.payment_method || undefined
      });

      if (!active || !payload) {
        return;
      }

      setAdminOrders(payload.orders);
    }

    void loadOrders();
    const interval = window.setInterval(() => {
      void loadOrders();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [hydrated, isAuthenticated, orderFilters.date, orderFilters.payment_method, orderFilters.status, orderFilters.table, staff?.role]);

  const displayedOrders = adminOrders;
  const stats = useMemo(() => {
    return {
      totalOrders: displayedOrders.length,
      revenue: displayedOrders
        .filter((order) => order.status !== "CANCELLED")
        .reduce((sum, order) => sum + order.total, 0),
      activeOrders: displayedOrders.filter((order) =>
        ["ORDER_TAKEN", "IN_KITCHEN", "READY"].includes(order.status)
      ).length,
      completed: displayedOrders.filter((order) => order.status === "SERVED").length,
      cancelled: displayedOrders.filter((order) => order.status === "CANCELLED").length
    };
  }, [displayedOrders]);

  function toIdList(
    value: string,
    options: Array<{ name: string; ingredient_id?: string; allergen_id?: string; tag_id?: string }>,
    key: "ingredient_id" | "allergen_id" | "tag_id"
  ) {
    const names = value
      .split(",")
      .map((item) => item.trim().toLowerCase())
      .filter(Boolean);

    return options
      .filter((option) => names.includes(option.name.trim().toLowerCase()))
      .map((option) => option[key])
      .filter((id): id is string => Boolean(id));
  }

  async function submitMenuItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      const selectedCategoryId = categoryIds[form.category];
      if (!venueId || !selectedCategoryId) {
        pushToast({
          title: "Backend category missing",
          description: "Reload dashboard once to sync venue and category mapping.",
          tone: "warning"
        });
        return;
      }

      const payload = {
        venue_id: venueId,
        category_id: selectedCategoryId,
        name: form.name,
        description: form.description,
        price: Number(form.price),
        health_score: Number(form.healthScore),
        calories: Number(form.nutritionCalories),
        protein_g: Number(form.nutritionProtein),
        carbs_g: Number(form.nutritionCarbs),
        fat_g: Number(form.nutritionFat),
        image_url: form.imageUrls[0] ?? "",
        image_urls: form.imageUrls,
        ingredient_ids: toIdList(form.ingredients, ingredientOptions, "ingredient_id"),
        allergen_ids: toIdList(form.allergens, allergenOptions, "allergen_id"),
        tag_ids: toIdList(`${form.tags},${form.dietaryLabels}`, dietaryTagOptions, "tag_id"),
        is_available: true
      };

      const response = await fetch(
        editingId ? `${API_BASE_URL}/admin/menu-items/${editingId}` : `${API_BASE_URL}/admin/menu`,
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        pushToast({
          title: "Save failed",
          description: "Could not save this item to backend.",
          tone: "warning"
        });
        return;
      }

      const savedItem = (await response.json()) as MenuItemDTO;
      upsertItem(savedItem);
      setForm(emptyForm);
      setEditingId(null);
      pushToast({
        title: editingId ? "Menu item updated" : "Menu item added",
        description: "The item is now saved to backend and visible on customer menu.",
        tone: "success"
      });
    } catch {
      pushToast({
        title: "Save error",
        description: "Could not connect to backend API.",
        tone: "warning"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    void logout();
    pushToast({
      title: "Logged out successfully",
      description: "Admin access has been closed on this device.",
      tone: "info"
    });
    router.push("/login");
  }

  async function uploadImage(file: File) {
    setImageUploading(true);

    try {
      const body = new FormData();
      body.append("image", file);

      const response = await fetch(`${API_BASE_URL}/admin/uploads/menu-image`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body
      });

      if (!response.ok) {
        pushToast({
          title: "Image upload failed",
          description: "Please try again with a valid image file.",
          tone: "warning"
        });
        return;
      }

      const payload = (await response.json()) as { url: string };
      setForm((current) => ({
        ...current,
        imageUrls: current.imageUrls.length >= 5 ? current.imageUrls : [...current.imageUrls, payload.url]
      }));
      pushToast({
        title: "Image uploaded",
        description: "The image is stored locally and ready for this menu item.",
        tone: "success"
      });
    } catch {
      pushToast({
        title: "Upload error",
        description: "Could not reach the backend upload endpoint.",
        tone: "warning"
      });
    } finally {
      setImageUploading(false);
    }
  }

  function startEdit(item: MenuItemDTO) {
    setEditingId(item.id);
    setForm({
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      healthScore: String(item.healthScore),
      imageUrls: item.imageUrls?.length ? item.imageUrls : [item.imageUrl].filter(Boolean),
      tags: item.tags.join(", "),
      dietaryLabels: item.dietaryLabels.join(", "),
      ingredients: item.ingredients.join(", "),
      allergens: item.allergens.join(", "),
      nutritionCalories: String(item.nutritionCalories),
      nutritionProtein: String(item.nutritionProtein),
      nutritionCarbs: String(item.nutritionCarbs),
      nutritionFat: String(item.nutritionFat ?? 0),
      vegetarian: item.vegetarian,
      vegan: item.vegan,
      halal: item.halal,
      glutenFree: item.glutenFree,
      spicy: item.spicy
    });
  }

  if (!hydrated || !isAuthenticated || staff?.role !== "ADMIN") {
    return (
      <div className="space-y-8">
        <Card className="h-28 animate-pulse bg-orange-100/70"></Card>
        <Card className="h-[680px] animate-pulse bg-orange-100/70"></Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card className="hero-wave overflow-hidden bg-white px-6 py-8 sm:px-8">
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#ff7a1a]">Admin Dashboard</p>
            <h1 className="font-display mt-3 text-5xl font-bold leading-[0.98] text-[#23233f]">
              Restaurant operations at a glance
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-500">
              Manage menu publishing, live order transitions, and mock reports from one editorial control room.
            </p>
            {venue ? (
              <p className="mt-3 text-sm text-slate-500">
                Venue: <span className="font-semibold text-[#23233f]">{venue.name}</span>
                {venue.welcome_banner ? ` | ${venue.welcome_banner}` : ""}
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Link href="/menu">
              <Button variant="secondary" className="bg-white">
                Go to Menu
              </Button>
            </Link>
            <Button
              variant="secondary"
              className="bg-white"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Total Orders", String(stats.totalOrders)],
          ["Revenue", formatCurrency(stats.revenue)],
          ["Active Orders", String(stats.activeOrders)],
          ["Cancelled", String(stats.cancelled)]
        ].map(([label, value], index) => (
          <Card key={label} className={`p-6 ${index === 0 ? "section-pattern text-white" : "bg-white"}`}>
            <div className={index === 0 ? "relative z-10" : undefined}>
              <p className={`text-sm ${index === 0 ? "text-orange-50" : "text-slate-500"}`}>{label}</p>
              <h2 className={`mt-3 text-4xl font-extrabold ${index === 0 ? "text-white" : "text-[#23233f]"}`}>
                {value}
              </h2>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="bg-white p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Menu Management</p>
              <h3 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Create or update dishes</h3>
              <p className="mt-2 text-sm text-slate-500">Add, update, and control item availability.</p>
            </div>
            {editingId ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setEditingId(null);
                  setForm(emptyForm);
                }}
              >
                Cancel Edit
              </Button>
            ) : null}
          </div>

          <form className="grid gap-4 md:grid-cols-2" onSubmit={submitMenuItem}>
            <Input
              placeholder="Item name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
            />
            <div className="space-y-2">
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []).slice(0, 5 - form.imageUrls.length);
                  if (files.length) {
                    void Promise.all(files.map((file) => uploadImage(file)));
                  }
                }}
                disabled={imageUploading || form.imageUrls.length >= 5}
              />
              <div className="flex flex-wrap gap-2">
                {form.imageUrls.map((url, index) => (
                  <div key={url} className="flex items-center gap-2 rounded-full bg-[#fff4e8] px-3 py-2 text-xs text-slate-600">
                    <span>{`Image ${index + 1}`}</span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          imageUrls: current.imageUrls.filter((item) => item !== url)
                        }))
                      }
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                {imageUploading ? "Uploading image gallery..." : "Upload up to 5 images for this menu item."}
              </p>
            </div>
            <Input
              placeholder="Price"
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              required
            />
            <Select
              value={form.category}
              onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Health score"
              value={form.healthScore}
              onChange={(event) => setForm((current) => ({ ...current, healthScore: event.target.value }))}
            />
            <Input
              placeholder="Tags (comma separated)"
              value={form.tags}
              onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
            />
            <Input
              placeholder="Dietary labels"
              value={form.dietaryLabels}
              onChange={(event) =>
                setForm((current) => ({ ...current, dietaryLabels: event.target.value }))
              }
            />
            <Input
              placeholder="Ingredients (comma separated)"
              value={form.ingredients}
              onChange={(event) => setForm((current) => ({ ...current, ingredients: event.target.value }))}
            />
            <Input
              placeholder="Allergens (comma separated)"
              value={form.allergens}
              onChange={(event) => setForm((current) => ({ ...current, allergens: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Input
                placeholder="Calories"
                value={form.nutritionCalories}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nutritionCalories: event.target.value }))
                }
              />
              <Input
                placeholder="Protein"
                value={form.nutritionProtein}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nutritionProtein: event.target.value }))
                }
              />
              <Input
                placeholder="Carbs"
                value={form.nutritionCarbs}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nutritionCarbs: event.target.value }))
                }
              />
              <Input
                placeholder="Fat"
                value={form.nutritionFat}
                onChange={(event) =>
                  setForm((current) => ({ ...current, nutritionFat: event.target.value }))
                }
              />
            </div>
            <div className="md:col-span-2">
              <Textarea
                placeholder="Description"
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                required
              />
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-slate-600 md:col-span-2">
              {[
                ["vegetarian", "Vegetarian"],
                ["vegan", "Vegan"],
                ["halal", "Halal"],
                ["glutenFree", "Gluten-Free"],
                ["spicy", "Spicy"]
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 rounded-full bg-[#fff4e8] px-4 py-2">
                  <input
                    type="checkbox"
                    checked={Boolean(form[key as keyof typeof form])}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        [key]: event.target.checked
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <Button className="md:col-span-2" disabled={loading}>
              {loading ? "Saving..." : editingId ? "Update Item" : "Add Item"}
            </Button>
          </form>

          <div className="mt-8 overflow-hidden rounded-[32px] border border-orange-100">
            <table className="min-w-full divide-y divide-orange-100 text-sm">
              <thead className="bg-[#fff6ee]">
                <tr>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Category</th>
                  <th className="px-4 py-3 text-left">Price</th>
                  <th className="px-4 py-3 text-left">Availability</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-orange-100 bg-white">
                {menuItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-4 py-3 font-medium text-slate-800">{item.name}</td>
                    <td className="px-4 py-3 text-slate-500">{item.category}</td>
                    <td className="px-4 py-3 text-slate-500">{formatCurrency(item.price)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.available
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                        onClick={async () => {
                          try {
                            const response = await fetch(
                              `${API_BASE_URL}/admin/menu/${item.id}/availability`,
                              {
                                method: "PATCH",
                                headers: token ? { Authorization: `Bearer ${token}` } : undefined
                              }
                            );

                            if (!response.ok) {
                              pushToast({
                                title: "Update failed",
                                description: "Could not update item visibility in backend.",
                                tone: "warning"
                              });
                              return;
                            }

                            const updated = (await response.json()) as MenuItemDTO;
                            upsertItem(updated);
                            pushToast({
                              title: `${item.name} visibility updated`,
                              description: "Menu availability saved to backend.",
                              tone: "info"
                            });
                          } catch {
                            pushToast({
                              title: "Update error",
                              description: "Could not connect to backend API.",
                              tone: "warning"
                            });
                          }
                        }}
                      >
                        {item.available ? "Available" : "Hidden"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          className="px-3 py-2 text-xs"
                          onClick={() => startEdit(item)}
                        >
                          Edit
                        </Button>
                        <Button
                          type="button"
                          variant="danger"
                          className="px-3 py-2 text-xs"
                          onClick={async () => {
                            try {
                              const response = await fetch(`${API_BASE_URL}/admin/menu-items/${item.id}`, {
                                method: "DELETE",
                                headers: token ? { Authorization: `Bearer ${token}` } : undefined
                              });

                              if (!response.ok) {
                                pushToast({
                                  title: "Delete failed",
                                  description: "Could not delete this item from backend.",
                                  tone: "warning"
                                });
                                return;
                              }

                              deleteMenuItem(item.id);
                              pushToast({
                                title: `${item.name} removed`,
                                description: "The item has been deleted from backend.",
                                tone: "warning"
                              });
                            } catch {
                              pushToast({
                                title: "Delete error",
                                description: "Could not connect to backend API.",
                                tone: "warning"
                              });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-8">
          <Card className="bg-white p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Reports</p>
                <h3 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Performance snapshot</h3>
                <p className="mt-2 text-sm text-slate-500">Revenue and order performance overview.</p>
              </div>
              <Select value={period} onChange={(event) => setPeriod(event.target.value)} className="w-36">
                <option>Daily</option>
                <option>Weekly</option>
                <option>Monthly</option>
              </Select>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {(["Daily", "Weekly", "Monthly"] as const).map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    const ok = await downloadAdminReport(option.toLowerCase() as "daily" | "weekly" | "monthly");
                    pushToast({
                      title: ok ? `${option} report downloaded` : "Report download failed",
                      description: ok ? "PDF report has been downloaded." : "Could not generate the report right now.",
                      tone: ok ? "success" : "warning"
                    });
                  }}
                >
                  Download {option}
                </Button>
              ))}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-[28px] bg-[#fff4e8] p-4">
                <p className="text-sm text-slate-500">Orders</p>
                <p className="mt-2 text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <div className="rounded-[28px] bg-emerald-50 p-4">
                <p className="text-sm text-slate-500">Completed</p>
                <p className="mt-2 text-2xl font-bold">{stats.completed}</p>
              </div>
              <div className="rounded-[28px] bg-rose-50 p-4">
                <p className="text-sm text-slate-500">Cancelled</p>
                <p className="mt-2 text-2xl font-bold">{stats.cancelled}</p>
              </div>
              <div className="rounded-[28px] bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Revenue</p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(stats.revenue)}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[28px] bg-[#fffaf6] p-5">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Popular Items</p>
              <div className="mt-4 space-y-3">
                {popularItems.slice(0, 4).map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="font-medium text-[#23233f]">{item.name}</span>
                    <span className="text-slate-500">
                      {item.quantity} sold | {formatCurrency(item.revenue)}
                    </span>
                  </div>
                ))}
                {!popularItems.length ? <p className="text-sm text-slate-500">No analytics yet.</p> : null}
              </div>
            </div>
          </Card>

          <Card className="bg-white p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Order Dashboard</p>
            <h3 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Kitchen flow</h3>
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <Select value={orderFilters.status} onChange={(event) => setOrderFilters((current) => ({ ...current, status: event.target.value }))}>
                <option value="">All Statuses</option>
                <option value="ORDER_TAKEN">Order Taken</option>
                <option value="IN_KITCHEN">In Kitchen</option>
                <option value="READY">Ready</option>
                <option value="SERVED">Served</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
              <Input
                placeholder="Filter by table"
                value={orderFilters.table}
                onChange={(event) => setOrderFilters((current) => ({ ...current, table: event.target.value }))}
              />
              <Input
                type="date"
                value={orderFilters.date}
                onChange={(event) => setOrderFilters((current) => ({ ...current, date: event.target.value }))}
              />
              <Select value={orderFilters.payment_method} onChange={(event) => setOrderFilters((current) => ({ ...current, payment_method: event.target.value }))}>
                <option value="">Any Payment</option>
                <option value="CASH">Cash</option>
                <option value="CARD">Card</option>
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
              </Select>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>Status uses exact backend order status (default includes all statuses).</span>
              <span>Table matches table label text.</span>
              <span>Date uses the order created date.</span>
              <span>Payment uses the recorded payment method.</span>
              <Button
                type="button"
                variant="secondary"
                className="h-auto px-3 py-1.5 text-xs"
                onClick={() => setOrderFilters({ status: "", table: "", date: "", payment_method: "" })}
              >
                Clear Filters
              </Button>
            </div>
            <div className="mt-5 space-y-4">
              {displayedOrders.map((order) => (
                <div key={order.id} className="rounded-[30px] bg-[#fffaf6] p-5 shadow-soft">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-400">Order ID</p>
                      <p className="font-semibold text-slate-900">{order.id}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        Table {order.tableNumber} | {format(new Date(order.createdAt), "PPp")}
                      </p>
                    </div>
                    <Badge
                      className={getStatusBadgeClass(order.status)}
                    >
                      {order.workflowStatus ?? order.status.replaceAll("_", " ")}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {order.items.map((item) => (
                      <Badge key={item.id} className="bg-white text-slate-700">
                        {item.quantity}x {item.name}
                      </Badge>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-slate-900">{formatCurrency(order.total)}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        disabled={!canAdminMove(order, "IN_KITCHEN")}
                        onClick={async () => {
                          const updated = await updateBackendOrderStatus(order.id, "IN_KITCHEN");
                          if (updated) {
                            setAdminOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          }
                          pushToast({
                            title: `Order ${order.id} moved to In Kitchen`,
                            description: updated ? "Customers will see this update from backend." : "Could not update backend order.",
                            tone: updated ? "info" : "warning"
                          });
                        }}
                      >
                        In Kitchen
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        disabled={!canAdminMove(order, "READY")}
                        onClick={async () => {
                          const updated = await updateBackendOrderStatus(order.id, "READY");
                          if (updated) {
                            setAdminOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          }
                          pushToast({
                            title: `Order ${order.id} is ready`,
                            description: updated ? "The tracking page will reflect this update." : "Could not update backend order.",
                            tone: updated ? "success" : "warning"
                          });
                        }}
                      >
                        Ready
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3 py-2 text-xs"
                        disabled={!canAdminMove(order, "SERVED")}
                        onClick={async () => {
                          const updated = await updateBackendOrderStatus(order.id, "SERVED");
                          if (updated) {
                            setAdminOrders((current) => current.map((item) => (item.id === updated.id ? updated : item)));
                          }
                          pushToast({
                            title: `Order ${order.id} served`,
                            description: updated ? "This order has reached the final service stage." : "Could not update backend order.",
                            tone: updated ? "success" : "warning"
                          });
                        }}
                      >
                        Served
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="bg-white p-6 sm:p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Staff & Setup</p>
            <h3 className="font-display mt-2 text-4xl font-bold text-[#23233f]">Roles and menu metadata</h3>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[28px] bg-[#fffaf6] p-5">
                <p className="font-semibold text-[#23233f]">Staff roles</p>
                <div className="mt-4 space-y-3">
                  {staffMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-[#23233f]">{member.name}</span>
                      <span className="text-slate-500">{member.role}</span>
                    </div>
                  ))}
                  {!staffMembers.length ? <p className="text-sm text-slate-500">No staff loaded.</p> : null}
                </div>
              </div>
              <div className="rounded-[28px] bg-[#fffaf6] p-5 text-sm text-slate-600">
                <p className="font-semibold text-[#23233f]">Available ingredients</p>
                <p className="mt-3">{ingredientOptions.map((item) => item.name).join(", ") || "No ingredients loaded."}</p>
                <p className="mt-5 font-semibold text-[#23233f]">Available allergens</p>
                <p className="mt-3">{allergenOptions.map((item) => item.name).join(", ") || "No allergens loaded."}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
