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

export interface RecipeSearchOptions {
  groceryItems: string[];
  mealType?: string;
  maxTimeMinutes?: number;
  dietaryGoal?: string;
  userGoal?: string;
}

/**
 * Intelligent Recipe Finder: suggest quick, healthy recipes utilizing what the user has in their grocery list.
 */
export async function findRecipesFromGroceries(options: RecipeSearchOptions) {
  const {
    groceryItems,
    mealType = "any",
    maxTimeMinutes = 30,
    dietaryGoal = "balanced",
    userGoal = "maintenance",
  } = options;

  const ingredientsList = groceryItems && groceryItems.length > 0
    ? groceryItems.join(", ")
    : "eggs, spinach, olive oil, oats, garlic, salt, pepper";

  try {
    const client = getGeminiClient();

    const prompt = `You are a creative executive chef and clinical nutritionist. The user has the following items in their grocery list / kitchen inventory:
[${ingredientsList}].

Generate 3 to 4 quick, healthy, delicious recipes the user can cook using these grocery items.
- Focus: ${dietaryGoal} (User fitness goal: ${userGoal}).
- Meal Category: ${mealType === "any" ? "Appropriate for any time of day (or mix of breakfast/lunch/dinner)" : mealType}.
- Target Cook/Prep Time: Under ${maxTimeMinutes} minutes.
- Emphasize whole, nutrient-dense ingredients.
- You can assume standard pantry basics like water, salt, black pepper, and cooking oil if not explicitly listed.
- Clearly separate ingredients used from their grocery list versus common pantry staples.
- Calculate realistic nutritional values (calories, protein, carbs, fat in grams per serving).
- Provide clear, simple, step-by-step instructions (3-5 steps).`;

    const response = await client.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  tagline: { type: Type.STRING, description: "Short appetizing 1-sentence descriptor" },
                  prepTimeMinutes: { type: Type.INTEGER },
                  cookTimeMinutes: { type: Type.INTEGER },
                  servings: { type: Type.INTEGER },
                  difficulty: { type: Type.STRING, description: "'Easy', 'Medium', or 'Quick'" },
                  caloriesPerServing: { type: Type.INTEGER },
                  proteinGrams: { type: Type.NUMBER },
                  carbsGrams: { type: Type.NUMBER },
                  fatGrams: { type: Type.NUMBER },
                  usedGroceryIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Ingredients directly matched from user's grocery list with quantities"
                  },
                  pantryStaplesNeeded: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Basic pantry items needed e.g. salt, olive oil, garlic"
                  },
                  missingOptionalIngredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Optional flavor boosters or garnishes"
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Clear step-by-step cooking steps"
                  },
                  chefTips: { type: Type.STRING, description: "Professional chef tip or easy variation" },
                  healthBenefits: { type: Type.STRING, description: "Key clinical nutrition highlight (e.g. high satiety, rich in polyphenols)" },
                },
                required: [
                  "id",
                  "title",
                  "tagline",
                  "prepTimeMinutes",
                  "cookTimeMinutes",
                  "servings",
                  "difficulty",
                  "caloriesPerServing",
                  "proteinGrams",
                  "carbsGrams",
                  "fatGrams",
                  "usedGroceryIngredients",
                  "pantryStaplesNeeded",
                  "instructions",
                  "chefTips",
                  "healthBenefits"
                ]
              }
            }
          },
          required: ["recipes"]
        }
      }
    });

    const text = response.text;
    if (text) {
      const parsed = JSON.parse(text);
      if (parsed.recipes && parsed.recipes.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn("Gemini Recipe Finder error or API key missing, generating curated recipe matches:", error);
  }

  // Fallback intelligent recipes matched from grocery items
  return getCuratedFallbackRecipes(groceryItems, mealType, maxTimeMinutes, dietaryGoal);
}

/**
 * Intelligent offline/fallback recipe generator matched against user's actual grocery items
 */
