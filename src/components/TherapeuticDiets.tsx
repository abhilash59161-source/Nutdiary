/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Heart, 
  Search, 
  Activity, 
  ShieldAlert, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  BookOpen,
  Apple
} from "lucide-react";
import { DiseaseCondition } from "../types.js";

// Hardcoded high-quality offline therapeutic diets for immediate access
const OFFLINE_DIETS: DiseaseCondition[] = [
  {
    id: "type-2-diabetes",
    name: "Type 2 Diabetes Diet Plan",
    description: "Focuses on steady blood glucose levels, optimizing insulin response, and minimizing simple sugar crashes using low Glycemic Index (GI) complex carbs.",
    guidelines: [
      "Prioritize high-fiber carbohydrates with a low glycemic load.",
      "Distribute carbohydrates evenly across breakfast, lunch, and dinner.",
      "Pair all carbs with healthy fats or lean proteins to flatten glucose spikes.",
      "Maintain strict portion control to regulate weight and improve cellular sensitivity."
    ],
    foodsToEmbrace: [
      "Non-starchy vegetables (spinach, broccoli, kale, cauliflowers)",
      "Fiber-rich legumes (lentils, chickpeas, black beans)",
      "Unrefined ancient grains (quinoa, wild rice, steel-cut oats)",
      "Lean healthy proteins (skinless chicken, wild salmon, egg whites)"
    ],
    foodsToAvoid: [
      "Refined sugar products (sodas, pastries, candies, sweetened yogurts)",
      "Simple white grains (white flour, white bread, standard white rice)",
      "Fried processed meats or trans-fats",
      "Packaged fruit juices or dried fruits with added sugars"
    ],
    sampleMenu: [
      { meal: "Breakfast", items: ["Steel-cut oats with cinnamon, walnuts, and flax seeds", "Two scrambled egg whites with spinach"] },
      { meal: "Lunch", items: ["Lentil soup with mixed leafy green salad", "Grilled chicken strips dressed in lemon juice & extra virgin olive oil"] },
      { meal: "Dinner", items: ["Pan-seared salmon fillet over baked sweet potato", "Steamed asparagus spears with garlic"] },
      { meal: "Snack", items: ["A handful of raw almonds", "Sliced cucumbers with fresh hummus"] }
    ],
    tips: [
      "Incorporate 20-30 minutes of low-intensity walking immediately after your largest meal to facilitate muscle glycogen intake.",
      "Monitor fasting glucose levels daily to gauge carbohydrate tolerability.",
      "Limit high-sugar fruits like grapes or fully ripe bananas."
    ]
  },
  {
    id: "hypertension-dash",
    name: "Hypertension / DASH Diet Plan",
    description: "Aligned with Dietary Approaches to Stop Hypertension (DASH), targeting blood pressure reduction via high potassium, calcium, magnesium, and low sodium.",
    guidelines: [
      "Limit total daily sodium intake strictly below 1500mg (about 2/3 teaspoon of salt).",
      "Maximize dietary potassium, which works as a natural vasodilator.",
      "Incorporate active magnesium-rich nuts and seeds.",
      "Restrict saturated fats and trans fatty acids to improve vascular elasticity."
    ],
    foodsToEmbrace: [
      "Potassium-rich vegetables & fruits (bananas, sweet potatoes, spinach, avocados)",
      "Low-fat dairy alternatives (skim milk, low-sodium plain greek yogurt)",
      "Whole grain products (brown rice, whole wheat pasta)",
      "Omega-3 rich fish and nuts (flax seeds, salmon, walnuts)"
    ],
    foodsToAvoid: [
      "Processed canned soups and frozen meals",
      "Cured meats, bacon, pepperoni, sausages, and hotdogs",
      "Soy sauce, excessive table salt, and pre-packaged seasonings",
      "Heavy liquor and binge drinking"
    ],
    sampleMenu: [
      { meal: "Breakfast", items: ["One medium banana with 1 cup skim milk", "Whole grain oatmeal topped with blueberries"] },
      { meal: "Lunch", items: ["Roasted turkey breast sandwich on 100% whole wheat bread (no salt added)", "Baby carrots with low-sodium dip"] },
      { meal: "Dinner", items: ["Baked cod with fresh garlic & parsley", "Quinoa pilaf with steamed broccoli"] },
      { meal: "Snack", items: ["Unsalted roasted pumpkin seeds", "A crisp red apple"] }
    ],
    tips: [
      "Do not add table salt while cooking; season dishes generously with lemon, dill, garlic, rosemary, and other dry herbs.",
      "Always rinse canned beans thoroughly under cold water to strip up to 40% of their preservation sodium.",
      "Read nutrition labels vigilantly for sodium percentages."
    ]
  },
  {
    id: "celiac-gluten-free",
    name: "Celiac Disease / Gluten-Free Diet Plan",
    description: "A strict therapeutic diet completely eliminating the gluten protein (found in wheat, barley, and rye) to allow intestinal villi to heal from inflammatory damage.",
    guidelines: [
      "Zero tolerance for wheat, barley, rye, spelt, or cross-contaminated products.",
      "Always search for certified 'Gluten-Free' packaging labels.",
      "Focus on naturally gluten-free whole food categories (meats, vegetables, fruits).",
      "Supplement with B-vitamins and iron as malabsorption is common in damaged guts."
    ],
    foodsToEmbrace: [
      "Gluten-free grains (quinoa, millet, brown rice, buckwheat, amaranth)",
      "Fresh proteins (beef, poultry, fresh fish, tofu, whole eggs)",
      "All fresh fruits and leafy vegetables",
      "Healthy plant fats (avocado oil, olives, nuts, seeds)"
    ],
    foodsToAvoid: [
      "Standard flour products (pasta, bread, cereals, crackers, soy sauces)",
      "Barley malt, beer, yeast extracts",
      "Processed foods with thickeners or hydrolyzed wheat protein",
      "Oats unless explicitly certified 'Gluten-Free' (cross-contamination is common)"
    ],
    sampleMenu: [
      { meal: "Breakfast", items: ["Scrambled eggs with diced tomatoes & bell peppers", "Gluten-free buckwheat toast with avocado spread"] },
      { meal: "Lunch", items: ["Quinoa bowl with grilled chicken, black beans, sweet corn, and lime cilantro dressing"] },
      { meal: "Dinner", items: ["Baked salmon with seasoned jasmine rice", "Sautéed zucchini and yellow squash"] },
      { meal: "Snack", items: ["Gluten-free plain Greek yogurt with honey", "Walnut halves"] }
    ],
    tips: [
      "Beware of cross-contact in kitchen appliances (e.g. sharing a toaster with standard wheat bread is unsafe).",
      "Inquire thoroughly about marinades and starch-based thickeners when dining out.",
      "Incorporate fiber-rich seeds to optimize healing gut motility."
    ]
  },
  {
    id: "gerd-acid-reflux",
    name: "GERD / Acid Reflux Diet Plan",
    description: "Designed to minimize gastric acid secretion and relax pressure on the Lower Esophageal Sphincter (LES) to prevent reflux symptoms.",
    guidelines: [
      "Avoid carbonated fluids, high acid fruits, and hot spicy condiments.",
      "Consume smaller, highly frequent meals rather than large heavy dinners.",
      "Do not lie flat or sleep within 3 hours of taking food inside.",
      "Opt for low-fat cooking methods (bake, steam, boil) as fat slows digestion."
    ],
    foodsToEmbrace: [
      "Alkaline non-citrus fruits (melons, bananas, pears, papayas)",
      "Oatmeal, brown rice, and whole grains",
      "Lean poultry and boiled white fish",
      "Ginger root herbal teas (ginger acts as a natural gastroprotective anti-inflammatory)"
    ],
    foodsToAvoid: [
      "Citrus fruits (oranges, grapefruits, lemons, limes, tomatoes)",
      "High fat dairy, chocolates, peppermint, spearmint",
      "Spicy chilies, onions, garlic, black pepper",
      "Caffeinated beverages (coffee, energy drinks, black teas)"
    ],
    sampleMenu: [
      { meal: "Breakfast", items: ["Oatmeal cooked with water, topped with sliced banana", "Warm chamomile or ginger tea"] },
      { meal: "Lunch", items: ["Boiled skinless chicken breast with brown rice", "Sautéed green beans (no garlic or onion)"] },
      { meal: "Dinner", items: ["Bake turkey fillet over boiled potato mash (no butter/heavy milk)", "Steamed carrots"] },
      { meal: "Snack", items: ["Fresh sweet honeydew melon cubes", "Low-fat crackers"] }
    ],
    tips: [
      "Elevate the head of your bed by 6 inches using block risers to prevent gravity-induced nighttime reflux.",
      "Avoid tight waistbands and restrictive clothing that compresses the stomach.",
      "Chew food thoroughly to facilitate easy enzymatic breakdown."
    ]
  }
];

