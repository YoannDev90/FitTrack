import type { Entry } from '../../../types';
import type { SocialFeedEventItem } from '../../../services/supabase/social';
import { isWorkoutEntry } from '../../../utils/socialChallenges';
import type { FeedViewItem, ShareableWorkoutItem } from './types';

interface TranslateOptions {
    [key: string]: unknown;
}

type TranslateFn = (key: string, options?: TranslateOptions) => string;
type WorkoutEntryType = 'home' | 'run' | 'beatsaber' | 'custom';

const DEFAULT_FEED_FLAGS = {
    isWorkoutShare: false,
    canLike: false,
    likedByMe: false,
    likeCount: 0,
    likedByPreview: [],
    canDelete: false,
} as const;

function toWorkoutType(rawType: unknown): WorkoutEntryType {
    const value = `${rawType || 'home'}`;
    return value === 'run' || value === 'beatsaber' || value === 'custom' ? value : 'home';
}

function toMetadataNumber(metadata: Record<string, unknown>, key: string): number {
    const value = Number(metadata[key] || 0);
    return Number.isFinite(value) ? value : 0;
}

function buildWorkoutStats(metadata: Record<string, unknown>, t: TranslateFn): string[] {
    const stats: string[] = [];
    const distanceKm = toMetadataNumber(metadata, 'distance_km');
    const durationMinutes = toMetadataNumber(metadata, 'duration_minutes');
    const totalReps = toMetadataNumber(metadata, 'total_reps');

    if (distanceKm > 0) {
        stats.push(t('socialHub.feed.stats.distance', { value: distanceKm.toFixed(1) }));
    }
    if (durationMinutes > 0) {
        stats.push(t('socialHub.feed.stats.duration', { value: Math.round(durationMinutes) }));
    }
    if (totalReps > 0) {
        stats.push(t('socialHub.feed.stats.reps', { value: Math.round(totalReps) }));
    }

    return stats;
}

function mapWorkoutFeedEvent(
    event: SocialFeedEventItem,
    currentUserId: string | undefined,
    t: TranslateFn
): FeedViewItem {
    const metadata = event.metadata || {};
    const isOwnWorkout = event.actor_id === currentUserId;
    const workoutType = toWorkoutType(metadata.entry_type);
    const workoutTypeLabel = t(`socialHub.workoutTypes.${workoutType}`);
    const stats = buildWorkoutStats(metadata, t);

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

function mapStandardFeedEvent(
    event: SocialFeedEventItem,
    title: string,
    detail: string
): FeedViewItem {
    return {
        id: event.id,
        actorId: event.actor_id,
        actorName: event.actor_name,
        title,
        detail,
        stats: [],
        createdAt: event.created_at,
        ...DEFAULT_FEED_FLAGS,
        eventId: event.id,
    };
}

function mapRunShareEntry(
    entry: Extract<Entry, { type: 'run' }>,
    t: TranslateFn,
    base: Pick<ShareableWorkoutItem, 'id' | 'entryId' | 'createdAt'>
): ShareableWorkoutItem {
    return {
        ...base,
        entryType: 'run',
        title: t('socialHub.workoutTypes.run'),
        summary: t('socialHub.shareWorkout.runSummary', {
            distance: entry.distanceKm.toFixed(1),
            duration: entry.durationMinutes,
        }),
        metadata: {
            distance_km: entry.distanceKm,
            duration_minutes: entry.durationMinutes,
        },
    };
}

function mapBeatSaberShareEntry(
    entry: Extract<Entry, { type: 'beatsaber' }>,
    t: TranslateFn,
    base: Pick<ShareableWorkoutItem, 'id' | 'entryId' | 'createdAt'>
): ShareableWorkoutItem {
    return {
        ...base,
        entryType: 'beatsaber',
        title: t('socialHub.workoutTypes.beatsaber'),
        summary: t('socialHub.shareWorkout.durationSummary', { duration: entry.durationMinutes || 0 }),
        metadata: {
            duration_minutes: entry.durationMinutes || 0,
        },
    };
}

function mapCustomShareEntry(
    entry: Extract<Entry, { type: 'custom' }>,
    t: TranslateFn,
    base: Pick<ShareableWorkoutItem, 'id' | 'entryId' | 'createdAt'>
): ShareableWorkoutItem {
    const resolvedTitle = entry.name?.trim() || t('socialHub.workoutTypes.custom');
    const summaryText = entry.distanceKm
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
        title: resolvedTitle,
        summary: summaryText,
        metadata: {
            duration_minutes: entry.durationMinutes || 0,
            distance_km: entry.distanceKm || 0,
            total_reps: entry.totalReps || 0,
        },
    };
}

function mapHomeShareEntry(
    entry: Extract<Entry, { type: 'home' }>,
    t: TranslateFn,
    base: Pick<ShareableWorkoutItem, 'id' | 'entryId' | 'createdAt'>
): ShareableWorkoutItem {
    const resolvedTitle = entry.name?.trim() || t('socialHub.workoutTypes.home');
    return {
        ...base,
        entryType: 'home',
        title: resolvedTitle,
        summary: t('socialHub.shareWorkout.homeSummary', {
            duration: entry.durationMinutes || 0,
            reps: entry.totalReps || 0,
        }),
        metadata: {
            duration_minutes: entry.durationMinutes || 0,
            total_reps: entry.totalReps || 0,
        },
    };
}

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

    switch (entry.type) {
        case 'run':
            return mapRunShareEntry(entry, t, base);
        case 'beatsaber':
            return mapBeatSaberShareEntry(entry, t, base);
        case 'custom':
            return mapCustomShareEntry(entry, t, base);
        case 'home':
        default:
            return mapHomeShareEntry(entry, t, base);
    }
}

export function mapFeedEvent(
    event: SocialFeedEventItem,
    currentUserId: string | undefined,
    t: TranslateFn
): FeedViewItem {
    switch (event.event_type) {
        case 'workout':
            return mapWorkoutFeedEvent(event, currentUserId, t);
        case 'challenge_progress': {
            const metadata = event.metadata || {};
            return mapStandardFeedEvent(
                event,
                t('socialHub.feed.challengeTitle', { name: event.actor_name }),
                `${metadata.challenge_title || t('socialHub.feed.challengeFallback')}`
            );
        }
        case 'streak':
            return mapStandardFeedEvent(
                event,
                t('socialHub.feed.streakTitle', { name: event.actor_name }),
                `${event.message}`
            );
        case 'encouragement':
        default:
            return mapStandardFeedEvent(
                event,
                t('socialHub.feed.encouragementTitle', { name: event.actor_name }),
                event.message
            );
    }
}
