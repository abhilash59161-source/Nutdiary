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
  Sparkles, 
  Copy, 
  Printer, 
  Filter, 
  Flame, 
  Tag, 
  ChefHat,
  DollarSign,
  Wallet,
  Receipt,
  PiggyBank,
  TrendingDown,
  Edit2,
  CheckCheck,
  Percent,
  Sliders,
  AlertCircle
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
  estimatedPrice: number;
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
  { id: "g1", name: "Baby Spinach & Arugula", quantity: "2 large boxes", category: "Produce", completed: false, addedAt: "2026-10-01", estimatedPrice: 3.99 },
  { id: "g2", name: "Skinless Chicken Breast", quantity: "1.5 kg", category: "Proteins", completed: false, addedAt: "2026-10-01", estimatedPrice: 12.50 },
  { id: "g3", name: "Greek Yogurt 0% Fat", quantity: "2 large tubs (900g)", category: "Dairy", completed: true, addedAt: "2026-10-01", estimatedPrice: 6.99 },
  { id: "g4", name: "Organic Rolled Oats", quantity: "1 kg bag", category: "Grains & Legumes", completed: false, addedAt: "2026-10-01", estimatedPrice: 3.49 },
  { id: "g5", name: "Raw Walnuts & Almonds", quantity: "500g pouch", category: "Healthy Fats & Nuts", completed: false, addedAt: "2026-10-01", estimatedPrice: 7.99 },
  { id: "g6", name: "Wild Alaskan Salmon Fillets", quantity: "4 fillets", category: "Proteins", completed: false, addedAt: "2026-10-01", estimatedPrice: 14.99 },
  { id: "g7", name: "Extra Virgin Olive Oil", quantity: "1 bottle (750ml)", category: "Healthy Fats & Nuts", completed: true, addedAt: "2026-10-01", estimatedPrice: 9.99 },
  { id: "g8", name: "Fresh Blueberries & Raspberries", quantity: "3 punnets", category: "Produce", completed: false, addedAt: "2026-10-01", estimatedPrice: 4.50 },
];

const CURRENCY_OPTIONS = ["$", "€", "£", "₹", "C$", "A$"];

const ensureItemPrices = (loadedItems: any[]): GroceryItem[] => {
  return loadedItems.map((item) => {
    if (typeof item.estimatedPrice === "number" && !isNaN(item.estimatedPrice)) {
      return item as GroceryItem;
    }
    let fallbackPrice = 3.99;
    if (item.category === "Proteins") fallbackPrice = 9.99;
    else if (item.category === "Dairy") fallbackPrice = 4.99;
    else if (item.category === "Healthy Fats & Nuts") fallbackPrice = 6.99;
    else if (item.category === "Grains & Legumes") fallbackPrice = 3.49;
    else if (item.category === "Produce") fallbackPrice = 3.99;
    else if (item.category === "Hydration & Beverages") fallbackPrice = 2.99;
    else fallbackPrice = 2.50;
    return { ...item, estimatedPrice: fallbackPrice } as GroceryItem;
  });
};

interface GroceryListProps {
  profile: UserProfile;
  foodLogs: FoodItem[];
  onNavigateToRecipes?: () => void;
}

