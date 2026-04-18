import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { type SocialChallengeProgress } from '../../../services/supabase/social';
import { styles } from '../SocialHubScreen.styles';
import { ChallengesTabPage } from './ChallengesTabPage';
import { FriendsTabPage } from './FriendsTabPage';
import { HomeTabPage } from './HomeTabPage';
import { LeaderboardTabPage } from './LeaderboardTabPage';
import type { FeedViewItem, SocialTopTabId } from './types';

interface SocialHubTabsContentProps {
    activeTopTab: SocialTopTabId;
    refreshing: boolean;
    onRefresh: () => void | Promise<void>;
    isHydratingHub: boolean;
    visibleChallenges: SocialChallengeProgress[];
    challengeCardWidth: number;
    challengeIndex: number;
    setChallengeIndex: (index: number) => void;
    onViewChallengeDetails: (challenge: SocialChallengeProgress) => void;
    onDismissChallenge: (challengeId: string) => void;
    challengesError: string | null;
    feedItems: FeedViewItem[];
    isSendingLikeForId: string | null;
    isDeletingFeedItemId: string | null;
    onSendLike: (item: FeedViewItem) => void | Promise<void>;
    onDeleteFeedItem: (item: FeedViewItem) => void;
    feedError: string | null;
    onPressShareWorkout: () => void;
    onPressCreateChallenge: () => void;
    homeTabLabels: any;
    activeChallenges: SocialChallengeProgress[];
    profileId?: string;
    isDeletingChallengeId: string | null;
    onDeleteChallenge: (challenge: SocialChallengeProgress) => void;
    challengesTabLabels: any;
    friends: any[];
    pendingRequests: any[];
    onPressAddFriend: () => void;
    onInvite: () => void | Promise<void>;
    onRespondToRequest: (friendshipId: string, accept: boolean) => void | Promise<void>;
    onRemoveFriend: (friendshipId: string, friendName: string) => void | Promise<void>;
    friendsTabLabels: any;
    isGlobalLeaderboardActive: boolean;
    onShowFriendsLeaderboard: () => void;
    onShowGlobalLeaderboard: () => void | Promise<void>;
    globalLeaderboardRows: any[];
    friendsLeaderboardRows: any[];
    isLoadingGlobalLeaderboard: boolean;
    leaderboardError: string | null;
    leaderboardTabLabels: any;
}

export function SocialHubTabsContent({
    activeTopTab,
    refreshing,
    onRefresh,
    isHydratingHub,
    visibleChallenges,
    challengeCardWidth,
    challengeIndex,
    setChallengeIndex,
    onViewChallengeDetails,
    onDismissChallenge,
    challengesError,
    feedItems,
    isSendingLikeForId,
    isDeletingFeedItemId,
    onSendLike,
    onDeleteFeedItem,
    feedError,
    onPressShareWorkout,
    onPressCreateChallenge,
    homeTabLabels,
    activeChallenges,
    profileId,
    isDeletingChallengeId,
    onDeleteChallenge,
    challengesTabLabels,
    friends,
    pendingRequests,
    onPressAddFriend,
    onInvite,
    onRespondToRequest,
    onRemoveFriend,
    friendsTabLabels,
    isGlobalLeaderboardActive,
    onShowFriendsLeaderboard,
    onShowGlobalLeaderboard,
    globalLeaderboardRows,
    friendsLeaderboardRows,
    isLoadingGlobalLeaderboard,
    leaderboardError,
    leaderboardTabLabels,
}: SocialHubTabsContentProps) {
    return (
        <View style={styles.pageContent}>
            {activeTopTab === 'home' && (
                <HomeTabPage
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    isHydrating={isHydratingHub}
                    activeChallenges={visibleChallenges}
                    challengeCardWidth={challengeCardWidth}
                    challengeIndex={challengeIndex}
                    setChallengeIndex={setChallengeIndex}
                    onAddSession={() => router.push('/workout' as never)}
                    onViewChallengeDetails={onViewChallengeDetails}
                    onDismissChallenge={onDismissChallenge}
                    challengesError={challengesError}
                    feedItems={feedItems}
                    isSendingLikeForId={isSendingLikeForId}
                    isDeletingItemId={isDeletingFeedItemId}
                    onSendLike={onSendLike}
                    onDeleteFeedItem={onDeleteFeedItem}
                    feedError={feedError}
                    onPressShareWorkout={onPressShareWorkout}
                    onPressCreateChallenge={onPressCreateChallenge}
                    labels={homeTabLabels}
                />
            )}

            {activeTopTab === 'challenges' && (
                <ChallengesTabPage
                    challenges={activeChallenges}
                    error={challengesError}
                    profileId={profileId}
                    deletingChallengeId={isDeletingChallengeId}
                    onPressCreateChallenge={onPressCreateChallenge}
                    onPressAddSession={() => router.push('/workout' as never)}
                    onPressDetails={onViewChallengeDetails}
                    onDeleteChallenge={onDeleteChallenge}
                    labels={challengesTabLabels}
                />
            )}

            {activeTopTab === 'friends' && (
                <FriendsTabPage
                    friends={friends}
                    pendingRequests={pendingRequests}
                    profileId={profileId}
                    onPressAddFriend={onPressAddFriend}
                    onInvite={onInvite}
                    onRespondToRequest={onRespondToRequest}
                    onRemoveFriend={onRemoveFriend}
                    labels={friendsTabLabels}
                />
            )}

            {activeTopTab === 'leaderboard' && (
                <LeaderboardTabPage
                    isGlobal={isGlobalLeaderboardActive}
                    onShowFriends={onShowFriendsLeaderboard}
                    onShowGlobal={onShowGlobalLeaderboard}
                    rows={isGlobalLeaderboardActive ? globalLeaderboardRows : friendsLeaderboardRows}
                    loadingGlobal={isLoadingGlobalLeaderboard}
                    error={leaderboardError}
                    profileId={profileId}
                    labels={leaderboardTabLabels}
                />
            )}
        </View>
    );
}
