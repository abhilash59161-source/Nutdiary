/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  ChefHat, 
  Sparkles, 
  Clock, 
  Flame, 
  Check, 
  Plus, 
  ShoppingCart, 
  Utensils, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  SlidersHorizontal,
  BookmarkPlus,
  BookOpen
} from "lucide-react";
import { UserProfile, FoodItem } from "../types.js";
import { GroceryItem } from "./GroceryList.tsx";

interface Recipe {
  id: string;
  title: string;
  tagline: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  difficulty: string;
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  usedGroceryIngredients: string[];
  pantryStaplesNeeded: string[];
  missingOptionalIngredients?: string[];
  instructions: string[];
  chefTips: string;
  healthBenefits: string;
}

interface RecipeFinderProps {
  profile: UserProfile;
  onAddLog: (item: Omit<FoodItem, "id">) => void;
  onNavigateToGrocery: () => void;
}

export default function RecipeFinder({
  profile,
  onAddLog,
  onNavigateToGrocery,
}: RecipeFinderProps) {
  // Load grocery items from localStorage
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>(() => {
    const saved = localStorage.getItem("nutdiary_grocery_list");
    return saved ? JSON.parse(saved) : [];
  });

  // Selected ingredients to include in the query
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [extraIngredientInput, setExtraIngredientInput] = useState("");
  
  // Search parameters
  const [mealType, setMealType] = useState<string>("any");
  const [maxTime, setMaxTime] = useState<number>(30);
  const [dietaryFocus, setDietaryFocus] = useState<string>(() => {
    if (profile.goal === "muscle_gain") return "high_protein";
    if (profile.goal === "low_carb") return "low_carb";
    if (profile.goal === "weight_loss") return "calorie_conscious";
    return "balanced";
  });

  // Generation state
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [loggedRecipeIds, setLoggedRecipeIds] = useState<Record<string, boolean>>({});
  const [addedGroceryItems, setAddedGroceryItems] = useState<Record<string, boolean>>({});

  // Sync selected ingredients when groceryItems loads
  useEffect(() => {
    if (groceryItems.length > 0 && selectedIngredients.length === 0) {
      setSelectedIngredients(groceryItems.map((i) => i.name));
    }
  }, [groceryItems]);

  // Toggle ingredient selection
  const toggleIngredient = (name: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(name) ? prev.filter((i) => i !== name) : [...prev, name]
    );
  };

  const handleSelectAll = () => {
    setSelectedIngredients(groceryItems.map((i) => i.name));
  };

  const handleClearAllSelected = () => {
    setSelectedIngredients([]);
  };

  const handleAddExtraIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extraIngredientInput.trim()) return;
    const name = extraIngredientInput.trim();
    if (!selectedIngredients.includes(name)) {
      setSelectedIngredients((prev) => [name, ...prev]);
    }
    setExtraIngredientInput("");
  };

  // Find recipes
  const handleFindRecipes = async () => {
    if (selectedIngredients.length === 0) {
      setError("Please select or add at least one ingredient to find recipes.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/recipes/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          groceryItems: selectedIngredients,
          mealType,
          maxTimeMinutes: maxTime,
          dietaryGoal: dietaryFocus,
          userGoal: profile.goal,
        }),
      });

      const data = await response.json();
      if (!data.success && !data.recipes) {
        throw new Error(data.error || "Failed to find recipes.");
      }

      setRecipes(data.recipes || []);
    } catch (err: any) {
      console.error("Recipe search error:", err);
      setError(err.message || "An unexpected error occurred while finding recipes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Automatically find recipes on initial mount if ingredients exist
  useEffect(() => {
    if (groceryItems.length > 0 && recipes.length === 0) {
      handleFindRecipes();
    }
  }, [groceryItems.length]);

  // Log recipe as meal
  const handleLogRecipe = (recipe: Recipe) => {
    const today = new Date().toISOString().split("T")[0];
    const targetMeal = 
      mealType === "breakfast" ? "breakfast" :
      mealType === "lunch" ? "lunch" :
      mealType === "dinner" ? "dinner" : "lunch";

    onAddLog({
      name: recipe.title,
      calories: recipe.caloriesPerServing,
      protein: recipe.proteinGrams,
      carbs: recipe.carbsGrams,
      fat: recipe.fatGrams,
      servingSize: "1 plate / serving",
      servingAmount: 1,
      mealType: targetMeal,
      loggedAt: today,
    });

    setLoggedRecipeIds((prev) => ({ ...prev, [recipe.id]: true }));
    setTimeout(() => {
      setLoggedRecipeIds((prev) => ({ ...prev, [recipe.id]: false }));
    }, 4000);
  };

  // Add missing ingredient to grocery list
  const handleAddMissingToGrocery = (ingredientName: string) => {
    const saved = localStorage.getItem("nutdiary_grocery_list");
    const currentList: GroceryItem[] = saved ? JSON.parse(saved) : [];

    const newItem: GroceryItem = {
      id: `grocery_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: ingredientName,
      quantity: "1 unit",
      category: "Pantry & Spices",
      completed: false,
      addedAt: new Date().toISOString().split("T")[0],
      estimatedPrice: 2.99,
    };

    const updated = [newItem, ...currentList];
    localStorage.setItem("nutdiary_grocery_list", JSON.stringify(updated));
    setGroceryItems(updated);
    setAddedGroceryItems((prev) => ({ ...prev, [ingredientName]: true }));
  };

  return (
    <div className="space-y-6" id="recipe-finder-tab">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-700 p-6 rounded-3xl text-white shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-1.5 rounded-xl bg-white/20">
              <ChefHat className="h-5 w-5 text-white" />
            </span>
            <span className="text-xs font-bold text-emerald-100 uppercase tracking-wider">
              Pantry & Grocery Recipe Finder
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">
            Cook With What You Have
          </h2>
          <p className="text-xs text-emerald-50 mt-1 max-w-xl">
            AI-powered healthy recipes generated specifically from your grocery list items. Zero food waste, perfectly aligned with your dietary targets.
          </p>
        </div>

        <button
          onClick={onNavigateToGrocery}
          className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-white/20"
        >
          <ShoppingCart className="h-4 w-4" />
          <span>Manage Grocery List</span>
        </button>
      </div>

      {/* Main Ingredient Control Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Ingredients Available from Grocery List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Utensils className="h-4 w-4 text-emerald-600" />
                Available Grocery & Pantry Ingredients
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toggle the items in your kitchen you want to cook with today ({selectedIngredients.length} selected)
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold">
              <button
                onClick={handleSelectAll}
                className="text-emerald-600 hover:text-emerald-700 cursor-pointer"
              >
                Select All
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={handleClearAllSelected}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Ingredient Chips */}
          {groceryItems.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center">
              <ShoppingCart className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">No items found in your Grocery Shopping List</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Add extra ingredients below, or visit your Grocery List to populate your kitchen inventory.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1">
              {groceryItems.map((item) => {
                const isSelected = selectedIngredients.includes(item.name);
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleIngredient(item.name)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300 shadow-xs"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <div
                      className={`h-3.5 w-3.5 rounded-md flex items-center justify-center text-[9px] ${
                        isSelected ? "bg-emerald-600 text-white" : "border border-slate-300"
                      }`}
                    >
                      {isSelected && <Check className="h-2.5 w-2.5" />}
                    </div>
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Add Extra Ingredient Form */}
          <form onSubmit={handleAddExtraIngredient} className="flex gap-2 pt-2 border-t border-slate-100">
            <input
              type="text"
              placeholder="Add another ingredient on hand (e.g. garlic, eggs, rice, canned tuna)..."
              value={extraIngredientInput}
              onChange={(e) => setExtraIngredientInput(e.target.value)}
              className="flex-grow px-3.5 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* Right Column: Recipe Search Filters & Trigger */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
              <SlidersHorizontal className="h-4 w-4 text-emerald-600" />
              Recipe Preferences
            </h3>

            {/* Meal Type */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Meal Category
              </label>
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="any">Any Meal (Best Matches)</option>
                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="snack">Snack / Post-Workout</option>
              </select>
            </div>

            {/* Max Cooking Time */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Max Prep & Cook Time
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs font-bold">
                {[15, 30, 45].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setMaxTime(time)}
                    className={`py-2 rounded-xl border text-center transition-all cursor-pointer ${
                      maxTime === time
                        ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    ≤ {time}m
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Focus */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Nutritional Target
              </label>
              <select
                value={dietaryFocus}
                onChange={(e) => setDietaryFocus(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="balanced">Balanced Whole Foods</option>
                <option value="high_protein">High Protein (Muscle Recovery)</option>
                <option value="low_carb">Low Carb / Keto Friendly</option>
                <option value="calorie_conscious">Calorie Conscious (Lean Volume)</option>
                <option value="heart_healthy">Cardiovascular Heart Health</option>
              </select>
            </div>
          </div>

          {/* Trigger Button */}
          <button
            onClick={handleFindRecipes}
            disabled={isLoading || selectedIngredients.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-xs shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Crafting Recipes with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Find Quick Recipes ({selectedIngredients.length} Items)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-700">
          <AlertCircle className="h-5 w-5 text-rose-500 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* Suggested Recipes Grid */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            Suggested Quick Recipes ({recipes.length})
          </h3>
          <span className="text-xs text-slate-400 font-medium">
            Personalized to: {profile.goal.replace("_", " ")}
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div key={n} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
                <div className="h-6 bg-slate-100 rounded-lg w-2/3" />
                <div className="h-4 bg-slate-50 rounded-lg w-full" />
                <div className="grid grid-cols-4 gap-2 pt-2">
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                  <div className="h-12 bg-slate-100 rounded-xl" />
                </div>
                <div className="h-24 bg-slate-50 rounded-xl" />
              </div>
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200">
            <ChefHat className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">Ready to Cook</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Select your available grocery items and tap <strong>"Find Quick Recipes"</strong> to generate chef-crafted healthy meals tailored to your kitchen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recipes.map((recipe) => {
              const isLogged = loggedRecipeIds[recipe.id];
              const totalTime = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

              return (
                <div
                  key={recipe.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-4">
                    {/* Header: Title & Badges */}
                    <div>
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {recipe.difficulty}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-slate-500 bg-slate-100 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {totalTime > 0 ? `${totalTime} mins` : "Instant"}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Serves {recipe.servings}
                        </span>
                      </div>

                      <h4 className="text-lg font-black text-slate-900 leading-tight">
                        {recipe.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 italic">
                        "{recipe.tagline}"
                      </p>
                    </div>

                    {/* Macro Nutrition Bento Strip */}
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Calories</span>
                        <span className="text-sm font-black text-slate-800 block mt-0.5">
                          {recipe.caloriesPerServing}
                        </span>
                        <span className="text-[9px] text-slate-400">kcal</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase block">Protein</span>
                        <span className="text-sm font-black text-indigo-700 block mt-0.5">
                          {recipe.proteinGrams}g
                        </span>
                        <span className="text-[9px] text-slate-400">leucine</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-amber-500 uppercase block">Carbs</span>
                        <span className="text-sm font-black text-amber-700 block mt-0.5">
                          {recipe.carbsGrams}g
                        </span>
                        <span className="text-[9px] text-slate-400">energy</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-rose-500 uppercase block">Fats</span>
                        <span className="text-sm font-black text-rose-700 block mt-0.5">
                          {recipe.fatGrams}g
                        </span>
                        <span className="text-[9px] text-slate-400">lipids</span>
                      </div>
                    </div>

                    {/* Ingredients Breakdown */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                        Ingredients Used From Your List:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {recipe.usedGroceryIngredients.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                          >
                            <Check className="h-3 w-3 text-emerald-600" />
                            {item}
                          </span>
                        ))}
                      </div>

                      {/* Pantry Staples */}
                      {recipe.pantryStaplesNeeded && recipe.pantryStaplesNeeded.length > 0 && (
                        <p className="text-[11px] text-slate-500 pt-1">
                          <strong className="text-slate-700">Pantry Basics:</strong> {recipe.pantryStaplesNeeded.join(", ")}
                        </p>
                      )}

                      {/* Missing / Optional items */}
                      {recipe.missingOptionalIngredients && recipe.missingOptionalIngredients.length > 0 && (
                        <div className="pt-1 flex flex-wrap items-center gap-1.5">
                          <span className="text-[11px] text-slate-400 font-medium">Optional additions:</span>
                          {recipe.missingOptionalIngredients.map((opt, idx) => {
                            const isAdded = addedGroceryItems[opt];
                            return (
                              <button
                                key={idx}
                                onClick={() => handleAddMissingToGrocery(opt)}
                                disabled={isAdded}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer flex items-center gap-1 ${
                                  isAdded
                                    ? "bg-slate-100 text-slate-500 border-slate-200"
                                    : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                                }`}
                              >
                                {isAdded ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                                <span>{opt}</span>
                                {!isAdded && <span className="text-[9px] text-emerald-500">+ Grocery</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Step-by-Step Instructions */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                        Quick Instructions:
                      </span>
                      <ol className="space-y-1.5 text-xs text-slate-600 list-decimal list-inside font-normal">
                        {recipe.instructions.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">
                            <span className="text-slate-800 font-medium">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Chef Tip & Clinical Benefits */}
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-900 space-y-1">
                      <p className="flex items-start gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <span><strong>Chef's Secret:</strong> {recipe.chefTips}</span>
                      </p>
                      <p className="text-[11px] text-amber-700 pl-5">
                        <strong>Clinical Benefit:</strong> {recipe.healthBenefits}
                      </p>
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 font-mono">
                      {recipe.caloriesPerServing} kcal • {recipe.proteinGrams}g P
                    </span>

                    <button
                      onClick={() => handleLogRecipe(recipe)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isLogged
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-900 hover:bg-slate-800 text-white"
                      }`}
                    >
                      {isLogged ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                          <span>Logged to Diary!</span>
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-4 w-4 text-emerald-400" />
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
      </div>

    </div>
  );
}
