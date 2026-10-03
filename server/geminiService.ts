/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from "../src/types.js";

let aiInstance: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      throw new Error(
        "GEMINI_API_KEY is not configured or contains placeholder. Please set your Gemini API key in the secrets panel."
      );
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiInstance;
}

/**
 * Automatically analyze a food image, identify ingredients, portion sizes, and calculate nutritional values.
 */
export async function analyzeFoodPhoto(base64Data: string, mimeType: string) {
  const client = getGeminiClient();

  const prompt = `Analyze this food image. Identify the visual food items, estimate their portions/weights, and calculate their calorie and macronutrient values (protein, carbs, fat in grams). For multiple foods in a single dish, split them out if possible, otherwise list the overall dish parts. Provide a nutritional health score (1 to 100) reflecting how healthy, nutrient-rich, and unprocessed the food is. Give friendly, actionable, and encouraging health/diet feedback on this meal. Ensure all numerical nutrient estimates are realistic averages.`;

  const imagePart = {
    inlineData: {
      data: base64Data,
      mimeType,
    },
  };

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [imagePart, prompt],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          identifiedItems: {
            type: Type.ARRAY,
            description: "List of individual ingredients or dishes identified in the photo",
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Name of the food item or ingredient" },
                portionEstimate: { type: Type.STRING, description: "Estimated portion size, e.g. '150g', '1 medium bowl', '2 slices'" },
                calories: { type: Type.INTEGER, description: "Estimated calories" },
                protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
                carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
                fat: { type: Type.NUMBER, description: "Estimated fats in grams" },
                confidence: { type: Type.NUMBER, description: "Confidence score between 0.0 and 1.0" },
              },
              required: ["name", "portionEstimate", "calories", "protein", "carbs", "fat", "confidence"],
            },
          },
          totalCalories: { type: Type.INTEGER, description: "Sum of estimated calories" },
          totalProtein: { type: Type.NUMBER, description: "Sum of estimated protein in grams" },
          totalCarbs: { type: Type.NUMBER, description: "Sum of estimated carbs in grams" },
          totalFat: { type: Type.NUMBER, description: "Sum of estimated fats in grams" },
          healthScore: { type: Type.INTEGER, description: "Health score of the meal from 1 (unhealthy) to 100 (superfood)" },
          feedback: { type: Type.STRING, description: "Insightful diet feedback about the nutritional balance of the photo" },
        },
        required: ["identifiedItems", "totalCalories", "totalProtein", "totalCarbs", "totalFat", "healthScore", "feedback"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }
  return JSON.parse(text);
}

/**
 * Fallback search to lookup any food item in the world and generate accurate nutritional info.
 */
export async function searchFoodWithAI(query: string) {
  const client = getGeminiClient();

  const prompt = `You are a certified nutrition database. Provide average nutritional and macro details for the food item queried: "${query}". Be highly accurate, realistic, and objective. State the typical standard serving size for this food. Calculate calories, protein, carbs, and fat. Rate its overall nutritional health score from 1 to 100 and list 3 powerful health benefits of taking this food inside.`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Properly formatted name of the food item" },
          calories: { type: Type.INTEGER, description: "Calories per typical serving" },
          protein: { type: Type.NUMBER, description: "Protein in grams per typical serving" },
          carbs: { type: Type.NUMBER, description: "Carbohydrates in grams per typical serving" },
          fat: { type: Type.NUMBER, description: "Fats in grams per typical serving" },
          servingSize: { type: Type.STRING, description: "Standard serving size, e.g. '1 medium fruit', '100g', '1 cup cooked'" },
          healthScore: { type: Type.INTEGER, description: "Health score from 1 to 100" },
          benefits: {
            type: Type.ARRAY,
            description: "Three health benefits or nutritional advantages of this item",
            items: { type: Type.STRING },
          },
        },
        required: ["name", "calories", "protein", "carbs", "fat", "servingSize", "healthScore", "benefits"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }
  return JSON.parse(text);
}

/**
 * Generate highly personalized goal-based diet plans and daily caloric targets.
 */
