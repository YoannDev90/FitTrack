import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Linking,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Bell, Sparkles, UserCircle2, Users } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BuildConfig } from '../../config';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { CustomAlertModal } from '../ui';
import type { AlertButton, AlertType } from '../ui';
import { useAppStore, useSocialStore } from '../../stores';
import { isSocialAvailable } from '../../services/supabase';
import {
    entryTimestampMs,
    getEntryContributionValue,
    isEntryInsideChallengeWindow,
    isWorkoutEntry,
} from '../../utils/socialChallenges';
import {
    createSocialChallenge,
    deleteSocialChallenge,
    deleteMySharedWorkoutEvent,
    computeChallengeProgressValue,
    getActiveSocialChallenges,
    getSocialFeed,
    leaveSocialChallenge,
    shareWorkoutToFeed,
    toggleSocialFeedReaction,
    type SocialChallengeGoalType,
    type SocialChallengeProgress,
} from '../../services/supabase/social';
import { ChallengesTabPage } from './hub/ChallengesTabPage';
import { ChallengeDetailsSheet } from './hub/ChallengeDetailsSheet';
import { CreateChallengeSheet } from './hub/CreateChallengeSheet';
import { AddFriendSheet } from './hub/AddFriendSheet';
import { FriendsTabPage } from './hub/FriendsTabPage';
import { HomeTabPage } from './hub/HomeTabPage';
import { LeaderboardTabPage } from './hub/LeaderboardTabPage';
import { ShareWorkoutSheet } from './hub/ShareWorkoutSheet';
import { TopTabs } from './hub/TopTabs';
import type { FeedViewItem, SearchResult, ShareableWorkoutItem, SocialTopTabId } from './hub/types';
import { buildShareableWorkouts, mapFeedEvent } from './hub/socialHubMappers';

interface HubDialogState {
    visible: boolean;
    title: string;
    message: string;
    type: AlertType;
    buttons?: AlertButton[];
    showCloseButton?: boolean;
}

const HOME_HYDRATION_CACHE_TTL_MS = 45 * 1000;
let homeChallengesCache: SocialChallengeProgress[] = [];
let homeFeedCache: FeedViewItem[] = [];
let homeHydrationCacheAt = 0;
let homeCacheProfileId: string | null = null;

function invalidateHomeHydrationCache(): void {
    homeChallengesCache = [];
    homeFeedCache = [];
    homeHydrationCacheAt = 0;
}

function invalidateHomeFeedCache(): void {
    homeFeedCache = [];
    homeHydrationCacheAt = 0;
}

function logSocialHubError(context: string, error: unknown): void {
    if (__DEV__) {
        console.warn(`[SocialHub] ${context}`, error);
    }
}

interface ChallengeContributionItem {
    id: string;
    workoutLabel: string;
    dateLabel: string;
    valueLabel: string;
}


