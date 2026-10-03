/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { 
  Camera, 
  Upload, 
  Sparkles, 
  CheckCircle, 
  Loader2, 
  AlertTriangle,
  Flame,
  Plus
} from "lucide-react";
import { FoodItem, ImageAnalysisResult } from "../types.js";

// Presets containing sample images in base64 format for instant testing
const PRESET_MEALS = [
  {
    name: "Avocado Salmon Salad",
    description: "Grilled wild salmon on spinach leaves, cherry tomatoes, and sliced avocado.",
    // Premium placeholder image representation or mini base64
    sampleUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=200",
    mockImage: "DATA_SALMON_AVOCADO"
  },
  {
    name: "Oatmeal Berry Bowl",
    description: "Rolled oats with fresh blueberries, sliced bananas, chia seeds, and honey.",
    sampleUrl: "https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&q=80&w=200",
    mockImage: "DATA_OATMEAL_BERRY"
  },
  {
    name: "Grilled Chicken & Rice",
    description: "Lean chicken breast, jasmine rice, and steamed broccoli florets.",
    sampleUrl: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&q=80&w=200",
    mockImage: "DATA_CHICKEN_BROCCOLI"
  }
];

interface PhotoRecognitionProps {
  onAddLog: (item: Omit<FoodItem, "id">) => void;
  selectedDate: string;
}

