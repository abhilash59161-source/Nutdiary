/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  servingSize: string; // e.g. "100g", "1 medium", "1 cup"
  servingAmount: number; // multiplier
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  loggedAt: string; // YYYY-MM-DD format
  healthScore?: number; // 1 to 100
  benefits?: string[];
}

export type UserGoal = "weight_loss" | "maintenance" | "muscle_gain" | "low_carb" | "clean_eating";
export type ActivityLevel = "sedentary" | "moderate" | "active";

export interface UserProfile {
  name?: string;
  age: number;
  gender: "male" | "female" | "other";
  weight: number; // in kg
  height: number; // in cm
  activityLevel: ActivityLevel;
  goal: UserGoal;
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number; // in grams
  targetFat: number; // in grams
}

export interface DiseaseCondition {
  id: string;
  name: string;
  description: string;
  guidelines: string[];
  foodsToEmbrace: string[];
  foodsToAvoid: string[];
  sampleMenu: {
    meal: string;
    items: string[];
  }[];
  tips: string[];
}

export interface SearchResult {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  healthScore: number;
  benefits: string[];
}

export interface ImageAnalysisResult {
  identifiedItems: {
    name: string;
    portionEstimate: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    confidence: number;
  }[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  healthScore: number;
  feedback: string;
}

export interface RecommendationResponse {
  dailyCalorieTarget: number;
  macros: {
    protein: number;
    carbs: number;
    fat: number;
  };
  overview: string;
  breakfastIdeas: string[];
  lunchIdeas: string[];
  dinnerIdeas: string[];
  snacksIdeas: string[];
  generalTips: string[];
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string; // Spouse, Child, Parent, Other
  age: number;
  gender: "male" | "female" | "other";
  goal: UserGoal;
}

export interface FamilyPlanResponse {
  familyOverview: string;
  combinedDailyCalories: number;
  memberSummaries: {
    memberName: string;
    relationship: string;
    suggestedCalories: number;
    keyAdvice: string;
  }[];
  familyMealIdeas: string[];
}

export interface WeeklyRationResponse {
  overview: string;
  durationDays: number;
  rations: {
    category: string; // e.g., "Grains & Cereals", "Proteins (Meats/Beans)", "Vegetables", "Dairy & Alt", "Fats & Oils"
    amount: string; // e.g., "5.4 kg", "12 liters"
    items: string[]; // e.g., ["Brown Rice", "Oats", "Quinoa"]
    notes?: string;
  }[];
  rationTips: string[];
}

export interface SmartFoodSuggestion {
  id: string;
  name: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  portion: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  goalFit: string;
  whyRecommended: string;
  ingredients: string[];
  prepTimeMinutes?: number;
  tags?: string[];
}

export interface SmartSuggestionsResponse {
  summary: string;
  targetDailyCalories: number;
  remainingCalories?: number;
  suggestions: SmartFoodSuggestion[];
}