export async function getPersonalizedRecommendations(profile: UserProfile) {
  const client = getGeminiClient();

  const prompt = `You are an expert sports and clinical nutritionist. Generate a personalized dietary strategy, caloric target, and macronutrient targets (protein, carbs, fat in grams) for a user with the following profile:
  - Age: ${profile.age}
  - Gender: ${profile.gender}
  - Weight: ${profile.weight} kg
  - Height: ${profile.height} cm
  - Activity Level: ${profile.activityLevel} (sedentary, moderate, or active)
  - Goal: ${profile.goal} (weight_loss, maintenance, muscle_gain, low_carb, or clean_eating)
  
  Suggest a realistic, sustainable daily calorie target and macro balance in grams. Draft an overview explaining the strategy, recommend explicit recipes/meals for breakfast, lunch, dinner, and snacks, and provide five general nutrition tips. Keep the tone friendly, scientific, and highly encouraging.`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          dailyCalorieTarget: { type: Type.INTEGER, description: "Suggested daily calorie goal" },
          macros: {
            type: Type.OBJECT,
            properties: {
              protein: { type: Type.INTEGER, description: "Target protein in grams" },
              carbs: { type: Type.INTEGER, description: "Target carbs in grams" },
              fat: { type: Type.INTEGER, description: "Target fat in grams" },
            },
            required: ["protein", "carbs", "fat"],
          },
          overview: { type: Type.STRING, description: "High-level summary of the nutrition strategy and physiological logic" },
          breakfastIdeas: {
            type: Type.ARRAY,
            description: "Three diverse breakfast meals aligned with this goal",
            items: { type: Type.STRING },
          },
          lunchIdeas: {
            type: Type.ARRAY,
            description: "Three diverse lunch meals aligned with this goal",
            items: { type: Type.STRING },
          },
          dinnerIdeas: {
            type: Type.ARRAY,
            description: "Three diverse dinner meals aligned with this goal",
            items: { type: Type.STRING },
          },
          snacksIdeas: {
            type: Type.ARRAY,
            description: "Three healthy snack options aligned with this goal",
            items: { type: Type.STRING },
          },
          generalTips: {
            type: Type.ARRAY,
            description: "Five crucial science-backed tips for dietary consistency and success",
            items: { type: Type.STRING },
          },
        },
        required: [
          "dailyCalorieTarget",
          "macros",
          "overview",
          "breakfastIdeas",
          "lunchIdeas",
          "dinnerIdeas",
          "snacksIdeas",
          "generalTips",
        ],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }
  return JSON.parse(text);
}

/**
 * Generate medical nutrition therapy diet plans for users suffering from diseases.
 */
export async function getDiseaseDietPlan(conditionName: string) {
  const client = getGeminiClient();

  const prompt = `You are a clinical dietitian specialist in Medical Nutrition Therapy (MNT). Draft a safe, detailed therapeutic diet plan to reduce symptoms and support recovery/management of: "${conditionName}".
  Provide an ID (slug), proper name, medical description, core guidelines, foods to prioritize/embrace, foods to limit/avoid, a highly practical 1-day sample menu (breakfast, lunch, dinner, snack), and crucial medical safety tips. Ensure the advice is medically aligned (e.g., lower sodium for hypertension, complex carbs/low glycemic index for diabetes, etc.).`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: "Sebab-case unique identifier slug for the condition, e.g. 'type-2-diabetes'" },
          name: { type: Type.STRING, description: "Full proper medical name of the condition, e.g. 'Type 2 Diabetes'" },
          description: { type: Type.STRING, description: "Clear, simple explanation of the disease and why specific nutrition helps" },
          guidelines: {
            type: Type.ARRAY,
            description: "Core nutrition principles for managing this condition",
            items: { type: Type.STRING },
          },
          foodsToEmbrace: {
            type: Type.ARRAY,
            description: "Foods that are highly beneficial and safe",
            items: { type: Type.STRING },
          },
          foodsToAvoid: {
            type: Type.ARRAY,
            description: "Foods that trigger symptoms or worsen the condition and should be avoided",
            items: { type: Type.STRING },
          },
          sampleMenu: {
            type: Type.ARRAY,
            description: "A highly practical 1-day sample menu",
            items: {
              type: Type.OBJECT,
              properties: {
                meal: { type: Type.STRING, description: "Meal name: Breakfast, Lunch, Dinner, or Snack" },
                items: {
                  type: Type.ARRAY,
                  description: "Specific food items for this meal",
                  items: { type: Type.STRING },
                },
              },
              required: ["meal", "items"],
            },
          },
          tips: {
            type: Type.ARRAY,
            description: "Essential lifestyle, cooking, or safety tips",
            items: { type: Type.STRING },
          },
        },
        required: ["id", "name", "description", "guidelines", "foodsToEmbrace", "foodsToAvoid", "sampleMenu", "tips"],
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }
  return JSON.parse(text);
}