export default function SocialHubScreen() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const challengeCardWidth = Math.max(260, width - Spacing.lg * 2);
    const latestReleaseUrl = `${BuildConfig.githubReleasesUrl}/latest`;

    const challengeSheetRef = useRef<TrueSheet>(null);
    const shareWorkoutSheetRef = useRef<TrueSheet>(null);
    const challengeDetailsSheetRef = useRef<TrueSheet>(null);
    const addFriendSheetRef = useRef<TrueSheet>(null);

    const [activeTopTab, setActiveTopTab] = useState<SocialTopTabId>('home');
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isHydratingHub, setIsHydratingHub] = useState(false);
    const [isHydratingFriendsTab, setIsHydratingFriendsTab] = useState(false);
    const [isHydratingLeaderboardTab, setIsHydratingLeaderboardTab] = useState(false);
    const [isGlobalLeaderboardActive, setIsGlobalLeaderboardActive] = useState(false);
    const [isLoadingGlobalLeaderboard, setIsLoadingGlobalLeaderboard] = useState(false);
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [dismissedChallengeIds, setDismissedChallengeIds] = useState<Set<string>>(new Set());
    const [isSendingLikeForId, setIsSendingLikeForId] = useState<string | null>(null);
    const [isSharingWorkoutId, setIsSharingWorkoutId] = useState<string | null>(null);
    const [selectedChallengeForDetails, setSelectedChallengeForDetails] = useState<SocialChallengeProgress | null>(null);

    const [activeChallenges, setActiveChallenges] = useState<SocialChallengeProgress[]>(() => (
        profile?.id && homeCacheProfileId === profile.id ? homeChallengesCache : []
    ));
    const [challengesError, setChallengesError] = useState<string | null>(null);
    const [feedItems, setFeedItems] = useState<FeedViewItem[]>(() => (
        profile?.id && homeCacheProfileId === profile.id ? homeFeedCache : []
    ));
    const [feedError, setFeedError] = useState<string | null>(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const searchRequestRef = useRef(0);

    const [challengeTitle, setChallengeTitle] = useState('');
    const [challengeGoalType, setChallengeGoalType] = useState<SocialChallengeGoalType>('workouts');
    const [challengeGoalTarget, setChallengeGoalTarget] = useState('10');
    const [challengeDurationDays, setChallengeDurationDays] = useState('7');
    const [selectedFriendIdsForChallenge, setSelectedFriendIdsForChallenge] = useState<string[]>([]);
    const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);
    const [isDeletingChallengeId, setIsDeletingChallengeId] = useState<string | null>(null);
    const [isDeletingFeedItemId, setIsDeletingFeedItemId] = useState<string | null>(null);
    const [dialogState, setDialogState] = useState<HubDialogState>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        buttons: [{ text: t('common.ok') }],
        showCloseButton: true,
    });
    const [fossModalVisible, setFossModalVisible] = useState(BuildConfig.isFoss);

    const { entries } = useAppStore();
    const {
        isAuthenticated,
        socialEnabled,
        profile,
        friends,
        pendingRequests,
        globalLeaderboard,
        globalLeaderboardError,
        friendsLeaderboard,
        friendsLeaderboardError,
        checkAuth,
        fetchFriends,
        fetchPendingRequests,
        respondToRequest,
        removeFriend,
        fetchGlobalLeaderboard,
        fetchFriendsLeaderboard,
        sendFriendRequest,
        searchUsers,
    } = useSocialStore();

    const hasLoadedFriendsTabRef = useRef(false);
    const hasLoadedLeaderboardTabRef = useRef(false);

    const closeDialog = useCallback(() => {
        setDialogState(prev => ({ ...prev, visible: false }));
    }, []);

    const openDialog = useCallback((options: Omit<HubDialogState, 'visible'>) => {
        setDialogState({
            visible: true,
            ...options,
        });
    }, []);

    const showSuccessDialog = useCallback((message: string) => {
        openDialog({
            title: t('common.success'),
            message,
            type: 'success',
            buttons: [{ text: t('common.ok') }],
            showCloseButton: true,
        });
    }, [openDialog, t]);

    const showErrorDialog = useCallback((message: string) => {
        openDialog({
            title: t('common.error'),
            message,
            type: 'error',
            buttons: [{ text: t('common.ok') }],
            showCloseButton: true,
        });
    }, [openDialog, t]);

    const showWarningDialog = useCallback((message: string) => {
        openDialog({
            title: t('common.warning'),
            message,
            type: 'warning',
            buttons: [{ text: t('common.ok') }],
            showCloseButton: true,
        });
    }, [openDialog, t]);

    const showConfirmDialog = useCallback((
        title: string,
        message: string,
        confirmLabel: string,
        onConfirm: () => Promise<void> | void
    ) => {
        openDialog({
            title,
            message,
            type: 'warning',
            showCloseButton: false,
            buttons: [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: confirmLabel,
                    style: 'destructive',
                    onPress: () => {
                        void onConfirm();
                    },
                },
            ],
        });
    }, [openDialog, t]);

    const openLatestRelease = useCallback(() => {
        void Linking.openURL(latestReleaseUrl);
    }, [latestReleaseUrl]);

    const shareableWorkouts = useMemo(() => {
        return buildShareableWorkouts(entries, t);
    }, [entries, t]);

    const selectedChallengeContributions = useMemo<ChallengeContributionItem[]>(() => {
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

    const mergeLocalChallengeProgress = useCallback((challenges: SocialChallengeProgress[]) => {
        let hasChanges = false;

        const nextChallenges = challenges.map((item) => {
            const computedProgress = Math.max(
                0,
                Math.round(computeChallengeProgressValue(entries, item.challenge) * 100) / 100
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
    }, [entries]);

    useEffect(() => {
        if (activeChallenges.length === 0) return;

        const nextChallenges = mergeLocalChallengeProgress(activeChallenges);
        if (nextChallenges !== activeChallenges) {
            setActiveChallenges(nextChallenges);
            homeChallengesCache = nextChallenges;
        }
    }, [activeChallenges, mergeLocalChallengeProgress]);

    useEffect(() => {
        if (!selectedChallengeForDetails) return;

        const nextChallenge = activeChallenges.find((item) => item.challenge.id === selectedChallengeForDetails.challenge.id);
        if (!nextChallenge) {
            setSelectedChallengeForDetails(null);
            return;
        }

        if (nextChallenge !== selectedChallengeForDetails) {
            setSelectedChallengeForDetails(nextChallenge);
        }
    }, [activeChallenges, selectedChallengeForDetails]);

    const friendsLeaderboardRows = useMemo(() => {
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

    const friendOptionsForChallenge = useMemo(() => {
        return friends.map(friend => ({
            id: friend.id,
            username: friend.username,
            display_name: friend.display_name,
        }));
    }, [friends]);

    const globalLeaderboardRows = useMemo(() => {
        const rows = globalLeaderboard
            .filter((row) => ((row.weekly_xp || 0) > 0 || (row.weekly_workouts || 0) > 0))
            .slice(0, 20);
        return rows.map((row, index) => ({
            ...row,
            rank: row.rank || index + 1,
        }));
    }, [globalLeaderboard]);

    const handleDismissChallenge = useCallback((challengeId: string) => {
        setDismissedChallengeIds((prev) => {
            const next = new Set(prev);
            next.add(challengeId);
            return next;
        });
    }, []);

    const visibleChallenges = useMemo(() =>
        activeChallenges.filter((item) => !dismissedChallengeIds.has(item.challenge.id)),
        [activeChallenges, dismissedChallengeIds]
    );

    const loadChallenges = useCallback(async () => {
        try {
            const challenges = await getActiveSocialChallenges();
            const mergedChallenges = mergeLocalChallengeProgress(challenges);
            setActiveChallenges(mergedChallenges);
            homeChallengesCache = mergedChallenges;
            setChallengeIndex(0);
            setChallengesError(null);
        } catch (error) {
            logSocialHubError('Failed to load active challenges', error);
            if (homeChallengesCache.length === 0) {
                setActiveChallenges([]);
            }
            setChallengesError(t('socialHub.errors.challengesLoad'));
        }
    }, [mergeLocalChallengeProgress, t]);

    const loadFeed = useCallback(async () => {
        try {
            const events = await getSocialFeed(10);
            const currentUserId = useSocialStore.getState().profile?.id;
            const mapped = events.map(event => mapFeedEvent(event, currentUserId, t));
            setFeedItems(mapped);
            homeFeedCache = mapped;
            setFeedError(null);
        } catch (error) {
            logSocialHubError('Failed to load social feed', error);
            if (homeFeedCache.length === 0) {
                setFeedItems([]);
            }
            setFeedError(t('socialHub.errors.feedLoad'));
        }
    }, [t]);

    const loadHomeData = useCallback(async (options?: { silent?: boolean }) => {
        const silent = options?.silent ?? false;
        if (!silent) {
            setIsHydratingHub(true);
        }

        try {
            const friendsTask = fetchFriends();
            const challengesTask = loadChallenges();
            const feedTask = loadFeed();
            await Promise.allSettled([friendsTask, challengesTask, feedTask]);
            homeCacheProfileId = profile?.id ?? null;
            homeHydrationCacheAt = Date.now();
        } finally {
            if (!silent) {
                setIsHydratingHub(false);
            }
        }
    }, [fetchFriends, loadChallenges, loadFeed, profile?.id]);

    const loadFriendsTabData = useCallback(async () => {
        setIsHydratingFriendsTab(true);
        try {
            const friendsTask = fetchFriends();
            const pendingTask = fetchPendingRequests();
            await Promise.allSettled([friendsTask, pendingTask]);
        } finally {
            setIsHydratingFriendsTab(false);
        }
    }, [fetchFriends, fetchPendingRequests]);

    const loadFriendsLeaderboardData = useCallback(async () => {
        setIsHydratingLeaderboardTab(true);
        try {
            await fetchFriendsLeaderboard();
        } finally {
            setIsHydratingLeaderboardTab(false);
        }
    }, [fetchFriendsLeaderboard]);

    const loadGlobalLeaderboardData = useCallback(async () => {
        setIsLoadingGlobalLeaderboard(true);
        try {
            await fetchGlobalLeaderboard();
        } finally {
            setIsLoadingGlobalLeaderboard(false);
        }
    }, [fetchGlobalLeaderboard]);

    useEffect(() => {
        let cancelled = false;

        const initialize = async () => {
            if (isAuthenticated && profile) {
                setIsInitialLoading(false);
                void checkAuth();
                return;
            }

            setIsInitialLoading(true);
            await checkAuth();

            if (!cancelled) {
                setIsInitialLoading(false);
            }
        };

        initialize();

        return () => {
            cancelled = true;
        };
    }, [checkAuth, isAuthenticated, profile]);

    useEffect(() => {
        const profileId = profile?.id ?? null;

        if (homeCacheProfileId !== profileId) {
            homeCacheProfileId = profileId;
            homeChallengesCache = [];
            homeFeedCache = [];
            homeHydrationCacheAt = 0;
            setActiveChallenges([]);
            setFeedItems([]);
        }
    }, [profile?.id]);

    useEffect(() => {
        if (isInitialLoading) return;
        if (!isAuthenticated || !socialEnabled) return;

        const hasFreshCache =
            homeHydrationCacheAt > 0 &&
            Date.now() - homeHydrationCacheAt < HOME_HYDRATION_CACHE_TTL_MS;

        if (hasFreshCache) {
            void loadHomeData({ silent: true });
            return;
        }

        loadHomeData();
    }, [isInitialLoading, isAuthenticated, socialEnabled, loadHomeData]);

    useEffect(() => {
        if (!isAuthenticated || !socialEnabled) return;

        if (activeTopTab === 'friends' && !hasLoadedFriendsTabRef.current) {
            hasLoadedFriendsTabRef.current = true;
            loadFriendsTabData();
            return;
        }

        if (activeTopTab === 'leaderboard' && !hasLoadedLeaderboardTabRef.current) {
            hasLoadedLeaderboardTabRef.current = true;
            loadFriendsLeaderboardData();
        }
    }, [activeTopTab, isAuthenticated, socialEnabled, loadFriendsTabData, loadFriendsLeaderboardData]);

    useFocusEffect(
        useCallback(() => {
            if (!isAuthenticated || !socialEnabled) {
                return;
            }

            void loadHomeData({ silent: true });
        }, [isAuthenticated, socialEnabled, loadHomeData])
    );

    useEffect(() => {
        if (searchQuery.trim().length < 2) {
            searchRequestRef.current += 1;
            setSearchResults([]);
            setSearchError(null);
            setIsSearching(false);
            return;
        }

        const requestId = ++searchRequestRef.current;
        setIsSearching(true);
        setSearchError(null);

        const timeoutId = setTimeout(async () => {
            try {
                const results = await searchUsers(searchQuery.trim());
                if (requestId !== searchRequestRef.current) return;
                setSearchResults(results as SearchResult[]);
            } catch (error) {
                logSocialHubError('User search failed', error);
                if (requestId !== searchRequestRef.current) return;
                setSearchResults([]);
                setSearchError(t('socialHub.errors.searchUnavailable'));
            } finally {
                if (requestId === searchRequestRef.current) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchUsers, t]);

    const handlePressTopTab = useCallback((tab: SocialTopTabId) => {
        setActiveTopTab(tab);
        if (tab !== 'friends') {
            setSearchQuery('');
            setSearchResults([]);
            setSearchError(null);
        }
    }, []);

    const openAddFriendSheet = useCallback(() => {
        setSearchQuery('');
        setSearchResults([]);
        setSearchError(null);
        addFriendSheetRef.current?.present();
    }, []);

    const onRefresh = useCallback(async () => {
        if (!isAuthenticated || !socialEnabled) return;
        setRefreshing(true);
        try {
            if (activeTopTab === 'home') {
                await loadHomeData();
                return;
            }

            if (activeTopTab === 'challenges') {
                await loadChallenges();
                return;
            }

            if (activeTopTab === 'friends') {
                await loadFriendsTabData();
                return;
            }

            await loadFriendsLeaderboardData();
            if (isGlobalLeaderboardActive) {
                await loadGlobalLeaderboardData();
            }
        } finally {
            setRefreshing(false);
        }
    }, [
        isAuthenticated,
        socialEnabled,
        activeTopTab,
        loadHomeData,
        loadChallenges,
        loadFriendsTabData,
        loadFriendsLeaderboardData,
        isGlobalLeaderboardActive,
        loadGlobalLeaderboardData,
    ]);

    const handleSendRequest = useCallback(async (userId: string) => {
        try {
            await sendFriendRequest(userId);
            invalidateHomeHydrationCache();
            setSearchResults(prev => prev.map(result => (
                result.id === userId ? { ...result, friendship_status: 'pending' } : result
            )));
            showSuccessDialog(t('social.requestSent'));
        } catch (error) {
            logSocialHubError('Failed to send friend request', error);
            showErrorDialog(t('socialHub.errors.sendFriendRequest'));
        }
    }, [sendFriendRequest, showErrorDialog, showSuccessDialog, t]);

    const handleInviteFriend = useCallback(async () => {
        try {
            const username = profile?.username || 'spix';
            await Share.share({
                title: t('socialHub.invite.shareTitle'),
                message: t('socialHub.invite.shareMessage', { username }),
            });
        } catch (error) {
            logSocialHubError('Failed to share invite', error);
            showErrorDialog(t('socialHub.errors.shareInvite'));
        }
    }, [profile?.username, showErrorDialog, t]);

    const handleRespondToRequest = useCallback(async (friendshipId: string, accept: boolean) => {
        try {
            await respondToRequest(friendshipId, accept);
            invalidateHomeHydrationCache();
            await loadFriendsTabData();
        } catch (error) {
            logSocialHubError('Failed to respond to friend request', error);
            showErrorDialog(t('socialHub.errors.sendFriendRequest'));
        }
    }, [respondToRequest, loadFriendsTabData, showErrorDialog, t]);

    const handleRemoveFriend = useCallback(async (friendshipId: string, friendName: string) => {
        showConfirmDialog(
            t('social.removeFriendConfirmTitle'),
            t('social.removeFriendConfirmMessage'),
            t('common.delete'),
            async () => {
                try {
                    await removeFriend(friendshipId);
                    invalidateHomeHydrationCache();
                    await Promise.allSettled([loadFriendsTabData(), loadFriendsLeaderboardData()]);
                    showSuccessDialog(`${t('social.friendRemoved')} · ${friendName}`);
                } catch (error) {
                    logSocialHubError('Failed to remove friend', error);
                    showErrorDialog(t('socialHub.errors.sendFriendRequest'));
                }
            }
        );
    }, [
        removeFriend,
        loadFriendsTabData,
        loadFriendsLeaderboardData,
        showConfirmDialog,
        showSuccessDialog,
        showErrorDialog,
        t,
    ]);

    const handleShowFriendsLeaderboard = useCallback(() => {
        setIsGlobalLeaderboardActive(false);
    }, []);

    const handleShowGlobalLeaderboard = useCallback(async () => {
        setIsGlobalLeaderboardActive(true);
        if (globalLeaderboardRows.length === 0) {
            await loadGlobalLeaderboardData();
        }
    }, [globalLeaderboardRows.length, loadGlobalLeaderboardData]);

    const handleToggleFriendForChallenge = useCallback((friendId: string) => {
        setSelectedFriendIdsForChallenge((previous) => (
            previous.includes(friendId)
                ? previous.filter(id => id !== friendId)
                : [...previous, friendId]
        ));
    }, []);

    const openChallengeSheet = useCallback(async () => {
        if (friends.length === 0) {
            try {
                await fetchFriends();
            } catch (error) {
                // Keep opening the sheet even if preloading friends fails.
                if (__DEV__) {
                    console.warn('[SocialHub] Failed to preload friends before opening challenge sheet', error);
                }
            }
        }
        challengeSheetRef.current?.present();
    }, [fetchFriends, friends.length]);

    const openChallengeDetails = useCallback((challenge: SocialChallengeProgress) => {
        setSelectedChallengeForDetails(challenge);
        challengeDetailsSheetRef.current?.present();
    }, []);

    const handleSendLike = useCallback(async (item: FeedViewItem) => {
        if (!item.isWorkoutShare || !item.eventId || !item.canLike) return;

        setIsSendingLikeForId(item.id);
        try {
            await toggleSocialFeedReaction(item.eventId);
            invalidateHomeFeedCache();
            await loadFeed();
        } catch (error) {
            logSocialHubError('Failed to toggle workout like', error);
            showErrorDialog(t('socialHub.errors.sendLike'));
        } finally {
            setIsSendingLikeForId(null);
        }
    }, [loadFeed, showErrorDialog, t]);

    const handleDeleteSharedWorkout = useCallback((item: FeedViewItem) => {
        if (!item.canDelete || !item.eventId) return;

        showConfirmDialog(
            t('socialHub.feed.deleteConfirmTitle'),
            t('socialHub.feed.deleteConfirmMessage'),
            t('common.delete'),
            async () => {
                setIsDeletingFeedItemId(item.id);
                try {
                    await deleteMySharedWorkoutEvent(item.eventId as string);
                    invalidateHomeFeedCache();
                    await loadFeed();
                } catch (error) {
                    logSocialHubError('Failed to delete shared workout', error);
                    showErrorDialog(t('socialHub.feed.deleteError'));
                } finally {
                    setIsDeletingFeedItemId(null);
                }
            }
        );
    }, [loadFeed, showConfirmDialog, showErrorDialog, t]);

    const handleShareWorkout = useCallback(async (workout: ShareableWorkoutItem) => {
        setIsSharingWorkoutId(workout.id);
        try {
            await shareWorkoutToFeed({
                entryId: workout.entryId,
                entryType: workout.entryType,
                title: workout.title,
                summary: workout.summary,
                createdAtIso: workout.createdAt,
                metadata: workout.metadata,
            });
            invalidateHomeFeedCache();
            shareWorkoutSheetRef.current?.dismiss();
            await loadFeed();
            showSuccessDialog(t('socialHub.shareWorkout.sharedSuccess'));
        } catch (error) {
            logSocialHubError('Failed to share workout to feed', error);
            showErrorDialog(t('socialHub.errors.shareWorkout'));
        } finally {
            setIsSharingWorkoutId(null);
        }
    }, [loadFeed, showErrorDialog, showSuccessDialog, t]);

    const handleCreateChallenge = useCallback(async () => {
        const title = challengeTitle.trim();
        const target = Number(challengeGoalTarget);
        const durationDays = Number(challengeDurationDays);

        if (!title) {
            showWarningDialog(t('socialHub.challenge.validation.titleRequired'));
            return;
        }

        if (!Number.isFinite(target) || target <= 0) {
            showWarningDialog(t('socialHub.challenge.validation.targetInvalid'));
            return;
        }

        if (!Number.isFinite(durationDays) || durationDays <= 0 || durationDays > 90) {
            showWarningDialog(t('socialHub.challenge.validation.durationInvalid'));
            return;
        }

        if (selectedFriendIdsForChallenge.length === 0) {
            showWarningDialog(t('socialHub.challenge.validation.friendsRequired'));
            return;
        }

        setIsCreatingChallenge(true);
        try {
            await createSocialChallenge({
                title,
                goalType: challengeGoalType,
                goalTarget: target,
                durationDays,
                invitedFriendIds: selectedFriendIdsForChallenge,
            });
            invalidateHomeHydrationCache();
            challengeSheetRef.current?.dismiss();
            setChallengeTitle('');
            setChallengeGoalType('workouts');
            setChallengeGoalTarget('10');
            setChallengeDurationDays('7');
            setSelectedFriendIdsForChallenge([]);
            await Promise.all([loadChallenges(), loadFeed(), loadFriendsTabData()]);
            showSuccessDialog(t('socialHub.challenge.createSuccess'));
        } catch (error) {
            logSocialHubError('Failed to create social challenge', error);
            showErrorDialog(t('socialHub.errors.createChallenge'));
        } finally {
            setIsCreatingChallenge(false);
        }
    }, [
        challengeDurationDays,
        challengeGoalTarget,
        challengeGoalType,
        challengeTitle,
        selectedFriendIdsForChallenge,
        loadChallenges,
        loadFeed,
        loadFriendsTabData,
        showWarningDialog,
        showSuccessDialog,
        showErrorDialog,
        t,
    ]);

    const handleDeleteChallenge = useCallback((item: SocialChallengeProgress) => {
        const challengeId = item.challenge.id;
        const isOwner = item.challenge.creator_id === profile?.id;

        showConfirmDialog(
            isOwner
                ? t('socialHub.challenge.deleteConfirmTitle')
                : t('socialHub.challenge.leaveConfirmTitle'),
            isOwner
                ? t('socialHub.challenge.deleteConfirmMessage')
                : t('socialHub.challenge.leaveConfirmMessage'),
            isOwner ? t('socialHub.challenge.deleteAction') : t('socialHub.challenge.leaveAction'),
            async () => {
                setIsDeletingChallengeId(challengeId);
                try {
                    if (isOwner) {
                        await deleteSocialChallenge(challengeId);
                    } else {
                        await leaveSocialChallenge(challengeId);
                    }

                    invalidateHomeHydrationCache();
                    await Promise.all([loadChallenges(), loadFeed()]);
                    showSuccessDialog(
                        isOwner
                            ? t('socialHub.challenge.deleteSuccess')
                            : t('socialHub.challenge.leaveSuccess')
                    );
                } catch (error) {
                    logSocialHubError('Failed to delete/leave challenge', error);
                    showErrorDialog(
                        isOwner
                            ? t('socialHub.challenge.deleteError')
                            : t('socialHub.challenge.leaveError')
                    );
                } finally {
                    setIsDeletingChallengeId(null);
                }
            }
        );
    }, [loadChallenges, loadFeed, profile?.id, showConfirmDialog, showSuccessDialog, showErrorDialog, t]);

    if (BuildConfig.isFoss) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredState}>
                    <Users size={56} color={Colors.muted} />
                    <Text style={styles.stateTitle}>{t('social.fossTitle')}</Text>
                    <Text style={styles.stateSubtitle}>{t('social.fossInfo')}</Text>
                </View>

                <CustomAlertModal
                    visible={fossModalVisible}
                    title={t('social.fossTitle')}
                    message={t('social.fossInfo')}
                    type="warning"
                    buttons={[
                        { text: t('common.ok'), onPress: () => setFossModalVisible(false) },
                        { text: t('social.fossUpgrade'), onPress: openLatestRelease },
                    ]}
                    showCloseButton={true}
                    onClose={() => setFossModalVisible(false)}
                />
            </SafeAreaView>
        );
    }

    if (!isSocialAvailable()) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredState}>
                    <Users size={56} color={Colors.muted} />
                    <Text style={styles.stateTitle}>{t('social.notConfiguredTitle')}</Text>
                    <Text style={styles.stateSubtitle}>{t('social.notConfiguredSubtitle')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (isInitialLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredState}>
                    <Sparkles size={48} color={Colors.cta} />
                    <Text style={styles.stateTitle}>{t('common.loading')}</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!isAuthenticated) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredState}>
                    <Users size={56} color={Colors.muted} />
                    <Text style={styles.stateTitle}>{t('social.authTitle')}</Text>
                    <Text style={styles.stateSubtitle}>{t('social.authSubtitle')}</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/auth' as never)}>
                        <Text style={styles.primaryButtonText}>{t('profile.signIn')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!socialEnabled) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredState}>
                    <Users size={56} color={Colors.muted} />
                    <Text style={styles.stateTitle}>{t('social.disabledTitle')}</Text>
                    <Text style={styles.stateSubtitle}>{t('social.disabledSubtitle')}</Text>
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/settings/social' as never)}>
                        <Text style={styles.primaryButtonText}>{t('settings.social')}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <GestureHandlerRootView style={styles.container}>
            <LinearGradient
                colors={[Colors.overlayViolet12, Colors.transparent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.topGlow}
            />
            <LinearGradient
                colors={[Colors.overlayTeal10, Colors.transparent]}
                start={{ x: 1, y: 0 }}
                end={{ x: 0, y: 1 }}
                style={styles.bottomGlow}
            />

            <SafeAreaView style={styles.container} edges={['top']}>
                <Animated.View entering={FadeIn.delay(100)} style={styles.topbarWrap}>
                    <View style={styles.topbar}>
                        <View style={styles.titleBlock}>
                            <View style={styles.eyebrowPill}>
                                <Sparkles size={12} color={Colors.cta} />
                                <Text style={styles.eyebrowText}>{t('tabs.social')}</Text>
                            </View>
                            <Text style={styles.screenTitle}>{t('social.title')}</Text>
                            <Text style={styles.screenSubtitle}>{t('socialHub.feed.sectionTitle')}</Text>
                        </View>

                        <View style={styles.topbarActions}>
                            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/settings/notifications' as never)}>
                                <Bell size={18} color={Colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/profile' as never)}>
                                <UserCircle2 size={18} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <TopTabs
                        activeTab={activeTopTab}
                        onPressTab={handlePressTopTab}
                        labels={{
                            home: t('socialHub.topTabs.home'),
                            challenges: t('socialHub.topTabs.challenges'),
                            friends: t('socialHub.topTabs.friends'),
                            leaderboard: t('socialHub.topTabs.leaderboard'),
                        }}
                    />
                </Animated.View>

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
                            onViewChallengeDetails={openChallengeDetails}
                            onDismissChallenge={handleDismissChallenge}
                            challengesError={challengesError}
                            feedItems={feedItems}
                            isSendingLikeForId={isSendingLikeForId}
                            isDeletingItemId={isDeletingFeedItemId}
                            onSendLike={handleSendLike}
                            onDeleteFeedItem={handleDeleteSharedWorkout}
                            feedError={feedError}
                            onPressShareWorkout={() => shareWorkoutSheetRef.current?.present()}
                            onPressCreateChallenge={openChallengeSheet}
                            labels={{
                                challenge: {
                                    sectionTitle: t('socialHub.challenge.sectionTitle'),
                                    swipeHint: t('socialHub.challenge.swipeHint'),
                                    noParticipants: t('socialHub.challenge.noParticipants'),
                                    details: t('socialHub.challenge.details'),
                                    addSession: t('socialHub.challenge.addSession'),
                                    finishedLabel: t('socialHub.challenge.finishedLabel'),
                                    winnerLabel: (name) => t('socialHub.challenge.winnerLabel', { name }),
                                    drawLabel: (count) => t('socialHub.challenge.drawLabel', { count }),
                                    finishReasonLabel: (reason) => t(`socialHub.challenge.finishReasons.${reason}`),
                                    daysRemaining: (count) => t('socialHub.challenge.daysRemaining', { count }),
                                    goalLabel: (goalType) => t(`socialHub.challenge.goalTypes.${goalType}`),
                                },
                                feed: {
                                    sectionTitle: t('socialHub.feed.sectionTitle'),
                                    emptyTitle: t('socialHub.feed.emptyTitle'),
                                    emptySubtitle: t('socialHub.feed.emptySubtitle'),
                                    like: t('socialHub.feed.likeAction'),
                                    liked: t('socialHub.feed.likedAction'),
                                    sending: t('socialHub.feed.likeSending'),
                                    likedBy: (names, extra) => t('socialHub.feed.likedBy', {
                                        names,
                                        extra: extra > 0 ? ` +${extra}` : '',
                                    }),
                                    justNow: t('socialHub.feed.time.justNow'),
                                    minutesAgo: (count) => t('socialHub.feed.time.minutesAgo', { count }),
                                    hoursAgo: (count) => t('socialHub.feed.time.hoursAgo', { count }),
                                    daysAgo: (count) => t('socialHub.feed.time.daysAgo', { count }),
                                },
                                cards: {
                                    shareTitle: t('socialHub.cards.shareTitle'),
                                    shareSubtitle: t('socialHub.cards.shareSubtitle'),
                                    challengeTitle: t('socialHub.cards.challengeTitle'),
                                    challengeSubtitle: t('socialHub.cards.challengeSubtitle'),
                                },
                                loading: t('common.loading'),
                            }}
                        />
                    )}

                    {activeTopTab === 'challenges' && (
                        <ChallengesTabPage
                            challenges={activeChallenges}
                            error={challengesError}
                            profileId={profile?.id}
                            deletingChallengeId={isDeletingChallengeId}
                            onPressCreateChallenge={openChallengeSheet}
                            onPressAddSession={() => router.push('/workout' as never)}
                            onPressDetails={openChallengeDetails}
                            onDeleteChallenge={handleDeleteChallenge}
                            labels={{
                                pageTitle: t('socialHub.pages.challenges.title'),
                                pageSubtitle: t('socialHub.pages.challenges.subtitle'),
                                createChallenge: t('socialHub.pages.challenges.create'),
                                noChallengesTitle: t('socialHub.pages.challenges.emptyTitle'),
                                noChallengesSubtitle: t('socialHub.pages.challenges.emptySubtitle'),
                                participantsLabel: t('socialHub.pages.challenges.participantsLabel'),
                                progressLabel: t('socialHub.pages.challenges.progressLabel'),
                                detailsLabel: t('socialHub.challenge.details'),
                                addSession: t('socialHub.challenge.addSession'),
                                finishedLabel: t('socialHub.challenge.finishedLabel'),
                                winnerLabel: (name) => t('socialHub.challenge.winnerLabel', { name }),
                                drawLabel: (count) => t('socialHub.challenge.drawLabel', { count }),
                                finishReasonLabel: (reason) => t(`socialHub.challenge.finishReasons.${reason}`),
                                rankLabel: (rank) => t('socialHub.challenge.rankLabel', { rank }),
                                pastChallengesTitle: (count) => t('socialHub.pages.challenges.pastTitle', { count }),
                                showPastChallenges: t('socialHub.pages.challenges.showPast'),
                                hidePastChallenges: t('socialHub.pages.challenges.hidePast'),
                                deleteChallenge: t('socialHub.challenge.deleteAction'),
                                leaveChallenge: t('socialHub.challenge.leaveAction'),
                                deletingChallenge: t('socialHub.challenge.deletingAction'),
                                daysRemaining: (count) => t('socialHub.challenge.daysRemaining', { count }),
                                goalLabel: (goalType) => t(`socialHub.challenge.goalTypes.${goalType}`),
                            }}
                        />
                    )}

                    {activeTopTab === 'friends' && (
                        <FriendsTabPage
                            friends={friends}
                            pendingRequests={pendingRequests}
                            profileId={profile?.id}
                            onPressAddFriend={openAddFriendSheet}
                            onInvite={handleInviteFriend}
                            onRespondToRequest={handleRespondToRequest}
                            onRemoveFriend={handleRemoveFriend}
                            labels={{
                                pageTitle: t('socialHub.pages.friends.title'),
                                pageSubtitle: isHydratingFriendsTab ? t('common.loading') : t('socialHub.pages.friends.subtitle'),
                                addFriend: t('socialHub.friends.addFriend'),
                                invite: t('socialHub.friends.invite'),
                                searchPlaceholder: t('socialHub.friends.searchPlaceholder'),
                                pendingTitle: (count) => t('social.pendingRequestsTitle', { count }),
                                myFriendsTitle: (count) => t('social.myFriends', { count }),
                                accept: t('common.confirm'),
                                decline: t('common.cancel'),
                                remove: t('common.delete'),
                                noFriendsTitle: t('socialHub.friends.emptyTitle'),
                                noFriendsSubtitle: t('socialHub.friends.emptySubtitle'),
                                noRequests: t('socialHub.pages.friends.noRequests'),
                                badgeFriend: t('socialHub.friends.badgeFriend'),
                                badgePending: t('socialHub.friends.badgePending'),
                                addAction: t('socialHub.friends.addAction'),
                                meBadge: t('socialHub.friends.meBadge'),
                                workoutsWeek: (count) => t('socialHub.friends.workoutsWeek', { count }),
                                xpSuffix: t('socialHub.friends.xpSuffix'),
                            }}
                        />
                    )}

                    {activeTopTab === 'leaderboard' && (
                        <LeaderboardTabPage
                            isGlobal={isGlobalLeaderboardActive}
                            onShowFriends={handleShowFriendsLeaderboard}
                            onShowGlobal={handleShowGlobalLeaderboard}
                            rows={isGlobalLeaderboardActive ? globalLeaderboardRows : friendsLeaderboardRows}
                            loadingGlobal={isLoadingGlobalLeaderboard}
                            error={isGlobalLeaderboardActive
                                ? (globalLeaderboardError ? t(`social.errorLeaderboard${globalLeaderboardError === 'network' ? 'Network' : 'Server'}`) : null)
                                : (friendsLeaderboardError ? t(`social.errorLeaderboard${friendsLeaderboardError === 'network' ? 'Network' : 'Server'}`) : null)}
                            profileId={profile?.id}
                            labels={{
                                pageTitle: t('socialHub.pages.leaderboard.title'),
                                pageSubtitle: isHydratingLeaderboardTab ? t('common.loading') : t('socialHub.pages.leaderboard.subtitle'),
                                friendsTab: t('social.friends'),
                                globalTab: t('social.global'),
                                loadingGlobal: t('socialHub.pages.leaderboard.loadingGlobal'),
                                emptyFriends: t('social.emptyLeaderboardFriends'),
                                emptyGlobal: t('social.emptyLeaderboardGlobal'),
                                workoutsWeek: (count) => t('socialHub.friends.workoutsWeek', { count }),
                                meBadge: t('socialHub.friends.meBadge'),
                                xpSuffix: t('socialHub.friends.xpSuffix'),
                            }}
                        />
                    )}
                </View>

                <CreateChallengeSheet
                    sheetRef={challengeSheetRef}
                    title={challengeTitle}
                    onChangeTitle={setChallengeTitle}
                    goalType={challengeGoalType}
                    onChangeGoalType={setChallengeGoalType}
                    goalTarget={challengeGoalTarget}
                    onChangeGoalTarget={setChallengeGoalTarget}
                    durationDays={challengeDurationDays}
                    onChangeDurationDays={setChallengeDurationDays}
                    friendOptions={friendOptionsForChallenge}
                    selectedFriendIds={selectedFriendIdsForChallenge}
                    onToggleFriendId={handleToggleFriendForChallenge}
                    isCreating={isCreatingChallenge}
                    onCreate={handleCreateChallenge}
                    labels={{
                        title: t('socialHub.challenge.sheet.title'),
                        subtitle: t('socialHub.challenge.sheet.subtitle'),
                        placeholderTitle: t('socialHub.challenge.sheet.placeholderTitle'),
                        placeholderTarget: t('socialHub.challenge.sheet.placeholderTarget'),
                        placeholderDuration: t('socialHub.challenge.sheet.placeholderDuration'),
                        cancel: t('common.cancel'),
                        create: t('socialHub.challenge.sheet.create'),
                        creating: t('socialHub.challenge.sheet.creating'),
                        workouts: t('socialHub.challenge.goalTypes.workouts'),
                        distance: t('socialHub.challenge.goalTypes.distance'),
                        duration: t('socialHub.challenge.goalTypes.duration'),
                        xp: t('socialHub.challenge.goalTypes.xp'),
                        friendsTitle: t('socialHub.challenge.sheet.friendsTitle'),
                        noFriends: t('socialHub.challenge.sheet.noFriends'),
                    }}
                />

                <ShareWorkoutSheet
                    sheetRef={shareWorkoutSheetRef}
                    workouts={shareableWorkouts}
                    isSharingWorkoutId={isSharingWorkoutId}
                    onShareWorkout={handleShareWorkout}
                    labels={{
                        title: t('socialHub.shareWorkout.sheetTitle'),
                        subtitle: t('socialHub.shareWorkout.sheetSubtitle'),
                        emptyTitle: t('socialHub.shareWorkout.emptyTitle'),
                        emptySubtitle: t('socialHub.shareWorkout.emptySubtitle'),
                        shareAction: t('socialHub.shareWorkout.shareAction'),
                        sharingAction: t('socialHub.shareWorkout.sharingAction'),
                    }}
                />

                <AddFriendSheet
                    sheetRef={addFriendSheetRef}
                    searchQuery={searchQuery}
                    onChangeSearchQuery={setSearchQuery}
                    isSearching={isSearching}
                    searchError={searchError}
                    searchResults={searchResults}
                    onSendRequest={handleSendRequest}
                    labels={{
                        title: t('socialHub.friends.sheetTitle'),
                        subtitle: t('socialHub.friends.sheetSubtitle'),
                        searchPlaceholder: t('socialHub.friends.searchPlaceholder'),
                        badgeFriend: t('socialHub.friends.badgeFriend'),
                        badgePending: t('socialHub.friends.badgePending'),
                        addAction: t('socialHub.friends.addAction'),
                        emptyTitle: t('socialHub.friends.searchEmptyTitle'),
                        emptySubtitle: t('socialHub.friends.searchEmptySubtitle'),
                        minCharsHint: t('socialHub.friends.searchHint'),
                    }}
                />

                <ChallengeDetailsSheet
                    sheetRef={challengeDetailsSheetRef}
                    challenge={selectedChallengeForDetails}
                    contributions={selectedChallengeContributions}
                    profileId={profile?.id}
                    onPressAddSession={() => {
                        challengeDetailsSheetRef.current?.dismiss();
                        router.push('/workout' as never);
                    }}
                    onPressOpenChallenges={() => {
                        challengeDetailsSheetRef.current?.dismiss();
                        setActiveTopTab('challenges');
                    }}
                    onPressDeleteOrLeave={(challenge) => {
                        challengeDetailsSheetRef.current?.dismiss();
                        handleDeleteChallenge(challenge);
                    }}
                    labels={{
                        title: t('socialHub.challenge.detailsSheet.title'),
                        activeSubtitle: t('socialHub.challenge.detailsSheet.activeSubtitle'),
                        finishedSubtitle: t('socialHub.challenge.detailsSheet.finishedSubtitle'),
                        close: t('common.close'),
                        openChallenges: t('socialHub.challenge.detailsSheet.openChallenges'),
                        addSession: t('socialHub.challenge.addSession'),
                        participantsTitle: t('socialHub.challenge.detailsSheet.participantsTitle'),
                        statsTitle: t('socialHub.challenge.detailsSheet.statsTitle'),
                        targetLabel: t('socialHub.challenge.detailsSheet.targetLabel'),
                        progressLabel: t('socialHub.challenge.detailsSheet.progressLabel'),
                        participantsLabel: t('socialHub.challenge.detailsSheet.participantsLabel'),
                        rankTitle: t('socialHub.challenge.detailsSheet.rankTitle'),
                        contributionsTitle: t('socialHub.challenge.detailsSheet.contributionsTitle'),
                        contributionsEmpty: t('socialHub.challenge.detailsSheet.contributionsEmpty'),
                        finishedLabel: t('socialHub.challenge.finishedLabel'),
                        winnerLabel: (name) => t('socialHub.challenge.winnerLabel', { name }),
                        drawLabel: (count) => t('socialHub.challenge.drawLabel', { count }),
                        finishReasonLabel: (reason) => t(`socialHub.challenge.finishReasons.${reason}`),
                        deleteChallenge: t('socialHub.challenge.deleteAction'),
                        leaveChallenge: t('socialHub.challenge.leaveAction'),
                    }}
                />
            </SafeAreaView>

            <CustomAlertModal
                visible={dialogState.visible}
                title={dialogState.title}
                message={dialogState.message}
                type={dialogState.type}
                buttons={dialogState.buttons}
                showCloseButton={dialogState.showCloseButton}
                onClose={closeDialog}
            />
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    topGlow: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 230,
    },
    bottomGlow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 220,
    },
    topbarWrap: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xs,
    },
    topbar: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    titleBlock: {
        flex: 1,
        gap: 2,
    },
    eyebrowPill: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        marginBottom: 4,
    },
    eyebrowText: {
        color: Colors.cta,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.9,
    },
    topbarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        marginTop: 2,
    },
    screenTitle: {
        fontSize: 32,
        fontWeight: FontWeight.extrabold,
        color: Colors.text,
        letterSpacing: -0.7,
    },
    screenSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    notifButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        backgroundColor: Colors.overlayBlack25,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageContent: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: 2,
    },
    centeredState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    stateTitle: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
        textAlign: 'center',
    },
    stateSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    primaryButton: {
        marginTop: Spacing.md,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.cta,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm,
    },
    primaryButtonText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },
});
