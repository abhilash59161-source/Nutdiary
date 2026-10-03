/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HealthyFood {
  name: string;
  category: "Fruits" | "Vegetables" | "Proteins" | "Grains" | "Dairy & Alternatives" | "Fats & Nuts" | "Beverages";
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  servingSize: string;
  healthScore: number; // 1-100
  benefits: string[];
  description: string;
}

export const healthyFoodsCatalog: HealthyFood[] = [
  {
    name: "Avocado",
    category: "Fats & Nuts",
    calories: 160,
    protein: 2,
    carbs: 9,
    fat: 15,
    servingSize: "100g (about half)",
    healthScore: 95,
    benefits: ["Rich in heart-healthy monounsaturated fats", "Loaded with potassium and fiber", "Improves absorption of fat-soluble vitamins"],
    description: "A nutrient-dense fruit containing healthy monounsaturated fatty acids, dietary fiber, and essential vitamins."
  },
  {
    name: "Wild Salmon",
    category: "Proteins",
    calories: 206,
    protein: 22,
    carbs: 0,
    fat: 12,
    servingSize: "100g cooked",
    healthScore: 98,
    benefits: ["High in EPA and DHA Omega-3 fatty acids", "Excellent source of high-quality protein", "Protects bone health and reduces inflammation"],
    description: "An outstanding source of high-quality protein and omega-3 fatty acids, crucial for brain and heart health."
  },
  {
    name: "Spinach",
    category: "Vegetables",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    servingSize: "100g raw",
    healthScore: 97,
    benefits: ["Packed with iron, calcium, and magnesium", "Rich in vitamins A, C, and K", "Contains antioxidants that fight cellular stress"],
    description: "A dark leafy green vegetable rich in iron and key micronutrients essential for immune and bone support."
  },
  {
    name: "Blueberries",
    category: "Fruits",
    calories: 57,
    protein: 0.7,
    carbs: 14,
    fat: 0.3,
    servingSize: "100g",
    healthScore: 96,
    benefits: ["King of antioxidant foods", "Supports brain function and improves memory", "Helps reduce muscle damage after strenuous exercise"],
    description: "A sweet, nutritious berry renowned for high levels of antioxidants called anthocyanins."
  },
  {
    name: "Quinoa",
    category: "Grains",
    calories: 120,
    protein: 4.4,
    carbs: 21,
    fat: 1.9,
    servingSize: "100g cooked",
    healthScore: 92,
    benefits: ["Gluten-free complete protein (contains all 9 essential amino acids)", "High fiber content supports digestive tract", "Low glycemic index helps maintain steady blood sugar"],
    description: "An ancient grain-like seed that is a nutritional powerhouse, loaded with amino acids, fiber, and iron."
  },
  {
    name: "Chicken Breast",
    category: "Proteins",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    servingSize: "100g grilled",
    healthScore: 88,
    benefits: ["Very high protein-to-fat ratio", "Supports muscle repair and hypertrophy", "Rich in selenium and vitamin B6"],
    description: "An excellent lean protein source ideal for muscle building, weight management, and athletic performance."
  },
  {
    name: "Greek Yogurt (Non-fat)",
    category: "Dairy & Alternatives",
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    servingSize: "100g",
    healthScore: 90,
    benefits: ["High in gut-friendly probiotics", "Rich in bone-building calcium", "Excellent source of satisfying protein"],
    description: "Strained yogurt with double the protein of regular yogurt, packed with calcium and probiotics for gut health."
  },
  {
    name: "Almonds",
    category: "Fats & Nuts",
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 49,
    servingSize: "100g (about 1 cup)",
    healthScore: 91,
    benefits: ["Delivers massive amounts of nutrients and Vitamin E", "Assists with blood sugar control", "Helps lower cholesterol levels"],
    description: "A popular tree nut packed with healthy fats, dietary fiber, magnesium, and vitamin E antioxidants."
  },
  {
    name: "Sweet Potato",
    category: "Vegetables",
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    servingSize: "100g baked",
    healthScore: 93,
    benefits: ["Incredibly rich in Beta-Carotene (Vitamin A)", "Promotes gut health with abundant prebiotic fiber", "Supports vision and immune system function"],
    description: "A sweet, starchy root vegetable loaded with fiber, vitamins, and minerals that support energy levels."
  },
  {
    name: "Broccoli",
    category: "Vegetables",
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    servingSize: "100g raw",
    healthScore: 96,
    benefits: ["Contains sulforaphane, a powerful cancer-fighting compound", "High in Vitamin C to boost immunity", "Supports healthy liver detoxification"],
    description: "A cruciferous vegetable packed with phytochemicals, fiber, and antioxidant vitamins."
  },
  {
    name: "Oatmeal",
    category: "Grains",
    calories: 68,
    protein: 2.5,
    carbs: 12,
    fat: 1.4,
    servingSize: "100g cooked",
    healthScore: 94,
    benefits: ["High in soluble fiber Beta-Glucan", "Reduces cholesterol and improves gut health", "Highly satiating, aiding weight management"],
    description: "Whole grain oats cooked in water, offering slow-release carbohydrates and critical dietary fiber."
  },
  {
    name: "Eggs",
    category: "Proteins",
    calories: 143,
    protein: 12.6,
    carbs: 0.7,
    fat: 9.5,
    servingSize: "100g (approx. 2 large eggs)",
    healthScore: 92,
    benefits: ["Highly bioavailable complete protein", "Rich in choline for brain development", "Contains lutein and zeaxanthin for eye health"],
    description: "One of nature's most complete foods, packed with essential vitamins, minerals, and healthy fats."
  },
  {
    name: "Chia Seeds",
    category: "Fats & Nuts",
    calories: 486,
    protein: 16.5,
    carbs: 42,
    fat: 30.7,
    servingSize: "100g",
    healthScore: 95,
    benefits: ["Incredible source of soluble fiber", "High plant-based Omega-3 ALA content", "Rich in bone nutrients like calcium and phosphorus"],
    description: "Tiny black seeds that expand in liquid, forming a fiber-rich gel that slows digestion and keeps you full."
  },
  {
    name: "Green Tea",
    category: "Beverages",
    calories: 2,
    protein: 0,
    carbs: 0,
    fat: 0,
    servingSize: "1 cup (240ml)",
    healthScore: 96,
    benefits: ["Loaded with polyphenols and EGCG antioxidants", "Boosts metabolic rate and fat burning", "Improves brain function and cognitive health"],
    description: "A minimally processed tea leaf infusion, rich in bioactive compounds that promote cellular longevity."
  },
  {
    name: "Garlic",
    category: "Vegetables",
    calories: 149,
    protein: 6.4,
    carbs: 33,
    fat: 0.5,
    servingSize: "100g raw",
    healthScore: 95,
    benefits: ["Contains Allicin, which has potent medicinal properties", "Highly effective in combatting common cold", "Reduces blood pressure and improves cholesterol"],
    description: "A pungent bulb used worldwide in cooking, known for its powerful immune-boosting and antimicrobial properties."
  },
  {
    name: "Apples",
    category: "Fruits",
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    servingSize: "100g raw",
    healthScore: 91,
    benefits: ["Good source of pectin prebiotic fiber", "Supports heart health by lowering LDL", "Promotes weight loss due to high water and fiber"],
    description: "A crisp, hydrating fruit that provides a balance of vitamin C, soluble fiber, and antioxidants."
  },
  {
    name: "Lentils",
    category: "Proteins",
    calories: 116,
    protein: 9,
    carbs: 20,
    fat: 0.4,
    servingSize: "100g cooked",
    healthScore: 94,
    benefits: ["Excellent plant-based iron and protein source", "Extremely high in folate and dietary fiber", "Helps stabilize blood sugar and cholesterol"],
    description: "A staple legume loaded with complex carbohydrates, plant-based proteins, and essential minerals."
  },
  {
    name: "Extra Virgin Olive Oil",
    category: "Fats & Nuts",
    calories: 884,
    protein: 0,
    carbs: 0,
    fat: 100,
    servingSize: "1 tablespoon (14g)",
    healthScore: 94,
    benefits: ["Cornerstone of the Mediterranean diet", "Potent anti-inflammatory oleocanthal antioxidants", "Protects blood vessels from LDL cholesterol damage"],
    description: "Cold-pressed olive oil, rich in healthy monounsaturated fats and inflammation-reducing antioxidants."
  },
  {
    name: "Dark Chocolate (85% Cocoa)",
    category: "Fats & Nuts",
    calories: 598,
    protein: 7.8,
    carbs: 46,
    fat: 43,
    servingSize: "100g",
    healthScore: 85,
    benefits: ["Incredibly rich in polyphenols and flavanols", "Improves blood flow and lowers blood pressure", "Boosts mood and protects brain health"],
    description: "Cocoa-rich chocolate containing minimal sugar, packed with heart-protective antioxidants."
  }
];
