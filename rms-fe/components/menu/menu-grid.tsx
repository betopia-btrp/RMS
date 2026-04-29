"use client";

import { useEffect, useMemo, useState } from "react";
import type { DietaryFilter, MenuCategory, MenuItemDTO } from "@/lib/types";
import { categories, dietaryFilters } from "@/lib/types";
import { MenuCard } from "@/components/menu/menu-card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMenuStore } from "@/lib/store/menu-store";

const categoryMeta: Record<MenuCategory, { marker: string; copy: string }> = {
  Food: { marker: "FD", copy: "Chef-curated plates for every craving." },
  Drinks: { marker: "DR", copy: "Coolers, mocktails, and sparkling pours." },
  Desserts: { marker: "DS", copy: "Sweet finishes for the perfect table." }
};

const INITIAL_VISIBLE_COUNT = 3;
type ActiveCategory = MenuCategory | "All";

export function MenuGrid({ items }: { items: MenuItemDTO[] }) {
  const storedItems = useMenuStore((state) => state.items);
  const setMenuItems = useMenuStore((state) => state.setItems);
  const resetMenu = useMenuStore((state) => state.resetMenu);
  const [hydrated, setHydrated] = useState(false);
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("All");
  const [activeFilters, setActiveFilters] = useState<DietaryFilter[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    if (items.length) {
      const toSignature = (menuItems: MenuItemDTO[]) =>
        menuItems
          .map(
            (item) =>
              `${item.id}:${item.available}:${item.imageUrl}:${item.imageUrls?.join(",") ?? ""}:${item.price}`
          )
          .join("|");
      const incomingSignature = toSignature(items);
      const storedSignature = toSignature(storedItems);

      if (incomingSignature !== storedSignature) {
        setMenuItems(items);
      }

      return;
    }

    const hasAllCategories = categories.every((category) =>
      storedItems.some((item) => item.category === category)
    );

    if (!storedItems.length || !hasAllCategories) {
      resetMenu();
    }
  }, [hydrated, items, resetMenu, setMenuItems, storedItems]);

  const sourceItems = hydrated ? storedItems : items;

  const filteredItems = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return sourceItems.filter((item) => {
      if (activeCategory !== "All" && item.category !== activeCategory) return false;

      const matchesDietaryFilters = activeFilters.every((filter) => {
        if (filter === "Vegetarian") return item.vegetarian;
        if (filter === "Vegan") return item.vegan;
        if (filter === "Halal") return item.halal;
        if (filter === "Gluten-Free") return item.glutenFree;
        if (filter === "Spicy") return item.spicy;
        return true;
      });

      if (!matchesDietaryFilters) return false;
      if (!normalizedSearch) return true;

      const searchable = `${item.name} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
      return searchable.includes(normalizedSearch);
    });
  }, [activeCategory, activeFilters, searchTerm, sourceItems]);

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  }, [activeCategory, activeFilters, searchTerm, sourceItems]);

  const visibleItems = filteredItems.slice(0, visibleCount);
  const hasMoreItems = visibleCount < filteredItems.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-4 lg:grid-cols-[0.82fr_1.18fr]">
        <div className="rounded-[32px] bg-white p-6 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff2e6] text-lg font-extrabold text-[#ff7a1a]">
              {activeCategory === "All" ? "ALL" : categoryMeta[activeCategory].marker}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#ff7a1a]">Category Focus</p>
              <h3 className="font-display text-3xl font-bold text-[#23233f]">{activeCategory}</h3>
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-500">
            {activeCategory === "All"
              ? "Browse everything from every category in one view."
              : categoryMeta[activeCategory].copy}
          </p>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(["All", ...categories] as ActiveCategory[]).map((category) => (
            <button
              type="button"
              key={category}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "rounded-full px-5 py-4 text-left shadow-soft transition",
                category === activeCategory
                  ? "bg-gradient-to-r from-[#ff7a1a] to-[#ff9f36] text-white"
                  : "bg-white text-slate-600 hover:bg-[#fff4e8]"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-sm font-extrabold text-[#ff7a1a]">
                  {category === "All" ? "ALL" : categoryMeta[category].marker}
                </div>
                <div>
                  <p className="text-base font-extrabold">{category}</p>
                  <p className={cn("text-xs", category === activeCategory ? "text-orange-50" : "text-slate-400")}>
                    {category === "All"
                      ? "Show items from every category."
                      : categoryMeta[category].copy}
                  </p>
                </div>
              </div>
            </button>
          ))}
          </div>

          {hasMoreItems ? (
            <div className="flex justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + INITIAL_VISIBLE_COUNT)}
                className="rounded-full bg-[#23233f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#17172b]"
              >
                Show More
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-[32px] bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-4">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search food by name, description, or tag..."
            className="w-full rounded-full border border-orange-100 bg-[#fffaf5] px-5 py-3 text-sm text-slate-700 outline-none transition focus:border-[#ff7a1a] focus:bg-white"
            aria-label="Search menu items"
          />
          <div className="flex flex-wrap items-center gap-3">
          <Badge className="bg-[#23233f] text-white">Filter Menu</Badge>
          {dietaryFilters.map((filter) => {
            const active = activeFilters.includes(filter);
            return (
              <button
                type="button"
                key={filter}
                onClick={() =>
                  setActiveFilters((current) =>
                    active ? current.filter((item) => item !== filter) : [...current, filter]
                  )
                }
              >
                <Badge
                  className={
                    active ? "border-none bg-[#ff7a1a] text-white" : "bg-[#fff7f0] text-slate-600"
                  }
                >
                  {filter}
                </Badge>
              </button>
            );
          })}
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((item) => (
          <MenuCard key={item.id} item={item} />
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="rounded-[32px] border border-dashed border-orange-200 bg-white p-12 text-center text-slate-500 shadow-soft">
          No items match the selected filters.
        </div>
      ) : null}
    </div>
  );
}
