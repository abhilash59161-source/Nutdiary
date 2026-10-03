/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  Flame, 
  Droplet, 
  Droplets,
  TrendingUp, 
  Calendar, 
  Trophy, 
  Apple,
  Award,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Settings2,
  CheckCircle2,
  Lock,
  Plus,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Zap,
  Check,
  Share2,
  FileText
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ReferenceLine,
  Legend
} from "recharts";
import { FoodItem, UserProfile } from "../types.js";
import ShareProgressModal from "./ShareProgressModal.tsx";

interface DashboardProps {
  foodLogs: FoodItem[];
  profile: UserProfile;
  selectedDate: string;
  onSetSelectedDate: (date: string) => void;
  onOpenExportReport?: () => void;
}

export default function Dashboard({
  foodLogs,
  profile,
  selectedDate,
  onSetSelectedDate,
  onOpenExportReport,
}: DashboardProps) {
  // Hydration Goal in glasses (1 glass = 250ml)
  const [hydrationGoal, setHydrationGoal] = useState<number>(() => {
    const saved = localStorage.getItem("hydration_goal");
    return saved ? Math.max(1, parseInt(saved, 10)) : 8;
  });

  const [waterCups, setWaterCups] = useState<number>(() => {
    const saved = localStorage.getItem(`water_${selectedDate}`);
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isSettingGoal, setIsSettingGoal] = useState<boolean>(false);
  const [customGoalInput, setCustomGoalInput] = useState<string>(hydrationGoal.toString());
  const [badgeFilter, setBadgeFilter] = useState<"all" | "unlocked" | "progress">("all");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  // Keep water cups synced when selectedDate changes
  useEffect(() => {
    const saved = localStorage.getItem(`water_${selectedDate}`);
    setWaterCups(saved ? parseInt(saved, 10) : 0);
  }, [selectedDate]);

  const handleWaterChange = (amount: number) => {
    const next = Math.max(0, waterCups + amount);
    setWaterCups(next);
    localStorage.setItem(`water_${selectedDate}`, next.toString());
  };

  const handleSaveHydrationGoal = (newGoal: number) => {
    const valid = Math.max(1, Math.min(24, Math.round(newGoal)));
    setHydrationGoal(valid);
    setCustomGoalInput(valid.toString());
    localStorage.setItem("hydration_goal", valid.toString());
    setIsSettingGoal(false);
  };

  // Filter logs for the selected date
  const todayLogs = foodLogs.filter((log) => log.loggedAt === selectedDate);

  // Totals for today
  const totalCalories = todayLogs.reduce((sum, log) => sum + log.calories * log.servingAmount, 0);
  const totalProtein = todayLogs.reduce((sum, log) => sum + log.protein * log.servingAmount, 0);
  const totalCarbs = todayLogs.reduce((sum, log) => sum + log.carbs * log.servingAmount, 0);
  const totalFat = todayLogs.reduce((sum, log) => sum + log.fat * log.servingAmount, 0);

  // Percentages against target
  const calPercent = Math.min(100, Math.round((totalCalories / profile.targetCalories) * 100)) || 0;
  const proteinPercent = Math.min(100, Math.round((totalProtein / profile.targetProtein) * 100)) || 0;
  const carbsPercent = Math.min(100, Math.round((totalCarbs / profile.targetCarbs) * 100)) || 0;
  const fatPercent = Math.min(100, Math.round((totalFat / profile.targetFat) * 100)) || 0;

  // Last 7 days history calculation for Weekly Progress Recharts
  const getLast7Days = () => {
    const days = [];
    const date = new Date(selectedDate);
    for (let i = 6; i >= 0; i--) {
      const d = new Date(date);
      d.setDate(d.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      days.push(`${year}-${month}-${day}`);
    }
    return days;
  };

  const last7Days = getLast7Days();
  const weeklyData = last7Days.map((dayStr) => {
    const dateObj = new Date(dayStr);
    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
    const fullDate = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const label = `${dayName} ${dateObj.getDate()}`;
    
    const dayLogs = foodLogs.filter((log) => log.loggedAt === dayStr);
    const cals = Math.round(dayLogs.reduce((sum, log) => sum + log.calories * log.servingAmount, 0));
    const protein = Math.round(dayLogs.reduce((sum, log) => sum + log.protein * log.servingAmount, 0));
    const carbs = Math.round(dayLogs.reduce((sum, log) => sum + log.carbs * log.servingAmount, 0));
    const fat = Math.round(dayLogs.reduce((sum, log) => sum + log.fat * log.servingAmount, 0));

    return {
      dayStr,
      dayName,
      fullDate,
      label,
      calories: cals,
      targetCalories: profile.targetCalories,
      protein,
      carbs,
      fat,
      diff: cals - profile.targetCalories,
    };
  });

  // Calculate 7-day summary metrics
  const activeDays = weeklyData.filter((d) => d.calories > 0);
  const avgCalories = activeDays.length > 0 
    ? Math.round(activeDays.reduce((sum, d) => sum + d.calories, 0) / activeDays.length)
    : 0;
  const onTargetDays = weeklyData.filter((d) => d.calories > 0 && d.calories <= profile.targetCalories).length;
  const maxDay = weeklyData.reduce((prev, curr) => curr.calories > prev.calories ? curr : prev, weeklyData[0]);

  // Helper for goal descriptions
  const getGoalLabel = (goal: string) => {
    switch (goal) {
      case "weight_loss": return "Weight Loss (Caloric Deficit)";
      case "muscle_gain": return "Muscle Gain (Protein Rich)";
      case "low_carb": return "Low Carb / Keto Focus";
      case "clean_eating": return "Clean Eating & Whole Foods";
      default: return "Weight Maintenance";
    }
  };

  // Hydration Calculations
  const hydrationPercent = Math.min(100, Math.round((waterCups / Math.max(1, hydrationGoal)) * 100));
  const isHydrationUnlocked = waterCups >= hydrationGoal && hydrationGoal > 0;

  // Nutritional Badge Calculations
  const targetProtein90 = profile.targetProtein * 0.9;
  const isProteinUnlocked = totalProtein >= targetProtein90 && targetProtein90 > 0;
  const proteinProgress = Math.min(100, Math.round((totalProtein / Math.max(1, targetProtein90)) * 100));

  const isCalorieBalanceUnlocked = totalCalories > 0 && 
    totalCalories >= profile.targetCalories * 0.85 && 
    totalCalories <= profile.targetCalories * 1.05;
  const calorieBalanceProgress = totalCalories <= 0 ? 0 : Math.min(100, Math.round((totalCalories / profile.targetCalories) * 100));

  const isMacroTrioUnlocked = proteinPercent >= 80 && carbsPercent >= 80 && fatPercent >= 80;
  const macroTrioProgress = Math.round((Math.min(100, proteinPercent) + Math.min(100, carbsPercent) + Math.min(100, fatPercent)) / 3);

  const isWholeNutritionUnlocked = todayLogs.length >= 3;
  const wholeNutritionProgress = Math.min(100, Math.round((todayLogs.length / 3) * 100));

  const isCleanFatUnlocked = totalCalories > 0 && ((totalFat * 9) / totalCalories) <= 0.35;
  const cleanFatProgress = totalCalories === 0 ? 0 : Math.min(100, Math.round(Math.max(0, 100 - (Math.max(0, ((totalFat * 9) / totalCalories) - 0.35) * 200))));

  const badges = [
    {
      id: "hydration_hero",
      title: "Hydration Champion",
      subtitle: `Goal: ${hydrationGoal} glasses (${hydrationGoal * 250} ml)`,
      description: `Drink at least ${hydrationGoal} glasses of water today`,
      icon: Droplets,
      color: "sky",
      unlocked: isHydrationUnlocked,
      progress: hydrationPercent,
      progressText: `${waterCups} / ${hydrationGoal} glasses (${waterCups * 250} ml)`,
      benefit: "Sustains cellular hydration, kidney filtration, and enzymatic nutrient transport."
    },
    {
      id: "protein_powerhouse",
      title: "Protein Powerhouse",
      subtitle: `Target: ${Math.round(targetProtein90)}g (90%+)`,
      description: `Achieve at least 90% of your daily protein target`,
      icon: Flame,
      color: "indigo",
      unlocked: isProteinUnlocked,
      progress: proteinProgress,
      progressText: `${Math.round(totalProtein)}g / ${profile.targetProtein}g (${proteinPercent}%)`,
      benefit: "Optimizes post-digestive muscle protein synthesis and appetite-regulating peptide hormones."
    },
    {
      id: "calorie_precision",
      title: "Caloric Discipline",
      subtitle: `Target: ±10% of ${profile.targetCalories} kcal`,
      description: `Keep daily caloric intake within ±10% of prescribed budget`,
      icon: Target,
      color: "emerald",
      unlocked: isCalorieBalanceUnlocked,
      progress: calorieBalanceProgress,
      progressText: `${Math.round(totalCalories)} / ${profile.targetCalories} kcal (${calPercent}%)`,
      benefit: "Maintains optimal energy balance and prevents unneeded adipocyte lipogenesis."
    },
    {
      id: "macro_alignment",
      title: "Macro Trio Harmony",
      subtitle: "Target: 80%+ across P, C & F",
      description: "Reach at least 80% on Protein, Carbs, and Fats concurrently",
      icon: Award,
      color: "amber",
      unlocked: isMacroTrioUnlocked,
      progress: macroTrioProgress,
      progressText: `P: ${proteinPercent}% | C: ${carbsPercent}% | F: ${fatPercent}%`,
      benefit: "Prevents acute glycemic fluctuations and fuels aerobic and anaerobic pathways."
    },
    {
      id: "clean_lipids",
      title: "Clean Lipid Shield",
      subtitle: "Target: Fats ≤ 35% of calories",
      description: "Keep dietary fat within healthy clinical heart thresholds",
      icon: ShieldCheck,
      color: "teal",
      unlocked: isCleanFatUnlocked,
      progress: cleanFatProgress,
      progressText: totalCalories > 0 ? `${Math.round(((totalFat * 9) / totalCalories) * 100)}% fat energy` : "Awaiting meal logs",
      benefit: "Supports healthy endothelial arterial dilation and optimal LDL/HDL lipid profiles."
    },
    {
      id: "meal_consistency",
      title: "Meal Consistency",
      subtitle: "Target: 3+ logged meals/snacks",
      description: "Log at least 3 meals or healthy snacks throughout the day",
      icon: Apple,
      color: "rose",
      unlocked: isWholeNutritionUnlocked,
      progress: wholeNutritionProgress,
      progressText: `${todayLogs.length} / 3 logged items`,
      benefit: "Steadies metabolic fire and prevents extreme hunger-induced cravings."
    }
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const filteredBadges = badges.filter((b) => {
    if (badgeFilter === "unlocked") return b.unlocked;
    if (badgeFilter === "progress") return !b.unlocked;
    return true;
  });

  return (
    <div className="space-y-6" id="dashboard-tab">
      {/* Date selector header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-500" />
            Daily Summary Dashboard
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Tracking nutrition for: <span className="font-semibold text-slate-700">{new Date(selectedDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              if (e.target.value) {
                onSetSelectedDate(e.target.value);
                // Reload water
                const saved = localStorage.getItem(`water_${e.target.value}`);
                setWaterCups(saved ? parseInt(saved, 10) : 0);
              }
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              onSetSelectedDate(today);
              const saved = localStorage.getItem(`water_${today}`);
              setWaterCups(saved ? parseInt(saved, 10) : 0);
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-colors cursor-pointer"
          >
            Today
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-[0.98] text-white text-sm font-bold rounded-lg shadow-xs shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            title="Generate card to share on social media"
          >
            <Share2 className="h-4 w-4" />
            <span>Share Progress</span>
          </button>
          {onOpenExportReport && (
            <button
              onClick={onOpenExportReport}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Export Clinical Nutrition Report (PDF / CSV)"
            >
              <FileText className="h-4 w-4 text-emerald-600" />
              <span>Export PDF / CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Caloric Intake Circle */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-between min-h-[300px]">
          <div className="w-full">
            <h3 className="text-sm font-semibold text-slate-500 flex items-center gap-1.5 uppercase tracking-wider">
              <Flame className="h-4 w-4 text-orange-500" />
              Calories Today
            </h3>
          </div>

          <div className="relative flex items-center justify-center my-4">
            {/* SVG Progress Ring */}
            <svg className="w-40 h-40 transform -rotate-90">
              {/* Outer background ring */}
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-slate-100"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Foreground progress ring */}
              <circle
                cx="80"
                cy="80"
                r="70"
                className="stroke-emerald-500 transition-all duration-500"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * calPercent) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-3xl font-extrabold text-slate-800">{Math.round(totalCalories)}</span>
              <p className="text-xs text-slate-400 mt-0.5">/ {profile.targetCalories} kcal</p>
              <span className={`inline-block mt-2 px-2 py-0.5 text-[10px] font-bold rounded-full ${calPercent > 100 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {calPercent}% of limit
              </span>
            </div>
          </div>

          <div className="w-full text-center text-xs text-slate-500">
            {totalCalories < profile.targetCalories ? (
              <p>You have <strong className="text-emerald-600">{Math.round(profile.targetCalories - totalCalories)} kcal</strong> remaining for today.</p>
            ) : (
              <p className="text-red-500 font-medium">Caloric target exceeded by {Math.round(totalCalories - profile.targetCalories)} kcal!</p>
            )}
          </div>
        </div>

        {/* Macronutrients Progress */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Macronutrient Targets
            </h3>
          </div>

          <div className="space-y-5 my-2">
            {/* Protein */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                  Protein
                </span>
                <span className="text-slate-500">
                  <strong>{Math.round(totalProtein)}g</strong> / {profile.targetProtein}g ({proteinPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${proteinPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Carbs */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                  Carbohydrates
                </span>
                <span className="text-slate-500">
                  <strong>{Math.round(totalCarbs)}g</strong> / {profile.targetCarbs}g ({carbsPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${carbsPercent}%` }}
                ></div>
              </div>
            </div>

            {/* Fat */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-rose-500"></span>
                  Fats
                </span>
                <span className="text-slate-500">
                  <strong>{Math.round(totalFat)}g</strong> / {profile.targetFat}g ({fatPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${fatPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg text-[11px] text-slate-500 flex gap-2 items-center">
            <Trophy className="h-4 w-4 text-amber-500 flex-shrink-0" />
            <span>Target calories calculated based on your goal: <strong>{getGoalLabel(profile.goal)}</strong></span>
          </div>
        </div>

        {/* Hydration / Water Tracker Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between min-h-[320px] relative">
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-sky-500" />
                Hydration Tracker
              </h3>
              <button
                onClick={() => setIsSettingGoal(!isSettingGoal)}
                className="text-[11px] font-bold text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100/80 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Customize daily hydration target"
              >
                <Settings2 className="h-3 w-3" />
                Goal: {hydrationGoal} Glasses
              </button>
            </div>

            {/* Inline Goal Setter Popover */}
            {isSettingGoal && (
              <div className="mb-4 p-3 bg-sky-50/70 border border-sky-100 rounded-xl space-y-2 animate-in fade-in-50">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                  <span>Daily Water Target:</span>
                  <span className="text-sky-600 font-bold">{hydrationGoal * 250} ml</span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[6, 8, 10, 12].map((g) => (
                    <button
                      key={g}
                      onClick={() => handleSaveHydrationGoal(g)}
                      className={`py-1 text-xs font-bold rounded-lg transition-all ${
                        hydrationGoal === g
                          ? "bg-sky-500 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-sky-100/50"
                      }`}
                    >
                      {g} ({g * 250}ml)
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-sky-100">
                  <span className="text-[11px] text-slate-500">Custom glasses:</span>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={customGoalInput}
                    onChange={(e) => setCustomGoalInput(e.target.value)}
                    className="w-16 px-2 py-0.5 text-xs border border-slate-200 rounded-md bg-white text-center font-bold"
                  />
                  <button
                    onClick={() => {
                      const num = parseInt(customGoalInput, 10);
                      if (!isNaN(num) && num > 0) handleSaveHydrationGoal(num);
                    }}
                    className="px-2.5 py-0.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-md transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsSettingGoal(false)}
                    className="px-2 py-0.5 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Water Fill & Glasses Visualization */}
          <div className="flex flex-col items-center justify-center my-1 space-y-3">
            {/* Visual glasses row */}
            <div className="flex flex-wrap gap-1.5 items-end justify-center max-w-[280px] min-h-[50px]">
              {Array.from({ length: Math.min(16, Math.max(hydrationGoal, waterCups)) }).map((_, i) => {
                const isFilled = i < waterCups;
                const isOverGoal = i >= hydrationGoal;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      // Clicking on glass sets or toggles to that count
                      const next = i + 1 === waterCups ? i : i + 1;
                      setWaterCups(next);
                      localStorage.setItem(`water_${selectedDate}`, next.toString());
                    }}
                    title={`Glass ${i + 1} (${(i + 1) * 250} ml)`}
                    className={`w-5 rounded-t-md transition-all duration-300 cursor-pointer ${
                      isFilled
                        ? isOverGoal
                          ? "bg-teal-400 h-11 shadow-xs shadow-teal-100 ring-1 ring-teal-500"
                          : "bg-sky-400 h-10 shadow-xs shadow-sky-100"
                        : "bg-slate-100 h-7 border border-dashed border-slate-200 hover:bg-sky-50"
                    }`}
                  />
                );
              })}
            </div>

            {/* Readout */}
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-black text-slate-800">{waterCups}</span>
                <span className="text-slate-400 text-sm font-semibold"> / {hydrationGoal} Glasses</span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {waterCups * 250} ml / {hydrationGoal * 250} ml ({hydrationPercent}%)
              </p>
            </div>

            {/* Celebration status */}
            {isHydrationUnlocked ? (
              <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border border-emerald-100 animate-in fade-in-50">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Daily Hydration Goal Reached! 🎉
              </div>
            ) : (
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-sky-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${hydrationPercent}%` }}
                ></div>
              </div>
            )}

            {/* Quick Logging Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
              <button
                onClick={() => handleWaterChange(-1)}
                disabled={waterCups === 0}
                className="px-2.5 py-1 border border-slate-200 disabled:opacity-40 rounded-lg text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors cursor-pointer"
                title="Remove 1 glass"
              >
                -1 Glass
              </button>
              <button
                onClick={() => handleWaterChange(1)}
                className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold shadow-xs shadow-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="Add 1 glass (250ml)"
              >
                <Plus className="h-3 w-3" />
                +1 Glass
              </button>
              <button
                onClick={() => handleWaterChange(2)}
                className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold shadow-xs shadow-sky-100 transition-colors flex items-center gap-1 cursor-pointer"
                title="Add 2 glasses / Bottle (500ml)"
              >
                <Plus className="h-3 w-3" />
                +500ml
              </button>
              {waterCups > 0 && (
                <button
                  onClick={() => {
                    setWaterCups(0);
                    localStorage.setItem(`water_${selectedDate}`, "0");
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition-colors"
                  title="Reset hydration for today"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="text-center text-[10.5px] text-slate-400 mt-2">
            Tip: Drinking water with electrolytes accelerates metabolic toxin elimination.
          </div>
        </div>
      </div>

      {/* NUTRITIONAL BADGES & ACHIEVEMENTS SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5" id="nutritional-badges-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Trophy className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                Nutritional Badges & Achievements
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live dietary milestones calculated in real time against today's caloric, macro, and hydration targets
            </p>
          </div>

          {/* Badges Filter & Live Tally */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-extrabold text-xs flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              {unlockedCount} of {badges.length} Unlocked Today
            </span>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold text-slate-600">
              <button
                onClick={() => setBadgeFilter("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  badgeFilter === "all" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                All ({badges.length})
              </button>
              <button
                onClick={() => setBadgeFilter("unlocked")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  badgeFilter === "unlocked" ? "bg-white text-emerald-600 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Unlocked ({unlockedCount})
              </button>
              <button
                onClick={() => setBadgeFilter("progress")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  badgeFilter === "progress" ? "bg-white text-slate-900 shadow-xs font-bold" : "hover:text-slate-900"
                }`}
              >
                In Progress ({badges.length - unlockedCount})
              </button>
            </div>
          </div>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBadges.map((badge) => {
            const Icon = badge.icon;
            return (
              <div
                key={badge.id}
                className={`p-4 rounded-2xl border transition-all duration-300 relative flex flex-col justify-between ${
                  badge.unlocked
                    ? "bg-gradient-to-b from-white to-emerald-50/20 border-emerald-200/80 shadow-xs shadow-emerald-100"
                    : "bg-slate-50/50 border-slate-200/70 opacity-90"
                }`}
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
                          badge.unlocked
                            ? "bg-emerald-500 text-white shadow-xs shadow-emerald-200 scale-105"
                            : "bg-slate-200 text-slate-500"
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug">
                          {badge.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium block">
                          {badge.subtitle}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {badge.unlocked ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold flex items-center gap-1 shrink-0">
                        <Check className="h-3 w-3 text-emerald-600" />
                        Unlocked
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-bold flex items-center gap-1 shrink-0">
                        <Lock className="h-2.5 w-2.5" />
                        {badge.progress}%
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-600 mb-3 font-normal leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Progress bar & details */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400 font-medium">Status</span>
                    <span className={`font-bold ${badge.unlocked ? "text-emerald-600" : "text-slate-700"}`}>
                      {badge.progressText}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        badge.unlocked ? "bg-emerald-500" : "bg-sky-500"
                      }`}
                      style={{ width: `${Math.min(100, badge.progress)}%` }}
                    ></div>
                  </div>

                  <p className="text-[10px] text-slate-400 italic pt-1 leading-tight">
                    💡 {badge.benefit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Progress Section using Recharts */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6" id="weekly-progress-section">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight">
                Weekly Progress
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              7-day trend line of your total calories consumed vs daily target ({profile.targetCalories} kcal)
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              Calories Consumed
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-slate-500"></span>
              Daily Target
            </span>
          </div>
        </div>

        {/* Recharts Area / Line Chart */}
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={weeklyData}
              margin={{ top: 20, right: 20, left: 0, bottom: 5 }}
            >
              <defs>
                <linearGradient id="weeklyCalorieGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `${val}`}
                domain={[0, (dataMax: number) => Math.max(Math.ceil((dataMax * 1.2) / 200) * 200, profile.targetCalories + 300)]}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    const diff = data.calories - profile.targetCalories;
                    return (
                      <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-xl shadow-xl border border-slate-700/60 text-xs min-w-[210px] animate-in fade-in-50">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                          <span className="font-bold text-slate-200">{data.fullDate} ({data.dayName})</span>
                          {data.calories > 0 ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              diff <= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                            }`}>
                              {diff <= 0 ? `${Math.abs(diff)} under target` : `+${diff} over target`}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                              No log
                            </span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Flame className="h-3.5 w-3.5 text-emerald-400" />
                              Calories:
                            </span>
                            <span className="font-extrabold text-white text-sm">{data.calories} kcal</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-slate-400 flex items-center gap-1.5">
                              <Target className="h-3.5 w-3.5 text-slate-400" />
                              Target:
                            </span>
                            <span className="text-slate-300 font-semibold">{profile.targetCalories} kcal</span>
                          </div>
                          {data.calories > 0 && (
                            <div className="pt-2 mt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-300">
                              <span>P: <strong className="text-indigo-400">{data.protein}g</strong></span>
                              <span>C: <strong className="text-amber-400">{data.carbs}g</strong></span>
                              <span>F: <strong className="text-rose-400">{data.fat}g</strong></span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine 
                y={profile.targetCalories} 
                stroke="#64748b" 
                strokeDasharray="5 5" 
                strokeWidth={1.5}
                label={{ 
                  value: `Target: ${profile.targetCalories} kcal`, 
                  position: 'insideTopRight', 
                  fill: '#64748b', 
                  fontSize: 11,
                  fontWeight: 600
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="calories" 
                name="Calories Consumed"
                stroke="#10b981" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#weeklyCalorieGradient)"
                activeDot={{ r: 6, fill: '#10b981', stroke: '#ffffff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 7-Day Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Average daily calories */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">7-Day Average</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800">{avgCalories}</span>
                <span className="text-xs text-slate-500">kcal/day</span>
              </div>
            </div>
          </div>

          {/* Days on target */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Goal Consistency</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800">{onTargetDays} / 7</span>
                <span className="text-xs text-slate-500">days within target</span>
              </div>
            </div>
          </div>

          {/* Peak intake day */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Highest Day</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-800">
                  {maxDay && maxDay.calories > 0 ? `${maxDay.calories} kcal` : "—"}
                </span>
                {maxDay && maxDay.calories > 0 && (
                  <span className="text-xs text-slate-500">({maxDay.dayName})</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Healthy items & recommendations quick promo */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 flex-shrink-0">
          <Apple className="h-6 w-6" />
        </div>
        <div className="text-center sm:text-left">
          <h4 className="text-sm font-semibold text-slate-800">Explore Nutritional Insights</h4>
          <p className="text-xs text-slate-500 mt-1">
            Need inspiration? Visit the <strong>Healthy Foods Directory</strong> or <strong>Personalized Recommendations</strong> tabs to unlock custom meals optimized by Gemini.
          </p>
        </div>
      </div>

      {/* SHARE PROGRESS MODAL */}
      {showShareModal && (
        <ShareProgressModal
          selectedDate={selectedDate}
          profile={profile}
          totalCalories={totalCalories}
          totalProtein={totalProtein}
          totalCarbs={totalCarbs}
          totalFat={totalFat}
          calPercent={calPercent}
          proteinPercent={proteinPercent}
          carbsPercent={carbsPercent}
          fatPercent={fatPercent}
          waterCups={waterCups}
          hydrationGoal={hydrationGoal}
          hydrationPercent={hydrationPercent}
          isHydrationUnlocked={isHydrationUnlocked}
          badges={badges}
          unlockedCount={unlockedCount}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
}
