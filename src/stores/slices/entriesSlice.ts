import { StateCreator } from "zustand";
import {
  Entry,
  HomeWorkoutEntry,
  RunEntry,
  BeatSaberEntry,
  MealEntry,
  MeasureEntry,
  CustomSportEntry,
  AddEntryOptions,
} from "../../types";
import { EntryFactory } from "../../utils/entryFactory";
import { isSportEntryType } from "../../constants/values";
import { storeLogger } from "../../utils/logger";

export interface EntriesSlice {
  entries: Entry[];
  addHomeWorkout: (
    data: Omit<HomeWorkoutEntry, "id" | "type" | "createdAt" | "date">,
    options?: AddEntryOptions,
  ) => void;
  addRun: (
    data: Omit<RunEntry, "id" | "type" | "createdAt" | "date" | "avgSpeed">,
    options?: AddEntryOptions,
  ) => void;
  addMeal: (
    data: Omit<MealEntry, "id" | "type" | "createdAt" | "date">,
    options?: AddEntryOptions,
  ) => void;
  addMeasure: (
    data: Omit<MeasureEntry, "id" | "type" | "createdAt" | "date">,
    options?: AddEntryOptions,
  ) => void;
  addBeatSaber: (
    data: Omit<BeatSaberEntry, "id" | "type" | "createdAt" | "date">,
    options?: AddEntryOptions,
  ) => void;
  addCustomSport: (
    data: Omit<CustomSportEntry, "id" | "type" | "createdAt" | "date">,
    options?: AddEntryOptions,
  ) => void;
  deleteEntry: (id: string) => void;
  updateEntry: (id: string, updates: Partial<Entry>) => void;
}

export const createEntriesSlice: StateCreator<
  EntriesSlice & {
    syncAllSystems: (
      entries: Entry[],
      entryAdded?: Entry,
      customCreatedAt?: string,
    ) => void;
  },
  [],
  [],
  EntriesSlice
> = (set, get) => ({
  entries: [],

  addHomeWorkout: (data, options) => {
    const entry = EntryFactory.homeWorkout(data, options);
    set((state) => ({ entries: [entry, ...state.entries] }));
    get().syncAllSystems(get().entries, entry, options?.customCreatedAt);
    storeLogger.debug("Added home workout", entry.id);
  },

  addRun: (data, options) => {
    const entry = EntryFactory.run(data, options);
    set((state) => ({ entries: [entry, ...state.entries] }));
    get().syncAllSystems(get().entries, entry, options?.customCreatedAt);
    storeLogger.debug("Added run", entry.id);
  },

  addBeatSaber: (data, options) => {
    const entry = EntryFactory.beatSaber(data, options);
    set((state) => ({ entries: [entry, ...state.entries] }));
    get().syncAllSystems(get().entries, entry, options?.customCreatedAt);
    storeLogger.debug("Added BeatSaber session", entry.id);
  },

  addMeal: (data, options) => {
    const entry = EntryFactory.meal(data, options);
    set((state) => ({ entries: [entry, ...state.entries] }));
    storeLogger.debug("Added meal", entry.id);
  },

  addMeasure: (data, options) => {
    const entry = EntryFactory.measure(data, options);
    set((state) => ({ entries: [entry, ...state.entries] }));
    storeLogger.debug("Added measure", entry.id);
  },

  addCustomSport: (data, options) => {
    const entry = EntryFactory.customSport(data, options);
    set((state) => ({ entries: [entry, ...state.entries] }));
    get().syncAllSystems(get().entries, entry, options?.customCreatedAt);
    storeLogger.debug("Added custom sport", entry.id);
  },

  deleteEntry: (id) => {
    const entryToDelete = get().entries.find((e) => e.id === id);
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));

    if (entryToDelete && isSportEntryType(entryToDelete.type)) {
      get().syncAllSystems(get().entries);
      storeLogger.debug("Deleted sport entry", id);
    }
  },

  updateEntry: (id, updates) => {
    const oldEntry = get().entries.find((e) => e.id === id);
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? ({ ...e, ...updates } as Entry) : e,
      ),
    }));

    const newEntry = get().entries.find((e) => e.id === id);
    if (
      oldEntry &&
      newEntry &&
      (isSportEntryType(oldEntry.type) || isSportEntryType(newEntry.type))
    ) {
      get().syncAllSystems(get().entries);
      storeLogger.debug("Updated sport entry", id);
    }
  },
});
