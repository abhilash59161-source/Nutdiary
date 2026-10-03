/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type WearableProvider = "apple_health" | "google_fit" | "garmin" | "fitbit" | "whoop";

export interface WearableWorkout {
  id: string;
  name: string;
  durationMinutes: number;
  caloriesBurned: number;
  avgHeartRate: number;
  startTime: string;
  intensity: "low" | "moderate" | "high";
}

export interface WearableDailyData {
  date: string; // YYYY-MM-DD
  activeCaloriesBurned: number; // Active energy expended (exercise + daily movement)
  basalCaloriesBurned: number; // Resting metabolic burn estimated by device
  totalBurned: number; // active + basal
  steps: number;
  distanceKm: number;
  activeWorkoutMinutes: number;
  avgHeartRateBpm: number;
  lastSyncedAt: string; // ISO String
  sourceProvider: WearableProvider;
  workouts: WearableWorkout[];
}

export interface WearableSettings {
  connectedProvider: WearableProvider | null;
  autoSyncEnabled: boolean;
  adjustCalorieBudgetWithBurn: boolean; // Add active burn to daily budget
  lastGlobalSync: string | null;
}

const SETTINGS_KEY = "nutdiary_wearable_settings";
const DATA_PREFIX = "nutdiary_wearable_data_";

export const WEARABLE_PROVIDERS_CONFIG: Record<
  WearableProvider,
  {
    name: string;
    icon: string;
    color: string;
    bg: string;
    border: string;
    tagline: string;
  }
> = {
  apple_health: {
    name: "Apple Health",
    icon: "🍏",
    color: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    tagline: "Apple HealthKit (Activity & Workouts)",
  },
  google_fit: {
    name: "Google Fit",
    icon: "🏃‍♂️",
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-200",
    tagline: "Google Health Connect & Android Fit",
  },
  garmin: {
    name: "Garmin Connect",
    icon: "⌚",
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    tagline: "Garmin Connect Activity Tracking",
  },
  fitbit: {
    name: "Fitbit",
    icon: "🔋",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    tagline: "Fitbit Daily Cardio & Calorie Burn",
  },
  whoop: {
    name: "WHOOP 4.0",
    icon: "⚡",
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    tagline: "WHOOP Strain & Metabolic Expenditure",
  },
};

export const DEFAULT_WEARABLE_SETTINGS: WearableSettings = {
  connectedProvider: "apple_health", // Default mock connected for ready-to-test UX
  autoSyncEnabled: true,
  adjustCalorieBudgetWithBurn: true,
  lastGlobalSync: new Date().toISOString(),
};

/**
 * Retrieve wearable settings
 */
export function getWearableSettings(): WearableSettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_WEARABLE_SETTINGS;
  } catch {
    return DEFAULT_WEARABLE_SETTINGS;
  }
}

/**
 * Save wearable settings
 */
export function saveWearableSettings(settings: WearableSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save wearable settings:", err);
  }
}

/**
 * Generate deterministic mock wearable data for a specific date
 */
export function generateMockWearableData(
  date: string,
  provider: WearableProvider = "apple_health"
): WearableDailyData {
  // Use date hash for consistent data
  let seed = 0;
  for (let i = 0; i < date.length; i++) {
    seed = (seed << 5) - seed + date.charCodeAt(i);
    seed |= 0;
  }
  const absSeed = Math.abs(seed);

  // Deterministic realistic numbers
  const steps = 6000 + (absSeed % 6500); // 6,000 to 12,500
  const activeCalories = Math.round(steps * 0.045 + (absSeed % 250)); // ~380 to 650 kcal
  const basalCalories = 1620 + (absSeed % 120); // ~1,620 - 1,740 kcal
  const distanceKm = +(steps * 0.00078).toFixed(2);
  const workoutMins = 25 + (absSeed % 40); // 25 to 65 mins
  const avgHeartRate = 68 + (absSeed % 14); // 68 to 82 bpm

  const workoutOptions: Array<Omit<WearableWorkout, "id">> = [
    {
      name: "Morning Outdoor Run",
      durationMinutes: Math.min(workoutMins, 35),
      caloriesBurned: Math.round(activeCalories * 0.65),
      avgHeartRate: 148,
      startTime: "07:15 AM",
      intensity: "high",
    },
    {
      name: "Functional Strength Training",
      durationMinutes: 30,
      caloriesBurned: Math.round(activeCalories * 0.45),
      avgHeartRate: 128,
      startTime: "05:30 PM",
      intensity: "moderate",
    },
    {
      name: "Brisk Commute Walk",
      durationMinutes: 20,
      caloriesBurned: Math.round(activeCalories * 0.25),
      avgHeartRate: 104,
      startTime: "12:30 PM",
      intensity: "low",
    },
  ];

  const workouts: WearableWorkout[] = [
    {
      ...workoutOptions[absSeed % workoutOptions.length],
      id: `w_${date}_1`,
    },
  ];

  return {
    date,
    activeCaloriesBurned: activeCalories,
    basalCaloriesBurned: basalCalories,
    totalBurned: activeCalories + basalCalories,
    steps,
    distanceKm,
    activeWorkoutMinutes: workoutMins,
    avgHeartRateBpm: avgHeartRate,
    lastSyncedAt: new Date().toISOString(),
    sourceProvider: provider,
    workouts,
  };
}

