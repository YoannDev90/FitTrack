import { useMemo } from "react";
import { useAppStore } from "../stores";
import { useTranslation } from "react-i18next";
import { getMonthName } from "../utils/date";
import { isSportEntryType } from "../constants/values";
import {
  HomeWorkoutEntry,
  RunEntry,
  BeatSaberEntry,
  MeasureEntry,
} from "../types";

/**
 * Hook centralisant tous les calculs de progression
 * Sort la logique métier "sale" des composants denses
 */
export const useWorkoutStats = () => {
  const { entries, settings } = useAppStore();
  const { t } = useTranslation();

  // 1. Filtrage de base
  const sportEntries = useMemo(
    () =>
      entries.filter((e): e is HomeWorkoutEntry | RunEntry | BeatSaberEntry =>
        isSportEntryType(e.type),
      ),
    [entries],
  );

  // 2. Totaux Cumulés
  const totals = useMemo(() => {
    let workouts = sportEntries.length;
    let distance = 0;
    let duration = 0;

    for (const e of sportEntries) {
      if (e.type === "run") {
        distance += e.distanceKm || 0;
        duration += e.durationMinutes || 0;
      } else if (
        e.type === "beatsaber" ||
        e.type === "home" ||
        e.type === "custom"
      ) {
        duration += (e as any).durationMinutes || 0;
      }
    }

    return { workouts, distance, duration };
  }, [sportEntries]);

  // 3. Records Personnels (Logique extraite de progress.tsx)
  const personalRecords = useMemo(() => {
    const tracked = [
      {
        id: "pushups",
        name: t("repCounter.exercises.pushups", "Pompes"),
        icon: "💪",
        type: "reps" as const,
      },
      {
        id: "situps",
        name: t("repCounter.exercises.situps", "Abdos"),
        icon: "🔥",
        type: "reps" as const,
      },
      {
        id: "squats",
        name: t("repCounter.exercises.squats", "Squats"),
        icon: "🦵",
        type: "reps" as const,
      },
      {
        id: "jumpingJacks",
        name: t("repCounter.exercises.jumpingJacks", "J. Jacks"),
        icon: "⭐",
        type: "reps" as const,
      },
      {
        id: "plank",
        name: t("repCounter.exercises.plank", "Gainage"),
        icon: "🧘",
        type: "time" as const,
      },
    ];

    return tracked.reduce<
      { id: string; name: string; icon: string; value: string }[]
    >((acc, ex) => {
      const relevant = entries.filter(
        (e): e is HomeWorkoutEntry =>
          e.type === "home" &&
          (e.exercises?.toLowerCase().includes(`${ex.id.toLowerCase()}:`) ||
            (e.name?.toLowerCase().includes(ex.name.toLowerCase()) ?? false)),
      );
      let best = 0;
      for (const w of relevant) {
        const v =
          ex.type === "time"
            ? (w.durationMinutes ?? 0) * 60
            : (w.totalReps ?? 0);
        if (v > best) best = v;
      }
      if (best > 0) {
        acc.push({
          id: ex.id,
          name: ex.name,
          icon: ex.icon,
          value: ex.type === "time" ? `${best}s` : `${best} reps`,
        });
      }
      return acc;
    }, []);
  }, [entries, t]);

  // 4. Données Calendrier
  const calendarData = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear(),
      mo = now.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const startDayOfWeek = (new Date(y, mo, 1).getDay() + 6) % 7;
    const monthStr = now.toISOString().slice(0, 7);
    const activeDays = new Set(
      sportEntries
        .filter((e) => e.date.startsWith(monthStr))
        .map((e) => parseInt(e.date.slice(8, 10), 10)),
    );
    return {
      daysInMonth,
      startDayOfWeek,
      activeDays,
      monthName: getMonthName(monthStr),
    };
  }, [sportEntries]);

  return {
    sportEntries,
    totals,
    personalRecords,
    calendarData,
    settings,
  };
};
