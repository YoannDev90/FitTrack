import type { SocialChallengeProgress } from '../../../services/supabase/social';

export type SocialTopTabId = 'home' | 'challenges' | 'friends' | 'leaderboard';

export interface FeedViewItem {
    id: string;
    actorId: string;
    actorName: string;
    title: string;
    detail: string;
    createdAt: string;
    isWorkoutShare: boolean;
    eventId?: string;
}

export interface SearchResult {
    id: string;
    username: string;
    display_name: string | null;
    level: number;
    friendship_status: 'pending' | 'accepted' | 'rejected' | 'blocked' | null;
}

export interface ShareableWorkoutItem {
    id: string;
    entryId: string;
    entryType: 'home' | 'run' | 'beatsaber' | 'custom';
    title: string;
    summary: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}

export interface ChallengeSectionStrings {
    sectionTitle: string;
    swipeHint: string;
    noParticipants: string;
    details: string;
    addSession: string;
    daysRemaining: (count: number) => string;
    goalLabel: (goalType: 'workouts' | 'distance' | 'duration' | 'xp') => string;
}

export interface ChallengeSectionProps {
    activeChallenges: SocialChallengeProgress[];
    challengeCardWidth: number;
    challengeIndex: number;
    setChallengeIndex: (index: number) => void;
    onAddSession: () => void;
    strings: ChallengeSectionStrings;
}
