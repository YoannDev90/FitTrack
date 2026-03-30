import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Entry } from '../../types';
import { BuildConfig } from '../../config';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { CustomAlertModal } from '../ui';
import type { AlertButton, AlertType } from '../ui';
import { useAppStore, useSocialStore } from '../../stores';
import { isSocialAvailable } from '../../services/supabase';
import {
    createSocialChallenge,
    deleteSocialChallenge,
    deleteMySharedWorkoutEvent,
    getActiveSocialChallenges,
    getSocialFeed,
    leaveSocialChallenge,
    setSocialFeedReaction,
    shareWorkoutToFeed,
    type SocialChallengeGoalType,
    type SocialChallengeProgress,
    type SocialFeedEventItem,
} from '../../services/supabase/social';
import { ChallengesTabPage } from './hub/ChallengesTabPage';
import { CreateChallengeSheet } from './hub/CreateChallengeSheet';
import { FriendsTabPage } from './hub/FriendsTabPage';
import { HomeTabPage } from './hub/HomeTabPage';
import { LeaderboardTabPage } from './hub/LeaderboardTabPage';
import { ShareWorkoutSheet } from './hub/ShareWorkoutSheet';
import { TopTabs } from './hub/TopTabs';
import type { FeedViewItem, SearchResult, ShareableWorkoutItem, SocialTopTabId } from './hub/types';

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

function isWorkoutEntry(entry: Entry): entry is Extract<Entry, { type: 'home' | 'run' | 'beatsaber' | 'custom' }> {
    return entry.type === 'home' || entry.type === 'run' || entry.type === 'beatsaber' || entry.type === 'custom';
}

