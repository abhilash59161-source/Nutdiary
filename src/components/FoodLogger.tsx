/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Utensils, 
  Sparkles, 
  CheckCircle, 
  ArrowRight,
  Info,
  Layers,
  ChevronRight
} from "lucide-react";
import { FoodItem, SearchResult } from "../types.js";

interface FoodLoggerProps {
  foodLogs: FoodItem[];
  onAddLog: (item: Omit<FoodItem, "id">) => void;
  onDeleteLog: (id: string) => void;
  selectedDate: string;
  initialMealType?: "breakfast" | "lunch" | "dinner" | "snack";
}

export default function FoodLogger({
  foodLogs,
  onAddLog,
  onDeleteLog,
  selectedDate,
  initialMealType,
}: FoodLoggerProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchSource, setSearchSource] = useState<"catalog" | "gemini" | null>(null);

  // Manual input state
  const [manualName, setManualName] = useState("");
  const [manualCalories, setManualCalories] = useState<number | "">("");
  const [manualProtein, setManualProtein] = useState<number | "">("");
  const [manualCarbs, setManualCarbs] = useState<number | "">("");
  const [manualFat, setManualFat] = useState<number | "">("");
  const [manualServingSize, setManualServingSize] = useState("100g");

  // Log configuration state (meal type and multiplier)
  const [targetMeal, setTargetMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">(
    initialMealType || "breakfast"
  );

  useEffect(() => {
    if (initialMealType) {
      setTargetMeal(initialMealType);
    }
  }, [initialMealType]);
  const [portionMultiplier, setPortionMultiplier] = useState(1);
  const [activeTab, setActiveTab] = useState<"search" | "manual" | "explore">("search");

  // Local directory catalog loaded from backend
  const [healthyCatalog, setHealthyCatalog] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    // Fetch healthy directory catalog
    fetch("/api/healthy-foods")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.catalog) {
          setHealthyCatalog(data.catalog);
        }
      })
      .catch((err) => console.error("Error loading healthy catalog:", err));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError(null);
    setSearchResult(null);
    setSearchSource(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await response.json();
      if (data.success) {
        setSearchResult(data.result);
        setSearchSource(data.source);
      } else {
        setSearchError(data.error || "Failed to retrieve nutrition details.");
      }
    } catch (error: any) {
      setSearchError(error.message || "Network error. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFromSearch = () => {
    if (!searchResult) return;
    onAddLog({
      name: searchResult.name,
      calories: Math.round(searchResult.calories * portionMultiplier),
      protein: parseFloat((searchResult.protein * portionMultiplier).toFixed(1)),
      carbs: parseFloat((searchResult.carbs * portionMultiplier).toFixed(1)),
      fat: parseFloat((searchResult.fat * portionMultiplier).toFixed(1)),
      servingSize: searchResult.servingSize,
      servingAmount: portionMultiplier,
      mealType: targetMeal,
      loggedAt: selectedDate,
      healthScore: searchResult.healthScore,
      benefits: searchResult.benefits,
    });

    // Reset states
    setSearchResult(null);
    setSearchQuery("");
    setPortionMultiplier(1);
  };

  const handleAddManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || manualCalories === "") return;

    onAddLog({
      name: manualName,
      calories: Number(manualCalories),
      protein: manualProtein !== "" ? Number(manualProtein) : 0,
      carbs: manualCarbs !== "" ? Number(manualCarbs) : 0,
      fat: manualFat !== "" ? Number(manualFat) : 0,
      servingSize: manualServingSize || "1 portion",
      servingAmount: 1,
      mealType: targetMeal,
      loggedAt: selectedDate,
    });

    // Clear form
    setManualName("");
    setManualCalories("");
    setManualProtein("");
    setManualCarbs("");
    setManualFat("");
    setManualServingSize("100g");
  };

  const handleAddDirect = (food: any, meal: "breakfast" | "lunch" | "dinner" | "snack") => {
    onAddLog({
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      servingSize: food.servingSize,
      servingAmount: 1,
      mealType: meal,
      loggedAt: selectedDate,
      healthScore: food.healthScore,
      benefits: food.benefits,
    });
  };

  // Group logged foods for current day
  const filteredLogs = foodLogs.filter((log) => log.loggedAt === selectedDate);
  const meals: ("breakfast" | "lunch" | "dinner" | "snack")[] = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
  ];

  const mealMeta = {
    breakfast: { title: "Breakfast", icon: "🍳" },
    lunch: { title: "Lunch", icon: "🥗" },
    dinner: { title: "Dinner", icon: "🍗" },
    snack: { title: "Snack & Beverages", icon: "🍎" },
  };

  // Filter healthy items in Directory Tab
  const categories = ["All", "Fruits", "Vegetables", "Proteins", "Grains", "Fats & Nuts", "Beverages"];
  const filteredHealthyCatalog = healthyCatalog.filter(
    (item) => selectedCategory === "All" || item.category === selectedCategory
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="food-logger-tab">
      
      {/* LEFT COLUMN: Food Input Panel (Search/Manual/Explore) */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Sub Tab headers */}
          <div className="flex border-b border-slate-100 bg-slate-50/50">
            <button
              onClick={() => setActiveTab("search")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "search"
                  ? "border-emerald-500 text-emerald-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Search className="h-4 w-4" />
              Dynamic AI Search
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "manual"
                  ? "border-emerald-500 text-emerald-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Plus className="h-4 w-4" />
              Quick Custom Log
            </button>
            <button
              onClick={() => setActiveTab("explore")}
              className={`flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors border-b-2 ${
                activeTab === "explore"
                  ? "border-emerald-500 text-emerald-600 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="h-4 w-4" />
              Healthy Directory
            </button>
          </div>

          <div className="p-6">
            {/* 1. DYNAMIC AI SEARCH */}
            {activeTab === "search" && (
              <div className="space-y-6">
                <div className="text-sm text-slate-500">
                  Search any product or meal in the world. NutriTrack will use its catalog database, or activate 
                  <strong className="text-emerald-600"> Gemini AI</strong> to estimate precise nutritional facts instantly.
                </div>

                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search e.g. Paneer Butter Masala, Sourdough bread, Matcha..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || !searchQuery.trim()}
                    className="px-5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                  >
                    {isSearching ? "Searching..." : "Search"}
                  </button>
                </form>

                {searchError && (
                  <div className="p-3.5 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold">
                    {searchError}
                  </div>
                )}

                {/* Display Search Results */}
                {searchResult && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{searchResult.name}</h4>
                        <span className="text-xs text-slate-500">
                          Serving size: {searchResult.servingSize}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                          Score: {searchResult.healthScore}/100
                        </span>
                        {searchSource === "gemini" && (
                          <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center justify-end gap-0.5">
                            <Sparkles className="h-3 w-3" /> Gemini Verified
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Macro block grids */}
                    <div className="grid grid-cols-4 gap-2 text-center bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Calories</span>
                        <strong className="text-base font-extrabold text-slate-800">{searchResult.calories}</strong>
                        <span className="text-[10px] text-slate-400 block">kcal</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Protein</span>
                        <strong className="text-base font-extrabold text-indigo-500">{searchResult.protein}g</strong>
                        <span className="text-[10px] text-slate-400 block">g</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Carbs</span>
                        <strong className="text-base font-extrabold text-amber-500">{searchResult.carbs}g</strong>
                        <span className="text-[10px] text-slate-400 block">g</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-400 block font-medium">Fat</span>
                        <strong className="text-base font-extrabold text-rose-500">{searchResult.fat}g</strong>
                        <span className="text-[10px] text-slate-400 block">g</span>
                      </div>
                    </div>

                    {/* Key Benefits */}
                    {searchResult.benefits && searchResult.benefits.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Health Benefits</span>
                        <ul className="space-y-1">
                          {searchResult.benefits.map((benefit, i) => (
                            <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <hr className="border-slate-200/60" />

                    {/* Portion multiplier and meal type logger */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Meal Type</label>
                        <select
                          value={targetMeal}
                          onChange={(e) => setTargetMeal(e.target.value as any)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="breakfast">Breakfast</option>
                          <option value="lunch">Lunch</option>
                          <option value="dinner">Dinner</option>
                          <option value="snack">Snack</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">Servings Portion</label>
                        <div className="flex items-center">
                          <input
                            type="number"
                            step="0.25"
                            min="0.25"
                            max="10"
                            value={portionMultiplier}
                            onChange={(e) => setPortionMultiplier(parseFloat(e.target.value) || 1)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                          <span className="text-xs text-slate-400 ml-2">x portion</span>
                        </div>
                      </div>

                      <button
                        onClick={handleAddFromSearch}
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm shadow-emerald-100"
                      >
                        <Plus className="h-4 w-4" />
                        Log into Diary
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. MANUAL DIARY LOGGING */}
            {activeTab === "manual" && (
              <form onSubmit={handleAddManual} className="space-y-4">
                <div className="text-sm text-slate-500 mb-4">
                  Add a custom dish or branded product from your pantry manually by filling out the macro specs.
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Food Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Grandma's Apple Pie"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Serving Unit</label>
                    <input
                      type="text"
                      placeholder="e.g. 1 slice (120g)"
                      value={manualServingSize}
                      onChange={(e) => setManualServingSize(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Calories (kcal) *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="0"
                      value={manualCalories}
                      onChange={(e) => setManualCalories(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Protein (g)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={manualProtein}
                      onChange={(e) => setManualProtein(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Carbs (g)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={manualCarbs}
                      onChange={(e) => setManualCarbs(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Fats (g)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={manualFat}
                      onChange={(e) => setManualFat(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Log to Meal</label>
                    <select
                      value={targetMeal}
                      onChange={(e) => setTargetMeal(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="breakfast">Breakfast</option>
                      <option value="lunch">Lunch</option>
                      <option value="dinner">Dinner</option>
                      <option value="snack">Snack</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm"
                    >
                      Log Manual Item
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* 3. HEALTHY FOODS DIRECTORY EXPLORER */}
            {activeTab === "explore" && (
              <div className="space-y-4">
                <div className="text-sm text-slate-500">
                  Quick-log from our curated healthy superfoods. These represent dense sources of essential vitamins 
                  and clean macros, excellent for standard wellness.
                </div>

                {/* Categories badges */}
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                        selectedCategory === cat
                          ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                          : "bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Food list items */}
                <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl divide-y divide-slate-100 bg-white">
                  {filteredHealthyCatalog.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs">
                      No matching foods in this category.
                    </div>
                  ) : (
                    filteredHealthyCatalog.map((food, i) => (
                      <div key={i} className="p-3 hover:bg-slate-50 transition-colors flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm">{food.name}</span>
                            <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 font-bold rounded-full">
                              Score: {food.healthScore}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{food.description}</p>
                          <div className="flex gap-3 text-[10px] text-slate-400 mt-1 font-mono">
                            <span>{food.calories} kcal ({food.servingSize})</span>
                            <span>P: {food.protein}g</span>
                            <span>C: {food.carbs}g</span>
                            <span>F: {food.fat}g</span>
                          </div>
                        </div>

                        {/* Quick-log action menu */}
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleAddDirect(food, "breakfast")}
                            className="p-1 hover:bg-indigo-50 text-indigo-600 rounded text-xs font-bold"
                            title="Add to Breakfast"
                          >
                            🍳 B
                          </button>
                          <button
                            onClick={() => handleAddDirect(food, "lunch")}
                            className="p-1 hover:bg-emerald-50 text-emerald-600 rounded text-xs font-bold"
                            title="Add to Lunch"
                          >
                            🥗 L
                          </button>
                          <button
                            onClick={() => handleAddDirect(food, "dinner")}
                            className="p-1 hover:bg-amber-50 text-amber-600 rounded text-xs font-bold"
                            title="Add to Dinner"
                          >
                            🍗 D
                          </button>
                          <button
                            onClick={() => handleAddDirect(food, "snack")}
                            className="p-1 hover:bg-rose-50 text-rose-600 rounded text-xs font-bold"
                            title="Add to Snack"
                          >
                            🍎 S
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Food Journal / Log Display */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-1.5">
              <Utensils className="h-5 w-5 text-emerald-500" />
              Food Intake Journal
            </h3>
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {filteredLogs.length} items logged
            </span>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="h-14 w-14 rounded-full bg-slate-50 flex items-center justify-center mx-auto text-slate-300">
                <Utensils className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-700">Daily Journal is Empty</h4>
                <p className="text-xs text-slate-400 max-w-[220px] mx-auto mt-1">
                  Start searching products, exploring healthy superfoods, or uploading photos to log meals.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {meals.map((mealType) => {
                const mealLogs = filteredLogs.filter((log) => log.mealType === mealType);
                if (mealLogs.length === 0) return null;

                const mealCals = mealLogs.reduce((sum, log) => sum + log.calories * log.servingAmount, 0);

                return (
                  <div key={mealType} className="space-y-2.5">
                    <div className="flex justify-between items-center text-xs font-bold border-b border-slate-100 pb-1">
                      <span className="text-slate-800 flex items-center gap-1">
                        <span className="text-sm">{mealMeta[mealType].icon}</span>
                        {mealMeta[mealType].title}
                      </span>
                      <span className="text-emerald-600 font-bold">{Math.round(mealCals)} kcal</span>
                    </div>

                    <div className="space-y-1.5">
                      {mealLogs.map((log) => (
                        <div
                          key={log.id}
                          className="flex justify-between items-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100/70 border border-slate-100 text-xs transition-colors group"
                        >
                          <div className="flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-800">{log.name}</span>
                              {log.healthScore && (
                                <span className="px-1.5 py-0.5 bg-emerald-50 text-[9px] text-emerald-700 font-bold rounded-full border border-emerald-100">
                                  H:{log.healthScore}
                                </span>
                              )}
                            </div>
                            <div className="flex gap-2.5 text-[10px] text-slate-400 mt-1 font-mono">
                              <span>Portion: {log.servingAmount > 1 ? `${log.servingAmount}x ` : ""}{log.servingSize}</span>
                              <span>P: {Math.round(log.protein * log.servingAmount)}g</span>
                              <span>C: {Math.round(log.carbs * log.servingAmount)}g</span>
                              <span>F: {Math.round(log.fat * log.servingAmount)}g</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700">{Math.round(log.calories * log.servingAmount)} kcal</span>
                            <button
                              onClick={() => onDeleteLog(log.id)}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                              title="Delete log"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              <hr className="border-slate-100" />

              {/* Day totals */}
              <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/50 text-xs space-y-2">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Total Calories Logged:</span>
                  <span className="text-sm font-extrabold text-emerald-700">
                    {Math.round(filteredLogs.reduce((sum, log) => sum + log.calories * log.servingAmount, 0))} kcal
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-emerald-200/40 text-[10px] font-mono text-slate-600">
                  <div>
                    <span className="block font-medium">Protein</span>
                    <strong className="text-slate-800">
                      {Math.round(filteredLogs.reduce((sum, log) => sum + log.protein * log.servingAmount, 0))}g
                    </strong>
                  </div>
                  <div>
                    <span className="block font-medium">Carbs</span>
                    <strong className="text-slate-800">
                      {Math.round(filteredLogs.reduce((sum, log) => sum + log.carbs * log.servingAmount, 0))}g
                    </strong>
                  </div>
                  <div>
                    <span className="block font-medium">Fats</span>
                    <strong className="text-slate-800">
                      {Math.round(filteredLogs.reduce((sum, log) => sum + log.fat * log.servingAmount, 0))}g
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