export default function TherapeuticDiets() {
  const [activeDiet, setActiveDiet] = useState<DiseaseCondition | null>(OFFLINE_DIETS[0]);
  const [customQuery, setCustomQuery] = useState("");
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  const handleCustomCondition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim()) return;

    setIsQuerying(true);
    setQueryError(null);

    try {
      const response = await fetch("/api/disease-diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ condition: customQuery }),
      });

      const data = await response.json();
      if (data.success && data.dietPlan) {
        setActiveDiet(data.dietPlan);
        setCustomQuery("");
      } else {
        throw new Error(data.error || "Could not retrieve diet guidelines.");
      }
    } catch (err: any) {
      console.warn("Disease Diet API Error:", err);
      setQueryError("Active medical nutrition plan could not be fetched via Gemini. Enjoy our offline medical guides below!");
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="therapeutic-diets-tab">
      
      {/* LEFT COLUMN: List of Diseases */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Custom Query search box */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Search Custom Condition</span>
          <form onSubmit={handleCustomCondition} className="flex gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Gout, IBS, Fatty Liver, Anemia..."
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={isQuerying || !customQuery.trim()}
              className="px-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
            >
              {isQuerying ? "Analyzing..." : "Ask AI"}
            </button>
          </form>

          {queryError && (
            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-[10px] leading-relaxed rounded-xl font-medium">
              {queryError}
            </div>
          )}
        </div>

        {/* Directory of Clinical plans */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Therapeutic Diet Registry</span>
          
          {isQuerying && (
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center space-y-2 animate-pulse">
              <Loader2 className="h-5 w-5 text-emerald-500 animate-spin mx-auto" />
              <p className="text-[10px] text-slate-500 font-semibold">Gemini is formulating custom clinical guidelines...</p>
            </div>
          )}

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {OFFLINE_DIETS.map((diet) => (
              <button
                key={diet.id}
                onClick={() => {
                  setActiveDiet(diet);
                  setQueryError(null);
                }}
                className={`w-full p-3.5 text-left rounded-xl border transition-all flex items-start gap-3 ${
                  activeDiet?.id === diet.id
                    ? "bg-emerald-500/10 border-emerald-300 shadow-sm shadow-emerald-50"
                    : "bg-white hover:bg-slate-50 border-slate-100"
                }`}
              >
                <div className={`p-1.5 rounded-lg ${activeDiet?.id === diet.id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">{diet.name}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">{diet.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer card */}
        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/50 text-[10px] text-amber-700 leading-relaxed flex gap-2">
          <ShieldAlert className="h-4.5 w-4.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Important Clinical Notice:</strong> Medical Nutrition Therapy (MNT) is a supportive diet strategy. It does NOT replace professional medical diagnosis, medication, or physician directives. Always consult your healthcare provider before shifting diet protocols.
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Active therapeutic diet view */}
      <div className="lg:col-span-8 space-y-6">
        {activeDiet ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 flex items-center gap-1.5">
                  <Heart className="h-5 w-5 text-red-500" />
                  {activeDiet.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  {activeDiet.description}
                </p>
              </div>
              <span className="inline-block px-3 py-1 bg-rose-50 text-rose-700 font-bold text-xs rounded-full border border-rose-100/50 flex-shrink-0">
                Therapeutic
              </span>
            </div>

            {/* Core Guidelines */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block flex items-center gap-1">
                <BookOpen className="h-4 w-4 text-emerald-500" /> Core Dietary Principles
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {activeDiet.guidelines.map((guide, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 leading-relaxed font-normal">
                    <span className="font-bold text-emerald-600 block mb-0.5">Rule #{idx + 1}</span>
                    {guide}
                  </div>
                ))}
              </div>
            </div>

            {/* Food selections: Embrace vs Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Foods to Embrace */}
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/10 space-y-3">
                <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Foods to Embrace
                </span>
                <ul className="space-y-1.5">
                  {activeDiet.foodsToEmbrace.map((food, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed font-medium">
                      <span className="text-emerald-500 font-bold flex-shrink-0">•</span>
                      <span>{food}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Foods to Avoid */}
              <div className="p-4 rounded-xl border border-red-100 bg-red-50/10 space-y-3">
                <span className="text-xs font-bold text-red-800 flex items-center gap-1.5 uppercase tracking-wide">
                  <XCircle className="h-4 w-4 text-red-600" /> Foods to Limit / Avoid
                </span>
                <ul className="space-y-1.5">
                  {activeDiet.foodsToAvoid.map((food, idx) => (
                    <li key={idx} className="text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed font-medium">
                      <span className="text-red-500 font-bold flex-shrink-0">•</span>
                      <span>{food}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Sample Menu */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block flex items-center gap-1">
                <Clock className="h-4 w-4 text-emerald-500" /> 1-Day Therapeutic Sample Menu
              </span>
              <div className="border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/20 divide-y divide-slate-100">
                {activeDiet.sampleMenu.map((day, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 text-xs hover:bg-slate-50/40 transition-colors">
                    <span className="font-extrabold text-slate-800 sm:w-24 flex-shrink-0">{day.meal}</span>
                    <ul className="flex-1 space-y-1">
                      {day.items.map((item, itemIdx) => (
                        <li key={itemIdx} className="text-slate-600 flex items-center gap-1">
                          <span className="h-1 w-1 bg-emerald-500 rounded-full flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Practical Clinical Tips */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block flex items-center gap-1">
                <Apple className="h-4 w-4 text-emerald-500" /> Vital Clinical Recovery Tips
              </span>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                {activeDiet.tips.map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="h-16 w-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm shadow-rose-100">
              <Activity className="h-8 w-8" />
            </div>
            <div className="max-w-md">
              <h4 className="text-md font-bold text-slate-700">Clinical Guide Selection</h4>
              <p className="text-xs text-slate-400 leading-relaxed mt-1">
                Select a condition from the left therapeutic registry, or type in a customized illness query (e.g. Acid Reflux, Fatty Liver) to generate a customized diet plan!
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
