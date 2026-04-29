import { nanoid } from "nanoid/non-secure";
import { getNowISO, getTodayDateString } from "./date";
import type {
  Entry,
  HomeWorkoutEntry,
  RunEntry,
  BeatSaberEntry,
  MealEntry,
  MeasureEntry,
  CustomSportEntry,
  AddEntryOptions,
  EntryType,
} from "../types";

/**
 * Factory pour la création unifiée d'entrées
 * Centralise l'ID, les dates et la structure de base
 */
export class EntryFactory {
  private static createBase(type: EntryType, options?: AddEntryOptions) {
    return {
      id: nanoid(),
      type,
      createdAt: options?.customCreatedAt || getNowISO(),
      date: options?.customDate || getTodayDateString(),
      healthConnectId: options?.healthConnectId,
    };
  }

  static homeWorkout(
    data: Omit<
      HomeWorkoutEntry,
      keyof ReturnType<typeof EntryFactory.createBase>
    >,
    options?: AddEntryOptions,
  ): HomeWorkoutEntry {
    return {
      ...this.createBase("home", options),
      ...data,
    };
  }

  static run(
    data: Omit<
      RunEntry,
      keyof ReturnType<typeof EntryFactory.createBase> | "avgSpeed"
    >,
    options?: AddEntryOptions,
  ): RunEntry {
    const avgSpeed =
      data.durationMinutes > 0
        ? Math.round((data.distanceKm / (data.durationMinutes / 60)) * 10) / 10
        : 0;

    return {
      ...this.createBase("run", options),
      ...data,
      avgSpeed,
    };
  }

  static beatSaber(
    data: Omit<
      BeatSaberEntry,
      keyof ReturnType<typeof EntryFactory.createBase>
    >,
    options?: AddEntryOptions,
  ): BeatSaberEntry {
    return {
      ...this.createBase("beatsaber", options),
      ...data,
    };
  }

  static meal(
    data: Omit<MealEntry, keyof ReturnType<typeof EntryFactory.createBase>>,
    options?: AddEntryOptions,
  ): MealEntry {
    return {
      ...this.createBase("meal", options),
      ...data,
    };
  }

  static measure(
    data: Omit<MeasureEntry, keyof ReturnType<typeof EntryFactory.createBase>>,
    options?: AddEntryOptions,
  ): MeasureEntry {
    return {
      ...this.createBase("measure", options),
      ...data,
    };
  }

  static customSport(
    data: Omit<
      CustomSportEntry,
      keyof ReturnType<typeof EntryFactory.createBase>
    >,
    options?: AddEntryOptions,
  ): CustomSportEntry {
    return {
      ...this.createBase("custom", options),
      ...data,
    };
  }
}
