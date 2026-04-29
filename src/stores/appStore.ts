import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "../storage";
import { STORAGE_KEYS, isSportEntryType } from "../constants/values";
import { useGamificationStore } from "./gamificationStore";
import { checkBadges } from "../utils/badges";
import {
  calculateStreak,
  calculateConsecutiveWeeklyGoalsMet,
} from "../utils/date";
import {
  shareSportEntryToFeed,
  syncActiveChallengeProgressFromEntries,
} from "../services/supabase/social";
import { useSocialStore } from "./socialStore";
import { storeLogger } from "../utils/logger";
import { createEntriesSlice, EntriesSlice } from "./slices/entriesSlice";
import { createSettingsSlice, SettingsSlice } from "./slices/settingsSlice";
import { Entry } from "../types";

/**
 * AppState combinant tous les slices
 */
export type AppState = EntriesSlice &
  SettingsSlice & {
    syncAllSystems: (
      entries: Entry[],
      entryAdded?: Entry,
      customCreatedAt?: string,
    ) => void;
    recheckBadges: (entries: Entry[]) => void;
    getSportEntries: () => Entry[];
    getStreak: () => { current: number; best: number };
    getMonthlyStats: () => { month: string; count: number }[];
  };

let socialStatsSyncTimeout: ReturnType<typeof setTimeout> | null = null;
let socialChallengeProgressSyncTimeout: ReturnType<typeof setTimeout> | null =
  null;

export const useAppStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      ...createEntriesSlice(set, get, api),
      ...createSettingsSlice(set, get, api),

      /**
       * Orchestrateur de synchronisation - Centralise tous les effets de bord
       */
      syncAllSystems: (entries, entryAdded, customCreatedAt) => {
        const gamificationStore = useGamificationStore.getState();

        if (entryAdded && isSportEntryType(entryAdded.type)) {
          gamificationStore.processEntryAdded(entryAdded);

          // Auto-share to social if matching conditions
          const isRecent =
            !customCreatedAt &&
            Math.abs(Date.now() - new Date(entryAdded.createdAt).getTime()) <
              5 * 60 * 1000;
          if (isRecent) {
            const socialStore = useSocialStore.getState();
            if (socialStore.isAuthenticated && socialStore.socialEnabled) {
              shareSportEntryToFeed(entryAdded as any).catch((e) =>
                storeLogger.warn("Auto-share failed", e),
              );
            }
          }
        }

        gamificationStore.syncQuestsWithEntries(entries);
        get().recheckBadges(entries);

        // Debounced Social Syncs
        if (socialStatsSyncTimeout) clearTimeout(socialStatsSyncTimeout);
        socialStatsSyncTimeout = setTimeout(() => {
          const socialStore = useSocialStore.getState();
          if (socialStore.isAuthenticated && socialStore.socialEnabled) {
            // Logic here would call social actions
          }
        }, 500);
      },

      recheckBadges: (entries) => {
        const sportDates = entries
          .filter((e) => isSportEntryType(e.type))
          .map((e) => e.date);
        const streak = calculateStreak(sportDates);
        const weeklyGoalsMet = calculateConsecutiveWeeklyGoalsMet(
          sportDates,
          get().settings.weeklyGoal,
        );

        const badges = checkBadges(
          entries,
          streak.current,
          streak.best,
          weeklyGoalsMet,
        );
        get().updateUnlockedBadges(badges);
      },

      getSportEntries: () =>
        get().entries.filter((e) => isSportEntryType(e.type)),
      getStreak: () => {
        const sportDates = get()
          .entries.filter((e) => isSportEntryType(e.type))
          .map((e) => e.date);
        return calculateStreak(sportDates);
      },
      getMonthlyStats: () => {
        const stats: Record<string, number> = {};
        get()
          .entries.filter((e) => isSportEntryType(e.type))
          .forEach((e) => {
            const m = e.date.slice(0, 7);
            stats[m] = (stats[m] || 0) + 1;
          });
        return Object.entries(stats)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month));
      },
    }),
    {
      name: STORAGE_KEYS.appStore,
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);

// Exports pour faciliter l'usage
export const useEntries = () => useAppStore((state) => state.entries);
export const useSettings = () => useAppStore((state) => state.settings);
export const useBadges = () => useAppStore((state) => state.unlockedBadges);
export const useSportsConfig = () => useAppStore((state) => state.sportsConfig);