function getCuratedFallbackRecipes(
  groceryItems: string[],
  mealType: string,
  maxTime: number,
  goal: string
) {
  const lowerItems = (groceryItems || []).map((i) => i.toLowerCase());
  const has = (keyword: string) => lowerItems.some((item) => item.includes(keyword));

  const allFallbacks = [
    {
      id: "recipe-spinach-egg-scramble",
      title: "Mediterranean Spinach & Herb Egg Scramble",
      tagline: "Fluffy protein-rich eggs folded with sautéed greens and healthy fats.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 7,
      servings: 1,
      difficulty: "Quick",
      caloriesPerServing: 310,
      proteinGrams: 22,
      carbsGrams: 5,
      fatGrams: 22,
      matches: has("egg") || has("spinach") || has("arugula"),
      usedGroceryIngredients: [
        has("egg") ? "3 Large Eggs" : "3 Eggs (or scrambled tofu)",
        has("spinach") || has("arugula") ? "2 cups Baby Spinach" : "Fresh leafy greens"
      ],
      pantryStaplesNeeded: ["1 tsp Extra Virgin Olive Oil", "Pinch of Sea Salt", "Freshly cracked black pepper"],
      missingOptionalIngredients: ["Crumbled feta cheese", "Chili flakes"],
      instructions: [
        "Warm 1 teaspoon of olive oil in a non-stick skillet over medium-low heat.",
        "Add fresh spinach and toss for 60 seconds until gently wilted.",
        "Whisk eggs with a pinch of sea salt and black pepper; pour over wilted greens.",
        "Stir gently with a spatula from edges to center for 2-3 minutes until soft curds form.",
        "Remove from heat immediately to prevent overcooking and serve hot."
      ],
      chefTips: "Pull the eggs off heat while still slightly glossy; residual skillet heat finishes the cook perfectly.",
      healthBenefits: "High lutein and choline content for cognitive focus, plus bioavailable leucine for muscle preservation."
    },
    {
      id: "recipe-salmon-greens",
      title: "Pan-Seared Salmon with Warm Greens & Lemon",
      tagline: "Crisp-skinned omega-3 powerhouse paired with nutrient-dense sautéed greens.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 10,
      servings: 1,
      difficulty: "Easy",
      caloriesPerServing: 420,
      proteinGrams: 38,
      carbsGrams: 6,
      fatGrams: 26,
      matches: has("salmon") || has("fish") || has("spinach"),
      usedGroceryIngredients: [
        has("salmon") ? "1 Wild Salmon Fillet (180g)" : "1 Salmon or White Fish Fillet",
        has("spinach") || has("kale") ? "2 cups Baby Greens / Spinach" : "Green Vegetables"
      ],
      pantryStaplesNeeded: ["1 tbsp Olive Oil", "1 clove Minced Garlic", "Half Lemon juice", "Salt & Pepper"],
      missingOptionalIngredients: ["Fresh dill or parsley", "Toasted sesame seeds"],
      instructions: [
        "Pat salmon fillet completely dry with paper towel; season both sides generously with salt and pepper.",
        "Heat olive oil in a heavy pan over medium-high heat until shimmering.",
        "Place salmon skin-side down; cook undisturbed for 4-5 minutes until skin is golden and crispy.",
        "Flip and cook 2-3 minutes more until medium-rare to medium.",
        "Transfer salmon to plate, toss greens and minced garlic into the same hot pan for 90 seconds, and squeeze fresh lemon juice over everything."
      ],
      chefTips: "Dry salmon skin is the secret to restaurant-quality crispiness. Do not move the fish during the first 4 minutes.",
      healthBenefits: "High EPA & DHA fatty acids reduce systemic inflammation and support cardiovascular endothelial elasticity."
    },
    {
      id: "recipe-chicken-veggie-skillet",
      title: "Herb-Roasted Chicken & Veggie Power Bowl",
      tagline: "Lean seared chicken breast tossed with colorful fiber-rich produce.",
      prepTimeMinutes: 10,
      cookTimeMinutes: 14,
      servings: 2,
      difficulty: "Easy",
      caloriesPerServing: 380,
      proteinGrams: 44,
      carbsGrams: 16,
      fatGrams: 14,
      matches: has("chicken") || has("turkey") || has("broccoli") || has("spinach"),
      usedGroceryIngredients: [
        has("chicken") ? "400g Chicken Breast (sliced into cutlets)" : "400g Lean Poultry or Tofu",
        has("spinach") || has("broccoli") || has("avocado") ? "Assorted fresh produce / greens" : "2 cups mixed vegetables"
      ],
      pantryStaplesNeeded: ["1 tbsp Olive Oil", "Garlic Powder", "Dried Oregano or Italian Herbs", "Salt & Pepper"],
      missingOptionalIngredients: ["Balsamic glaze drizzle", "Crushed red pepper"],
      instructions: [
        "Season chicken cutlets with garlic powder, oregano, salt, and black pepper.",
        "Heat half of the olive oil in a skillet over medium-high; sear chicken 5-6 minutes per side until golden (internal temp 165°F/74°C).",
        "Rest chicken on cutting board for 3 minutes, then slice against the grain.",
        "Add remaining oil and vegetables to the pan, searing for 4 minutes until crisp-tender.",
        "Assemble chicken slices over vegetables and drizzle with pan drippings."
      ],
      chefTips: "Slicing chicken into even cutlets cuts cooking time in half and keeps the lean meat juicy.",
      healthBenefits: "Dense complete amino acid profile for muscle recovery combined with prebiotic micronutrients."
    },
    {
      id: "recipe-greek-yogurt-berry-parfait",
      title: "High-Protein Greek Yogurt & Berry Crunch Bowl",
      tagline: "Creamy, probiotic-rich protein bowl with vibrant antioxidant berries.",
      prepTimeMinutes: 4,
      cookTimeMinutes: 0,
      servings: 1,
      difficulty: "Quick",
      caloriesPerServing: 290,
      proteinGrams: 26,
      carbsGrams: 28,
      fatGrams: 7,
      matches: has("yogurt") || has("blueberr") || has("berr") || has("oat") || has("walnut"),
      usedGroceryIngredients: [
        has("yogurt") ? "1 cup Greek Yogurt 0% or 2%" : "1 cup Greek Yogurt",
        has("berr") || has("blueberr") ? "1/2 cup Fresh Berries" : "Fresh fruit of choice",
        has("oat") || has("walnut") || has("almond") ? "2 tbsp Rolled Oats or Chopped Walnuts" : "Handful of nuts or seeds"
      ],
      pantryStaplesNeeded: ["Dash of ground cinnamon", "1 tsp honey or stevia (optional)"],
      missingOptionalIngredients: ["Chia seeds", "Cacao nibs"],
      instructions: [
        "Spoon Greek yogurt into a bowl.",
        "Top with fresh berries and crushed walnuts or oats for texture.",
        "Dust with fragrant ground cinnamon and an optional light drizzle of raw honey.",
        "Enjoy immediately for an instant zero-cook metabolic fuel."
      ],
      chefTips: "Cinnamon has natural glucose-sensitizing properties that blunt morning blood sugar spikes.",
      healthBenefits: "Active probiotic cultures for microbiome diversity plus anthocyanin flavonoids for cellular protection."
    },
    {
      id: "recipe-overnight-protein-oats",
      title: "Creamy Chia & Rolled Oats Power Porridge",
      tagline: "Slow-release complex carbohydrates that sustain steady energy all morning.",
      prepTimeMinutes: 5,
      cookTimeMinutes: 5,
      servings: 1,
      difficulty: "Quick",
      caloriesPerServing: 340,
      proteinGrams: 16,
      carbsGrams: 48,
      fatGrams: 9,
      matches: has("oat") || has("chia") || has("milk") || has("banana"),
      usedGroceryIngredients: [
        has("oat") ? "1/2 cup Rolled Oats" : "Rolled or Quick Oats",
        has("walnut") || has("almond") ? "1 tbsp Crushed Nuts" : "Seeds or nuts",
        has("banana") || has("berr") ? "Fresh fruit slices" : "1/2 sliced banana or berries"
      ],
      pantryStaplesNeeded: ["1 cup water or milk", "Pinch of salt", "1/2 tsp vanilla extract"],
      missingOptionalIngredients: ["1 scoop protein powder", "1 tsp peanut butter"],
      instructions: [
        "Combine rolled oats, liquid, and pinch of salt in a saucepan over medium heat.",
        "Simmer for 4-5 minutes, stirring continuously until thick and creamy.",
        "Remove from heat and fold in vanilla extract and optional protein powder.",
        "Transfer to a bowl and top with sliced fruit and nuts."
      ],
      chefTips: "A pinch of salt in sweet oatmeal enhances the natural nutty sweetness of the grain.",
      healthBenefits: "Beta-glucan soluble fiber binds cholesterol in the digestive tract and enhances feelings of satiety."
    }
  ];

  // Prioritize matching recipes
  const prioritized = allFallbacks.sort((a, b) => (b.matches ? 1 : 0) - (a.matches ? 1 : 0));
  return { recipes: prioritized.slice(0, 3) };
}

