import type { Entry } from '../types';
import { isSportEntryType } from '../constants/values';
import { calculateXpForEntry } from '../stores/gamificationStore';

export type ChallengeGoalType = 'workouts' | 'distance' | 'duration' | 'xp';
export type WorkoutEntry = Extract<Entry, { type: 'home' | 'run' | 'beatsaber' | 'custom' }>;

export function isWorkoutEntry(entry: Entry): entry is WorkoutEntry {
    return entry.type === 'home' || entry.type === 'run' || entry.type === 'beatsaber' || entry.type === 'custom';
}

export function entryTimestampMs(entry: Entry): number {
    const createdAtMs = new Date(entry.createdAt).getTime();
    if (Number.isFinite(createdAtMs)) {
        return createdAtMs;
    }

    const fallbackMs = new Date(`${entry.date}T12:00:00.000Z`).getTime();
    return Number.isFinite(fallbackMs) ? fallbackMs : 0;
}

export function isEntryInsideChallengeWindow(entry: Entry, startsAt: string, endsAt: string): boolean {
    const challengeStartDate = startsAt.slice(0, 10);
    const challengeEndDate = endsAt.slice(0, 10);

    if (
        /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
        /^\d{4}-\d{2}-\d{2}$/.test(challengeStartDate) &&
        /^\d{4}-\d{2}-\d{2}$/.test(challengeEndDate)
    ) {
        return entry.date >= challengeStartDate && entry.date <= challengeEndDate;
    }

    const startsAtMs = new Date(startsAt).getTime();
    const endsAtMs = new Date(endsAt).getTime();
    if (!Number.isFinite(startsAtMs) || !Number.isFinite(endsAtMs)) {
        return false;
    }

    const timestamp = entryTimestampMs(entry);
    return timestamp >= startsAtMs && timestamp <= endsAtMs;
}

export function getEntryContributionValue(entry: WorkoutEntry, goalType: ChallengeGoalType): number {
    if (goalType === 'workouts') {
        return 1;
    }

    if (goalType === 'distance') {
        if (entry.type === 'run' || entry.type === 'custom') {
            return Number(entry.distanceKm || 0);
        }
        return 0;
    }

    if (goalType === 'duration') {
        return Number(entry.durationMinutes || 0);
    }

    return Math.round(calculateXpForEntry(entry));
}

export function computeChallengeProgressValueFromEntries(
    entries: Entry[],
    challenge: Pick<{ goal_type: ChallengeGoalType; starts_at: string; ends_at: string }, 'goal_type' | 'starts_at' | 'ends_at'>
): number {
    const relevantEntries = entries.filter((entry) => (
        isSportEntryType(entry.type) &&
        isEntryInsideChallengeWindow(entry, challenge.starts_at, challenge.ends_at)
    )) as WorkoutEntry[];

    return relevantEntries.reduce((sum, entry) => sum + getEntryContributionValue(entry, challenge.goal_type), 0);
}
