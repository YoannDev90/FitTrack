import type { Entry } from '../../../types';
import type { SocialFeedEventItem } from '../../../services/supabase/social';
import { isWorkoutEntry } from '../../../utils/socialChallenges';
import type { FeedViewItem, ShareableWorkoutItem } from './types';

interface TranslateOptions {
    [key: string]: unknown;
}

type TranslateFn = (key: string, options?: TranslateOptions) => string;

export function buildShareableWorkouts(entries: Entry[], t: TranslateFn): ShareableWorkoutItem[] {
    return entries
        .filter(isWorkoutEntry)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12)
        .map((entry) => formatSportEntry(entry, t));
}

export function formatSportEntry(
    entry: Extract<Entry, { type: 'home' | 'run' | 'beatsaber' | 'custom' }>,
    t: TranslateFn
): ShareableWorkoutItem {
    const base = {
        id: entry.id,
        entryId: entry.id,
        createdAt: entry.createdAt,
    };

    if (entry.type === 'run') {
        const title = t('socialHub.workoutTypes.run');
        const summary = t('socialHub.shareWorkout.runSummary', {
            distance: entry.distanceKm.toFixed(1),
            duration: entry.durationMinutes,
        });

        return {
            ...base,
            entryType: 'run',
            title,
            summary,
            metadata: {
                distance_km: entry.distanceKm,
                duration_minutes: entry.durationMinutes,
            },
        };
    }

    if (entry.type === 'beatsaber') {
        const title = t('socialHub.workoutTypes.beatsaber');
        const summary = t('socialHub.shareWorkout.durationSummary', { duration: entry.durationMinutes || 0 });

        return {
            ...base,
            entryType: 'beatsaber',
            title,
            summary,
            metadata: {
                duration_minutes: entry.durationMinutes || 0,
            },
        };
    }

    if (entry.type === 'custom') {
        const title = entry.name?.trim() || t('socialHub.workoutTypes.custom');
        const summary = entry.distanceKm
            ? t('socialHub.shareWorkout.runSummary', {
                distance: Number(entry.distanceKm).toFixed(1),
                duration: entry.durationMinutes || 0,
            })
            : t('socialHub.shareWorkout.customSummary', {
                duration: entry.durationMinutes || 0,
                reps: entry.totalReps || 0,
            });

        return {
            ...base,
            entryType: 'custom',
            title,
            summary,
            metadata: {
                duration_minutes: entry.durationMinutes || 0,
                distance_km: entry.distanceKm || 0,
                total_reps: entry.totalReps || 0,
            },
        };
    }

    const title = entry.name?.trim() || t('socialHub.workoutTypes.home');
    const summary = t('socialHub.shareWorkout.homeSummary', {
        duration: entry.durationMinutes || 0,
        reps: entry.totalReps || 0,
    });

    return {
        ...base,
        entryType: 'home',
        title,
        summary,
        metadata: {
            duration_minutes: entry.durationMinutes || 0,
            total_reps: entry.totalReps || 0,
        },
    };
}

export function mapFeedEvent(
    event: SocialFeedEventItem,
    currentUserId: string | undefined,
    t: TranslateFn
): FeedViewItem {
    const metadata = event.metadata || {};

    if (event.event_type === 'workout') {
        const isOwnWorkout = event.actor_id === currentUserId;
        const workoutType = `${metadata.entry_type || 'home'}` as 'home' | 'run' | 'beatsaber' | 'custom';
        const workoutTypeLabel = t(`socialHub.workoutTypes.${workoutType}`);
        const stats: string[] = [];

        const distanceKm = Number(metadata.distance_km || 0);
        const durationMinutes = Number(metadata.duration_minutes || 0);
        const totalReps = Number(metadata.total_reps || 0);
        if (distanceKm > 0) {
            stats.push(t('socialHub.feed.stats.distance', { value: distanceKm.toFixed(1) }));
        }
        if (durationMinutes > 0) {
            stats.push(t('socialHub.feed.stats.duration', { value: Math.round(durationMinutes) }));
        }
        if (totalReps > 0) {
            stats.push(t('socialHub.feed.stats.reps', { value: Math.round(totalReps) }));
        }

        return {
            id: event.id,
            actorId: event.actor_id,
            actorName: event.actor_name,
            title: t('socialHub.feed.workoutCompletedTitle', {
                name: event.actor_name,
                workout: workoutTypeLabel.toLowerCase(),
            }),
            detail: stats.length > 0 ? '' : `${metadata.summary || t('socialHub.feed.genericWorkoutDetail')}`,
            stats,
            createdAt: event.created_at,
            isWorkoutShare: true,
            canLike: !isOwnWorkout,
            likedByMe: event.liked_by_me,
            likeCount: event.reactions_count,
            likedByPreview: (event.liked_by_preview || []).map((liker) => ({
                id: liker.id,
                name: liker.display_name || liker.username,
            })),
            canDelete: isOwnWorkout,
            eventId: event.id,
        };
    }

    if (event.event_type === 'challenge_progress') {
        return {
            id: event.id,
            actorId: event.actor_id,
            actorName: event.actor_name,
            title: t('socialHub.feed.challengeTitle', { name: event.actor_name }),
            detail: `${metadata.challenge_title || t('socialHub.feed.challengeFallback')}`,
            stats: [],
            createdAt: event.created_at,
            isWorkoutShare: false,
            canLike: false,
            likedByMe: false,
            likeCount: 0,
            likedByPreview: [],
            canDelete: false,
            eventId: event.id,
        };
    }

    if (event.event_type === 'streak') {
        return {
            id: event.id,
            actorId: event.actor_id,
            actorName: event.actor_name,
            title: t('socialHub.feed.streakTitle', { name: event.actor_name }),
            detail: `${event.message}`,
            stats: [],
            createdAt: event.created_at,
            isWorkoutShare: false,
            canLike: false,
            likedByMe: false,
            likeCount: 0,
            likedByPreview: [],
            canDelete: false,
            eventId: event.id,
        };
    }

    return {
        id: event.id,
        actorId: event.actor_id,
        actorName: event.actor_name,
        title: t('socialHub.feed.encouragementTitle', { name: event.actor_name }),
        detail: event.message,
        stats: [],
        createdAt: event.created_at,
        isWorkoutShare: false,
        canLike: false,
        likedByMe: false,
        likeCount: 0,
        likedByPreview: [],
        canDelete: false,
        eventId: event.id,
    };
}
