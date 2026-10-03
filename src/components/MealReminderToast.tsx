/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { 
  Utensils, 
  Coffee, 
  Sun, 
  Moon, 
  X, 
  ArrowRight, 
  Bell, 
  Clock, 
  Settings2,
  Sparkles
} from "lucide-react";
import { FoodItem } from "../types.js";
import { ReminderConfig } from "./ReminderSettingsModal.tsx";

interface MealReminderToastProps {
  config: ReminderConfig;
  foodLogs: FoodItem[];
  selectedDate: string;
  onLogMeal: (mealType: "breakfast" | "lunch" | "dinner") => void;
  onOpenSettings: () => void;
  activeTestMeal: "breakfast" | "lunch" | "dinner" | null;
  onClearTestMeal: () => void;
}

interface ActiveReminder {
  mealType: "breakfast" | "lunch" | "dinner";
  title: string;
  subtitle: string;
  tip: string;
  timeStr: string;
}

export default function MealReminderToast({
  config,
  foodLogs,
  selectedDate,
  onLogMeal,
  onOpenSettings,
  activeTestMeal,
  onClearTestMeal,
}: MealReminderToastProps) {
  const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);
  const [dismissedMeals, setDismissedMeals] = useState<Record<string, boolean>>({});
  const lastCheckTimeRef = useRef<string>("");

  // Play gentle web audio chime
  const playReminderChime = () => {
    if (!config.soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const audioCtx = new AudioCtx();
      
      const playTone = (freq: number, delay: number, dur: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + dur);
      };

      playTone(523.25, 0, 0.25);   // C5
      playTone(659.25, 0.12, 0.25); // E5
      playTone(783.99, 0.24, 0.4);  // G5
    } catch {
      // AudioContext blocked or not allowed
    }
  };

  // Trigger browser push notification if enabled
  const sendBrowserNotification = (meal: ActiveReminder) => {
    if (
      config.pushEnabled && 
      typeof window !== "undefined" && 
      "Notification" in window && 
      Notification.permission === "granted"
    ) {
      try {
        const n = new Notification(`NutDiary: ${meal.title}`, {
          body: `${meal.subtitle} ${meal.tip}`,
          icon: "/favicon.ico",
          tag: `nutdiary-${meal.mealType}`,
        });
        n.onclick = () => {
          window.focus();
          onLogMeal(meal.mealType);
          n.close();
        };
      } catch (err) {
        console.warn("Browser notification failed:", err);
      }
    }
  };

  const showReminder = (mealType: "breakfast" | "lunch" | "dinner") => {
    let reminder: ActiveReminder;
    if (mealType === "breakfast") {
      reminder = {
        mealType: "breakfast",
        title: "Good Morning! Time for Breakfast",
        subtitle: "Kickstart your metabolism with nutrient-dense fuel.",
        tip: "A high-protein breakfast reduces postprandial cravings throughout the day.",
        timeStr: config.breakfastTime,
      };
    } else if (mealType === "lunch") {
      reminder = {
        mealType: "lunch",
        title: "Midday Fuel: Lunch Check-In",
        subtitle: "Replenish your glycogen and cognitive focus.",
        tip: "Incorporate fiber and clean protein to avoid an afternoon energy crash.",
        timeStr: config.lunchTime,
      };
    } else {
      reminder = {
        mealType: "dinner",
        title: "Evening Nutrition: Dinner Reminder",
        subtitle: "Log your final meal to complete today's targets.",
        tip: "Keep dinner balanced to support nighttime cellular restoration and rest.",
        timeStr: config.dinnerTime,
      };
    }

    setActiveReminder(reminder);
    playReminderChime();
    sendBrowserNotification(reminder);
  };

  // Handle active test meal from settings
  useEffect(() => {
    if (activeTestMeal) {
      showReminder(activeTestMeal);
      onClearTestMeal();
    }
  }, [activeTestMeal]);

  // Periodic time checking against reminder configuration & logged meals
  useEffect(() => {
    if (!config.enabled) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const todayStr = now.toISOString().split("T")[0];

      // Form HH:MM
      const currentHHMM = `${String(currentHour).padStart(2, "0")}:${String(currentMin).padStart(2, "0")}`;
      if (currentHHMM === lastCheckTimeRef.current) return;
      lastCheckTimeRef.current = currentHHMM;

      // Check if user already logged these meals today
      const todayLogs = foodLogs.filter((log) => log.loggedAt === todayStr);
      const hasBreakfast = todayLogs.some((log) => log.mealType === "breakfast");
      const hasLunch = todayLogs.some((log) => log.mealType === "lunch");
      const hasDinner = todayLogs.some((log) => log.mealType === "dinner");

      // Check configured or typical windows
      // 1. Breakfast check (at configured time or within 07:30 - 10:00)
      if (
        !hasBreakfast && 
        !dismissedMeals[`${todayStr}_breakfast`] && 
        (currentHHMM === config.breakfastTime || (currentHour === 8 && currentMin === 30))
      ) {
        showReminder("breakfast");
        return;
      }

      // 2. Lunch check (at configured time or within 12:30 - 14:00)
      if (
        !hasLunch && 
        !dismissedMeals[`${todayStr}_lunch`] && 
        (currentHHMM === config.lunchTime || (currentHour === 13 && currentMin === 0))
      ) {
        showReminder("lunch");
        return;
      }

      // 3. Dinner check (at configured time or within 19:00 - 20:30)
      if (
        !hasDinner && 
        !dismissedMeals[`${todayStr}_dinner`] && 
        (currentHHMM === config.dinnerTime || (currentHour === 19 && currentMin === 30))
      ) {
        showReminder("dinner");
        return;
      }
    };

    // Run check immediately and every 25 seconds
    checkReminders();
    const interval = setInterval(checkReminders, 25000);
    return () => clearInterval(interval);
  }, [config, foodLogs, dismissedMeals]);

  if (!activeReminder) return null;

  const handleDismiss = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    setDismissedMeals((prev) => ({
      ...prev,
      [`${todayStr}_${activeReminder.mealType}`]: true,
    }));
    setActiveReminder(null);
  };

  const handleAction = () => {
    onLogMeal(activeReminder.mealType);
    handleDismiss();
  };

  const getMealIcon = (type: string) => {
    switch (type) {
      case "breakfast":
        return <Coffee className="h-5 w-5 text-amber-500" />;
      case "lunch":
        return <Sun className="h-5 w-5 text-orange-500" />;
      default:
        return <Moon className="h-5 w-5 text-indigo-500" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full mx-4 sm:mx-0 animate-in slide-in-from-bottom-5 duration-300">
      <div className="bg-white/95 backdrop-blur-md border border-emerald-100 rounded-3xl p-5 shadow-2xl shadow-emerald-950/15 flex flex-col gap-3 relative overflow-hidden">
        {/* Accent top gradient stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100/80">
              {getMealIcon(activeReminder.mealType)}
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                NutDiary Reminder
              </span>
              <h4 className="text-sm font-bold text-slate-800 leading-tight">
                {activeReminder.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={onOpenSettings}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Reminder Settings"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Message */}
        <p className="text-xs text-slate-600 leading-relaxed font-normal">
          {activeReminder.subtitle}
        </p>

        {/* Nutritional tip callout */}
        <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-500 flex items-start gap-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
          <span>{activeReminder.tip}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 px-3 py-1.5 transition-colors cursor-pointer"
          >
            Snooze / Dismiss
          </button>
          
          <button
            onClick={handleAction}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Log {activeReminder.mealType.charAt(0).toUpperCase() + activeReminder.mealType.slice(1)}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
