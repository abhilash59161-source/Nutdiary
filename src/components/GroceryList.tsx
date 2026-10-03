/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Check, 
  CheckCircle2, 
  Circle, 
  Sparkles, 
  Copy, 
  Printer, 
  Share2, 
  Filter, 
  Apple, 
  Flame, 
  Tag, 
  ListFilter,
  CheckCheck
} from "lucide-react";
import { UserProfile, FoodItem } from "../types.js";

export type GroceryCategory = 
  | "Produce" 
  | "Proteins" 
  | "Dairy" 
  | "Grains & Legumes" 
  | "Healthy Fats & Nuts" 
  | "Hydration & Beverages" 
  | "Pantry & Spices";

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: GroceryCategory;
  completed: boolean;
  addedAt: string;
}

const CATEGORY_COLORS: Record<GroceryCategory, { bg: string; text: string; border: string; emoji: string }> = {
  "Produce": { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", emoji: "🥦" },
  "Proteins": { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200", emoji: "🥩" },
  "Dairy": { bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", emoji: "🥛" },
  "Grains & Legumes": { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", emoji: "🌾" },
  "Healthy Fats & Nuts": { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", emoji: "🥑" },
  "Hydration & Beverages": { bg: "bg-teal-50", text: "text-teal-700", border: "border-teal-200", emoji: "💧" },
  "Pantry & Spices": { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", emoji: "🧂" },
};

const DEFAULT_GROCERY_ITEMS: GroceryItem[] = [
  { id: "g1", name: "Baby Spinach & Arugula", quantity: "2 large boxes", category: "Produce", completed: false, addedAt: "2026-10-01" },
  { id: "g2", name: "Skinless Chicken Breast", quantity: "1.5 kg", category: "Proteins", completed: false, addedAt: "2026-10-01" },
  { id: "g3", name: "Greek Yogurt 0% Fat", quantity: "2 large tubs (900g)", category: "Dairy", completed: true, addedAt: "2026-10-01" },
  { id: "g4", name: "Organic Rolled Oats", quantity: "1 kg bag", category: "Grains & Legumes", completed: false, addedAt: "2026-10-01" },
  { id: "g5", name: "Raw Walnuts & Almonds", quantity: "500g pouch", category: "Healthy Fats & Nuts", completed: false, addedAt: "2026-10-01" },
  { id: "g6", name: "Wild Alaskan Salmon Fillets", quantity: "4 fillets", category: "Proteins", completed: false, addedAt: "2026-10-01" },
  { id: "g7", name: "Extra Virgin Olive Oil", quantity: "1 bottle (750ml)", category: "Healthy Fats & Nuts", completed: true, addedAt: "2026-10-01" },
  { id: "g8", name: "Fresh Blueberries & Raspberries", quantity: "3 punnets", category: "Produce", completed: false, addedAt: "2026-10-01" },
];

interface GroceryListProps {
  profile: UserProfile;
  foodLogs: FoodItem[];
}

export default function GroceryList({ profile, foodLogs }: GroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem("nutdiary_grocery_list");
    return saved ? JSON.parse(saved) : DEFAULT_GROCERY_ITEMS;
  });

  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<GroceryCategory>("Produce");
  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [copied, setCopied] = useState(false);

  // Save to localStorage automatically
  useEffect(() => {
    localStorage.setItem("nutdiary_grocery_list", JSON.stringify(items));
  }, [items]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const item: GroceryItem = {
      id: `grocery_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: newItemName.trim(),
      quantity: newItemQuantity.trim() || "1 unit",
      category: newItemCategory,
      completed: false,
      addedAt: new Date().toISOString().split("T")[0],
    };

    setItems((prev) => [item, ...prev]);
    setNewItemName("");
    setNewItemQuantity("");
  };

  const handleToggleItem = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      )
    );
  };

  const handleDeleteItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCompleted = () => {
    setItems((prev) => prev.filter((item) => !item.completed));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to clear your entire grocery shopping list?")) {
      setItems([]);
    }
  };

  // Smart Curated Generator based on Goal & Clinical Archetypes
  const handleSmartGenerate = () => {
    let suggestions: Omit<GroceryItem, "id" | "completed" | "addedAt">[] = [];

    if (profile.goal === "muscle_gain") {
      suggestions = [
        { name: "Organic Eggs (Free Range)", quantity: "2 dozen", category: "Proteins" },
        { name: "Lean Turkey Mince (93/7)", quantity: "1 kg", category: "Proteins" },
        { name: "Cottage Cheese (Low Sodium)", quantity: "2 tubs", category: "Dairy" },
        { name: "Tri-Color Quinoa", quantity: "1 kg bag", category: "Grains & Legumes" },
        { name: "Natural Peanut Butter (No Added Sugar)", quantity: "1 jar", category: "Healthy Fats & Nuts" },
        { name: "Bananas & Sweet Potatoes", quantity: "2 bunches / 1.5kg", category: "Produce" },
      ];
    } else if (profile.goal === "low_carb") {
      suggestions = [
        { name: "Hass Avocados", quantity: "5 ripe", category: "Produce" },
        { name: "Grass-Fed Beef Sirloin", quantity: "800g", category: "Proteins" },
        { name: "Cauliflower Florets & Broccoli", quantity: "2 heads", category: "Produce" },
        { name: "Macadamia Nuts & Pecans", quantity: "400g pouch", category: "Healthy Fats & Nuts" },
        { name: "Coconut Oil (Cold Pressed)", quantity: "1 jar", category: "Healthy Fats & Nuts" },
        { name: "Cage-Free Eggs", quantity: "2 dozen", category: "Proteins" },
      ];
    } else if (profile.goal === "weight_loss") {
      suggestions = [
        { name: "Liquid Egg Whites", quantity: "2 cartons", category: "Proteins" },
        { name: "Cucumbers, Celery & Zucchini", quantity: "1.5 kg", category: "Produce" },
        { name: "Strawberries & Blackberries", quantity: "3 boxes", category: "Produce" },
        { name: "Canned Albacore Tuna in Springwater", quantity: "4 cans", category: "Proteins" },
        { name: "Sparkling Mineral Water (Zero Cal)", quantity: "6 pack", category: "Hydration & Beverages" },
        { name: "Chia Seeds", quantity: "250g bag", category: "Healthy Fats & Nuts" },
      ];
    } else {
      // Clean Eating / Maintenance
      suggestions = [
        { name: "Baby Kale & Spinach Medley", quantity: "2 tubs", category: "Produce" },
        { name: "Steel-Cut Oats", quantity: "1 kg", category: "Grains & Legumes" },
        { name: "Organic Brown Lentils", quantity: "500g bag", category: "Grains & Legumes" },
        { name: "Tofu or Tempeh (Non-GMO)", quantity: "3 blocks", category: "Proteins" },
        { name: "Cold-Pressed Flaxseed Oil", quantity: "1 bottle", category: "Healthy Fats & Nuts" },
        { name: "Himalayan Pink Salt & Turmeric", quantity: "1 pack", category: "Pantry & Spices" },
      ];
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const newItems: GroceryItem[] = suggestions
      .filter((s) => !items.some((item) => item.name.toLowerCase() === s.name.toLowerCase()))
      .map((s) => ({
        ...s,
        id: `gen_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        completed: false,
        addedAt: todayStr,
      }));

    if (newItems.length === 0) {
      alert("All recommended items for your target diet are already on your grocery list!");
      return;
    }

    setItems((prev) => [...newItems, ...prev]);
  };

  // Copy list text to clipboard
  const handleCopyList = async () => {
    const lines = [
      `🛒 NutDiary Grocery Shopping List`,
      `📅 Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      ``,
    ];

    const categories = Array.from(new Set(items.map((i) => i.category)));
    categories.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      if (catItems.length > 0) {
        lines.push(`--- ${cat} ---`);
        catItems.forEach((item) => {
          lines.push(`${item.completed ? "✓ [BOUGHT]" : "☐"} ${item.name} (${item.quantity})`);
        });
        lines.push("");
      }
    });

    lines.push(`Total Items: ${items.length} | Completed: ${items.filter(i => i.completed).length}`);
    lines.push(`Organized with NutDiary AI Diet Suite`);

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error("Clipboard copy failed:", e);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchesCategory = filterCategory === "All" || item.category === filterCategory;
    const matchesStatus = 
      statusFilter === "all" ? true :
      statusFilter === "pending" ? !item.completed :
      item.completed;
    return matchesCategory && matchesStatus;
  });

  const completedCount = items.filter((i) => i.completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  return (
    <div className="space-y-6" id="grocery-list-tab">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-white/20">
              <ShoppingCart className="h-5 w-5 text-white" />
            </span>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Smart Kitchen Companion
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Dietary Grocery Shopping List
          </h2>
          <p className="text-xs text-emerald-50 mt-1 max-w-xl">
            Organize whole foods, pantry staples, and clinical nutrition ingredients. Check off items while shopping or share directly with family.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleSmartGenerate}
            className="px-3.5 py-2 bg-white text-emerald-700 hover:bg-emerald-50 active:scale-[0.98] font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            title="Auto-populate nutrient-dense staples tailored to your target goal"
          >
            <Sparkles className="h-4 w-4 text-emerald-600" />
            <span>Generate for {profile.goal.replace("_", " ")}</span>
          </button>

          <button
            onClick={handleCopyList}
            className="px-3.5 py-2 bg-emerald-700/80 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer border border-emerald-500/50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied List!" : "Copy List"}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2 bg-emerald-700/80 hover:bg-emerald-700 text-white rounded-xl shadow-xs transition-colors cursor-pointer border border-emerald-500/50"
            title="Print Shopping List"
          >
            <Printer className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress & Quick Stats Card */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800">
              Shopping Progress:
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {completedCount} of {items.length} items purchased ({progressPercent}%)
            </span>
          </div>

          <div className="w-full sm:w-80 bg-slate-100 h-2.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Quick batch actions */}
        <div className="flex items-center gap-2">
          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Clear Completed ({completedCount})
            </button>
          )}

          {items.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Add New Item Form */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-emerald-600" />
          Add Item to Grocery List
        </h3>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Item name (e.g. Organic Avocados, Greek Yogurt)..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Quantity (e.g. 500g, 2 bags)..."
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as GroceryCategory)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
            >
              <option value="Produce">🥦 Produce (Fruits/Veg)</option>
              <option value="Proteins">🥩 Proteins & Seafood</option>
              <option value="Dairy">🥛 Dairy & Plant Milks</option>
              <option value="Grains & Legumes">🌾 Grains & Legumes</option>
              <option value="Healthy Fats & Nuts">🥑 Healthy Fats & Nuts</option>
              <option value="Hydration & Beverages">💧 Hydration & Drinks</option>
              <option value="Pantry & Spices">🧂 Pantry & Spices</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-xs shadow-emerald-200 transition-all flex items-center justify-center cursor-pointer"
              title="Add item"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-100 shadow-sm">
        {/* Status filter */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <span className="text-[11px] text-slate-400 font-semibold mr-1">Status:</span>
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === "all" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setStatusFilter("pending")}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === "pending" ? "bg-emerald-500 text-white font-bold" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            To Buy ({items.length - completedCount})
          </button>
          <button
            onClick={() => setStatusFilter("completed")}
            className={`px-3 py-1 rounded-lg transition-all ${
              statusFilter === "completed" ? "bg-slate-900 text-white font-bold" : "bg-slate-100 hover:bg-slate-200"
            }`}
          >
            Bought ({completedCount})
          </button>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          <span className="text-[11px] text-slate-400 font-semibold shrink-0">Category:</span>
          {["All", "Produce", "Proteins", "Dairy", "Grains & Legumes", "Healthy Fats & Nuts"].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition-all ${
                filterCategory === cat
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grocery Items List */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200">
            <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">Your shopping list is empty</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add food items manually above or tap <strong>"Generate for {profile.goal.replace("_", " ")}"</strong> to automatically populate whole foods staples!
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Produce"];

            return (
              <div
                key={item.id}
                onClick={() => handleToggleItem(item.id)}
                className={`p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                  item.completed
                    ? "bg-slate-50/80 border-slate-200 opacity-60"
                    : "bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Checkbox */}
                  <div
                    className={`h-6 w-6 rounded-lg flex items-center justify-center transition-all ${
                      item.completed
                        ? "bg-emerald-500 text-white"
                        : "border-2 border-slate-300 hover:border-emerald-500"
                    }`}
                  >
                    {item.completed && <Check className="h-4 w-4" />}
                  </div>

                  <div>
                    <span
                      className={`text-sm font-bold block transition-all ${
                        item.completed
                          ? "line-through text-slate-400"
                          : "text-slate-800"
                      }`}
                    >
                      {item.name}
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-slate-500">
                        Qty: {item.quantity}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                      >
                        {catStyle.emoji} {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
