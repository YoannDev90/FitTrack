import { StateCreator } from "zustand";
import { UserSettings, SportConfig, BadgeId } from "../../types";
import {
  DEFAULT_SAFETY_INTERVAL_MINUTES,
  DEFAULT_SAFETY_AUTO_ALERT_DELAY_SECONDS,
} from "../../constants/safety";

export interface SettingsSlice {
  settings: UserSettings;
  sportsConfig: SportConfig[];
  unlockedBadges: BadgeId[];
  updateWeeklyGoal: (goal: number) => void;
  updateSettings: (settings: Partial<UserSettings>) => void;
  updateUnlockedBadges: (badges: BadgeId[]) => void;
}

const defaultSettings: UserSettings = {
  weeklyGoal: 4,
  units: { weight: "kg", distance: "km" },
  hiddenTabs: { tools: true, workout: false, gamification: false },
  themePreset: "default",
  aiFeaturesEnabled: false,
  aiTone: "neutral",
  safety: {
    contacts: [],
    defaultIntervalMinutes: DEFAULT_SAFETY_INTERVAL_MINUTES,
    defaultAutoAlertDelaySeconds: DEFAULT_SAFETY_AUTO_ALERT_DELAY_SECONDS,
    fallDetectionEnabled: false,
  },
};

const defaultSportsConfig: SportConfig[] = [
  {
    id: "home",
    name: "Musculation",
    emoji: "💪",
    icon: "Dumbbell",
    color: "#8B5CF6",
    trackingFields: ["duration", "exercises", "totalReps"],
    isDefault: true,
    isHidden: false,
  },
  {
    id: "run",
    name: "Course",
    emoji: "🏃",
    icon: "Footprints",
    color: "#22C55E",
    trackingFields: ["duration", "distance", "bpmAvg", "bpmMax", "cardiacLoad"],
    isDefault: true,
    isHidden: false,
  },
  {
    id: "beatsaber",
    name: "Beat Saber",
    emoji: "🕹️",
    icon: "Gamepad2",
    color: "#EF4444",
    trackingFields: ["duration", "bpmAvg", "bpmMax", "cardiacLoad"],
    isDefault: true,
    isHidden: false,
  },
];

export const createSettingsSlice: StateCreator<
  SettingsSlice,
  [],
  [],
  SettingsSlice
> = (set) => ({
  settings: defaultSettings,
  sportsConfig: defaultSportsConfig,
  unlockedBadges: [],

  updateWeeklyGoal: (goal) =>
    set((state) => ({ settings: { ...state.settings, weeklyGoal: goal } })),
  updateSettings: (newSettings) =>
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
  updateUnlockedBadges: (badges) => set({ unlockedBadges: badges }),
});
