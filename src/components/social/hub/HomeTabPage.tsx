import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { SocialChallengeProgress } from '../../../services/supabase/social';
import { Colors, FontSize, Spacing } from '../../../constants';
import { ActionCards } from './ActionCards';
import { ChallengeCarouselSection } from './ChallengeCarouselSection';
import { FeedSection } from './FeedSection';
import type { FeedViewItem } from './types';

interface HomeTabPageProps {
    refreshing: boolean;
    onRefresh: () => void;
    isHydrating: boolean;
    activeChallenges: SocialChallengeProgress[];
    challengeCardWidth: number;
    challengeIndex: number;
    setChallengeIndex: (index: number) => void;
    onAddSession: () => void;
    onViewChallengeDetails: (challenge: SocialChallengeProgress) => void;
    onDismissChallenge: (challengeId: string) => void;
    challengesError: string | null;
    feedItems: FeedViewItem[];
    isSendingLikeForId: string | null;
    isDeletingItemId: string | null;
    onSendLike: (item: FeedViewItem) => void;
    onDeleteFeedItem: (item: FeedViewItem) => void;
    feedError: string | null;
    onPressShareWorkout: () => void;
    onPressCreateChallenge: () => void;
    labels: {
        challenge: {
            sectionTitle: string;
            swipeHint: string;
            noParticipants: string;
            details: string;
            addSession: string;
            finishedLabel: string;
            winnerLabel: (name: string) => string;
            drawLabel: (count: number) => string;
            finishReasonLabel: (reason: 'active' | 'completed' | 'expired' | 'target_reached' | 'cancelled') => string;
            daysRemaining: (count: number) => string;
            goalLabel: (goalType: 'workouts' | 'distance' | 'duration' | 'xp') => string;
        };
        feed: {
            sectionTitle: string;
            emptyTitle: string;
            emptySubtitle: string;
            like: string;
            liked: string;
            sending: string;
            likedBy: (names: string, extra: number) => string;
            justNow: string;
            minutesAgo: (count: number) => string;
            hoursAgo: (count: number) => string;
            daysAgo: (count: number) => string;
        };
        cards: {
            shareTitle: string;
            shareSubtitle: string;
            challengeTitle: string;
            challengeSubtitle: string;
        };
        loading: string;
    };
}

export function HomeTabPage({
    refreshing,
    onRefresh,
    isHydrating,
    activeChallenges,
    challengeCardWidth,
    challengeIndex,
    setChallengeIndex,
    onAddSession,
    onViewChallengeDetails,
    onDismissChallenge,
    challengesError,
    feedItems,
    isSendingLikeForId,
    isDeletingItemId,
    onSendLike,
    onDeleteFeedItem,
    feedError,
    onPressShareWorkout,
    onPressCreateChallenge,
    labels,
}: HomeTabPageProps) {
    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cta} />}
        >
            {isHydrating && (
                <View style={styles.hubLoadingRow}>
                    <ActivityIndicator size="small" color={Colors.cta} />
                    <Text style={styles.hubLoadingText}>{labels.loading}</Text>
                </View>
            )}

            <View style={styles.section}>
                <ChallengeCarouselSection
                    activeChallenges={activeChallenges}
                    challengeCardWidth={challengeCardWidth}
                    challengeIndex={challengeIndex}
                    setChallengeIndex={setChallengeIndex}
                    onAddSession={onAddSession}
                    onViewDetails={onViewChallengeDetails}
                    onDismissChallenge={onDismissChallenge}
                    strings={labels.challenge}
                />
                {!!challengesError && <Text style={styles.errorText}>{challengesError}</Text>}
            </View>

            <View style={styles.section}>
                <FeedSection
                    items={feedItems}
                    isSendingLikeForId={isSendingLikeForId}
                    isDeletingItemId={isDeletingItemId}
                    onSendLike={onSendLike}
                    onDeleteItem={onDeleteFeedItem}
                    error={feedError}
                    labels={labels.feed}
                />
            </View>

            <View style={styles.section}>
                <ActionCards
                    onPressShareWorkout={onPressShareWorkout}
                    onPressCreateChallenge={onPressCreateChallenge}
                    labels={labels.cards}
                />
            </View>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 24,
    },
    section: {
        marginBottom: Spacing.md,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },
    hubLoadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginBottom: Spacing.sm,
    },
    hubLoadingText: {
        color: Colors.muted,
        fontSize: FontSize.xs,
    },
    bottomSpacer: {
        height: 96,
    },
});
