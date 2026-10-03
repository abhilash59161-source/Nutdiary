/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Check, 
  Plus, 
  Flame, 
  Dumbbell, 
  Clock, 
  Utensils, 
  RefreshCw, 
  Search, 
  ShoppingCart, 
  Target, 
  CheckCircle2,
  Tag,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Apple
} from "lucide-react";
import { UserProfile, FoodItem, SmartFoodSuggestion, SmartSuggestionsResponse } from "../types.js";

interface SmartFoodSuggestionsProps {
  profile: UserProfile;
  foodLogs: FoodItem[];
  selectedDate: string;
  onAddLog: (item: Omit<FoodItem, "id">) => void;
  onNavigateToGroceries?: () => void;
  defaultMealType?: "all" | "breakfast" | "lunch" | "dinner" | "snack";
}

export default function SmartFoodSuggestions({
  profile,
  foodLogs,
  selectedDate,
  onAddLog,
  onNavigateToGroceries,
  defaultMealType = "all",
}: SmartFoodSuggestionsProps) {
  const [mealFilter, setMealFilter] = useState<"all" | "breakfast" | "lunch" | "dinner" | "snack">(defaultMealType);
  const [preferenceFilter, setPreferenceFilter] = useState<string>("balanced");
  const [cravingQuery, setCravingQuery] = useState<string>("");
  const [tailorToRemaining, setTailorToRemaining] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [suggestionsData, setSuggestionsData] = useState<SmartSuggestionsResponse | null>(null);
  const [loggedIds, setLoggedIds] = useState<Record<string, boolean>>({});
  const [groceriesAddedIds, setGroceriesAddedIds] = useState<Record<string, boolean>>({});
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Calculate today's logged intake
  const todaysLogs = foodLogs.filter((log) => log.loggedAt === selectedDate);
  const consumedCalories = todaysLogs.reduce((sum, item) => sum + (item.calories || 0), 0);
  const consumedProtein = todaysLogs.reduce((sum, item) => sum + (item.protein || 0), 0);
  const consumedCarbs = todaysLogs.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const consumedFat = todaysLogs.reduce((sum, item) => sum + (item.fat || 0), 0);

  const remainingCalories = Math.max(0, profile.targetCalories - consumedCalories);
  const remainingProtein = Math.max(0, profile.targetProtein - consumedProtein);
  const remainingCarbs = Math.max(0, profile.targetCarbs - consumedCarbs);
  const remainingFat = Math.max(0, profile.targetFat - consumedFat);

  const calProgress = Math.min(100, Math.round((consumedCalories / Math.max(1, profile.targetCalories)) * 100));
  const proteinProgress = Math.min(100, Math.round((consumedProtein / Math.max(1, profile.targetProtein)) * 100));

  const fetchSuggestions = async (cQuery?: string) => {
    setIsLoading(true);
    setErrorNotice(null);

    const activeCraving = cQuery !== undefined ? cQuery : cravingQuery;

    try {
      const response = await fetch("/api/smart-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile,
          remainingCalories: tailorToRemaining ? remainingCalories : undefined,
          remainingProtein: tailorToRemaining ? remainingProtein : undefined,
          remainingCarbs: tailorToRemaining ? remainingCarbs : undefined,
          remainingFat: tailorToRemaining ? remainingFat : undefined,
          mealType: mealFilter,
          preferenceFilter,
          queryCraving: activeCraving.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (data.success && data.data) {
        setSuggestionsData(data.data);
      } else {
        throw new Error(data.error || "Failed to load suggestions.");
      }
    } catch (err: any) {
      console.warn("Smart Food Suggestions Fetch Error:", err);
      setErrorNotice("Loaded offline suggestions tailored directly to your macro balance.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [mealFilter, preferenceFilter, tailorToRemaining]);

  const handleLogSuggestion = (suggestion: SmartFoodSuggestion) => {
    onAddLog({
      name: suggestion.name,
      calories: suggestion.calories,
      protein: suggestion.protein,
      carbs: suggestion.carbs,
      fat: suggestion.fat,
      servingSize: suggestion.portion,
      servingAmount: 1,
      mealType: suggestion.mealType,
      loggedAt: selectedDate,
      healthScore: 95,
      benefits: [suggestion.goalFit, suggestion.whyRecommended],
    });

    setLoggedIds((prev) => ({ ...prev, [suggestion.id]: true }));
    setTimeout(() => {
      setLoggedIds((prev) => ({ ...prev, [suggestion.id]: false }));
    }, 4000);
  };

  const handleAddIngredientsToGrocery = (suggestion: SmartFoodSuggestion) => {
    const saved = localStorage.getItem("nutdiary_grocery_list");
    let currentGroceries: any[] = saved ? JSON.parse(saved) : [];

    const newItems = suggestion.ingredients.map((ing, idx) => ({
      id: `smart_g_${Date.now()}_${idx}`,
      name: ing,
      quantity: "1 serving",
      category: suggestion.mealType === "breakfast" ? "Produce" : "Proteins",
      completed: false,
      addedAt: selectedDate,
      estimatedPrice: 3.50,
    }));

    const updated = [...newItems, ...currentGroceries];
    localStorage.setItem("nutdiary_grocery_list", JSON.stringify(updated));

    setGroceriesAddedIds((prev) => ({ ...prev, [suggestion.id]: true }));
    setTimeout(() => {
      setGroceriesAddedIds((prev) => ({ ...prev, [suggestion.id]: false }));
    }, 4000);
  };

  const goalTitleMap: Record<string, string> = {
    weight_loss: "Weight Loss & Fat Burning",
    muscle_gain: "Hypertrophy & Muscle Gain",
    maintenance: "Weight Maintenance & Vitality",
    low_carb: "Low Carb & Ketogenic Focus",
    clean_eating: "Clean Eating & Whole Foods",
  };

  const mealColorMap: Record<string, { badge: string; bg: string; icon: string }> = {
    breakfast: { badge: "bg-amber-100 text-amber-800 border-amber-200", bg: "from-amber-500/10 to-orange-500/5", icon: "🍳" },
    lunch: { badge: "bg-emerald-100 text-emerald-800 border-emerald-200", bg: "from-emerald-500/10 to-teal-500/5", icon: "🥗" },
    dinner: { badge: "bg-indigo-100 text-indigo-800 border-indigo-200", bg: "from-indigo-500/10 to-blue-500/5", icon: "🍲" },
    snack: { badge: "bg-rose-100 text-rose-800 border-rose-200", bg: "from-rose-500/10 to-pink-500/5", icon: "🍎" },
  };

  return (
    <div className="space-y-6">
      {/* HERO BANNER: NUTRITIONAL PROFILE & MACRO TARGET PROGRESS */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              Nutritional Profile Intelligence
            </div>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              Smart Food Suggestions
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed">
              Precision food recommendations calibrated to your{" "}
              <span className="text-emerald-400 font-bold underline underline-offset-2">
                {goalTitleMap[profile.goal] || profile.goal}
              </span>{" "}
              profile. Designed to help you seamlessly hit your {profile.targetCalories} kcal, {profile.targetProtein}g protein, {profile.targetCarbs}g carbs, and {profile.targetFat}g fat targets.
            </p>
          </div>

          {/* Quick Macro Target Bento Card */}
          <div className="bg-slate-800/80 backdrop-blur-md border border-slate-700 p-5 rounded-2xl flex-shrink-0 min-w-[280px]">
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-emerald-400" /> Daily Target
              </span>
              <span className="text-sm font-black text-emerald-400">
                {profile.targetCalories} kcal
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-indigo-400" /> Protein ({profile.targetProtein}g)
                </span>
                <span className="font-mono font-bold text-white">
                  {consumedProtein}g / {profile.targetProtein}g
                </span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-indigo-400 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${proteinProgress}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-slate-300 pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-400" /> Calories ({profile.targetCalories} kcal)
                </span>
                <span className="font-mono font-bold text-white">
                  {consumedCalories} / {profile.targetCalories}
                </span>
              </div>
              <div className="w-full bg-slate-700/60 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-400 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${calProgress}%` }}
                />
              </div>
            </div>

            {/* Remaining budget badge */}
            <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Remaining Today:</span>
              <span className="font-bold text-emerald-300">
                {remainingCalories} kcal • {remainingProtein}g P
              </span>
            </div>
          </div>
        </div>

        {/* DIETITIAN SUMMARY BRIEF */}
        {suggestionsData?.summary && (
          <div className="mt-6 pt-5 border-t border-slate-700/70 text-xs sm:text-sm text-emerald-200/90 flex items-start gap-2.5 bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-800/40">
            <Sparkles className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="leading-snug">{suggestionsData.summary}</p>
          </div>
        )}
      </div>

      {/* CONTROLS BAR: MEAL TABS, PREFERENCES, SEARCH & REMAINING TOGGLE */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Meal Type Filter Tabs */}
          <div className="flex items-center flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Meals", icon: "✨" },
              { id: "breakfast", label: "Breakfast", icon: "🍳" },
              { id: "lunch", label: "Lunch", icon: "🥗" },
              { id: "dinner", label: "Dinner", icon: "🍲" },
              { id: "snack", label: "Snacks", icon: "🍎" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setMealFilter(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mealFilter === tab.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Refresh button & Toggle Tailored to Remaining */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={tailorToRemaining}
                onChange={(e) => setTailorToRemaining(e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
              />
              <span>Fit Remaining Budget ({remainingCalories} kcal)</span>
            </label>

            <button
              onClick={() => fetchSuggestions()}
              disabled={isLoading}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 flex items-center gap-1.5 transition-all disabled:opacity-50"
              title="Refresh suggestions"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* SECOND ROW: PREFERENCE CHIPS & CRAVING SEARCH */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Preference chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
              <SlidersHorizontal className="h-3 w-3" /> Focus:
            </span>
            {[
              { id: "balanced", label: "Macro-Balanced" },
              { id: "high_protein", label: "High Protein" },
              { id: "low_carb", label: "Low Carb" },
              { id: "quick", label: "Under 15 Mins" },
            ].map((pref) => (
              <button
                key={pref.id}
                onClick={() => setPreferenceFilter(pref.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  preferenceFilter === pref.id
                    ? "bg-emerald-600 text-white font-bold"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                }`}
              >
                {pref.label}
              </button>
            ))}
          </div>

          {/* Craving / Ingredient filter input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchSuggestions(cravingQuery);
            }}
            className="flex items-center gap-2 max-w-sm w-full"
          >
            <div className="relative flex-1">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={cravingQuery}
                onChange={(e) => setCravingQuery(e.target.value)}
                placeholder="Craving e.g. salmon, oats, eggs..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-all"
            >
              Filter
            </button>
          </form>
        </div>
      </div>

      {/* LOADING STATE */}
      {isLoading && (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center space-y-3">
          <div className="h-10 w-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <h4 className="text-base font-bold text-slate-800">Calculating Smart Food Recommendations...</h4>
          <p className="text-xs text-slate-500 max-w-sm">
            Aligning your personal calories, macronutrient split, and remaining daily budget with clinical meal suggestions.
          </p>
        </div>
      )}

      {/* SUGGESTIONS LIST */}
      {!isLoading && suggestionsData && suggestionsData.suggestions && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {suggestionsData.suggestions.map((suggestion) => {
            const mealStyle = mealColorMap[suggestion.mealType] || mealColorMap.lunch;
            const isLogged = loggedIds[suggestion.id];
            const isGroceriesAdded = groceriesAddedIds[suggestion.id];

            // Macro total for mini progress bar
            const totalMacroGrams = Math.max(1, suggestion.protein + suggestion.carbs + suggestion.fat);
            const pPct = Math.round((suggestion.protein / totalMacroGrams) * 100);
            const cPct = Math.round((suggestion.carbs / totalMacroGrams) * 100);
            const fPct = Math.round((suggestion.fat / totalMacroGrams) * 100);

            return (
              <div
                key={suggestion.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between relative overflow-hidden group"
              >
                {/* Top background accent */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${
                  suggestion.mealType === "breakfast" ? "from-amber-400 to-orange-400" :
                  suggestion.mealType === "lunch" ? "from-emerald-400 to-teal-400" :
                  suggestion.mealType === "dinner" ? "from-indigo-400 to-blue-400" :
                  "from-rose-400 to-pink-400"
                }`} />

                <div className="space-y-4">
                  {/* Badges row */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1 uppercase tracking-wider ${mealStyle.badge}`}>
                        <span>{mealStyle.icon}</span>
                        <span>{suggestion.mealType}</span>
                      </span>

                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {suggestion.goalFit}
                      </span>
                    </div>

                    {suggestion.prepTimeMinutes && (
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {suggestion.prepTimeMinutes} mins
                      </span>
                    )}
                  </div>

                  {/* Title & Portion */}
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug group-hover:text-emerald-700 transition-colors">
                      {suggestion.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 mt-0.5">
                      Portion: {suggestion.portion}
                    </p>
                  </div>

                  {/* 4-Metric Macro Grid */}
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Calories</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5 flex items-center justify-center gap-0.5">
                        <Flame className="h-3 w-3 text-amber-500" />
                        {suggestion.calories}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-wider">Protein</div>
                      <div className="text-sm font-black text-indigo-700 mt-0.5">
                        {suggestion.protein}g
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Carbs</div>
                      <div className="text-sm font-black text-amber-700 mt-0.5">
                        {suggestion.carbs}g
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Fat</div>
                      <div className="text-sm font-black text-rose-700 mt-0.5">
                        {suggestion.fat}g
                      </div>
                    </div>
                  </div>

                  {/* Macro ratio horizontal bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                      <span>Macro Split</span>
                      <span>P {pPct}% • C {cPct}% • F {fPct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                      <div style={{ width: `${pPct}%` }} className="bg-indigo-500 h-full" title={`Protein ${pPct}%`} />
                      <div style={{ width: `${cPct}%` }} className="bg-amber-400 h-full" title={`Carbs ${cPct}%`} />
                      <div style={{ width: `${fPct}%` }} className="bg-rose-400 h-full" title={`Fat ${fPct}%`} />
                    </div>
                  </div>

                  {/* Why it fits your goals (Dietitian reasoning) */}
                  <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-900 leading-relaxed">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                      Why it helps your goal:
                    </div>
                    <p>{suggestion.whyRecommended}</p>
                  </div>

                  {/* Ingredients Chips */}
                  {suggestion.ingredients && suggestion.ingredients.length > 0 && (
                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Key Ingredients:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {suggestion.ingredients.map((ing, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] rounded-md font-medium"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ACTION BUTTONS */}
                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <button
                    onClick={() => handleAddIngredientsToGrocery(suggestion)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      isGroceriesAdded
                        ? "bg-teal-500 text-white border-teal-500"
                        : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
                    }`}
                    title="Add ingredients to your Grocery Shopping List"
                  >
                    {isGroceriesAdded ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Added to Groceries!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-3.5 w-3.5 text-slate-500" />
                        <span>+ Grocery List</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleLogSuggestion(suggestion)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 ${
                      isLogged
                        ? "bg-emerald-600 text-white shadow-emerald-200 scale-[0.98]"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white active:scale-95"
                    }`}
                  >
                    {isLogged ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Logged to {suggestion.mealType}!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        <span>Log to Food Diary</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && suggestionsData && suggestionsData.suggestions && suggestionsData.suggestions.length === 0 && (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <Utensils className="h-10 w-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No suggestions matching your filter</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try resetting your craving search or changing your meal type filter to see recommended options.
          </p>
          <button
            onClick={() => {
              setMealFilter("all");
              setPreferenceFilter("balanced");
              setCravingQuery("");
              fetchSuggestions("");
            }}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