export interface SmartSuggestionOptions {
  profile: UserProfile;
  remainingCalories?: number;
  remainingProtein?: number;
  remainingCarbs?: number;
  remainingFat?: number;
  mealType?: "all" | "breakfast" | "lunch" | "dinner" | "snack";
  preferenceFilter?: string;
  queryCraving?: string;
}

/**
 * Generate smart food suggestions tailored to the user's nutritional profile
 * to help them hit their daily calorie and macronutrient targets.
 */
export async function getSmartFoodSuggestions(options: SmartSuggestionOptions) {
  const { profile, remainingCalories, remainingProtein, remainingCarbs, remainingFat, mealType = "all", preferenceFilter = "balanced", queryCraving } = options;

  try {
    const client = getGeminiClient();

    const prompt = `You are a clinical performance dietitian. Recommend specific wholesome foods/meals for a user with this nutritional profile:
    - Age: ${profile.age}, Gender: ${profile.gender}, Weight: ${profile.weight} kg, Height: ${profile.height} cm
    - Goal: ${profile.goal}
    - Daily Target: ${profile.targetCalories} kcal (Protein: ${profile.targetProtein}g, Carbs: ${profile.targetCarbs}g, Fat: ${profile.targetFat}g)
    - Today's Remaining Target: ${remainingCalories !== undefined ? `${remainingCalories} kcal` : "Full Day"} (Remaining Protein: ${remainingProtein !== undefined ? `${remainingProtein}g` : "N/A"}, Carbs: ${remainingCarbs !== undefined ? `${remainingCarbs}g` : "N/A"}, Fat: ${remainingFat !== undefined ? `${remainingFat}g` : "N/A"})
    - Requested Meal Category: ${mealType}
    - User Preference / Filter: ${preferenceFilter}
    ${queryCraving ? `- User's specific craving or ingredient preference: "${queryCraving}"` : ""}

    Provide 6 to 8 specific, high-quality, practical food/meal suggestions covering ${mealType === "all" ? "Breakfast, Lunch, Dinner, and Snacks" : mealType}.
    For each food:
    - Name of the meal/dish
    - Meal type ("breakfast", "lunch", "dinner", or "snack")
    - Realistic portion description (e.g. "1 medium bowl (350g)" or "2 soft tacos (280g)")
    - Estimated calories (kcal), protein (g), carbs (g), fat (g), and dietary fiber (g)
    - Goal fit badge (e.g. "High Protein", "Lean Satiety", "Complex Carb Fuel", "Keto Friendly", "Metabolic Reset")
    - Clear, encouraging 1-2 sentence nutritional explanation of why this specific food helps them hit their calorie and macro goals
    - 3-5 key whole ingredients
    - Estimated prep time in minutes (10-30m)
    - 2-3 tags (e.g. ["High Fiber", "Gluten-Free", "Quick Prep"])
    `;

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "Short dietitian briefing explaining how these recommendations optimize the user's macronutrient balance today"
            },
            targetDailyCalories: { type: Type.INTEGER },
            remainingCalories: { type: Type.INTEGER },
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  name: { type: Type.STRING },
                  mealType: { type: Type.STRING, description: "breakfast, lunch, dinner, or snack" },
                  portion: { type: Type.STRING },
                  calories: { type: Type.INTEGER },
                  protein: { type: Type.INTEGER },
                  carbs: { type: Type.INTEGER },
                  fat: { type: Type.INTEGER },
                  fiber: { type: Type.INTEGER },
                  goalFit: { type: Type.STRING },
                  whyRecommended: { type: Type.STRING },
                  ingredients: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  prepTimeMinutes: { type: Type.INTEGER },
                  tags: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  }
                },
                required: ["name", "mealType", "portion", "calories", "protein", "carbs", "fat", "goalFit", "whyRecommended", "ingredients"]
              }
            }
          },
          required: ["summary", "suggestions"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text received from Gemini.");
    const parsed = JSON.parse(text);
    return {
      success: true,
      data: {
        ...parsed,
        targetDailyCalories: profile.targetCalories,
        remainingCalories: remainingCalories ?? profile.targetCalories
      }
    };
  } catch (err: any) {
    console.warn("Using offline smart food suggestions generator:", err?.message || err);
    return {
      success: true,
      data: generateFallbackSmartSuggestions(options)
    };
  }
}

/**
 * Rich offline smart food suggestions based on user profile, goals, and macro targets
 */
function generateFallbackSmartSuggestions(options: SmartSuggestionOptions) {
  const { profile, remainingCalories, remainingProtein, mealType = "all", preferenceFilter = "balanced", queryCraving } = options;

  // Scaling factor based on user's target calories vs standard 2000
  const calScale = Math.max(0.7, Math.min(1.5, profile.targetCalories / 2000));
  const isWeightLoss = profile.goal === "weight_loss";
  const isMuscleGain = profile.goal === "muscle_gain";
  const isLowCarb = profile.goal === "low_carb";

  const allSuggestions = [
    // BREAKFAST SUGGESTIONS
    {
      id: "sug-bf-1",
      name: "Mediterranean Spinach & Feta Egg White Scramble",
      mealType: "breakfast" as const,
      portion: "Plate with 2 slices Ezekiel toast (320g)",
      calories: Math.round(360 * calScale),
      protein: Math.round(34 * (isMuscleGain ? 1.2 : 1)),
      carbs: Math.round(28 * (isLowCarb ? 0.4 : 1)),
      fat: Math.round(11 * calScale),
      fiber: 6,
      goalFit: isMuscleGain ? "High Leucine Protein" : isLowCarb ? "Low Carb Satiety" : "Lean Protein & Micronutrients",
      whyRecommended: `Provides ${Math.round(34 * (isMuscleGain ? 1.2 : 1))}g of clean protein to jumpstart morning muscle protein synthesis while keeping insulin steady for your ${profile.goal.replace("_", " ")} goal.`,
      ingredients: ["3 egg whites + 1 whole pasture egg", "Baby spinach", "Crumbled low-fat feta", "Sprouted grain toast", "Cherry tomatoes"],
      prepTimeMinutes: 12,
      tags: ["High Protein", "Vegetarian", "Quick Cook"]
    },
    {
      id: "sug-bf-2",
      name: "Icelandic Skyr Protein Bowl with Wild Berries & Chia",
      mealType: "breakfast" as const,
      portion: "1 large bowl (340g)",
      calories: Math.round(310 * calScale),
      protein: Math.round(32 * (isMuscleGain ? 1.2 : 1)),
      carbs: Math.round(30 * (isLowCarb ? 0.5 : 1)),
      fat: Math.round(6 * calScale),
      fiber: 8,
      goalFit: "Gut Health & High Protein",
      whyRecommended: "Rich in slow-digesting casein and live cultures, offering long-lasting fullness without excess calories to preserve your daily budget.",
      ingredients: ["Plain 0% Skyr or Greek Yogurt", "Fresh blueberries & raspberries", "1 tbsp chia seeds", "Ground Ceylon cinnamon", "Crushed walnuts"],
      prepTimeMinutes: 5,
      tags: ["Zero Cook", "Antioxidant Rich", "High Fiber"]
    },
    {
      id: "sug-bf-3",
      name: "Steel-Cut Oats with Whey Isolate & Natural Almond Butter",
      mealType: "breakfast" as const,
      portion: "1 warm bowl (380g)",
      calories: Math.round(420 * calScale),
      protein: Math.round(30 * (isMuscleGain ? 1.25 : 1)),
      carbs: Math.round(52 * (isLowCarb ? 0.4 : 1)),
      fat: Math.round(12 * calScale),
      fiber: 9,
      goalFit: isMuscleGain ? "Anabolic Glycogen & Protein" : "Sustained Energy & Fiber",
      whyRecommended: "Beta-glucan soluble fiber delivers hours of stable glycemic endurance, ideal for active mornings and workout performance.",
      ingredients: ["Steel-cut oats", "Vanilla whey or plant isolate", "1 tbsp raw almond butter", "Sliced banana or berries", "Pinch of sea salt"],
      prepTimeMinutes: 15,
      tags: ["Slow Carb", "Heart Healthy", "Pre-Workout"]
    },

    // LUNCH SUGGESTIONS
    {
      id: "sug-lu-1",
      name: "Grilled Herb Chicken Breast & Tri-Color Quinoa Harvest Bowl",
      mealType: "lunch" as const,
      portion: "1 large bowl (420g)",
      calories: Math.round(510 * calScale),
      protein: Math.round(46 * (isMuscleGain ? 1.2 : 1)),
      carbs: Math.round(45 * (isLowCarb ? 0.35 : 1)),
      fat: Math.round(14 * calScale),
      fiber: 8,
      goalFit: "Complete Amino Acid & Energy Profile",
      whyRecommended: `Hits nearly ${Math.round(46 * (isMuscleGain ? 1.2 : 1))}g of lean protein to hit your ${profile.targetProtein}g daily target, paired with complex carbs for zero afternoon energy crash.`,
      ingredients: ["Free-range chicken breast", "Cooked quinoa", "Steamed broccoli & zucchini", "1/4 sliced avocado", "Lemon tahini drizzle"],
      prepTimeMinutes: 20,
      tags: ["Meal Prep Favorite", "High Protein", "Gluten-Free"]
    },
    {
      id: "sug-lu-2",
      name: "Wild Albacore Tuna & Avocado Mediterranean Salad",
      mealType: "lunch" as const,
      portion: "1 large salad bowl (390g)",
      calories: Math.round(440 * calScale),
      protein: Math.round(40 * (isMuscleGain ? 1.15 : 1)),
      carbs: Math.round(18 * (isLowCarb ? 0.7 : 1)),
      fat: Math.round(22 * calScale),
      fiber: 7,
      goalFit: isLowCarb ? "Keto-Optimized Omega Fats" : "Low Glycemic & High Protein",
      whyRecommended: "Packed with cardiovascular EPA/DHA omega-3 fatty acids and crisp cruciferous greens to accelerate fat oxidation.",
      ingredients: ["Solid white albacore tuna in water", "Mixed organic salad greens", "1/2 Hass avocado", "Cucumber & kalamata olives", "Extra virgin olive oil & red wine vinegar"],
      prepTimeMinutes: 10,
      tags: ["Low Carb", "Keto Friendly", "Zero Cook"]
    },
    {
      id: "sug-lu-3",
      name: "Warm Moroccan Lentil & Sweet Potato Stew with Tempeh",
      mealType: "lunch" as const,
      portion: "1 deep bowl (450g)",
      calories: Math.round(480 * calScale),
      protein: Math.round(28 * (isMuscleGain ? 1.2 : 1)),
      carbs: Math.round(62 * (isLowCarb ? 0.5 : 1)),
      fat: Math.round(12 * calScale),
      fiber: 14,
      goalFit: "100% Plant-Based High Fiber",
      whyRecommended: "High potassium and dietary fiber balance sodium levels, curb evening cravings, and support digestive biome vitality.",
      ingredients: ["Brown lentils", "Roasted sweet potato cubes", "Organic grilled tempeh", "Baby kale", "Cumin, turmeric & ginger broth"],
      prepTimeMinutes: 25,
      tags: ["Vegan", "Superfood Fiber", "Anti-Inflammatory"]
    },

    // DINNER SUGGESTIONS
    {
      id: "sug-di-1",
      name: "Pan-Seared Wild Salmon with Roasted Garlic Asparagus & Baby Potatoes",
      mealType: "dinner" as const,
      portion: "1 dinner plate (400g)",
      calories: Math.round(540 * calScale),
      protein: Math.round(44 * (isMuscleGain ? 1.15 : 1)),
      carbs: Math.round(32 * (isLowCarb ? 0.3 : 1)),
      fat: Math.round(24 * calScale),
      fiber: 6,
      goalFit: "Cardioprotective & Recovery Dinner",
      whyRecommended: `Rich in marine omega-3s, selenium, and ${Math.round(44 * (isMuscleGain ? 1.15 : 1))}g of clean protein to fuel nighttime muscular repair and deep recovery.`,
      ingredients: ["Wild sockeye salmon fillet", "Tender asparagus spears", "Roasted herb baby potatoes", "Cold-pressed olive oil", "Fresh lemon wedges & dill"],
      prepTimeMinutes: 22,
      tags: ["Omega-3 Rich", "Anti-Inflammatory", "Clean Dinner"]
    },
    {
      id: "sug-di-2",
      name: "Lean Grass-Fed Beef Sirloin over Cauliflower-Parmesan Mash",
      mealType: "dinner" as const,
      portion: "1 generous plate (380g)",
      calories: Math.round(480 * calScale),
      protein: Math.round(45 * (isMuscleGain ? 1.2 : 1)),
      carbs: Math.round(14 * (isLowCarb ? 0.7 : 1)),
      fat: Math.round(26 * calScale),
      fiber: 5,
      goalFit: isLowCarb ? "Ketogenic Lean Fuel" : "Bioavailable Heme Iron & Zinc",
      whyRecommended: "Provides highly bioavailable heme iron and zinc for endocrine health, paired with cauliflower mash to keep evening carbs light.",
      ingredients: ["Grass-fed beef top sirloin", "Steamed riced cauliflower", "Aged parmesan & garlic", "Sautéed French green beans", "Cracked black pepper"],
      prepTimeMinutes: 20,
      tags: ["Low Carb", "Heme Iron", "High Protein"]
    },
    {
      id: "sug-di-3",
      name: "Herb Baked Lemon Cod with Zucchini Ribbons & Warm Quinoa Pilaf",
      mealType: "dinner" as const,
      portion: "1 large dinner plate (410g)",
      calories: Math.round(410 * calScale),
      protein: Math.round(42 * (isMuscleGain ? 1.15 : 1)),
      carbs: Math.round(36 * (isLowCarb ? 0.3 : 1)),
      fat: Math.round(10 * calScale),
      fiber: 6,
      goalFit: isWeightLoss ? "Calorie-Deficit Maximizer" : "Lean Protein & Light Digestion",
      whyRecommended: "Ultra-lean white fish delivers maximum protein per calorie, allowing you to hit your daily macro goal without overshooting your caloric limit.",
      ingredients: ["Atlantic cod fillet", "Shaved zucchini ribbons", "Fluffy quinoa pilaf", "Capers & cherry tomatoes", "Extra virgin olive oil"],
      prepTimeMinutes: 18,
      tags: ["Lean & Light", "Low Calorie", "Heart Smart"]
    },

    // SNACK SUGGESTIONS
    {
      id: "sug-sn-1",
      name: "Cottage Cheese with Crisp Apple Slices & Roasted Walnuts",
      mealType: "snack" as const,
      portion: "1 bowl (220g)",
      calories: Math.round(230 * calScale),
      protein: 20,
      carbs: 22,
      fat: 8,
      fiber: 4,
      goalFit: "Slow Sustained Casein",
      whyRecommended: "Curbs mid-day hunger spikes with a balance of slow-digesting casein protein, pectin fiber, and healthy brain fats.",
      ingredients: ["Low-fat cottage cheese", "Honeycrisp apple slices", "Crushed raw walnuts", "Dash of cinnamon"],
      prepTimeMinutes: 3,
      tags: ["Quick Snack", "High Protein", "No Cooking"]
    },
    {
      id: "sug-sn-2",
      name: "Dark Cacao Whey Protein Shake with Unsweetened Almond Milk",
      mealType: "snack" as const,
      portion: "1 large shaker (350ml)",
      calories: Math.round(190 * calScale),
      protein: 28,
      carbs: 6,
      fat: 4,
      fiber: 3,
      goalFit: "Fast Muscle Recovery",
      whyRecommended: "Delivers 28g of fast-acting whey protein isolate with minimal carbohydrates to close any remaining daily protein deficit.",
      ingredients: ["Whey isolate powder", "Unsweetened vanilla almond milk", "1 tsp raw cacao powder", "Ice cubes"],
      prepTimeMinutes: 2,
      tags: ["Post-Workout", "Low Carb", "Rapid Protein"]
    }
  ];

  // Filter by mealType if requested
  let filtered = allSuggestions;
  if (mealType && mealType !== "all") {
    filtered = filtered.filter(s => s.mealType === mealType);
  }

  // Filter by craving if query was supplied
  if (queryCraving && queryCraving.trim()) {
    const q = queryCraving.toLowerCase();
    const cravingMatches = filtered.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.ingredients.some(ing => ing.toLowerCase().includes(q)) ||
      s.whyRecommended.toLowerCase().includes(q)
    );
    if (cravingMatches.length > 0) {
      filtered = cravingMatches;
    }
  }

  // Filter by preference filter
  if (preferenceFilter === "high_protein") {
    filtered = filtered.sort((a, b) => b.protein - a.protein);
  } else if (preferenceFilter === "low_carb") {
    filtered = filtered.sort((a, b) => a.carbs - b.carbs);
  } else if (preferenceFilter === "quick") {
    filtered = filtered.sort((a, b) => (a.prepTimeMinutes || 15) - (b.prepTimeMinutes || 15));
  }

  const remainingText = remainingCalories !== undefined 
    ? `You have approx ${remainingCalories} kcal ${remainingProtein !== undefined ? `and ${remainingProtein}g protein` : ""} remaining today. `
    : "";

  return {
    summary: `${remainingText}Here are dietitian-curated food recommendations tailored to your ${profile.goal.replace("_", " ")} profile and daily target of ${profile.targetCalories} kcal.`,
    targetDailyCalories: profile.targetCalories,
    remainingCalories: remainingCalories ?? profile.targetCalories,
    suggestions: filtered
  };
}
