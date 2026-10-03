/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  X, 
  Bell, 
  Clock, 
  Volume2, 
  VolumeX, 
  Send, 
  CheckCircle, 
  Smartphone, 
  Utensils, 
  Coffee, 
  Sun, 
  Moon, 
  Sparkles,
  AlertCircle
} from "lucide-react";

export interface ReminderConfig {
  enabled: boolean;
  pushEnabled: boolean;
  soundEnabled: boolean;
  breakfastTime: string;
  lunchTime: string;
  dinnerTime: string;
}

export const DEFAULT_REMINDER_CONFIG: ReminderConfig = {
  enabled: true,
  pushEnabled: false,
  soundEnabled: true,
  breakfastTime: "08:30",
  lunchTime: "13:00",
  dinnerTime: "19:30",
};

interface ReminderSettingsModalProps {
  config: ReminderConfig;
  onSaveConfig: (newConfig: ReminderConfig) => void;
  onClose: () => void;
  onTriggerTestReminder: (mealType: "breakfast" | "lunch" | "dinner") => void;
}

export default function ReminderSettingsModal({
  config,
  onSaveConfig,
  onClose,
  onTriggerTestReminder,
}: ReminderSettingsModalProps) {
  const [localConfig, setLocalConfig] = useState<ReminderConfig>(config);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(() => {
    return typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default";
  });
  const [testSent, setTestSent] = useState(false);

  const handleRequestPushPermission = async () => {
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notifications.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionStatus(permission);
      if (permission === "granted") {
        setLocalConfig((prev) => ({ ...prev, pushEnabled: true }));
      } else {
        setLocalConfig((prev) => ({ ...prev, pushEnabled: false }));
      }
    } catch (err) {
      console.error("Error requesting notification permission:", err);
    }
  };

  const handleSave = () => {
    onSaveConfig(localConfig);
    onClose();
  };

  const handleTest = (meal: "breakfast" | "lunch" | "dinner") => {
    onTriggerTestReminder(meal);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in-50">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">
                Meal Reminder Schedule
              </h3>
              <span className="text-[11px] text-emerald-100 font-medium block">
                Never forget to log your daily nutrition
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

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Main Master Switch */}
          <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
            <div className="space-y-0.5">
              <label className="text-sm font-bold text-slate-800 flex items-center gap-2 cursor-pointer">
                <span>Meal Reminders Active</span>
                {localConfig.enabled && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                )}
              </label>
              <p className="text-xs text-slate-500">
                Receive in-app toasts & notifications at your preferred meal times
              </p>
            </div>
            <button
              onClick={() => setLocalConfig(prev => ({ ...prev, enabled: !prev.enabled }))}
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                localConfig.enabled ? "bg-emerald-500" : "bg-slate-300"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  localConfig.enabled ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Time Schedules */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              Target Reminder Times
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Breakfast */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Coffee className="h-3.5 w-3.5 text-amber-500" />
                  Breakfast
                </div>
                <input
                  type="time"
                  disabled={!localConfig.enabled}
                  value={localConfig.breakfastTime}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, breakfastTime: e.target.value }))}
                  className="w-full px-2 py-1 text-sm font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Typical: 07:00 - 09:30</span>
              </div>

              {/* Lunch */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Sun className="h-3.5 w-3.5 text-orange-500" />
                  Lunch
                </div>
                <input
                  type="time"
                  disabled={!localConfig.enabled}
                  value={localConfig.lunchTime}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, lunchTime: e.target.value }))}
                  className="w-full px-2 py-1 text-sm font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Typical: 12:00 - 14:00</span>
              </div>

              {/* Dinner */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-200 transition-colors">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Moon className="h-3.5 w-3.5 text-indigo-500" />
                  Dinner
                </div>
                <input
                  type="time"
                  disabled={!localConfig.enabled}
                  value={localConfig.dinnerTime}
                  onChange={(e) => setLocalConfig(prev => ({ ...prev, dinnerTime: e.target.value }))}
                  className="w-full px-2 py-1 text-sm font-bold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Typical: 18:30 - 20:30</span>
              </div>
            </div>
          </div>

          {/* Delivery Channels */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
              Delivery Channels
            </h4>

            {/* Browser Push Notification Toggle */}
            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Browser & Mobile Push Notifications
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Receive prompts even when NutDiary tab is minimized
                  </p>
                </div>

                {permissionStatus === "granted" ? (
                  <button
                    onClick={() => setLocalConfig(prev => ({ ...prev, pushEnabled: !prev.pushEnabled }))}
                    disabled={!localConfig.enabled}
                    className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                      localConfig.pushEnabled && localConfig.enabled ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                        localConfig.pushEnabled && localConfig.enabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                ) : (
                  <button
                    onClick={handleRequestPushPermission}
                    disabled={!localConfig.enabled}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                  >
                    Enable Push
                  </button>
                )}
              </div>

              {permissionStatus === "granted" ? (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  Browser notification permission is granted
                </div>
              ) : permissionStatus === "denied" ? (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                  Notifications are blocked in your browser settings
                </div>
              ) : (
                <p className="text-[10px] text-slate-400">
                  Click "Enable Push" to allow your browser or installed PWA to trigger notifications.
                </p>
              )}
            </div>

            {/* Sound Chime Toggle */}
            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                  {localConfig.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Sound Chime</span>
                  <span className="text-[11px] text-slate-500">Play a gentle melodic chime when reminder triggers</span>
                </div>
              </div>

              <button
                onClick={() => setLocalConfig(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
                disabled={!localConfig.enabled}
                className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 ${
                  localConfig.soundEnabled && localConfig.enabled ? "bg-emerald-500" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                    localConfig.soundEnabled && localConfig.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Test Reminder Trigger */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">Preview & Test Reminder:</span>
              {testSent && (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in-50">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Toast Triggered!
                </span>
              )}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleTest("breakfast")}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Coffee className="h-3.5 w-3.5 text-amber-500" />
                Breakfast
              </button>
              <button
                onClick={() => handleTest("lunch")}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Sun className="h-3.5 w-3.5 text-orange-500" />
                Lunch
              </button>
              <button
                onClick={() => handleTest("dinner")}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <Moon className="h-3.5 w-3.5 text-indigo-500" />
                Dinner
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2.5 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs shadow-emerald-200 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="h-4 w-4" />
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
