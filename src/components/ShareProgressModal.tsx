/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { 
  X, 
  Share2, 
  Download, 
  Copy, 
  Check, 
  Sparkles, 
  Apple, 
  Flame, 
  Droplet, 
  Target, 
  Trophy, 
  ExternalLink,
  MessageCircle,
  Twitter,
  Image as ImageIcon
} from "lucide-react";
import { UserProfile } from "../types.js";

interface BadgeItem {
  id: string;
  title: string;
  unlocked: boolean;
  progressText: string;
}

interface ShareProgressModalProps {
  selectedDate: string;
  profile: UserProfile;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  calPercent: number;
  proteinPercent: number;
  carbsPercent: number;
  fatPercent: number;
  waterCups: number;
  hydrationGoal: number;
  hydrationPercent: number;
  isHydrationUnlocked: boolean;
  badges: BadgeItem[];
  unlockedCount: number;
  onClose: () => void;
}

type CardTheme = "midnight" | "obsidian" | "clean";

export default function ShareProgressModal({
  selectedDate,
  profile,
  totalCalories,
  totalProtein,
  totalCarbs,
  totalFat,
  calPercent,
  proteinPercent,
  carbsPercent,
  fatPercent,
  waterCups,
  hydrationGoal,
  hydrationPercent,
  isHydrationUnlocked,
  badges,
  unlockedCount,
  onClose,
}: ShareProgressModalProps) {
  const [theme, setTheme] = useState<CardTheme>("midnight");
  const [copiedText, setCopiedText] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dateObj = new Date(selectedDate);
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const unlockedBadges = badges.filter((b) => b.unlocked);

  // Generate Social Share Text
  const getShareText = () => {
    const lines = [
      `🥗 NutDiary Daily Nutrition Report • ${formattedDate}`,
      ``,
      `🔥 Calories: ${Math.round(totalCalories)} / ${profile.targetCalories} kcal (${calPercent}%)`,
      `🥩 Protein: ${Math.round(totalProtein)}g / ${profile.targetProtein}g (${proteinPercent}%)`,
      `🌾 Carbs: ${Math.round(totalCarbs)}g / ${profile.targetCarbs}g (${carbsPercent}%)`,
      `🥑 Fat: ${Math.round(totalFat)}g / ${profile.targetFat}g (${fatPercent}%)`,
      `💧 Hydration: ${waterCups} / ${hydrationGoal} Glasses (${waterCups * 250} ml)${isHydrationUnlocked ? " ✅" : ""}`,
      ``,
      unlockedBadges.length > 0 
        ? `🏆 Achievements Earned: ${unlockedBadges.map(b => b.title).join(", ")}`
        : `🎯 Consistent logging towards ${profile.goal.replace("_", " ")}!`,
      ``,
      `Logged with #NutDiary • AI Nutrition Tracker`
    ];
    return lines.join("\n");
  };

  // Render high-res card onto canvas
  const renderCardToCanvas = (): HTMLCanvasElement | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    const width = 1080;
    const height = 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Background
    if (theme === "midnight") {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, "#064e3b"); // dark emerald
      grad.addColorStop(0.5, "#0f172a"); // slate-900
      grad.addColorStop(1, "#022c22"); // deep teal
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Subtle decorative ambient glow circles
      ctx.beginPath();
      ctx.arc(900, 150, 280, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(150, 950, 240, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(14, 165, 233, 0.12)";
      ctx.fill();
    } else if (theme === "obsidian") {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      ctx.beginPath();
      ctx.arc(width / 2, 200, 350, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(16, 185, 129, 0.08)";
      ctx.fill();
    } else {
      // Clean light theme
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#f8fafc");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }

    const isLight = theme === "clean";
    const primaryTextColor = isLight ? "#0f172a" : "#ffffff";
    const secondaryTextColor = isLight ? "#64748b" : "#94a3b8";
    const cardBgColor = isLight ? "rgba(241, 245, 249, 0.9)" : "rgba(30, 41, 59, 0.75)";
    const cardBorderColor = isLight ? "rgba(226, 232, 240, 0.9)" : "rgba(51, 65, 85, 0.7)";

    // 2. Top Header Brand Bar
    ctx.save();
    // App icon placeholder pill
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.roundRect(80, 75, 48, 48, 14);
    ctx.fill();

    // Apple symbol text
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🥗", 104, 108);

    // App Name
    ctx.textAlign = "left";
    ctx.font = "900 34px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = primaryTextColor;
    ctx.fillText("NutDiary", 145, 108);

    // Date Pill on right
    ctx.fillStyle = isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.12)";
    ctx.beginPath();
    ctx.roundRect(width - 400, 75, 320, 48, 24);
    ctx.fill();

    ctx.fillStyle = isLight ? "#334155" : "#e2e8f0";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(formattedDate, width - 240, 106);
    ctx.restore();

    // 3. Main Hero Banner: Calories
    ctx.save();
    ctx.fillStyle = cardBgColor;
    ctx.strokeStyle = cardBorderColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(80, 160, width - 160, 240, 28);
    ctx.fill();
    ctx.stroke();

    // Calorie label
    ctx.fillStyle = "#10b981";
    ctx.font = "bold 20px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("DAILY CALORIC INTAKE", 120, 215);

    // Big Calories Number
    ctx.fillStyle = primaryTextColor;
    ctx.font = "900 84px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText(`${Math.round(totalCalories)}`, 120, 310);

    ctx.fillStyle = secondaryTextColor;
    ctx.font = "600 32px sans-serif";
    ctx.fillText(`/ ${profile.targetCalories} kcal`, 120 + ctx.measureText(`${Math.round(totalCalories)} `).width + 10, 305);

    // Goal status pill
    const statusText = calPercent > 105 
      ? `Calorie Goal Exceeded (${calPercent}%)` 
      : `${calPercent}% of Daily Allowance`;
    const statusColor = calPercent > 105 ? "#ef4444" : "#10b981";

    ctx.fillStyle = calPercent > 105 ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.18)";
    ctx.beginPath();
    ctx.roundRect(120, 335, 330, 40, 20);
    ctx.fill();

    ctx.fillStyle = statusColor;
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(statusText, 120 + 165, 361);

    // Calorie Progress Ring on the Right
    const ringX = width - 210;
    const ringY = 280;
    const ringRadius = 75;

    ctx.beginPath();
    ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 14;
    ctx.stroke();

    ctx.beginPath();
    const endAngle = -Math.PI / 2 + (Math.PI * 2 * Math.min(100, calPercent)) / 100;
    ctx.arc(ringX, ringY, ringRadius, -Math.PI / 2, endAngle);
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.stroke();

    ctx.fillStyle = primaryTextColor;
    ctx.font = "900 26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${calPercent}%`, ringX, ringY + 8);
    ctx.restore();

    // 4. Macro Targets Bento Row (Protein, Carbs, Fat)
    const macroY = 430;
    const macroWidth = (width - 160 - 40) / 3;
    const macros = [
      {
        name: "Protein",
        val: `${Math.round(totalProtein)}g`,
        target: `${profile.targetProtein}g`,
        percent: proteinPercent,
        color: "#6366f1", // indigo
      },
      {
        name: "Carbohydrates",
        val: `${Math.round(totalCarbs)}g`,
        target: `${profile.targetCarbs}g`,
        percent: carbsPercent,
        color: "#f59e0b", // amber
      },
      {
        name: "Healthy Fats",
        val: `${Math.round(totalFat)}g`,
        target: `${profile.targetFat}g`,
        percent: fatPercent,
        color: "#f43f5e", // rose
      },
    ];

    macros.forEach((m, idx) => {
      const mx = 80 + idx * (macroWidth + 20);
      ctx.save();
      ctx.fillStyle = cardBgColor;
      ctx.strokeStyle = cardBorderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(mx, macroY, macroWidth, 180, 24);
      ctx.fill();
      ctx.stroke();

      // Color accent dot & title
      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.arc(mx + 30, macroY + 35, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = secondaryTextColor;
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(m.name, mx + 46, macroY + 41);

      // Value
      ctx.fillStyle = primaryTextColor;
      ctx.font = "900 38px sans-serif";
      ctx.fillText(m.val, mx + 30, macroY + 95);

      ctx.fillStyle = secondaryTextColor;
      ctx.font = "600 18px sans-serif";
      ctx.fillText(`/ ${m.target} (${m.percent}%)`, mx + 30, macroY + 125);

      // Progress bar
      ctx.fillStyle = isLight ? "#cbd5e1" : "rgba(255, 255, 255, 0.1)";
      ctx.beginPath();
      ctx.roundRect(mx + 30, macroY + 145, macroWidth - 60, 10, 5);
      ctx.fill();

      ctx.fillStyle = m.color;
      ctx.beginPath();
      ctx.roundRect(
        mx + 30,
        macroY + 145,
        Math.max(8, ((macroWidth - 60) * Math.min(100, m.percent)) / 100),
        10,
        5
      );
      ctx.fill();
      ctx.restore();
    });

    // 5. Hydration & Badges Row
    const bottomY = 640;
    const halfWidth = (width - 160 - 20) / 2;

    // 5a. Hydration Card
    ctx.save();
    ctx.fillStyle = cardBgColor;
    ctx.strokeStyle = cardBorderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80, bottomY, halfWidth, 230, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0284c7"; // sky
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("💧 HYDRATION TRACKER", 115, bottomY + 45);

    ctx.fillStyle = primaryTextColor;
    ctx.font = "900 44px sans-serif";
    ctx.fillText(`${waterCups} Glasses`, 115, bottomY + 105);

    ctx.fillStyle = secondaryTextColor;
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${waterCups * 250} ml / ${hydrationGoal * 250} ml target`, 115, bottomY + 140);

    // Status pill
    if (isHydrationUnlocked) {
      ctx.fillStyle = "rgba(16, 185, 129, 0.2)";
      ctx.beginPath();
      ctx.roundRect(115, bottomY + 165, 250, 36, 18);
      ctx.fill();

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🎉 Daily Goal Achieved!", 115 + 125, bottomY + 189);
    } else {
      ctx.fillStyle = "rgba(14, 165, 233, 0.15)";
      ctx.beginPath();
      ctx.roundRect(115, bottomY + 165, 250, 36, 18);
      ctx.fill();

      ctx.fillStyle = "#0284c7";
      ctx.font = "bold 16px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${hydrationPercent}% Hydration Reached`, 115 + 125, bottomY + 189);
    }
    ctx.restore();

    // 5b. Unlocked Badges & Milestones Card
    ctx.save();
    ctx.fillStyle = cardBgColor;
    ctx.strokeStyle = cardBorderColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(80 + halfWidth + 20, bottomY, halfWidth, 230, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#f59e0b"; // amber
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("🏆 DAILY ACHIEVEMENTS", 80 + halfWidth + 50, bottomY + 45);

    ctx.fillStyle = primaryTextColor;
    ctx.font = "900 44px sans-serif";
    ctx.fillText(`${unlockedCount} Badges Unlocked`, 80 + halfWidth + 50, bottomY + 105);

    // List top 2 badge titles
    if (unlockedBadges.length > 0) {
      ctx.fillStyle = isLight ? "#047857" : "#34d399";
      ctx.font = "bold 18px sans-serif";
      unlockedBadges.slice(0, 2).forEach((b, i) => {
        ctx.fillText(`✓ ${b.title}`, 80 + halfWidth + 50, bottomY + 150 + i * 32);
      });
    } else {
      ctx.fillStyle = secondaryTextColor;
      ctx.font = "italic 18px sans-serif";
      ctx.fillText("Log meals & water to unlock", 80 + halfWidth + 50, bottomY + 150);
      ctx.fillText("performance badges today!", 80 + halfWidth + 50, bottomY + 180);
    }
    ctx.restore();

    // 6. Bottom Signature / Watermark
    ctx.save();
    ctx.fillStyle = secondaryTextColor;
    ctx.font = "500 20px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tracked with NutDiary • AI Food Diary & Goal Companion", width / 2, height - 70);

    ctx.fillStyle = "#10b981";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("nutdiary.app", width / 2, height - 42);
    ctx.restore();

    return canvas;
  };

  useEffect(() => {
    renderCardToCanvas();
  }, [theme, totalCalories, totalProtein, totalCarbs, totalFat, waterCups, hydrationGoal, selectedDate]);

  // Download card as PNG
  const handleDownloadImage = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const canvas = renderCardToCanvas();
      if (!canvas) {
        setIsGenerating(false);
        return;
      }

      const link = document.createElement("a");
      link.download = `NutDiary_Progress_${selectedDate}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      setIsGenerating(false);
    }, 150);
  };

  // Copy Image to Clipboard
  const handleCopyImageToClipboard = async () => {
    try {
      const canvas = renderCardToCanvas();
      if (!canvas) return;

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob })
          ]);
          setCopiedImage(true);
          setTimeout(() => setCopiedImage(false), 2500);
        } catch (e) {
          console.warn("ClipboardItem write failed, fallback to text:", e);
          handleCopyText();
        }
      });
    } catch {
      handleCopyText();
    }
  };

  // Copy Formatted Text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(getShareText());
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2500);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  // Web Share API
  const handleNativeShare = async () => {
    const text = getShareText();
    const canvas = renderCardToCanvas();

    if (navigator.share) {
      try {
        if (canvas && navigator.canShare) {
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], `NutDiary_Progress_${selectedDate}.png`, { type: "image/png" });
              if (navigator.canShare({ files: [file] })) {
                await navigator.share({
                  title: `NutDiary Daily Report - ${formattedDate}`,
                  text: text,
                  files: [file],
                });
                return;
              }
            }
            // Fallback to text share
            await navigator.share({
              title: `NutDiary Daily Report - ${formattedDate}`,
              text: text,
            });
          });
        } else {
          await navigator.share({
            title: `NutDiary Daily Report - ${formattedDate}`,
            text: text,
          });
        }
      } catch (e) {
        // User cancelled or share error
      }
    } else {
      handleCopyText();
    }
  };

  // Social URLs
  const twitterShareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(getShareText())}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(getShareText())}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-sky-600 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Share2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Share Daily Progress
              </h3>
              <span className="text-[11px] text-emerald-100 font-medium block">
                Generate a social-media ready summary card
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Card Theme Picker */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <span className="text-xs font-bold text-slate-700">Choose Card Theme:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTheme("midnight")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "midnight"
                    ? "bg-slate-900 text-emerald-400 ring-2 ring-emerald-500 shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                🌲 Midnight Emerald
              </button>
              <button
                onClick={() => setTheme("obsidian")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "obsidian"
                    ? "bg-black text-white ring-2 ring-slate-700 shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                🌑 Obsidian Dark
              </button>
              <button
                onClick={() => setTheme("clean")}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  theme === "clean"
                    ? "bg-white text-slate-900 ring-2 ring-emerald-500 shadow-xs"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                ☀️ Clean Light
              </button>
            </div>
          </div>

          {/* Interactive Card Preview */}
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[440px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-slate-950 relative flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full object-contain select-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              High-resolution 1080×1080 canvas export ready for Instagram, X/Twitter, WhatsApp & LinkedIn.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Download PNG */}
            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-xs shadow-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Download Image</span>
            </button>

            {/* Copy Image / Text */}
            <button
              onClick={handleCopyImageToClipboard}
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {copiedImage ? (
                <>
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span>Image Copied!</span>
                </>
              ) : (
                <>
                  <ImageIcon className="h-4 w-4 text-emerald-400" />
                  <span>Copy Image</span>
                </>
              )}
            </button>

            {/* Native Share */}
            <button
              onClick={handleNativeShare}
              className="py-2.5 px-4 bg-teal-600 hover:bg-teal-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="h-4 w-4" />
              <span>Quick Share</span>
            </button>
          </div>

          {/* Direct Social Links & Copy Text */}
          <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">Quick Share Links:</span>
              <button
                onClick={handleCopyText}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                {copiedText ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copied Text!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Post Text</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <a
                href={twitterShareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-black text-white hover:bg-slate-800 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Twitter className="h-3.5 w-3.5" />
                Post to X (Twitter)
              </a>

              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Share on WhatsApp
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