function formatSportEntry(entry: Extract<Entry, { type: 'home' | 'run' | 'beatsaber' | 'custom' }>, t: (key: string, options?: any) => string): ShareableWorkoutItem {
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

function mapFeedEvent(event: SocialFeedEventItem, currentUserId: string | undefined, t: (key: string, options?: any) => string): FeedViewItem {
    const metadata = event.metadata || {};

    if (event.event_type === 'workout') {
        const isOwnWorkout = event.actor_id === currentUserId;
        return {
            id: event.id,
            actorId: event.actor_id,
            actorName: event.actor_name,
            title: t('socialHub.feed.workoutTitle', { name: event.actor_name }),
            detail: `${metadata.title || t('socialHub.workoutTypes.home')} · ${metadata.summary || t('socialHub.feed.genericWorkoutDetail')}`,
            createdAt: event.created_at,
            isWorkoutShare: !isOwnWorkout,
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
            createdAt: event.created_at,
            isWorkoutShare: false,
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
            createdAt: event.created_at,
            isWorkoutShare: false,
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
        createdAt: event.created_at,
        isWorkoutShare: false,
        canDelete: false,
        eventId: event.id,
    };
}

export default function SocialHubScreen() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const challengeCardWidth = Math.max(260, width - Spacing.lg * 2);

    const challengeSheetRef = useRef<TrueSheet>(null);
    const shareWorkoutSheetRef = useRef<TrueSheet>(null);

    const [activeTopTab, setActiveTopTab] = useState<SocialTopTabId>('home');
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isHydratingHub, setIsHydratingHub] = useState(false);
    const [isHydratingFriendsTab, setIsHydratingFriendsTab] = useState(false);
    const [isHydratingLeaderboardTab, setIsHydratingLeaderboardTab] = useState(false);
    const [isGlobalLeaderboardActive, setIsGlobalLeaderboardActive] = useState(false);
    const [isLoadingGlobalLeaderboard, setIsLoadingGlobalLeaderboard] = useState(false);
    const [challengeIndex, setChallengeIndex] = useState(0);
    const [isSendingLikeForId, setIsSendingLikeForId] = useState<string | null>(null);
    const [isSharingWorkoutId, setIsSharingWorkoutId] = useState<string | null>(null);

    const [activeChallenges, setActiveChallenges] = useState<SocialChallengeProgress[]>(() => (
        profile?.id && homeCacheProfileId === profile.id ? homeChallengesCache : []
    ));
    const [challengesError, setChallengesError] = useState<string | null>(null);
    const [feedItems, setFeedItems] = useState<FeedViewItem[]>(() => (
        profile?.id && homeCacheProfileId === profile.id ? homeFeedCache : []
    ));
    const [feedError, setFeedError] = useState<string | null>(null);

    const [showAddFriendPanel, setShowAddFriendPanel] = useState(false);
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
        sendEncouragement,
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

    const shareableWorkouts = useMemo(() => {
        return entries
            .filter(isWorkoutEntry)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12)
            .map(entry => formatSportEntry(entry, t));
    }, [entries, t]);

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

        if (profile) {
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
        const rows = globalLeaderboard.slice(0, 20);
        return rows.map((row, index) => ({
            ...row,
            rank: row.rank || index + 1,
        }));
    }, [globalLeaderboard]);

    const loadChallenges = useCallback(async () => {
        try {
            const challenges = await getActiveSocialChallenges();
            setActiveChallenges(challenges);
            homeChallengesCache = challenges;
            setChallengeIndex(0);
            setChallengesError(null);
        } catch {
            if (homeChallengesCache.length === 0) {
                setActiveChallenges([]);
            }
            setChallengesError(t('socialHub.errors.challengesLoad'));
        }
    }, [t]);

    const loadFeed = useCallback(async () => {
        try {
            const events = await getSocialFeed(10);
            const currentUserId = useSocialStore.getState().profile?.id;
            const mapped = events.map(event => mapFeedEvent(event, currentUserId, t));
            setFeedItems(mapped);
            homeFeedCache = mapped;
            setFeedError(null);
        } catch {
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
            await Promise.allSettled([
                fetchFriends(),
                loadChallenges(),
                loadFeed(),
            ]);
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
            await Promise.allSettled([
                fetchFriends(),
                fetchPendingRequests(),
            ]);
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

    useEffect(() => {
        if (!showAddFriendPanel || searchQuery.trim().length < 2) {
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
            } catch {
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
    }, [showAddFriendPanel, searchQuery, searchUsers, t]);

    const handlePressTopTab = useCallback((tab: SocialTopTabId) => {
        setActiveTopTab(tab);
        if (tab !== 'friends') {
            setShowAddFriendPanel(false);
            setSearchQuery('');
            setSearchResults([]);
            setSearchError(null);
        }
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
            setSearchResults(prev => prev.map(result => (
                result.id === userId ? { ...result, friendship_status: 'pending' } : result
            )));
            showSuccessDialog(t('social.requestSent'));
        } catch {
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
        } catch {
            showErrorDialog(t('socialHub.errors.shareInvite'));
        }
    }, [profile?.username, showErrorDialog, t]);

    const handleRespondToRequest = useCallback(async (friendshipId: string, accept: boolean) => {
        try {
            await respondToRequest(friendshipId, accept);
            await loadFriendsTabData();
        } catch {
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
                    await Promise.allSettled([loadFriendsTabData(), loadFriendsLeaderboardData()]);
                    showSuccessDialog(`${t('social.friendRemoved')} · ${friendName}`);
                } catch {
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
            } catch {
                // Keep opening the sheet even if preloading friends fails.
            }
        }
        challengeSheetRef.current?.present();
    }, [fetchFriends, friends.length]);

    const handleSendLike = useCallback(async (item: FeedViewItem) => {
        if (!item.isWorkoutShare || !item.eventId || item.actorId === profile?.id) return;

        setIsSendingLikeForId(item.id);
        try {
            await setSocialFeedReaction(item.eventId, 'like');
            await sendEncouragement(item.actorId, t('socialHub.feed.likeMessage'));
        } catch {
            showErrorDialog(t('socialHub.errors.sendLike'));
        } finally {
            setIsSendingLikeForId(null);
        }
    }, [profile?.id, sendEncouragement, showErrorDialog, t]);

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
                    await loadFeed();
                } catch {
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
            shareWorkoutSheetRef.current?.dismiss();
            await loadFeed();
            showSuccessDialog(t('socialHub.shareWorkout.sharedSuccess'));
        } catch {
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
            challengeSheetRef.current?.dismiss();
            setChallengeTitle('');
            setChallengeGoalType('workouts');
            setChallengeGoalTarget('10');
            setChallengeDurationDays('7');
            setSelectedFriendIdsForChallenge([]);
            await Promise.all([loadChallenges(), loadFeed(), loadFriendsTabData()]);
            showSuccessDialog(t('socialHub.challenge.createSuccess'));
        } catch {
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

                    await Promise.all([loadChallenges(), loadFeed()]);
                    showSuccessDialog(
                        isOwner
                            ? t('socialHub.challenge.deleteSuccess')
                            : t('socialHub.challenge.leaveSuccess')
                    );
                } catch {
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

    if (!isSocialAvailable()) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.centeredState}>
                    <Users size={56} color={Colors.muted} />
                    <Text style={styles.stateTitle}>{BuildConfig.isFoss ? t('social.fossTitle') : t('social.notConfiguredTitle')}</Text>
                    <Text style={styles.stateSubtitle}>{BuildConfig.isFoss ? t('social.fossInfo') : t('social.notConfiguredSubtitle')}</Text>
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
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/auth' as any)}>
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
                    <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/settings/social' as any)}>
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
                            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/settings/notifications' as any)}>
                                <Bell size={18} color={Colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/profile' as any)}>
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
                            activeChallenges={activeChallenges}
                            challengeCardWidth={challengeCardWidth}
                            challengeIndex={challengeIndex}
                            setChallengeIndex={setChallengeIndex}
                            onAddSession={() => router.push('/workout' as any)}
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
                                    daysRemaining: (count) => t('socialHub.challenge.daysRemaining', { count }),
                                    goalLabel: (goalType) => t(`socialHub.challenge.goalTypes.${goalType}`),
                                },
                                feed: {
                                    sectionTitle: t('socialHub.feed.sectionTitle'),
                                    emptyTitle: t('socialHub.feed.emptyTitle'),
                                    emptySubtitle: t('socialHub.feed.emptySubtitle'),
                                    like: t('socialHub.feed.likeAction'),
                                    sending: t('socialHub.feed.likeSending'),
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
                            onPressAddSession={() => router.push('/workout' as any)}
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
                            showAddFriendPanel={showAddFriendPanel}
                            setShowAddFriendPanel={setShowAddFriendPanel}
                            searchQuery={searchQuery}
                            onChangeSearchQuery={setSearchQuery}
                            isSearching={isSearching}
                            searchError={searchError}
                            searchResults={searchResults}
                            onSendRequest={handleSendRequest}
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