/**
 * Generate a combined family nutrition and meal plan based on the core user and family members.
 */
export async function getFamilyPlanRecommendations(profile: UserProfile, familyMembers: any[]) {
  const client = getGeminiClient();

  const prompt = `You are a professional family dietitian and clinical nutritionist. Generate a comprehensive combined family diet plan.
  Primary Account Holder:
  - Name: ${profile.name || "User"}
  - Age: ${profile.age}, Gender: ${profile.gender}, Goal: ${profile.goal}
  
  Family Members:
  ${familyMembers.map((m, i) => `${i+1}. Name: ${m.name}, Relationship: ${m.relationship}, Age: ${m.age}, Gender: ${m.gender}, Goal: ${m.goal}`).join("\n")}

  Generate:
  1. A high-level familyOverview of combined nutritional strategy and harmony, balancing everyone's goals.
  2. A combined daily calorie estimate for the household to buy/cook for.
  3. A memberSummary for each individual listing a suggested daily calorie count and one key dietary advice tip.
  4. At least 5 family meal ideas that are kid-friendly, senior-friendly, nutrient-dense, and satisfying for everyone in the group.`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          familyOverview: { type: Type.STRING, description: "Strategy for family nutrition harmony" },
          combinedDailyCalories: { type: Type.INTEGER, description: "Suggested combined total household calories" },
          memberSummaries: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                memberName: { type: Type.STRING },
                relationship: { type: Type.STRING },
                suggestedCalories: { type: Type.INTEGER },
                keyAdvice: { type: Type.STRING }
              },
              required: ["memberName", "relationship", "suggestedCalories", "keyAdvice"]
            }
          },
          familyMealIdeas: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["familyOverview", "combinedDailyCalories", "memberSummaries", "familyMealIdeas"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }
  return JSON.parse(text);
}

/**
 * Generate weekly grocery/ration estimate for the user and their family.
 */
export async function getWeeklyRationPlan(profile: UserProfile, familyMembers: any[], preferences?: string) {
  const client = getGeminiClient();

  const prompt = `You are a clinical household dietitian and supply chain/grocery planning expert. Estimate a highly practical 7-day grocery ration (ingredients breakdown) for this household.
  Household Size: ${1 + familyMembers.length} person(s).
  Primary: Name: ${profile.name || "User"}, Age: ${profile.age}, Goal: ${profile.goal}
  Family Members:
  ${familyMembers.map((m, i) => `${m.name} (${m.relationship}, Age: ${m.age}, Goal: ${m.goal})`).join("\n")}
  
  Preferences / Diet style: ${preferences || "Balanced whole-food diet"}

  Estimate the total weight/volume requirements for a 7-day period for major categories (e.g., Grains, Proteins, Vegetables, Fruits, Dairy or alternatives, Fats & Oils, etc.). Ensure amounts are mathematically scaled and practical for the group size.`;

  const response = await client.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overview: { type: Type.STRING, description: "Summary explaining the ration scale, based on caloric needs of the home" },
          durationDays: { type: Type.INTEGER, description: "Usually 7 days" },
          rations: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, description: "e.g., Grains & Cereals, Proteins (Meats/Tofu/Legumes), Vegetables, etc." },
                amount: { type: Type.STRING, description: "e.g., '4.5 kg', '10 liters', '3 dozen'" },
                items: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: "Specific recommended items to buy in this category"
                },
                notes: { type: Type.STRING, description: "Optional notes e.g., 'Prioritize high-fiber' or 'Focus on lean meat'" }
              },
              required: ["category", "amount", "items"]
            }
          },
          rationTips: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Tips on storage, waste reduction, and cost-effective planning"
          }
        },
        required: ["overview", "durationDays", "rations", "rationTips"]
      }
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response text received from Gemini.");
  }
  return JSON.parse(text);
}
