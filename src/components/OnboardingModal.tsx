/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Sparkles, 
  User, 
  Activity, 
  Users, 
  ShoppingBag, 
  ArrowRight, 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Loader2, 
  Heart, 
  CheckCircle,
  Apple
} from "lucide-react";
import { UserProfile, UserGoal, ActivityLevel, FamilyMember, FamilyPlanResponse, WeeklyRationResponse } from "../types.js";

interface OnboardingModalProps {
  onComplete: (
    profile: UserProfile, 
    familyMembers: FamilyMember[], 
    familyPlan: FamilyPlanResponse | null, 
    weeklyRations: WeeklyRationResponse | null
  ) => void;
}

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState(28);
  const [gender, setGender] = useState<"male" | "female" | "other">("male");
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(175);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>("moderate");
  const [goal, setGoal] = useState<UserGoal>("maintenance");

  // Selection choices
  const [includePersonal, setIncludePersonal] = useState(true);
  const [includeFamily, setIncludeFamily] = useState(false);
  const [includeRations, setIncludeRations] = useState(false);

  // Family State
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [newMemName, setNewMemName] = useState("");
  const [newMemRelation, setNewMemRelation] = useState("Spouse");
  const [newMemAge, setNewMemAge] = useState(28);
  const [newMemGender, setNewMemGender] = useState<"male" | "female" | "other">("female");
  const [newMemGoal, setNewMemGoal] = useState<UserGoal>("maintenance");

  // Rations State
  const [dietPref, setDietPref] = useState("Balanced Whole-food");
  
  // Statuses
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const handleAddFamilyMember = () => {
    if (!newMemName.trim()) return;
    const newMember: FamilyMember = {
      id: `fam_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newMemName.trim(),
      relationship: newMemRelation,
      age: newMemAge,
      gender: newMemGender,
      goal: newMemGoal
    };
    setFamilyMembers(prev => [...prev, newMember]);
    setNewMemName("");
  };

  const handleRemoveFamilyMember = (id: string) => {
    setFamilyMembers(prev => prev.filter(m => m.id !== id));
  };

  // Move forward through steps
  const nextStep = () => {
    if (step === 1 && !name.trim()) {
      alert("Please enter your name to continue!");
      return;
    }
    
    let targetNext = step + 1;
    if (step === 3) {
      if (!includeFamily && !includeRations) {
        // Skip family and ration config, jump straight to loader step
        targetNext = 6;
      } else if (!includeFamily && includeRations) {
        // Skip family, go to rations step
        targetNext = 5;
      }
    } else if (step === 4) {
      if (!includeRations) {
        // Skip rations config, go to loader step
        targetNext = 6;
      }
    }
    
    setStep(targetNext);
  };

  // Move backward through steps
  const prevStep = () => {
    let targetPrev = step - 1;
    if (step === 6) {
      if (!includeRations && !includeFamily) {
        targetPrev = 3;
      } else if (includeRations && !includeFamily) {
        targetPrev = 5;
      } else if (!includeRations && includeFamily) {
        targetPrev = 4;
      }
    } else if (step === 5) {
      if (!includeFamily) {
        targetPrev = 3;
      }
    }
    setStep(targetPrev);
  };

  const calculateOfflineBMR = (w: number, h: number, a: number, g: string, act: ActivityLevel, gl: UserGoal) => {
    let bmr = 0;
    if (g === "male") {
      bmr = 10 * w + 6.25 * h - 5 * a + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * a - 161;
    }

    let multiplier = 1.2;
    if (act === "moderate") multiplier = 1.375;
    if (act === "active") multiplier = 1.55;

    let tdee = Math.round(bmr * multiplier);
    let targetCal = tdee;
    if (gl === "weight_loss") targetCal = tdee - 500;
    if (gl === "muscle_gain") targetCal = tdee + 300;
    if (gl === "low_carb") targetCal = tdee - 200;

    targetCal = Math.max(targetCal, 1200);

    const targetP = Math.round(gl === "muscle_gain" ? 2.2 * w : gl === "weight_loss" ? 2.0 * w : 1.8 * w);
    let targetF = Math.round((targetCal * 0.25) / 9);
    if (gl === "low_carb") {
      targetF = Math.round((targetCal * 0.55) / 9);
    }
    const targetC = Math.max(30, Math.round((targetCal - (targetP * 4 + targetF * 9)) / 4));

    return {
      dailyCalorieTarget: targetCal,
      protein: targetP,
      carbs: targetC,
      fat: targetF,
      tdee
    };
  };

  const triggerAIFormulation = async () => {
    setIsLoading(true);
    
    // 1. Core Profile targets
    const { dailyCalorieTarget, protein, carbs, fat } = calculateOfflineBMR(weight, height, age, gender, activityLevel, goal);
    const finalizedProfile: UserProfile = {
      name: name.trim(),
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      targetCalories: dailyCalorieTarget,
      targetProtein: protein,
      targetCarbs: carbs,
      targetFat: fat
    };

    let calculatedPersonal: any = null;
    let calculatedFamily: FamilyPlanResponse | null = null;
    let calculatedRations: WeeklyRationResponse | null = null;

    try {
      // Step A: Personal Plan (optional but usually run)
      if (includePersonal) {
        setStatusMessage("Formulating your personal scientific calorie budget...");
        try {
          const res = await fetch("/api/recommendations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: finalizedProfile })
          });
          const data = await res.json();
          if (data.success && data.recommendations) {
            calculatedPersonal = data.recommendations;
            finalizedProfile.targetCalories = data.recommendations.dailyCalorieTarget;
            finalizedProfile.targetProtein = data.recommendations.macros.protein;
            finalizedProfile.targetCarbs = data.recommendations.macros.carbs;
            finalizedProfile.targetFat = data.recommendations.macros.fat;
          }
        } catch (err) {
          console.warn("AI Personal Rec fell back.", err);
        }
      }

      // Step B: Family Plan
      if (includeFamily) {
        setStatusMessage("Harmonizing nutritional goals for your family...");
        try {
          const res = await fetch("/api/family-plan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ profile: finalizedProfile, familyMembers })
          });
          const data = await res.json();
          if (data.success && data.familyPlan) {
            calculatedFamily = data.familyPlan;
          } else {
            throw new Error();
          }
        } catch (err) {
          console.warn("AI Family Plan fell back. Activating clinical math fallback.", err);
          
          let sumCalories = finalizedProfile.targetCalories;
          const memberSummariesList = familyMembers.map(m => {
            const { dailyCalorieTarget: mCals } = calculateOfflineBMR(
              m.relationship === "Child" ? 30 : 65, 
              m.relationship === "Child" ? 120 : 165, 
              m.age, 
              m.gender, 
              "moderate", 
              m.goal
            );
            sumCalories += mCals;

            let mAdvice = "Maintain a colorful variety of dietary sources.";
            if (m.goal === "weight_loss") mAdvice = "Prioritize nutrient-dense proteins and healthy fiber to feel full longer.";
            if (m.goal === "muscle_gain") mAdvice = "Fuel recovery with lean amino proteins and clean complex carbohydrates.";
            if (m.goal === "low_carb") mAdvice = "Embrace healthy essential plant fats, avocados, and cruciferous green vegetables.";

            return {
              memberName: m.name,
              relationship: m.relationship,
              suggestedCalories: mCals,
              keyAdvice: mAdvice
            };
          });

          calculatedFamily = {
            familyOverview: `Balanced nutritional alignment compiled for ${name}'s family. Focus is placed on sustaining active growth for younger members while promoting structural cellular integrity and lipid optimization for adult members.`,
            combinedDailyCalories: sumCalories,
            memberSummaries: memberSummariesList,
            familyMealIdeas: [
              "One-pot rustic chicken breast with quinoa and steamed green beans",
              "Lean turkey tacos inside whole grain corn shells with chopped avocado and tomato salsa",
              "Baked salmon steaks with roasted lemon sweet potato wedges",
              "Creamy red lentil and carrot dahl served with a wild brown rice blend",
              "Tofu stir fry with light sesame seeds, broccoli crowns, and snap peas"
            ]
          };
        }
      }

      // Step C: Weekly Ration Plan
      if (includeRations) {
        setStatusMessage("Scaling weekly grocery and ingredient quotas...");
        try {
          const res = await fetch("/api/weekly-ration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              profile: finalizedProfile, 
              familyMembers, 
              preferences: dietPref 
            })
          });
          const data = await res.json();
          if (data.success && data.weeklyRations) {
            calculatedRations = data.weeklyRations;
          } else {
            throw new Error();
          }
        } catch (err) {
          console.warn("AI Weekly Ration fell back. Deploying offline scale model.", err);
          const totalPeople = 1 + familyMembers.length;
          
          calculatedRations = {
            overview: `Estimated 7-day grocery ration guidelines customized for a household of ${totalPeople} following a ${dietPref} regime. High accuracy based on total energy requirement scaling.`,
            durationDays: 7,
            rations: [
              {
                category: "Grains & Carbohydrates",
                amount: `${(totalPeople * 1.5).toFixed(1)} kg`,
                items: ["Steel-cut oats", "Brown basmati rice", "Quinoa", "Whole wheat sourdough"],
                notes: "Aim for unrefined whole grains for a lower glycemic index impact."
              },
              {
                category: "Lean Proteins & Legumes",
                amount: `${(totalPeople * 1.3).toFixed(1)} kg`,
                items: ["Organic eggs", "Skinless chicken breast", "Atlantic salmon fillets", "Red lentils", "Firm organic tofu"],
                notes: "Provides essential branch-chain amino acids for structural recovery."
              },
              {
                category: "Garden Vegetables",
                amount: `${(totalPeople * 2.2).toFixed(1)} kg`,
                items: ["Spinach and Kale", "Broccoli crowns", "Baby carrots", "Bell peppers", "Fresh garlic & ginger"],
                notes: "Vital source of micronutrients, magnesium, and dietary fiber."
              },
              {
                category: "Fresh Seasonal Fruits",
                amount: `${(totalPeople * 1.1).toFixed(1)} kg`,
                items: ["Anti-oxidant rich blueberries", "Organic bananas", "Crisp red apples"],
                notes: "Great for quick energy reserves and cellular hydration."
              },
              {
                category: "Dairy & Plant Alternatives",
                amount: `${(totalPeople * 1.5).toFixed(1)} L`,
                items: ["Plain unsweetened Greek yogurt", "Unsweetened organic Almond milk", "Low-sodium cottage cheese"],
                notes: "High calcium and probiotic culture reserves for digestive health."
              },
              {
                category: "Essential Lipids & Nuts",
                amount: `${(totalPeople * 0.3).toFixed(1)} kg`,
                items: ["Cold-pressed extra virgin olive oil", "Raw unsalted almonds", "Chia & flax seeds"],
                notes: "Healthy monounsaturated fats supporting hormonal synthesis."
              }
            ],
            rationTips: [
              "Buy grains and dry legumes in bulk to optimize costs and minimize shelf turnover.",
              "Rinse canned lentils and beans thoroughly to strip packaging sodium content.",
              "Wrap fresh leafy herbs in slightly damp paper towels to double their storage life."
            ]
          };
        }
      }

      setStatusMessage("Saving your profiles and compiling dashboards...");
      // Save results
      if (calculatedPersonal) {
        localStorage.setItem("last_ai_recommendation", JSON.stringify(calculatedPersonal));
      }
      if (calculatedFamily) {
        localStorage.setItem("family_nutrition_plan", JSON.stringify(calculatedFamily));
      }
      if (calculatedRations) {
        localStorage.setItem("weekly_ration_plan", JSON.stringify(calculatedRations));
      }
      localStorage.setItem("family_members_list", JSON.stringify(familyMembers));
      localStorage.setItem("has_onboarded", "true");

      // Give a tiny buffer for a seamless feel
      await new Promise(resolve => setTimeout(resolve, 800));
      onComplete(finalizedProfile, familyMembers, calculatedFamily, calculatedRations);
    } catch (e) {
      console.error(e);
      alert("A critical setup error occurred. Continuing using local clinical mathematical standards!");
      onComplete(finalizedProfile, familyMembers, null, null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto" id="onboarding-modal">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Onboarding Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <Apple className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-md font-black tracking-tight leading-none">NutDiary</h2>
              <span className="text-[10px] text-emerald-100 font-bold uppercase tracking-wider block mt-1">Smart Setup Engine</span>
            </div>
          </div>
          <span className="text-xs font-bold bg-white/10 px-2.5 py-1 rounded-full text-emerald-50">
            Step {step} of 6
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 shrink-0">
          <div 
            className="bg-emerald-500 h-1.5 transition-all duration-300" 
            style={{ width: `${(step / 6) * 100}%` }}
          />
        </div>

        {/* Step Contents */}
        <div className="p-6 overflow-y-auto flex-grow space-y-6">
          
          {/* STEP 1: Name & Basic Bio */}
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Hello! Let's get to know you</h3>
                <p className="text-xs text-slate-500">Provide your basic profile details so we can align our algorithms.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">What should we call you? (Full Name)</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Abhilash G."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Your Age (Years)</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={age}
                      onChange={(e) => setAge(Math.max(1, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Biological Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Physical Metrics */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Your Physical Metrics</h3>
                <p className="text-xs text-slate-500">Required to compute your baseline metabolic rate (BMR) and total daily energy requirements.</p>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Weight (in kg)</label>
                    <input
                      type="number"
                      min="20"
                      max="400"
                      value={weight}
                      onChange={(e) => setWeight(Math.max(20, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Height (in cm)</label>
                    <input
                      type="number"
                      min="50"
                      max="300"
                      value={height}
                      onChange={(e) => setHeight(Math.max(50, Number(e.target.value)))}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Weekly Physical Activity Level</label>
                  <select
                    value={activityLevel}
                    onChange={(e) => setActivityLevel(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                  >
                    <option value="sedentary">Sedentary (Little or no exercise, office desk deskbound)</option>
                    <option value="moderate">Moderate Exercise (3 to 5 times/week, medium intensity)</option>
                    <option value="active">Very Active (6 to 7 times/week, high volume training)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Plan Scope & Primary Goal */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Your Plan Scope & Goals</h3>
                <p className="text-xs text-slate-500">Choose your primary goal and check the options you want our AI engine to formulate for you.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1.5">Primary Nutritional & Body Goal</label>
                  <select
                    value={goal}
                    onChange={(e) => setGoal(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                  >
                    <option value="weight_loss">Weight Loss (Caloric Deficit, Fat Loss)</option>
                    <option value="maintenance">Weight Maintenance (Isocaloric Balance)</option>
                    <option value="muscle_gain">Muscle Gain & Hypertrophy (Anabolic Surplus)</option>
                    <option value="low_carb">Low Carbohydrate / Ketogenic Transition</option>
                    <option value="clean_eating">Clean Eating (Natural Organic Whole-foods)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 block">Select the plans to prepare:</label>
                  
                  <div className="grid grid-cols-1 gap-3">
                    
                    {/* Personal Plan Selection */}
                    <div 
                      onClick={() => setIncludePersonal(!includePersonal)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        includePersonal 
                          ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/5" 
                          : "bg-white hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={includePersonal} 
                        onChange={() => {}} // handled by parent container click
                        className="mt-1 h-4 w-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500" 
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-emerald-500" />
                          Personal Scientific Diet Plan
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Calculates individual caloric budgets, proteins, carbs, fats, and customized recipes.</p>
                      </div>
                    </div>

                    {/* Family Plan Selection */}
                    <div 
                      onClick={() => setIncludeFamily(!includeFamily)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        includeFamily 
                          ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/5" 
                          : "bg-white hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={includeFamily} 
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500" 
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-emerald-500" />
                          Family Nutrition Harmonizer Plan
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Add household members to calculate combined household daily needs and collective meals.</p>
                      </div>
                    </div>

                    {/* Weekly Ration Selection */}
                    <div 
                      onClick={() => setIncludeRations(!includeRations)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start gap-3.5 ${
                        includeRations 
                          ? "bg-emerald-50/40 border-emerald-300 ring-2 ring-emerald-500/5" 
                          : "bg-white hover:bg-slate-50 border-slate-100"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={includeRations} 
                        onChange={() => {}}
                        className="mt-1 h-4 w-4 text-emerald-600 border-slate-200 rounded focus:ring-emerald-500" 
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                          <ShoppingBag className="h-4 w-4 text-emerald-500" />
                          7-Day Weekly Household Ration Estimator
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">Generates scaled grocery weights for grains, proteins, greens, and dairy for the week.</p>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Family Details Setup */}
          {step === 4 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Family Nutrition Setup</h3>
                <p className="text-xs text-slate-500">Specify other members of your household so we can build your collective nutritional framework.</p>
              </div>

              {/* Add form inside card */}
              <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">Add Family Member</span>
                
                <div className="grid grid-cols-2 gap-3">
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
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Age</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      value={newMemAge}
                      onChange={(e) => setNewMemAge(Math.max(1, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500 text-slate-700"
                    />
                  </div>
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
                  onClick={handleAddFamilyMember}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 shadow-sm"
                >
                  <Plus className="h-3.5 w-3.5" /> Add Member to Group
                </button>
              </div>

              {/* Registry of family members */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Your Registered Members ({familyMembers.length})</span>
                {familyMembers.length === 0 ? (
                  <div className="p-6 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-400">
                    No family members added yet. Add them using the form above!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[160px] overflow-y-auto">
                    {familyMembers.map((m) => (
                      <div key={m.id} className="p-3 bg-white border border-slate-100 rounded-xl flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center text-xs font-bold">
                            {m.relationship.charAt(0)}
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-800">{m.name}</span>
                            <div className="flex gap-2 text-[10px] text-slate-400 font-semibold -mt-0.5">
                              <span>{m.relationship}</span>
                              <span>•</span>
                              <span>{m.age} Years</span>
                              <span>•</span>
                              <span className="capitalize">{m.goal.replace("_", " ")}</span>
                            </div>
                          </div>
                        </div>

                        <button 
                          onClick={() => handleRemoveFamilyMember(m.id)}
                          className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Ration Customization */}
          {step === 5 && (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-800">Weekly Ration Preferences</h3>
                <p className="text-xs text-slate-500">Provide baseline details about your family's eating habits to scale the 7-day pantry quotas.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">Household Diet Archetype</label>
                  <select
                    value={dietPref}
                    onChange={(e) => setDietPref(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-slate-700"
                  >
                    <option value="Balanced Whole-food">Standard Balanced (Whole food, Meat & Plants)</option>
                    <option value="Fully Vegetarian">Pure Vegetarian (Legumes, Dairy, Herbs, No Meat)</option>
                    <option value="High-Protein Power">High Protein Athlete Regime (Egg, Fish, Poultry focus)</option>
                    <option value="Keto/LCHF">High Fat Low Carb / Ketogenic Archetype</option>
                    <option value="Plant-Based Vegan">Strict Vegan (100% Plant proteins, Dairy-free alternatives)</option>
                  </select>
                </div>

                <div className="bg-emerald-50/30 p-4 border border-emerald-100/50 rounded-2xl space-y-2">
                  <span className="text-xs font-bold text-emerald-800 block flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 animate-bounce" /> How the math works
                  </span>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-normal">
                    The AI correlates the metabolic base rates (BMR/TDEE) of everyone in the household (including your partner, children, or elderly parents), scales them into 7 full days of fuel requirements, and provides a direct gross weights catalog. Less kitchen waste, ideal portion sizes, and peak nutrient-density!
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Completion Screen & Processing */}
          {step === 6 && (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center space-y-6 animate-fade-in">
              {isLoading ? (
                <>
                  <div className="relative">
                    <div className="h-20 w-20 rounded-full border-4 border-slate-50 border-t-emerald-500 animate-spin" />
                    <Sparkles className="h-8 w-8 text-emerald-500 absolute top-6 left-6 animate-pulse" />
                  </div>
                  <div className="max-w-md space-y-1">
                    <h4 className="text-md font-black text-slate-800">Formulating Nutrition Matrix...</h4>
                    <p className="text-xs text-slate-400 font-mono tracking-wide">{statusMessage}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 shadow-lg shadow-emerald-100">
                    <CheckCircle className="h-10 w-10 animate-bounce" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h4 className="text-lg font-black text-slate-800">All Set, {name}!</h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      Your diagnostic parameters are locked. Click below to launch your personal macro profile, calculate household goals, and estimate your 7-day pantry quotas!
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

        </div>

        {/* Onboarding Footer Actions */}
        <div className="border-t border-slate-100 p-6 bg-slate-50/50 flex justify-between shrink-0">
          {step > 1 && step < 6 && (
            <button
              onClick={prevStep}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
          )}

          <div className="ml-auto">
            {step < 6 ? (
              <button
                onClick={nextStep}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-100"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              !isLoading && (
                <button
                  onClick={triggerAIFormulation}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-100"
                >
                  Prepare My Plans! <ArrowRight className="h-4 w-4" />
                </button>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
