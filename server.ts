/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { healthyFoodsCatalog } from "./server/foodData.js";
import {
  analyzeFoodPhoto,
  searchFoodWithAI,
  getPersonalizedRecommendations,
  getDiseaseDietPlan,
  getFamilyPlanRecommendations,
  getWeeklyRationPlan,
} from "./server/geminiService.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Set high limits for handling base64 food photo uploads
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// ----------------------------------------------------
// API ROUTES FIRST
// ----------------------------------------------------

/**
 * Health check endpoint
 */
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

/**
 * Retrieve the curated healthy foods directory
 */
app.get("/api/healthy-foods", (req: Request, res: Response) => {
  try {
    res.json({ success: true, catalog: healthyFoodsCatalog });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Food item search: tries static catalog first, falls back to Gemini AI for any food in the world
 */
app.post("/api/search", async (req: Request, res: Response) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== "string" || query.trim() === "") {
      return res.status(400).json({ success: false, error: "Query is required" });
    }

    const searchTerm = query.toLowerCase().trim();

    // Try finding exact or partial match in curated local catalog
    const localMatch = healthyFoodsCatalog.find(
      (item) =>
        item.name.toLowerCase() === searchTerm ||
        item.name.toLowerCase().includes(searchTerm) ||
        searchTerm.includes(item.name.toLowerCase())
    );

    if (localMatch) {
      return res.json({
        success: true,
        source: "catalog",
        result: {
          name: localMatch.name,
          calories: localMatch.calories,
          protein: localMatch.protein,
          carbs: localMatch.carbs,
          fat: localMatch.fat,
          servingSize: localMatch.servingSize,
          healthScore: localMatch.healthScore,
          benefits: localMatch.benefits,
        },
      });
    }

    // Fallback to Gemini API search
    const aiResult = await searchFoodWithAI(query);
    res.json({
      success: true,
      source: "gemini",
      result: aiResult,
    });
  } catch (error: any) {
    console.error("Search API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while looking up nutrition facts.",
    });
  }
});

/**
 * Analyze an uploaded food photo using Gemini Multi-modal capabilities
 */
app.post("/api/analyze-image", async (req: Request, res: Response) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ success: false, error: "Image data is required" });
    }

    // Extract raw base64 data if it contains data URI header
    let base64String = image;
    let actualMime = mimeType || "image/jpeg";
    if (image.startsWith("data:")) {
      const parts = image.split(";base64,");
      if (parts.length === 2) {
        actualMime = parts[0].replace("data:", "");
        base64String = parts[1];
      }
    }

    const analysis = await analyzeFoodPhoto(base64String, actualMime);
    res.json({ success: true, analysis });
  } catch (error: any) {
    console.error("Image Analysis API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while analyzing the food photo.",
    });
  }
});

/**
 * Get personalized nutrition targets and daily recipes based on physical goals
 */
app.post("/api/recommendations", async (req: Request, res: Response) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ success: false, error: "User profile data is required" });
    }

    const recommendations = await getPersonalizedRecommendations(profile);
    res.json({ success: true, recommendations });
  } catch (error: any) {
    console.error("Recommendations API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while generating diet recommendations.",
    });
  }
});

/**
 * Retrieve Therapeutic Diet Plan for conditions/diseases
 */
app.post("/api/disease-diet", async (req: Request, res: Response) => {
  try {
    const { condition } = req.body;
    if (!condition || typeof condition !== "string") {
      return res.status(400).json({ success: false, error: "Condition name is required" });
    }

    const dietPlan = await getDiseaseDietPlan(condition);
    res.json({ success: true, dietPlan });
  } catch (error: any) {
    console.error("Disease Diet API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while building the disease diet plan.",
    });
  }
});

/**
 * Generate combined Family Nutrition Plan
 */
app.post("/api/family-plan", async (req: Request, res: Response) => {
  try {
    const { profile, familyMembers } = req.body;
    if (!profile || !familyMembers) {
      return res.status(400).json({ success: false, error: "Profile and family members are required" });
    }
    const familyPlan = await getFamilyPlanRecommendations(profile, familyMembers);
    res.json({ success: true, familyPlan });
  } catch (error: any) {
    console.error("Family Plan API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while building the family diet plan.",
    });
  }
});

/**
 * Generate Weekly Ration Estimate
 */
app.post("/api/weekly-ration", async (req: Request, res: Response) => {
  try {
    const { profile, familyMembers, preferences } = req.body;
    if (!profile) {
      return res.status(400).json({ success: false, error: "Profile is required" });
    }
    const weeklyRations = await getWeeklyRationPlan(profile, familyMembers || [], preferences);
    res.json({ success: true, weeklyRations });
  } catch (error: any) {
    console.error("Weekly Ration API Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while building the weekly rations.",
    });
  }
});

// ----------------------------------------------------
// VITE OR STATIC MIDDLEWARE SETUP
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Integrate Vite in development mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve pre-built static client files in production
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Nutrition App] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
