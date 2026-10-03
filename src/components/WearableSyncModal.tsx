/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Watch, 
  RefreshCw, 
  Flame, 
  Footprints, 
  Heart, 
  Clock, 
  Activity, 
  Plus, 
  Check, 
  CheckCircle2, 
  Sliders, 
  Smartphone,
  ChevronRight,
  TrendingDown,
  Info
} from "lucide-react";
import { 
  WearableProvider, 
  WearableDailyData, 
  WearableSettings, 
  WEARABLE_PROVIDERS_CONFIG,
  connectWearableDevice,
  disconnectWearableDevice,
  syncWearableData,
  addSimulatedWorkout,
  saveWearableSettings
} from "../services/wearableService.js";

interface WearableSyncModalProps {
  selectedDate: string;
  wearableData: WearableDailyData;
  settings: WearableSettings;
  onUpdateData: (data: WearableDailyData) => void;
  onUpdateSettings: (settings: WearableSettings) => void;
  onClose: () => void;
}

export default function WearableSyncModal({
  selectedDate,
  wearableData,
  settings,
  onUpdateData,
  onUpdateSettings,
  onClose,
}: WearableSyncModalProps) {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<WearableProvider>(
    settings.connectedProvider || "apple_health"
  );

  // Custom workout simulation form
  const [customWorkoutName, setCustomWorkoutName] = useState("");
  const [customWorkoutMins, setCustomWorkoutMins] = useState("30");
  const [customWorkoutCals, setCustomWorkoutCals] = useState("250");
  const [customHeartRate, setCustomHeartRate] = useState("135");
  const [showCustomForm, setShowCustomForm] = useState(false);

  const activeConfig = WEARABLE_PROVIDERS_CONFIG[selectedProvider];

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const updated = await syncWearableData(selectedDate, selectedProvider);
      onUpdateData(updated);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2500);
    } catch (e) {
      console.error("Sync error:", e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSwitchProvider = async (provider: WearableProvider) => {
    setSelectedProvider(provider);
    setIsSyncing(true);
    try {
      const newSettings = await connectWearableDevice(provider);
      onUpdateSettings(newSettings);
      const updated = await syncWearableData(selectedDate, provider);
      onUpdateData(updated);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleAdjustBudget = () => {
    const updated: WearableSettings = {
      ...settings,
      adjustCalorieBudgetWithBurn: !settings.adjustCalorieBudgetWithBurn,
    };
    saveWearableSettings(updated);
    onUpdateSettings(updated);
  };

  const handleQuickAddWorkout = (
    name: string,
    duration: number,
    calories: number,
    hr: number
  ) => {
    const updated = addSimulatedWorkout(selectedDate, name, duration, calories, hr);
    onUpdateData(updated);
  };

  const handleAddCustomWorkout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customWorkoutName.trim()) return;
    const duration = parseInt(customWorkoutMins, 10) || 30;
    const cals = parseInt(customWorkoutCals, 10) || 200;
    const hr = parseInt(customHeartRate, 10) || 130;

    const updated = addSimulatedWorkout(
      selectedDate,
      customWorkoutName.trim(),
      duration,
      cals,
      hr
    );
    onUpdateData(updated);
    setCustomWorkoutName("");
    setShowCustomForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-500 via-pink-600 to-indigo-600 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Watch className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Fitness Wearable Integration
              </h3>
              <span className="text-[11px] text-pink-100 font-medium block">
                Sync Apple Health & Google Fit active energy expenditure
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
          
          {/* Provider Selector Strip */}
          <div>
            <span className="text-xs font-bold text-slate-700 block mb-2">
              Select Connected Fitness Tracker:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(Object.keys(WEARABLE_PROVIDERS_CONFIG) as WearableProvider[]).map((prov) => {
                const conf = WEARABLE_PROVIDERS_CONFIG[prov];
                const isSelected = selectedProvider === prov;
                return (
                  <button
                    key={prov}
                    onClick={() => handleSwitchProvider(prov)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-xs ring-2 ring-emerald-500"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-xl">{conf.icon}</span>
                    <span className="text-[11px] font-bold block truncate max-w-full">
                      {conf.name}
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-black text-emerald-400">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Connected Device Status Card */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl shadow-xs">
                {activeConfig.icon}
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">
                    {activeConfig.tagline}
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Last Synced: {new Date(wearableData.lastSyncedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            </div>

            <button
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-xs font-bold rounded-xl shadow-xs shadow-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              <span>{isSyncing ? "Syncing..." : syncSuccess ? "Synced!" : "Sync Now"}</span>
            </button>
          </div>

          {/* Today's Synced Live Metrics Bento */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-slate-700">
                Synced Metrics ({selectedDate}):
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 font-mono">
                Continuous Background Sync Active
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-rose-600 uppercase flex items-center justify-center gap-1">
                  <Flame className="h-3 w-3" />
                  Active Burn
                </span>
                <span className="text-xl font-black text-rose-800 block mt-0.5">
                  {wearableData.activeCaloriesBurned}
                </span>
                <span className="text-[10px] text-rose-500 font-medium">kcal expended</span>
              </div>

              <div className="p-3 bg-sky-50 border border-sky-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-sky-600 uppercase flex items-center justify-center gap-1">
                  <Footprints className="h-3 w-3" />
                  Steps
                </span>
                <span className="text-xl font-black text-sky-800 block mt-0.5">
                  {wearableData.steps.toLocaleString()}
                </span>
                <span className="text-[10px] text-sky-500 font-medium">{wearableData.distanceKm} km</span>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-indigo-600 uppercase flex items-center justify-center gap-1">
                  <Clock className="h-3 w-3" />
                  Exercise
                </span>
                <span className="text-xl font-black text-indigo-800 block mt-0.5">
                  {wearableData.activeWorkoutMinutes}m
                </span>
                <span className="text-[10px] text-indigo-500 font-medium">workout time</span>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                <span className="text-[10px] font-bold text-amber-600 uppercase flex items-center justify-center gap-1">
                  <Heart className="h-3 w-3" />
                  Heart Rate
                </span>
                <span className="text-xl font-black text-amber-800 block mt-0.5">
                  {wearableData.avgHeartRateBpm}
                </span>
                <span className="text-[10px] text-amber-500 font-medium">avg bpm</span>
              </div>
            </div>
          </div>

          {/* Calorie Budget Setting Toggle */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Add Active Burn to Calorie Budget
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Automatically adjusts your daily allowance so workout energy increases remaining calories.
                </p>
              </div>

              <button
                type="button"
                onClick={handleToggleAdjustBudget}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                  settings.adjustCalorieBudgetWithBurn ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    settings.adjustCalorieBudgetWithBurn ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
              <Info className="h-3.5 w-3.5 shrink-0" />
              <span>
                {settings.adjustCalorieBudgetWithBurn
                  ? `Active Burn of ${wearableData.activeCaloriesBurned} kcal is currently factored into your net calories.`
                  : "Caloric budget strictly tracks consumed food without exercise deduction."}
              </span>
            </div>
          </div>

          {/* Workouts Synced Today */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-700">
                Synced Workouts ({wearableData.workouts.length}):
              </span>
              <button
                onClick={() => setShowCustomForm(!showCustomForm)}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Simulate Workout</span>
              </button>
            </div>

            {/* Quick Simulation Chips */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleQuickAddWorkout("Morning 5km Run", 28, 290, 152)}
                className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold hover:bg-rose-100 transition-colors cursor-pointer"
              >
                + 5km Run (290 kcal)
              </button>
              <button
                onClick={() => handleQuickAddWorkout("Strength & Hypertrophy", 45, 260, 126)}
                className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-semibold hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                + Gym Weights (260 kcal)
              </button>
              <button
                onClick={() => handleQuickAddWorkout("Outdoor Cycling", 35, 240, 134)}
                className="px-2.5 py-1.5 bg-sky-50 text-sky-700 border border-sky-200 rounded-xl text-xs font-semibold hover:bg-sky-100 transition-colors cursor-pointer"
              >
                + Cycling (240 kcal)
              </button>
            </div>

            {/* Custom Workout Form */}
            {showCustomForm && (
              <form onSubmit={handleAddCustomWorkout} className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-in fade-in-50">
                <span className="text-xs font-bold text-slate-700 block">
                  Simulate Wearable Activity Record:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Activity Name (e.g. HIIT)"
                    value={customWorkoutName}
                    onChange={(e) => setCustomWorkoutName(e.target.value)}
                    className="col-span-2 px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Minutes"
                    value={customWorkoutMins}
                    onChange={(e) => setCustomWorkoutMins(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Calories (kcal)"
                    value={customWorkoutCals}
                    onChange={(e) => setCustomWorkoutCals(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomForm(false)}
                    className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Inject into Wearable Data
                  </button>
                </div>
              </form>
            )}

            {/* List of workouts */}
            <div className="space-y-2">
              {wearableData.workouts.map((w) => (
                <div
                  key={w.id}
                  className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                      🔥
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        {w.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {w.startTime} • {w.durationMinutes} mins • avg {w.avgHeartRate} bpm
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                    +{w.caloriesBurned} kcal
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
