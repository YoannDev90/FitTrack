import { useMemo } from 'react';
import {
    entryTimestampMs,
    getEntryContributionValue,
    isEntryInsideChallengeWindow,
    isWorkoutEntry,
} from '../../../utils/socialChallenges';
import {
    computeChallengeProgressValue,
    type SocialChallengeProgress,
} from '../../../services/supabase/social';

interface ChallengeContributionItem {
    id: string;
    workoutLabel: string;
    dateLabel: string;
    valueLabel: string;
}

export function useSelectedChallengeContributions(
    entries: any[],
    selectedChallengeForDetails: SocialChallengeProgress | null,
    t: (key: string, options?: Record<string, unknown>) => string,
): ChallengeContributionItem[] {
    return useMemo<ChallengeContributionItem[]>(() => {
        if (!selectedChallengeForDetails) {
            return [];
        }

        const challenge = selectedChallengeForDetails.challenge;
        const goalType = challenge.goal_type;

        return entries
            .filter(isWorkoutEntry)
            .filter((entry) => isEntryInsideChallengeWindow(entry, challenge.starts_at, challenge.ends_at))
            .map((entry) => {
                const contributionValue = getEntryContributionValue(entry, goalType);
                if (contributionValue <= 0) return null;

                const workoutLabel = (() => {
                    if (entry.type === 'run') return t('socialHub.workoutTypes.run');
                    if (entry.type === 'beatsaber') return t('socialHub.workoutTypes.beatsaber');
                    if (entry.type === 'custom') return entry.name?.trim() || t('socialHub.workoutTypes.custom');
                    return entry.name?.trim() || t('socialHub.workoutTypes.home');
                })();

                const valueLabel = (() => {
                    if (goalType === 'workouts') return '+1';
                    if (goalType === 'distance') return `+${contributionValue.toFixed(1)} km`;
                    if (goalType === 'duration') return `+${Math.round(contributionValue)} min`;
                    return `+${Math.round(contributionValue)} XP`;
                })();

                return {
                    id: entry.id,
                    workoutLabel,
                    dateLabel: entry.date,
                    valueLabel,
                    sortKey: entryTimestampMs(entry),
                };
            })
            .filter((item): item is (ChallengeContributionItem & { sortKey: number }) => !!item)
            .sort((a, b) => b.sortKey - a.sortKey)
            .map(({ sortKey: _sortKey, ...item }) => item);
    }, [entries, selectedChallengeForDetails, t]);
}

export function mergeLocalChallengeProgress(
    challenges: SocialChallengeProgress[],
    entries: any[],
): SocialChallengeProgress[] {
    let hasChanges = false;

    const nextChallenges = challenges.map((item) => {
        const computedProgress = Math.max(
            0,
            Math.round(computeChallengeProgressValue(entries, item.challenge) * 100) / 100,
        );
        const remoteProgress = Number(item.my_progress || 0);

        if (Math.abs(computedProgress - remoteProgress) < 0.01) {
            return item;
        }

        hasChanges = true;
        return {
            ...item,
            my_progress: computedProgress,
        };
    });

    return hasChanges ? nextChallenges : challenges;
}

export function useFriendsLeaderboardRows(
    friendsLeaderboard: any[],
    friends: any[],
    profile: any,
): any[] {
    return useMemo(() => {
        const rows = friendsLeaderboard.length > 0
            ? friendsLeaderboard
            : [...friends].map(friend => ({
                ...friend,
            }));

        const byId = new Map<string, any>();
        rows.forEach(row => {
            byId.set(row.id, row);
        });

        const shouldIncludeSelf = !!profile && ((profile.weekly_xp || 0) > 0 || (profile.weekly_workouts || 0) > 0);
        if (shouldIncludeSelf && profile) {
            byId.set(profile.id, profile);
        }

        const withSelf = Array.from(byId.values());

        return withSelf
            .sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0))
            .slice(0, 5)
            .map((row, index) => ({
                ...row,
                rank: index + 1,
            }));
    }, [friendsLeaderboard, friends, profile]);
}

export function useFriendOptionsForChallenge(friends: any[]): any[] {
    return useMemo(() => {
        return friends.map(friend => ({
            id: friend.id,
            username: friend.username,
            display_name: friend.display_name,
        }));
    }, [friends]);
}

export function useGlobalLeaderboardRows(globalLeaderboard: any[]): any[] {
    return useMemo(() => {
        const rows = globalLeaderboard
            .filter((row) => ((row.weekly_xp || 0) > 0 || (row.weekly_workouts || 0) > 0))
            .slice(0, 20);
        return rows.map((row, index) => ({
            ...row,
            rank: row.rank || index + 1,
        }));
    }, [globalLeaderboard]);
}

export function useVisibleChallenges(
    activeChallenges: SocialChallengeProgress[],
    dismissedChallengeIds: Set<string>,
): SocialChallengeProgress[] {
    return useMemo(() =>
        activeChallenges.filter((item) => !dismissedChallengeIds.has(item.challenge.id)),
        [activeChallenges, dismissedChallengeIds],
    );
}
