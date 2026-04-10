import type { SocialChallengeFinishReason, SocialChallengeProgress } from '../../../services/supabase/social';

export type SocialTopTabId = 'home' | 'challenges' | 'friends' | 'leaderboard';

export interface FeedViewItem {
    id: string;
    actorId: string;
    actorName: string;
    title: string;
    detail: string;
    stats: string[];
    createdAt: string;
    isWorkoutShare: boolean;
    canLike: boolean;
    likedByMe: boolean;
    likeCount: number;
    likedByPreview: Array<{ id: string; name: string }>;
    canDelete: boolean;
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
    finishedLabel: string;
    winnerLabel: (name: string) => string;
    drawLabel: (count: number) => string;
    finishReasonLabel: (reason: SocialChallengeFinishReason) => string;
    daysRemaining: (count: number) => string;
    goalLabel: (goalType: 'workouts' | 'distance' | 'duration' | 'xp') => string;
}

export interface ChallengeSectionProps {
    activeChallenges: SocialChallengeProgress[];
    challengeCardWidth: number;
    challengeIndex: number;
    setChallengeIndex: (index: number) => void;
    onAddSession: () => void;
    onViewDetails: (challenge: SocialChallengeProgress) => void;
    onDismissChallenge: (challengeId: string) => void;
    strings: ChallengeSectionStrings;
}