/**
 * Get wearable data for a specific date
 */
export function getDailyWearableData(date: string): WearableDailyData {
  try {
    const saved = localStorage.getItem(`${DATA_PREFIX}${date}`);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error("Error reading wearable data from storage:", err);
  }

  // If not yet generated, create deterministic initial sync
  const settings = getWearableSettings();
  const initial = generateMockWearableData(
    date,
    settings.connectedProvider || "apple_health"
  );
  saveDailyWearableData(initial);
  return initial;
}

/**
 * Save daily wearable data
 */
export function saveDailyWearableData(data: WearableDailyData): void {
  try {
    localStorage.setItem(`${DATA_PREFIX}${data.date}`, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save wearable data:", err);
  }
}

/**
 * Simulate live sync operation (simulates async Bluetooth/HealthKit API call)
 */
export async function syncWearableData(
  date: string,
  provider?: WearableProvider
): Promise<WearableDailyData> {
  const settings = getWearableSettings();
  const activeProvider = provider || settings.connectedProvider || "apple_health";

  // Simulate network / Bluetooth sync latency
  await new Promise((resolve) => setTimeout(resolve, 600));

  const existing = getDailyWearableData(date);
  
  // Slightly adjust active burn and steps to mimic live real-time wearable sync updates
  const updatedSteps = Math.min(20000, existing.steps + Math.floor(Math.random() * 280) + 50);
  const additionalBurn = Math.floor(Math.random() * 35) + 10;
  const updatedActiveBurn = existing.activeCaloriesBurned + additionalBurn;

  const updated: WearableDailyData = {
    ...existing,
    steps: updatedSteps,
    activeCaloriesBurned: updatedActiveBurn,
    totalBurned: updatedActiveBurn + existing.basalCaloriesBurned,
    distanceKm: +(updatedSteps * 0.00078).toFixed(2),
    lastSyncedAt: new Date().toISOString(),
    sourceProvider: activeProvider,
  };

  saveDailyWearableData(updated);

  // Update global settings timestamp
  saveWearableSettings({
    ...settings,
    connectedProvider: activeProvider,
    lastGlobalSync: new Date().toISOString(),
  });

  return updated;
}

/**
 * Manually simulate logging an extra workout or activity to the wearable
 */
export function addSimulatedWorkout(
  date: string,
  workoutName: string,
  durationMinutes: number,
  caloriesBurned: number,
  avgHeartRate: number
): WearableDailyData {
  const current = getDailyWearableData(date);

  const newWorkout: WearableWorkout = {
    id: `workout_${Date.now()}`,
    name: workoutName,
    durationMinutes,
    caloriesBurned,
    avgHeartRate,
    startTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    intensity: caloriesBurned > 300 ? "high" : caloriesBurned > 150 ? "moderate" : "low",
  };

  const updated: WearableDailyData = {
    ...current,
    activeCaloriesBurned: current.activeCaloriesBurned + caloriesBurned,
    totalBurned: current.totalBurned + caloriesBurned,
    activeWorkoutMinutes: current.activeWorkoutMinutes + durationMinutes,
    lastSyncedAt: new Date().toISOString(),
    workouts: [newWorkout, ...current.workouts],
  };

  saveDailyWearableData(updated);
  return updated;
}

/**
 * Connect a wearable device
 */
export async function connectWearableDevice(
  provider: WearableProvider
): Promise<WearableSettings> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const settings = getWearableSettings();
  const updated: WearableSettings = {
    ...settings,
    connectedProvider: provider,
    autoSyncEnabled: true,
    lastGlobalSync: new Date().toISOString(),
  };
  saveWearableSettings(updated);
  return updated;
}

/**
 * Disconnect wearable device
 */
export function disconnectWearableDevice(): WearableSettings {
  const settings = getWearableSettings();
  const updated: WearableSettings = {
    ...settings,
    connectedProvider: null,
  };
  saveWearableSettings(updated);
  return updated;
}
