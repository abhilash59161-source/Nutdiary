/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Sparkles, 
  Settings, 
  Flame, 
  Dumbbell, 
  CheckCircle, 
  Loader2, 
  TrendingUp, 
  Coffee, 
  Apple, 
  ChevronRight,
  Calculator,
  User,
  Users,
  ShoppingBag,
  Download,
  Copy,
  Plus,
  Trash2,
  Check
} from "lucide-react";
import { 
  UserProfile, 
  RecommendationResponse, 
  UserGoal, 
  ActivityLevel, 
  FamilyMember, 
  FamilyPlanResponse, 
  WeeklyRationResponse 
} from "../types.js";

interface RecommendationsProps {
  profile: UserProfile;
  onUpdateProfile: (newProfile: UserProfile) => void;
}

export default function Recommendations({
  profile,
  onUpdateProfile,
}: RecommendationsProps) {
  // Sub-tabs: 'personal' | 'family' | 'rations'
  const [subTab, setSubTab] = useState<"personal" | "family" | "rations">("personal");

  // Local profile form state, initialized from active profile
  const [age, setAge] = useState(profile.age);
  const [gender, setGender] = useState(profile.gender);
  const [weight, setWeight] = useState(profile.weight);
  const [height, setHeight] = useState(profile.height);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(profile.activityLevel);
  const [goal, setGoal] = useState<UserGoal>(profile.goal);

  // Loading and Error statuses
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Copied alert state
  const [copied, setCopied] = useState(false);

  // Plans state
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(() => {
    const saved = localStorage.getItem("last_ai_recommendation");
    return saved ? JSON.parse(saved) : null;
  });

  const [familyPlan, setFamilyPlan] = useState<FamilyPlanResponse | null>(() => {
    const saved = localStorage.getItem("family_nutrition_plan");
    return saved ? JSON.parse(saved) : null;
  });

  const [weeklyRations, setWeeklyRations] = useState<WeeklyRationResponse | null>(() => {
    const saved = localStorage.getItem("weekly_ration_plan");
    return saved ? JSON.parse(saved) : null;
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(() => {
    const saved = localStorage.getItem("family_members_list");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync state if localStorage updates externally
  useEffect(() => {
    const savedRec = localStorage.getItem("last_ai_recommendation");
    if (savedRec) setRecommendation(JSON.parse(savedRec));

    const savedFam = localStorage.getItem("family_nutrition_plan");
    if (savedFam) setFamilyPlan(JSON.parse(savedFam));

    const savedRat = localStorage.getItem("weekly_ration_plan");
    if (savedRat) setWeeklyRations(JSON.parse(savedRat));

    const savedMem = localStorage.getItem("family_members_list");
    if (savedMem) setFamilyMembers(JSON.parse(savedMem));
  }, [subTab]);

  // Fallback BMR / TDEE estimation math
  const calculateOfflineBMR = (w: number, h: number, a: number, g: string, act: ActivityLevel, gl: UserGoal) => {
    let bmr = 0;
    if (g === "male") {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    let activityMultiplier = 1.2;
    if (act === "moderate") activityMultiplier = 1.375;
    if (act === "active") activityMultiplier = 1.55;

    let tdee = Math.round(bmr * activityMultiplier);

    let calTarget = tdee;
    if (gl === "weight_loss") calTarget = tdee - 500;
    if (gl === "muscle_gain") calTarget = tdee + 300;
    if (gl === "low_carb") calTarget = tdee - 200;

    calTarget = Math.max(calTarget, 1200);

    let targetP = 1.8 * w; 
    if (gl === "muscle_gain") targetP = 2.2 * w;
    if (gl === "weight_loss") targetP = 2.0 * w;

    let targetF = (calTarget * 0.25) / 9; 
    if (gl === "low_carb") {
      targetF = (calTarget * 0.55) / 9; 
      targetP = 1.6 * w;
    }

    const targetC = Math.max(30, (calTarget - (targetP * 4 + targetF * 9)) / 4);

    return {
      dailyCalorieTarget: calTarget,
      macros: {
        protein: Math.round(targetP),
        carbs: Math.round(targetC),
        fat: Math.round(targetF),
      },
      tdee
    };
  };

  const handlePersonalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const offlineVal = calculateOfflineBMR(weight, height, age, gender, activityLevel, goal);

    const calculatedProfile: UserProfile = {
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      targetCalories: offlineVal.dailyCalorieTarget,
      targetProtein: offlineVal.macros.protein,
      targetCarbs: offlineVal.macros.carbs,
      targetFat: offlineVal.macros.fat,
    };

    try {
      const response = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: calculatedProfile }),
      });

      const data = await response.json();
      if (data.success && data.recommendations) {
        setRecommendation(data.recommendations);
        localStorage.setItem("last_ai_recommendation", JSON.stringify(data.recommendations));
        
        onUpdateProfile({
          ...calculatedProfile,
          targetCalories: data.recommendations.dailyCalorieTarget,
          targetProtein: data.recommendations.macros.protein,
          targetCarbs: data.recommendations.macros.carbs,
          targetFat: data.recommendations.macros.fat,
        });
      } else {
        throw new Error();
      }
    } catch (err: any) {
      console.warn("Recommendations API Error:", err);
      const fallbackRec: RecommendationResponse = {
        dailyCalorieTarget: offlineVal.dailyCalorieTarget,
        macros: offlineVal.macros,
        overview: `Based on your profile, your estimated TDEE is ${offlineVal.tdee} kcal. We've structured a custom daily target to assist in your transition toward your goals.`,
        breakfastIdeas: ["Vegetable Egg Omelette with Whole Grain Toast", "Greek Yogurt with Mixed Berries & Pumpkin Seeds", "Oatmeal Porridge with Almond Butter & Sliced Bananas"],
        lunchIdeas: ["Grilled Chicken Breast over Quinoa & Broccoli", "Tuna Salad wrapped in Spinach Tortillas", "Tofu stir-fry with Sesame Seeds and Snap Peas"],
        dinnerIdeas: ["Baked Salmon Fillet with Asparagus & Sweet Potatoes", "Lean Turkey Meatballs with Marinara Sauce over Zucchini Noodles", "Lentil Vegetable Soup with a side Mixed Garden Salad"],
        snacksIdeas: ["A handful of Almonds & Walnut halves", "Apple Slices with Natural Peanut Butter", "Cottage Cheese with Cucumber Sticks"],
        generalTips: [
          "Prioritize lean protein sources at every major meal to trigger satiety.",
          "Drink at least 8 cups of filtered water daily to facilitate metabolic lipid breakdown.",
          "Keep dietary logs daily for high accountability.",
          "Limit refined sugar and processed foods to maintain stable insulin curves.",
          "Incorporate light resistance training or walking daily to boost resting metabolic rate."
        ]
      };
      setRecommendation(fallbackRec);
      localStorage.setItem("last_ai_recommendation", JSON.stringify(fallbackRec));
      
      onUpdateProfile(calculatedProfile);
      setError("Active recommendations generated using offline metabolic formulas due to unconfigured Gemini API Key.");
    } finally {
      setIsLoading(false);
    }
  };

  // Add family member directly from recommendations view
  const [newMemName, setNewMemName] = useState("");
  const [newMemRelation, setNewMemRelation] = useState("Spouse");
  const [newMemAge, setNewMemAge] = useState(28);
  const [newMemGender, setNewMemGender] = useState<"male" | "female" | "other">("female");
  const [newMemGoal, setNewMemGoal] = useState<UserGoal>("maintenance");

  const handleAddMember = () => {
    if (!newMemName.trim()) return;
    const newMember: FamilyMember = {
      id: `fam_${Date.now()}`,
      name: newMemName.trim(),
      relationship: newMemRelation,
      age: newMemAge,
      gender: newMemGender,
      goal: newMemGoal
    };
    const updated = [...familyMembers, newMember];
    setFamilyMembers(updated);
    localStorage.setItem("family_members_list", JSON.stringify(updated));
    setNewMemName("");
  };

  const handleRemoveMember = (id: string) => {
    const updated = familyMembers.filter(m => m.id !== id);
    setFamilyMembers(updated);
    localStorage.setItem("family_members_list", JSON.stringify(updated));
  };

  const generateFamilyPlan = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/family-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, familyMembers }),
      });
      const data = await response.json();
      if (data.success && data.familyPlan) {
        setFamilyPlan(data.familyPlan);
        localStorage.setItem("family_nutrition_plan", JSON.stringify(data.familyPlan));
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn("Family plan API error, running clinical math fallback.");
      
      let sumCalories = profile.targetCalories;
      const memberSummariesList = familyMembers.map(m => {
        const mOffVal = calculateOfflineBMR(
          m.relationship === "Child" ? 30 : 65,
          m.relationship === "Child" ? 120 : 165,
          m.age,
          m.gender,
          "moderate",
          m.goal
        );
        sumCalories += mOffVal.dailyCalorieTarget;
        return {
          memberName: m.name,
          relationship: m.relationship,
          suggestedCalories: mOffVal.dailyCalorieTarget,
          keyAdvice: `Keep tracking clean protein sources and balance complex grains for steady athletic recovery.`
        };
      });

      const fallbackFam: FamilyPlanResponse = {
        familyOverview: `Combined clinical nutritional plan calculated for your home group. Balancing target macros to ensure growing members get adequate amino acids and vitamins, while optimizing energy distribution for adults.`,
        combinedDailyCalories: sumCalories,
        memberSummaries: memberSummariesList,
        familyMealIdeas: [
          "Sheet Pan Garlic Lemon Herb Chicken with Roasted Broccoli and Red Potatoes",
          "Healthy Turkey & Vegetable Chili topped with fresh cilantro and avocado slices",
          "Seared Salmon steaks with quinoa and baked asparagus spears",
          "Vegetarian Lentil Curry soup served alongside fluffy brown basmati rice",
          "Low-sodium Tofu Stir-fry with red bell peppers, snap peas, and sesame"
        ]
      };
      setFamilyPlan(fallbackFam);
      localStorage.setItem("family_nutrition_plan", JSON.stringify(fallbackFam));
      setError("AI Family Plan estimated using local metabolic balance guidelines.");
    } finally {
      setIsLoading(false);
    }
  };

  // Weekly Ration Generation
  const [dietPref, setDietPref] = useState("Balanced Whole-food");
  
  const generateWeeklyRations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/weekly-ration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, familyMembers, preferences: dietPref }),
      });
      const data = await response.json();
      if (data.success && data.weeklyRations) {
        setWeeklyRations(data.weeklyRations);
        localStorage.setItem("weekly_ration_plan", JSON.stringify(data.weeklyRations));
      } else {
        throw new Error();
      }
    } catch (err) {
      console.warn("Weekly Ration API error, running fallback.");
      const totalPeople = 1 + familyMembers.length;
      const fallbackRations: WeeklyRationResponse = {
        overview: `Optimal 7-day pantry ration and grocery inventory scaling for a household of ${totalPeople} person(s). Balanced on active caloric guidelines.`,
        durationDays: 7,
        rations: [
          {
            category: "Grains & Cereals",
            amount: `${(totalPeople * 1.6).toFixed(1)} kg`,
            items: ["Steel-cut oats", "Brown basmati rice", "Quinoa", "Whole wheat sourdough pasta"],
            notes: "Prioritize unrefined carbs for sustained low-GI cellular glucose release."
          },
          {
            category: "Lean Proteins & Legumes",
            amount: `${(totalPeople * 1.4).toFixed(1)} kg`,
            items: ["Organic eggs", "Free-range chicken breast", "Wild salmon fillets", "Red lentils", "Firm organic tofu"],
            notes: "Crucial for structural muscle repair and maintaining satiety."
          },
          {
            category: "Garden Vegetables",
            amount: `${(totalPeople * 2.2).toFixed(1)} kg`,
            items: ["Spinach and leafy kale", "Broccoli crowns", "Sweet potatoes", "Bell peppers", "Fresh ginger & garlic"],
            notes: "High in dietary potassium, magnesium, and essential gut-microbiome fiber."
          },
          {
            category: "Fresh Seasonal Fruits",
            amount: `${(totalPeople * 1.2).toFixed(1)} kg`,
            items: ["Blueberries", "Bananas", "Apples"],
            notes: "Rich in anti-oxidants and ideal for quick clean energy reserves."
          },
          {
            category: "Dairy & Probiotics",
            amount: `${(totalPeople * 1.5).toFixed(1)} L`,
            items: ["Plain non-fat Greek yogurt", "Unsweetened organic Almond milk", "Cottage cheese"],
            notes: "High calcium reserves. Promotes gut health."
          },
          {
            category: "Healthy Lipids & Seeds",
            amount: `${(totalPeople * 0.35).toFixed(1)} kg`,
            items: ["Extra virgin olive oil", "Almonds and Walnuts", "Chia & flax seeds"],
            notes: "Healthy monounsaturated fat profiles vital for cellular hormone synthesis."
          }
        ],
        rationTips: [
          "Buy grains and dry lentils in bulk to optimize household pantry costs.",
          "Pre-portion and freeze raw meats to avoid waste and maintain food safety.",
          "Prep and wash salad greens, then store with a clean dry paper towel to absorb ambient humidity."
        ]
      };
      setWeeklyRations(fallbackRations);
      localStorage.setItem("weekly_ration_plan", JSON.stringify(fallbackRations));
      setError("AI Weekly Ration estimated using local scaling algorithms.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyTargets = () => {
    if (!recommendation) return;
    onUpdateProfile({
      ...profile,
      targetCalories: recommendation.dailyCalorieTarget,
      targetProtein: recommendation.macros.protein,
      targetCarbs: recommendation.macros.carbs,
      targetFat: recommendation.macros.fat,
    });
    alert("Macronutrient and caloric targets applied successfully to your active daily logs!");
  };

  const handleCopyRations = () => {
    if (!weeklyRations) return;
    const text = `NutriTrack Weekly Ration Estimate\nDuration: 7 Days\nHousehold Size: ${1 + familyMembers.length} person(s)\n\nOverview:\n${weeklyRations.overview}\n\nRations list:\n` +
      weeklyRations.rations.map(r => `- ${r.category}: ${r.amount} (${r.items.join(", ")})\n  Note: ${r.notes || "N/A"}`).join("\n\n") +
      `\n\nTips:\n` + weeklyRations.rationTips.map(t => `• ${t}`).join("\n");
    
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadRations = () => {
    if (!weeklyRations) return;
    const text = `NutriTrack Weekly Ration Estimate\nDuration: 7 Days\nHousehold Size: ${1 + familyMembers.length} person(s)\n\nOverview:\n${weeklyRations.overview}\n\nRations list:\n` +
      weeklyRations.rations.map(r => `- ${r.category}: ${r.amount} (${r.items.join(", ")})\n  Note: ${r.notes || "N/A"}`).join("\n\n") +
      `\n\nTips:\n` + weeklyRations.rationTips.map(t => `• ${t}`).join("\n");
    
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `weekly_rations_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="recommendations-tab">
      
      {/* Sub-tabs segment buttons */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex max-w-lg mx-auto border border-slate-200/50 shadow-inner shrink-0">
        <button
          onClick={() => { setSubTab("personal"); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === "personal"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <User className="h-4 w-4 text-emerald-500" />
          Personal Plan
        </button>
        <button
          onClick={() => { setSubTab("family"); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === "family"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Users className="h-4 w-4 text-emerald-500" />
          Family Plan
        </button>
        <button
          onClick={() => { setSubTab("rations"); setError(null); }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            subTab === "rations"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ShoppingBag className="h-4 w-4 text-emerald-500" />
          Weekly Rations
        </button>
      </div>

      {error && (
        <div className="p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-2xl text-[10px] leading-relaxed max-w-xl mx-auto font-medium shadow-sm">
          <strong>Notice:</strong> {error}
        </div>
      )}

      {/* RENDER PERSONAL TAB */}
      {subTab === "personal" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* LEFT COLUMN: Profile Setup */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Calculator className="h-5 w-5 text-emerald-500" />
                <h3 className="text-md font-extrabold text-slate-800">Caloric Goal Profiler</h3>
              </div>

              <form onSubmit={handlePersonalSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Age (Years)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      required
                      min="20"
                      max="300"
                      value={weight}
                      onChange={(e) => setWeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      required
                      min="50"
                      max="250"
                      value={height}
                      onChange={(e) => setHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Weekly Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="sedentary">Sedentary (Little or no exercise)</option>
                    <option value="moderate">Moderate (Exercise 3-5 days/week)</option>
                    <option value="active">Active (Heavy exercise 6-7 days/week)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Primary Nutritional Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="weight_loss">Weight Loss (Caloric Deficit)</option>
                    <option value="maintenance">Weight Maintenance</option>
                    <option value="muscle_gain">Muscle Gain (Hypertrophy)</option>
                    <option value="low_carb">Low Carb / Keto transition</option>
                    <option value="clean_eating">Clean Eating & Whole Foods</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Calculating Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Calculate targets
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN: AI Diet Plan Results */}
          <div className="lg:col-span-8 space-y-6">
            {recommendation ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-2 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                      Your AI Diet Strategy
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Custom daily macro formulation from clinical engine</p>
                  </div>

                  <button
                    onClick={handleApplyTargets}
                    className="py-1.5 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-100 transition-colors"
                  >
                    Apply Targets to active Log
                  </button>
                </div>

                {/* Generated Goals Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Calories</span>
                    <strong className="text-lg font-black text-slate-800 flex items-center justify-center gap-1">
                      <Flame className="h-4 w-4 text-orange-500" /> {recommendation.dailyCalorieTarget}
                    </strong>
                    <span className="text-[9px] text-slate-400 font-semibold block">kcal / day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Protein</span>
                    <strong className="text-lg font-black text-indigo-600">{recommendation.macros.protein}g</strong>
                    <span className="text-[9px] text-slate-400 font-semibold block">g / day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Carbs</span>
                    <strong className="text-lg font-black text-amber-600">{recommendation.macros.carbs}g</strong>
                    <span className="text-[9px] text-slate-400 font-semibold block">g / day</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Fats</span>
                    <strong className="text-lg font-black text-rose-600">{recommendation.macros.fat}g</strong>
                    <span className="text-[9px] text-slate-400 font-semibold block">g / day</span>
                  </div>
                </div>

                {/* Overview */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Physiological Strategy</span>
                  <p className="text-xs text-slate-600 leading-relaxed font-normal bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                    {recommendation.overview}
                  </p>
                </div>

                {/* Structured Recipe Suggestions */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Your Goal-Aligned Day Meal Plan</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Breakfast */}
                    <div className="p-4 rounded-xl border border-indigo-50/50 bg-indigo-50/10 space-y-1.5">
                      <span className="text-xs font-bold text-indigo-800 flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-indigo-600" /> Breakfast Ideas
                      </span>
                      <ul className="space-y-1 text-slate-600 text-xs">
                        {recommendation.breakfastIdeas.map((idea, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-indigo-400 flex-shrink-0" />
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Lunch */}
                    <div className="p-4 rounded-xl border border-emerald-50/50 bg-emerald-50/10 space-y-1.5">
                      <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                        <Apple className="h-4 w-4 text-emerald-600" /> Lunch Ideas
                      </span>
                      <ul className="space-y-1 text-slate-600 text-xs">
                        {recommendation.lunchIdeas.map((idea, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-emerald-400 flex-shrink-0" />
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Dinner */}
                    <div className="p-4 rounded-xl border border-amber-50/50 bg-amber-50/10 space-y-1.5">
                      <span className="text-xs font-bold text-amber-800 flex items-center gap-1.5">
                        <Dumbbell className="h-4 w-4 text-amber-600" /> Dinner Ideas
                      </span>
                      <ul className="space-y-1 text-slate-600 text-xs">
                        {recommendation.dinnerIdeas.map((idea, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-amber-400 flex-shrink-0" />
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Snacks */}
                    <div className="p-4 rounded-xl border border-rose-50/50 bg-rose-50/10 space-y-1.5">
                      <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                        <Apple className="h-4 w-4 text-rose-600" /> Snack & Beverages
                      </span>
                      <ul className="space-y-1 text-slate-600 text-xs">
                        {recommendation.snacksIdeas.map((idea, idx) => (
                          <li key={idx} className="flex items-start gap-1">
                            <ChevronRight className="h-3.5 w-3.5 mt-0.5 text-rose-400 flex-shrink-0" />
                            <span>{idea}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>

                {/* Tips */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Wellness & Success Advice</span>
                  <div className="space-y-1.5 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {recommendation.generalTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100">
                  <Sparkles className="h-8 w-8" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-md font-bold text-slate-700">Awaiting Target Formulation</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Input your physiological metrics on the left column or trigger AI formulation to output customized recipes and daily calorie parameters.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER FAMILY PLAN TAB */}
      {subTab === "family" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* LEFT: Manage Household Members */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users className="h-5 w-5 text-emerald-500" />
                <h3 className="text-md font-extrabold text-slate-800">Household Group</h3>
              </div>

              {/* Add Family Member Form */}
              <div className="space-y-3.5 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Add Family Member</span>
                
                <div>
                  <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Priya G."
                    value={newMemName}
                    onChange={(e) => setNewMemName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Relationship</label>
                    <select
                      value={newMemRelation}
                      onChange={(e) => setNewMemRelation(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                    >
                      <option value="Spouse">Spouse</option>
                      <option value="Child">Child</option>
                      <option value="Parent">Parent</option>
                      <option value="Sibling">Sibling</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Age</label>
                    <input
                      type="number"
                      value={newMemAge}
                      onChange={(e) => setNewMemAge(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Gender</label>
                    <select
                      value={newMemGender}
                      onChange={(e) => setNewMemGender(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Diet Goal</label>
                    <select
                      value={newMemGoal}
                      onChange={(e) => setNewMemGoal(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                    >
                      <option value="weight_loss">Weight Loss</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="muscle_gain">Muscle Gain</option>
                      <option value="low_carb">Low Carb</option>
                      <option value="clean_eating">Clean Eat</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMember}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Member
                </button>
              </div>

              {/* Household Member list */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Active Registry ({familyMembers.length})</span>
                {familyMembers.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-200 rounded-xl text-center text-xs text-slate-400 leading-relaxed font-normal">
                    You have no registered family members. Add them using the quick form above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto">
                    {familyMembers.map(m => (
                      <div key={m.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                          <h4 className="text-xs font-bold text-slate-800">{m.name}</h4>
                          <span className="text-[10px] text-slate-400 font-semibold flex gap-1.5 -mt-0.5">
                            <span>{m.relationship}</span>
                            <span>•</span>
                            <span>{m.age} Yrs</span>
                            <span>•</span>
                            <span className="capitalize">{m.goal.replace("_", " ")}</span>
                          </span>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(m.id)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {familyMembers.length > 0 && (
                <button
                  onClick={generateFamilyPlan}
                  disabled={isLoading}
                  className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Concocting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Generate Family Plan
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* RIGHT: Combined Family plan results */}
          <div className="lg:col-span-8 space-y-6">
            {familyPlan ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                
                <div className="pb-3 border-b border-slate-100">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users className="h-5 w-5 text-emerald-500" />
                    Combined Family Nutrition Plan
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Custom harmonized diet framework for your entire household</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Energy harmonizer card */}
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-1 text-center flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Combined Household Energy Requirement</span>
                    <strong className="text-2xl font-black text-slate-800 flex items-center justify-center gap-1.5">
                      <Flame className="h-5 w-5 text-orange-500 animate-pulse" />
                      {familyPlan.combinedDailyCalories}
                    </strong>
                    <span className="text-xs text-slate-500 font-semibold">Total calories / day</span>
                  </div>

                  <div className="p-4 border border-emerald-50 bg-emerald-50/10 rounded-2xl space-y-1.5">
                    <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-emerald-600" /> Strategic Synergy
                    </span>
                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                      {familyPlan.familyOverview}
                    </p>
                  </div>
                </div>

                {/* Individual breakdowns */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Individual Group Guidelines</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Holder */}
                    <div className="p-4 border border-slate-100 rounded-xl space-y-2 hover:border-emerald-200 transition-colors bg-white">
                      <div className="flex justify-between items-center">
                        <strong className="text-xs font-extrabold text-slate-800">{profile.name || "Primary User"} (You)</strong>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold text-[9px] uppercase tracking-wider">Host</span>
                      </div>
                      <div className="text-xs text-slate-600 space-y-1">
                        <div className="flex justify-between border-b border-slate-50 pb-1 font-semibold">
                          <span>Target Budget:</span>
                          <span className="text-slate-800">{profile.targetCalories} kcal</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-400">
                          Primary diagnostic user. Core macros are set to {profile.targetProtein}g protein, {profile.targetCarbs}g carbs, and {profile.targetFat}g fats.
                        </p>
                      </div>
                    </div>

                    {/* Other Members */}
                    {familyPlan.memberSummaries.map((m, idx) => (
                      <div key={idx} className="p-4 border border-slate-100 rounded-xl space-y-2 hover:border-emerald-200 transition-colors bg-white">
                        <div className="flex justify-between items-center">
                          <strong className="text-xs font-extrabold text-slate-800">{m.memberName}</strong>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[9px] uppercase tracking-wider">{m.relationship}</span>
                        </div>
                        <div className="text-xs text-slate-600 space-y-1">
                          <div className="flex justify-between border-b border-slate-50 pb-1 font-semibold">
                            <span>Target Budget:</span>
                            <span className="text-slate-800">{m.suggestedCalories} kcal</span>
                          </div>
                          <p className="text-[10px] leading-relaxed text-slate-400">
                            <strong>AI Advice:</strong> {m.keyAdvice}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Combined Meal Ideas */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Group-Friendly Joint Meal Ideas</span>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    {familyPlan.familyMealIdeas.map((idea, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium leading-relaxed">
                        <span className="h-5 w-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span>{idea}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-500 shadow-sm">
                  <Users className="h-8 w-8 text-slate-400" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-md font-bold text-slate-700">Ready to Harmonize family nutrition?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Add family members on the left column (Spouse, Child, Parent, Sibling) and click "Generate Family Plan" to output harmonized meals and daily calorie quotas!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* RENDER RATIONS TAB */}
      {subTab === "rations" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          
          {/* LEFT: Configure Preferences */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShoppingBag className="h-5 w-5 text-emerald-500" />
                <h3 className="text-md font-extrabold text-slate-800">Weekly Preferences</h3>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">Household Diet Archetype</label>
                <select
                  value={dietPref}
                  onChange={(e) => setDietPref(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                >
                  <option value="Balanced Whole-food">Standard Balanced (Whole food, Meat & Plants)</option>
                  <option value="Fully Vegetarian">Pure Vegetarian (Legumes, Dairy, Herbs, No Meat)</option>
                  <option value="High-Protein Power">High Protein Athlete Regime (Egg, Fish, Poultry focus)</option>
                  <option value="Keto/LCHF">High Fat Low Carb / Ketogenic Archetype</option>
                  <option value="Plant-Based Vegan">Strict Vegan (100% Plant proteins, Dairy-free alternatives)</option>
                </select>
              </div>

              <div className="p-3.5 bg-emerald-50/20 border border-emerald-100/50 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-emerald-800 uppercase block">Group Scaling Factor</span>
                <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                  Rations are mathematically scaled to provide 7 full days of clean food for **{1 + familyMembers.length}** person(s) currently registered in your profile.
                </p>
              </div>

              <button
                onClick={generateWeeklyRations}
                disabled={isLoading}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Estimating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" /> Estimate 7-Day Rations
                  </>
                )}
              </button>
            </div>
          </div>

          {/* RIGHT: Ration calculations and actions */}
          <div className="lg:col-span-8 space-y-6">
            {weeklyRations ? (
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-slate-100 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-emerald-500" />
                      Weekly Household Ration Estimate
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Calculated grocery and pantry gross weights for a 7-day period</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleCopyRations}
                      className="py-1.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl border border-slate-200/50 transition-colors flex items-center gap-1.5"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-emerald-600 animate-pulse" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copied!" : "Copy List"}
                    </button>
                    <button
                      onClick={handleDownloadRations}
                      className="py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-100 transition-colors flex items-center gap-1.5"
                    >
                      <Download className="h-3.5 w-3.5" />
                      Download (.txt)
                    </button>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs text-slate-600 leading-relaxed font-normal">
                  {weeklyRations.overview}
                </div>

                {/* Ration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {weeklyRations.rations.map((rat, idx) => (
                    <div key={idx} className="p-4 border border-slate-100 rounded-2xl space-y-3 bg-white hover:shadow-sm transition-all">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800">{rat.category}</span>
                        <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-extrabold text-[10px] rounded-lg tracking-wide shrink-0 shadow-sm shadow-emerald-100">
                          {rat.amount}
                        </span>
                      </div>

                      {/* Items Tags */}
                      <div className="flex flex-wrap gap-1.5">
                        {rat.items.map((item, idy) => (
                          <span key={idy} className="px-2 py-1 bg-slate-50 border border-slate-100 text-slate-500 font-medium text-[10px] rounded-lg">
                            {item}
                          </span>
                        ))}
                      </div>

                      {rat.notes && (
                        <p className="text-[10px] text-slate-400 font-semibold italic border-t border-slate-50 pt-1.5">
                          <strong>Focus:</strong> {rat.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Logistics / Storage tips */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Storage & Smart Packing Tips</span>
                  <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {weeklyRations.rationTips.map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 font-medium leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                  <ShoppingBag className="h-8 w-8 text-slate-400" />
                </div>
                <div className="max-w-md">
                  <h4 className="text-md font-bold text-slate-700">Calculate 7-day grocery targets?</h4>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">
                    Select your diet archetype preference on the left column and click "Estimate 7-Day Rations" to output precise gross weights of food groups for your entire household!
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