export default function GroceryList({ profile, foodLogs, onNavigateToRecipes }: GroceryListProps) {
  const [items, setItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem("nutdiary_grocery_list");
    if (!saved) return DEFAULT_GROCERY_ITEMS;
    try {
      return ensureItemPrices(JSON.parse(saved));
    } catch {
      return DEFAULT_GROCERY_ITEMS;
    }
  });

  const [currency, setCurrency] = useState<string>(() => {
    return localStorage.getItem("nutdiary_grocery_currency") || "$";
  });

  const [weeklyBudgetTarget, setWeeklyBudgetTarget] = useState<number>(() => {
    const saved = localStorage.getItem("nutdiary_grocery_weekly_budget");
    return saved ? parseFloat(saved) : 85.0;
  });

  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudgetInput, setTempBudgetInput] = useState(weeklyBudgetTarget.toString());

  // Add Item form inputs
  const [newItemName, setNewItemName] = useState("");
  const [newItemQuantity, setNewItemQuantity] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<GroceryCategory>("Produce");

  // Inline item price edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [inlinePriceInput, setInlinePriceInput] = useState("");

  const [filterCategory, setFilterCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("all");
  const [copied, setCopied] = useState(false);

  // Save to localStorage automatically
  useEffect(() => {
    localStorage.setItem("nutdiary_grocery_list", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("nutdiary_grocery_currency", currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem("nutdiary_grocery_weekly_budget", weeklyBudgetTarget.toString());
  }, [weeklyBudgetTarget]);

  // Calculations for budget projections
  const totalProjectedCost = items.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  const purchasedCost = items.filter((i) => i.completed).reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  const remainingCost = items.filter((i) => !i.completed).reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
  
  const budgetUsagePercent = weeklyBudgetTarget > 0 
    ? Math.round((totalProjectedCost / weeklyBudgetTarget) * 100)
    : 0;

  const budgetVariance = weeklyBudgetTarget - totalProjectedCost; // >0 is under, <0 is over

  // Category Cost Breakdown
  const categoryBreakdown = (Object.keys(CATEGORY_COLORS) as GroceryCategory[]).map((cat) => {
    const catItems = items.filter((i) => i.category === cat);
    const cost = catItems.reduce((sum, i) => sum + (i.estimatedPrice || 0), 0);
    const percent = totalProjectedCost > 0 ? Math.round((cost / totalProjectedCost) * 100) : 0;
    return {
      category: cat,
      cost,
      percent,
      count: catItems.length,
      ...CATEGORY_COLORS[cat]
    };
  }).filter((c) => c.count > 0).sort((a, b) => b.cost - a.cost);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const parsedPrice = parseFloat(newItemPrice);
    const validPrice = !isNaN(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 3.99;

    const item: GroceryItem = {
      id: `grocery_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: newItemName.trim(),
      quantity: newItemQuantity.trim() || "1 unit",
      category: newItemCategory,
      completed: false,
      addedAt: new Date().toISOString().split("T")[0],
      estimatedPrice: validPrice,
    };

    setItems((prev) => [item, ...prev]);
    setNewItemName("");
    setNewItemQuantity("");
    setNewItemPrice("");
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

  const handleStartEditPrice = (item: GroceryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingItemId(item.id);
    setInlinePriceInput(item.estimatedPrice.toString());
  };

  const handleSaveInlinePrice = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const val = parseFloat(inlinePriceInput);
    if (!isNaN(val) && val >= 0) {
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, estimatedPrice: val } : item))
      );
    }
    setEditingItemId(null);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(tempBudgetInput);
    if (!isNaN(val) && val > 0) {
      setWeeklyBudgetTarget(val);
    }
    setIsEditingBudget(false);
  };

  // Smart Curated Generator based on Goal & Clinical Archetypes
  const handleSmartGenerate = () => {
    let suggestions: Omit<GroceryItem, "id" | "completed" | "addedAt">[] = [];

    if (profile.goal === "muscle_gain") {
      suggestions = [
        { name: "Organic Eggs (Free Range)", quantity: "2 dozen", category: "Proteins", estimatedPrice: 6.49 },
        { name: "Lean Turkey Mince (93/7)", quantity: "1 kg", category: "Proteins", estimatedPrice: 9.99 },
        { name: "Cottage Cheese (Low Sodium)", quantity: "2 tubs", category: "Dairy", estimatedPrice: 5.50 },
        { name: "Tri-Color Quinoa", quantity: "1 kg bag", category: "Grains & Legumes", estimatedPrice: 4.80 },
        { name: "Natural Peanut Butter (No Added Sugar)", quantity: "1 jar", category: "Healthy Fats & Nuts", estimatedPrice: 4.29 },
        { name: "Bananas & Sweet Potatoes", quantity: "2 bunches / 1.5kg", category: "Produce", estimatedPrice: 4.90 },
      ];
    } else if (profile.goal === "low_carb") {
      suggestions = [
        { name: "Hass Avocados", quantity: "5 ripe", category: "Produce", estimatedPrice: 5.49 },
        { name: "Grass-Fed Beef Sirloin", quantity: "800g", category: "Proteins", estimatedPrice: 16.50 },
        { name: "Cauliflower Florets & Broccoli", quantity: "2 heads", category: "Produce", estimatedPrice: 4.20 },
        { name: "Macadamia Nuts & Pecans", quantity: "400g pouch", category: "Healthy Fats & Nuts", estimatedPrice: 8.99 },
        { name: "Coconut Oil (Cold Pressed)", quantity: "1 jar", category: "Healthy Fats & Nuts", estimatedPrice: 7.49 },
        { name: "Cage-Free Eggs", quantity: "2 dozen", category: "Proteins", estimatedPrice: 6.20 },
      ];
    } else if (profile.goal === "weight_loss") {
      suggestions = [
        { name: "Liquid Egg Whites", quantity: "2 cartons", category: "Proteins", estimatedPrice: 6.99 },
        { name: "Cucumbers, Celery & Zucchini", quantity: "1.5 kg", category: "Produce", estimatedPrice: 4.10 },
        { name: "Strawberries & Blackberries", quantity: "3 boxes", category: "Produce", estimatedPrice: 5.80 },
        { name: "Canned Albacore Tuna in Springwater", quantity: "4 cans", category: "Proteins", estimatedPrice: 7.20 },
        { name: "Sparkling Mineral Water (Zero Cal)", quantity: "6 pack", category: "Hydration & Beverages", estimatedPrice: 3.99 },
        { name: "Chia Seeds", quantity: "250g bag", category: "Healthy Fats & Nuts", estimatedPrice: 3.50 },
      ];
    } else {
      // Clean Eating / Maintenance
      suggestions = [
        { name: "Baby Kale & Spinach Medley", quantity: "2 tubs", category: "Produce", estimatedPrice: 4.99 },
        { name: "Steel-Cut Oats", quantity: "1 kg", category: "Grains & Legumes", estimatedPrice: 3.79 },
        { name: "Organic Brown Lentils", quantity: "500g bag", category: "Grains & Legumes", estimatedPrice: 2.49 },
        { name: "Tofu or Tempeh (Non-GMO)", quantity: "3 blocks", category: "Proteins", estimatedPrice: 5.80 },
        { name: "Cold-Pressed Flaxseed Oil", quantity: "1 bottle", category: "Healthy Fats & Nuts", estimatedPrice: 8.20 },
        { name: "Himalayan Pink Salt & Turmeric", quantity: "1 pack", category: "Pantry & Spices", estimatedPrice: 3.99 },
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

  // Copy list text to clipboard with prices
  const handleCopyList = async () => {
    const lines = [
      `🛒 NutDiary Weekly Grocery Shopping List & Budget`,
      `📅 Generated: ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`,
      `💰 Total Projected Basket: ${currency}${totalProjectedCost.toFixed(2)} | Weekly Target: ${currency}${weeklyBudgetTarget.toFixed(2)}`,
      `📊 Status: ${budgetVariance >= 0 ? `Under Budget by ${currency}${budgetVariance.toFixed(2)}` : `Over Budget by ${currency}${Math.abs(budgetVariance).toFixed(2)}`}`,
      ``,
    ];

    const categories = Array.from(new Set(items.map((i) => i.category)));
    categories.forEach((cat) => {
      const catItems = items.filter((i) => i.category === cat);
      if (catItems.length > 0) {
        const catCost = catItems.reduce((sum, item) => sum + (item.estimatedPrice || 0), 0);
        lines.push(`--- ${cat} (Subtotal: ${currency}${catCost.toFixed(2)}) ---`);
        catItems.forEach((item) => {
          lines.push(
            `${item.completed ? "✓ [BOUGHT]" : "☐"} ${item.name} (${item.quantity}) - ${currency}${item.estimatedPrice.toFixed(2)}`
          );
        });
        lines.push("");
      }
    });

    lines.push(`Total Items: ${items.length} | Completed: ${items.filter(i => i.completed).length}`);
    lines.push(`Organized with NutDiary AI Diet & Budget Suite`);

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
              Smart Kitchen & Budget Companion
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Dietary Grocery Shopping & Budget Projections
          </h2>
          <p className="text-xs text-emerald-50 mt-1 max-w-xl">
            Input estimated prices per ingredient to forecast your weekly grocery budget. Keep nutrient density high while keeping grocery expenditure on target.
          </p>
        </div>

        {/* Top Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToRecipes && (
            <button
              onClick={onNavigateToRecipes}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-black text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              title="Find quick recipes you can cook with these grocery items"
            >
              <ChefHat className="h-4 w-4 text-emerald-400" />
              <span>Find Recipes With Items</span>
            </button>
          )}

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

      {/* WEEKLY SHOPPING BUDGET PROJECTION SUITE */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-md border border-slate-700/70 space-y-5">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Wallet className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Weekly Shopping Budget Forecast
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  budgetVariance >= 0 
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" 
                    : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                }`}>
                  {budgetVariance >= 0 
                    ? `✓ Under Budget (+${currency}${budgetVariance.toFixed(2)})`
                    : `⚠️ Over Target (${currency}${Math.abs(budgetVariance).toFixed(2)})`}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Live projected spend calculated from {items.length} estimated grocery items
              </p>
            </div>
          </div>

          {/* Currency selector & Budget Goal Setter */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-xs">
              <span className="text-slate-400 mr-1.5 text-[11px] font-semibold">Currency:</span>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-transparent text-emerald-400 font-bold focus:outline-none cursor-pointer text-xs"
              >
                {CURRENCY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900 text-white">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {isEditingBudget ? (
              <form onSubmit={handleSaveBudget} className="flex items-center gap-1.5 animate-in fade-in-50">
                <input
                  type="number"
                  step="0.01"
                  min="5"
                  value={tempBudgetInput}
                  onChange={(e) => setTempBudgetInput(e.target.value)}
                  className="w-20 px-2 py-1 text-xs rounded-xl bg-slate-800 border border-emerald-500 text-white font-bold text-center focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Save
                </button>
              </form>
            ) : (
              <button
                onClick={() => {
                  setTempBudgetInput(weeklyBudgetTarget.toString());
                  setIsEditingBudget(true);
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Change weekly shopping budget target"
              >
                <DollarSign className="h-3.5 w-3.5 text-emerald-400" />
                <span>Target: {currency}{weeklyBudgetTarget.toFixed(2)}</span>
                <Edit2 className="h-3 w-3 text-slate-400 ml-1" />
              </button>
            )}
          </div>
        </div>

        {/* 4-Bento Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Basket (Proj.)
            </span>
            <span className="text-xl font-black text-white block mt-0.5">
              {currency}{totalProjectedCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">All {items.length} items</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
              Purchased in Cart
            </span>
            <span className="text-xl font-black text-emerald-300 block mt-0.5">
              {currency}{purchasedCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">{completedCount} items bought</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
              Remaining to Buy
            </span>
            <span className="text-xl font-black text-amber-300 block mt-0.5">
              {currency}{remainingCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-400">{items.length - completedCount} items pending</span>
          </div>

          <div className="p-3.5 bg-white/5 rounded-2xl border border-white/10 text-center">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
              Budget Utilization
            </span>
            <span className="text-xl font-black text-indigo-300 block mt-0.5">
              {budgetUsagePercent}%
            </span>
            <span className="text-[10px] text-slate-400">of {currency}{weeklyBudgetTarget.toFixed(2)} target</span>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-slate-300">
              Projected Spend: <strong className="text-white">{currency}{totalProjectedCost.toFixed(2)}</strong>
            </span>
            <span className={budgetVariance >= 0 ? "text-emerald-400" : "text-rose-400 font-bold"}>
              {budgetVariance >= 0 
                ? `${currency}${budgetVariance.toFixed(2)} remaining under target`
                : `${currency}${Math.abs(budgetVariance).toFixed(2)} exceeds weekly budget`}
            </span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsagePercent > 100 
                  ? "bg-rose-500" 
                  : budgetUsagePercent > 85 
                  ? "bg-amber-400" 
                  : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
            />
          </div>
        </div>

        {/* Category Budget Breakdown Bar */}
        {categoryBreakdown.length > 0 && (
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Projected Cost by Food Group:
            </span>
            <div className="flex flex-wrap gap-2">
              {categoryBreakdown.map((cat) => (
                <div
                  key={cat.category}
                  className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-xl text-xs flex items-center gap-1.5"
                >
                  <span>{cat.emoji}</span>
                  <span className="text-slate-300 font-medium">{cat.category}:</span>
                  <strong className="text-white font-bold">{currency}{cat.cost.toFixed(2)}</strong>
                  <span className="text-[10px] text-emerald-400 font-semibold">({cat.percent}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Shopping Progress & Quick Batch Actions */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-800">
              Shopping Checklist Progress:
            </span>
            <span className="text-xs font-bold text-emerald-600">
              {completedCount} of {items.length} items purchased ({progressPercent}%) • {currency}{purchasedCost.toFixed(2)} spent
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

      {/* Add New Item Form With Price Field */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-emerald-600" />
          Add Item with Estimated Price
        </h3>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Item name (e.g. Organic Avocados)..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Quantity (e.g. 500g, 2 tubs)..."
              value={newItemQuantity}
              onChange={(e) => setNewItemQuantity(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <div className="sm:col-span-2">
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400 text-sm font-bold">
                {currency}
              </span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Est. Price"
                value={newItemPrice}
                onChange={(e) => setNewItemPrice(e.target.value)}
                className="w-full pl-7 pr-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <select
              value={newItemCategory}
              onChange={(e) => setNewItemCategory(e.target.value as GroceryCategory)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium h-[38px]"
            >
              <option value="Produce">🥦 Produce</option>
              <option value="Proteins">🥩 Proteins</option>
              <option value="Dairy">🥛 Dairy</option>
              <option value="Grains & Legumes">🌾 Grains</option>
              <option value="Healthy Fats & Nuts">🥑 Fats & Nuts</option>
              <option value="Hydration & Beverages">💧 Drinks</option>
              <option value="Pantry & Spices">🧂 Pantry</option>
            </select>
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              className="w-full h-full py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-xs shadow-emerald-200 transition-all flex items-center justify-center cursor-pointer min-h-[38px]"
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

      {/* Grocery Items List with Pricing Badges & Inline Price Editing */}
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200">
            <ShoppingCart className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">Your shopping list is empty</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Add food items manually above or tap <strong>"Generate for {profile.goal.replace("_", " ")}"</strong> to automatically populate whole foods staples with estimated prices!
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const catStyle = CATEGORY_COLORS[item.category] || CATEGORY_COLORS["Produce"];
            const isEditingThis = editingItemId === item.id;

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

                {/* Right Area: Estimated Price & Actions */}
                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  {/* Inline Price Pill / Editor */}
                  {isEditingThis ? (
                    <form
                      onSubmit={(e) => handleSaveInlinePrice(item.id, e)}
                      className="flex items-center gap-1 animate-in fade-in-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-xs font-bold text-slate-500">{currency}</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={inlinePriceInput}
                        onChange={(e) => setInlinePriceInput(e.target.value)}
                        className="w-16 px-1.5 py-0.5 text-xs font-black border border-emerald-500 rounded-lg text-slate-900 bg-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => handleSaveInlinePrice(item.id, e)}
                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                        title="Save price"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                    </form>
                  ) : (
                    <div
                      onClick={(e) => handleStartEditPrice(item, e)}
                      className="group/price flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all cursor-pointer"
                      title="Click to edit estimated price"
                    >
                      <span className="text-xs font-black text-slate-900 group-hover/price:text-emerald-700">
                        {currency}{item.estimatedPrice.toFixed(2)}
                      </span>
                      <Edit2 className="h-2.5 w-2.5 text-slate-400 group-hover/price:text-emerald-600 opacity-60 group-hover/price:opacity-100" />
                    </div>
                  )}

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