export default function PhotoRecognition({
  onAddLog,
  selectedDate,
}: PhotoRecognitionProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [targetMeal, setTargetMeal] = useState<"breakfast" | "lunch" | "dinner" | "snack">("lunch");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setAnalysisResult(null);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  // Convert presets to simulated base64 or analyze them using general Gemini descriptions if loaded
  const handleSelectPreset = async (preset: typeof PRESET_MEALS[0]) => {
    setError(null);
    setAnalysisResult(null);
    setIsAnalyzing(true);
    setImagePreview(preset.sampleUrl);

    try {
      // Prompt clinical nutritionist to analyze preset meal
      const promptQuery = `Identify nutrition details for a standard serving of: ${preset.name}. Ingredients: ${preset.description}.`;
      const response = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: promptQuery }),
      });
      const data = await response.json();
      
      if (data.success) {
        const item = data.result;
        // Map search result to ImageAnalysisResult structure
        const mappedAnalysis: ImageAnalysisResult = {
          identifiedItems: [
            {
              name: item.name,
              portionEstimate: item.servingSize || "1 plate",
              calories: item.calories,
              protein: item.protein,
              carbs: item.carbs,
              fat: item.fat,
              confidence: 0.98
            }
          ],
          totalCalories: item.calories,
          totalProtein: item.protein,
          totalCarbs: item.carbs,
          totalFat: item.fat,
          healthScore: item.healthScore || 92,
          feedback: `This is a high-fidelity preset analysis of ${preset.name}. ${item.benefits?.join(" ") || "Excellent nutritional value."}`
        };
        setAnalysisResult(mappedAnalysis);
      } else {
        throw new Error(data.error || "Failed to analyze preset.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to analyze the preset food.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzePhoto = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      // If imagePreview is a web URL (like the Unsplash preset links), we send a search query instead to simulate
      if (imagePreview.startsWith("http")) {
        const foundPreset = PRESET_MEALS.find(p => p.sampleUrl === imagePreview);
        if (foundPreset) {
          await handleSelectPreset(foundPreset);
          return;
        }
      }

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imagePreview }),
      });

      const data = await response.json();
      if (data.success) {
        setAnalysisResult(data.analysis);
      } else {
        setError(data.error || "Failed to analyze image. Please ensure your Gemini key is configured correctly.");
      }
    } catch (err: any) {
      setError(err.message || "Network error. Please verify your connection.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleLogAllItems = () => {
    if (!analysisResult) return;

    analysisResult.identifiedItems.forEach((item) => {
      onAddLog({
        name: item.name,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        servingSize: item.portionEstimate,
        servingAmount: 1,
        mealType: targetMeal,
        loggedAt: selectedDate,
        healthScore: analysisResult.healthScore,
      });
    });

    // Clear state
    setAnalysisResult(null);
    setImagePreview(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="photo-recognition-tab">
      
      {/* LEFT COLUMN: Upload Area */}
      <div className="lg:col-span-6 space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Camera className="h-5 w-5 text-emerald-500" />
              AI Food Photo Recognition
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Upload an image of your plate. Gemini Vision will identify all ingredients, estimate portions, and calculate macros.
            </p>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={triggerUpload}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              imagePreview 
                ? "border-emerald-300 bg-emerald-50/10" 
                : "border-slate-200 hover:border-emerald-400 bg-slate-50/50 hover:bg-slate-50"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {imagePreview ? (
              <div className="space-y-4 w-full">
                <img
                  src={imagePreview}
                  alt="Food preview"
                  referrerPolicy="no-referrer"
                  className="max-h-48 rounded-xl mx-auto object-cover border border-slate-200 shadow-sm"
                />
                <p className="text-xs text-emerald-600 font-semibold">Image selected successfully</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Upload className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-700 block">Drag & Drop plate image here</span>
                  <span className="text-xs text-slate-400 mt-1 block">Or click to browse from device (JPEG, PNG, WEBP)</span>
                </div>
              </div>
            )}
          </div>

          {imagePreview && !isAnalyzing && !analysisResult && (
            <div className="flex gap-2">
              <button
                onClick={() => setImagePreview(null)}
                className="flex-1 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-semibold text-sm transition-colors"
              >
                Clear Photo
              </button>
              <button
                onClick={handleAnalyzePhoto}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Sparkles className="h-4 w-4" />
                Analyze Plate
              </button>
            </div>
          )}

          {isAnalyzing && (
            <div className="p-6 text-center space-y-4 bg-slate-50 rounded-xl border border-slate-100">
              <Loader2 className="h-8 w-8 text-emerald-500 animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-700">Gemini Vision is analyzing...</h4>
                <p className="text-xs text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                  Identifying visual ingredients, calculating nutrient masses, and rating meal wellness scores. This takes about 4-6 seconds.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" /> Photo Analysis Failed
              </p>
              <p>{error}</p>
            </div>
          )}

          {/* Quick Preset Cards */}
          <div className="space-y-2.5 pt-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Or test instantly with a sample preset</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PRESET_MEALS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectPreset(preset)}
                  disabled={isAnalyzing}
                  className="flex sm:flex-col items-center sm:text-center p-2.5 border border-slate-100 hover:border-emerald-300 rounded-xl hover:bg-emerald-50/10 transition-all text-left gap-3 disabled:opacity-50"
                >
                  <img
                    src={preset.sampleUrl}
                    alt={preset.name}
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 sm:h-16 sm:w-16 rounded-lg object-cover flex-shrink-0"
                  />
                  <div>
                    <h5 className="text-xs font-bold text-slate-800 line-clamp-1">{preset.name}</h5>
                    <p className="text-[10px] text-slate-400 line-clamp-1 sm:line-clamp-2 mt-0.5">{preset.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Analysis Display & Logging */}
      <div className="lg:col-span-6 space-y-6">
        {analysisResult ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-fade-in">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-md font-extrabold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  AI Vision Plate Breakdown
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Ingredients scanned from food photograph</p>
              </div>
              <div className="text-center bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100">
                <span className="block text-[9px] font-bold text-emerald-600 uppercase">Health Score</span>
                <span className="text-xl font-black text-emerald-700">{analysisResult.healthScore}</span>
                <span className="text-[9px] text-emerald-500 font-bold">/100</span>
              </div>
            </div>

            {/* Total nutrients block */}
            <div className="grid grid-cols-4 gap-2 text-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Est. Calories</span>
                <strong className="text-base font-extrabold text-slate-800">{analysisResult.totalCalories}</strong>
                <span className="text-[10px] text-slate-400 block">kcal</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Protein</span>
                <strong className="text-base font-extrabold text-indigo-500">{analysisResult.totalProtein}g</strong>
                <span className="text-[10px] text-slate-400 block">total</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Carbs</span>
                <strong className="text-base font-extrabold text-amber-500">{analysisResult.totalCarbs}g</strong>
                <span className="text-[10px] text-slate-400 block">total</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Fats</span>
                <strong className="text-base font-extrabold text-rose-500">{analysisResult.totalFat}g</strong>
                <span className="text-[10px] text-slate-400 block">total</span>
              </div>
            </div>

            {/* Identified item list */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block">Identified Ingredients</span>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {analysisResult.identifiedItems.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white border border-slate-100 rounded-xl text-xs space-y-1.5 shadow-sm">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{item.name} <span className="font-medium text-slate-400 text-[11px]">({item.portionEstimate})</span></span>
                      <span className="text-emerald-600">{item.calories} kcal</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 pt-0.5">
                      <span>P: {item.protein}g</span>
                      <span>C: {item.carbs}g</span>
                      <span>F: {item.fat}g</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dietitian Feedback */}
            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-100/50 text-xs text-slate-600 leading-relaxed space-y-1.5">
              <h4 className="font-bold text-emerald-800 flex items-center gap-1">
                <Sparkles className="h-4.5 w-4.5" /> Nutritionist Feedback
              </h4>
              <p>{analysisResult.feedback}</p>
            </div>

            <hr className="border-slate-100" />

            {/* Destination meal selector and log execution */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 block mb-1">Add to Meal Category</label>
                <select
                  value={targetMeal}
                  onChange={(e) => setTargetMeal(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <button
                onClick={handleLogAllItems}
                className="py-2 px-5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold rounded-lg transition-colors shadow-sm flex items-center justify-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Log All Items to Diary
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-2xl border border-slate-100 shadow-sm text-center space-y-4 flex flex-col items-center justify-center min-h-[300px]">
            <div className="h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm shadow-emerald-100">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="max-w-[280px]">
              <h4 className="text-sm font-bold text-slate-700">Awaiting Plate Image</h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Upload your meal photo or click a sample preset to trigger real-time AI recognition. Identified foods will appear here!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
