import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    Alert,
    RefreshControl,
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
import Animated, { FadeIn } from 'react-native-reanimated';
import { Bell, Sparkles, UserCircle2, Users } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Entry } from '../../types';
import { BuildConfig } from '../../config';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../constants';
import { useAppStore, useSocialStore } from '../../stores';
import { isSocialAvailable } from '../../services/supabase';
import {
    createSocialChallenge,
    getActiveSocialChallenges,
    getSocialFeed,
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
        return {
            id: event.id,
            actorId: event.actor_id,
            actorName: event.actor_name,
            title: t('socialHub.feed.workoutTitle', { name: event.actor_name }),
            detail: `${metadata.title || t('socialHub.workoutTypes.home')} · ${metadata.summary || t('socialHub.feed.genericWorkoutDetail')}`,
            createdAt: event.created_at,
            isWorkoutShare: event.actor_id !== currentUserId,
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

    const [activeChallenges, setActiveChallenges] = useState<SocialChallengeProgress[]>([]);
    const [challengesError, setChallengesError] = useState<string | null>(null);
    const [feedItems, setFeedItems] = useState<FeedViewItem[]>([]);
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
    const [isCreatingChallenge, setIsCreatingChallenge] = useState(false);

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

    const friendIds = useMemo(() => new Set(friends.map(friend => friend.id)), [friends]);

    const shareableWorkouts = useMemo(() => {
        return entries
            .filter(isWorkoutEntry)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12)
            .map(entry => formatSportEntry(entry, t));
    }, [entries, t]);

    const friendsLeaderboardRows = useMemo(() => {
        const friendRows = friendsLeaderboard
            .filter(entry => friendIds.has(entry.id))
            .slice();

        const rows = friendRows.length > 0
            ? friendRows
            : [...friends].map(friend => ({
                ...friend,
            }));

        const withSelf = profile
            ? [...rows, { ...profile }]
            : rows;

        return withSelf
            .sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0))
            .slice(0, 5)
            .map((row, index) => ({
                ...row,
                rank: index + 1,
            }));
    }, [friendsLeaderboard, friendIds, friends, profile]);

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
            setChallengeIndex(0);
            setChallengesError(null);
        } catch {
            setActiveChallenges([]);
            setChallengesError(t('socialHub.errors.challengesLoad'));
        }
    }, [t]);

    const loadFeed = useCallback(async () => {
        try {
            const events = await getSocialFeed(20);
            const currentUserId = useSocialStore.getState().profile?.id;
            const mapped = events.map(event => mapFeedEvent(event, currentUserId, t));
            setFeedItems(mapped);
            setFeedError(null);
        } catch {
            setFeedItems([]);
            setFeedError(t('socialHub.errors.feedLoad'));
        }
    }, [t]);

    const loadHomeData = useCallback(async () => {
        setIsHydratingHub(true);
        try {
            await Promise.allSettled([
                loadChallenges(),
                loadFeed(),
            ]);
        } finally {
            setIsHydratingHub(false);
        }
    }, [loadChallenges, loadFeed]);

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
    }, [checkAuth]);

    useEffect(() => {
        if (isInitialLoading) return;
        if (!isAuthenticated || !socialEnabled) return;
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
            Alert.alert(t('common.success'), t('social.requestSent'));
        } catch {
            Alert.alert(t('common.error'), t('socialHub.errors.sendFriendRequest'));
        }
    }, [sendFriendRequest, t]);

    const handleInviteFriend = useCallback(async () => {
        try {
            const username = profile?.username || 'spix';
            await Share.share({
                title: t('socialHub.invite.shareTitle'),
                message: t('socialHub.invite.shareMessage', { username }),
            });
        } catch {
            Alert.alert(t('common.error'), t('socialHub.errors.shareInvite'));
        }
    }, [profile?.username, t]);

    const handleRespondToRequest = useCallback(async (friendshipId: string, accept: boolean) => {
        try {
            await respondToRequest(friendshipId, accept);
            await loadFriendsTabData();
        } catch {
            Alert.alert(t('common.error'), t('socialHub.errors.sendFriendRequest'));
        }
    }, [respondToRequest, loadFriendsTabData, t]);

    const handleRemoveFriend = useCallback(async (friendshipId: string, friendName: string) => {
        Alert.alert(
            t('social.removeFriendConfirmTitle'),
            t('social.removeFriendConfirmMessage'),
            [
                { text: t('common.cancel'), style: 'cancel' },
                {
                    text: t('common.delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await removeFriend(friendshipId);
                            await Promise.allSettled([loadFriendsTabData(), loadFriendsLeaderboardData()]);
                            Alert.alert(t('common.success'), `${t('social.friendRemoved')} · ${friendName}`);
                        } catch {
                            Alert.alert(t('common.error'), t('socialHub.errors.sendFriendRequest'));
                        }
                    },
                },
            ]
        );
    }, [removeFriend, loadFriendsTabData, loadFriendsLeaderboardData, t]);

    const handleShowFriendsLeaderboard = useCallback(() => {
        setIsGlobalLeaderboardActive(false);
    }, []);

    const handleShowGlobalLeaderboard = useCallback(async () => {
        setIsGlobalLeaderboardActive(true);
        if (globalLeaderboardRows.length === 0) {
            await loadGlobalLeaderboardData();
        }
    }, [globalLeaderboardRows.length, loadGlobalLeaderboardData]);

    const handleSendLike = useCallback(async (item: FeedViewItem) => {
        if (!item.isWorkoutShare || !item.eventId || item.actorId === profile?.id) return;

        setIsSendingLikeForId(item.id);
        try {
            await setSocialFeedReaction(item.eventId, 'like');
            await sendEncouragement(item.actorId, t('socialHub.feed.likeMessage'));
        } catch {
            Alert.alert(t('common.error'), t('socialHub.errors.sendLike'));
        } finally {
            setIsSendingLikeForId(null);
        }
    }, [profile?.id, sendEncouragement, t]);

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
            Alert.alert(t('common.success'), t('socialHub.shareWorkout.sharedSuccess'));
        } catch {
            Alert.alert(t('common.error'), t('socialHub.errors.shareWorkout'));
        } finally {
            setIsSharingWorkoutId(null);
        }
    }, [loadFeed, t]);

    const handleCreateChallenge = useCallback(async () => {
        const title = challengeTitle.trim();
        const target = Number(challengeGoalTarget);
        const durationDays = Number(challengeDurationDays);

        if (!title) {
            Alert.alert(t('common.warning'), t('socialHub.challenge.validation.titleRequired'));
            return;
        }

        if (!Number.isFinite(target) || target <= 0) {
            Alert.alert(t('common.warning'), t('socialHub.challenge.validation.targetInvalid'));
            return;
        }

        if (!Number.isFinite(durationDays) || durationDays <= 0 || durationDays > 90) {
            Alert.alert(t('common.warning'), t('socialHub.challenge.validation.durationInvalid'));
            return;
        }

        setIsCreatingChallenge(true);
        try {
            await createSocialChallenge({
                title,
                goalType: challengeGoalType,
                goalTarget: target,
                durationDays,
            });
            challengeSheetRef.current?.dismiss();
            setChallengeTitle('');
            setChallengeGoalType('workouts');
            setChallengeGoalTarget('10');
            setChallengeDurationDays('7');
            await Promise.all([loadChallenges(), loadFeed()]);
            Alert.alert(t('common.success'), t('socialHub.challenge.createSuccess'));
        } catch {
            Alert.alert(t('common.error'), t('socialHub.errors.createChallenge'));
        } finally {
            setIsCreatingChallenge(false);
        }
    }, [challengeDurationDays, challengeGoalTarget, challengeGoalType, challengeTitle, loadChallenges, loadFeed, t]);

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
            <SafeAreaView style={styles.container} edges={['top']}>
                <Animated.View entering={FadeIn.delay(100)} style={styles.topbarWrap}>
                    <View style={styles.topbar}>
                        <Text style={styles.screenTitle}>{t('social.title')}</Text>
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
                            onSendLike={handleSendLike}
                            onRefreshFeed={loadFeed}
                            feedError={feedError}
                            onPressShareWorkout={() => shareWorkoutSheetRef.current?.present()}
                            onPressCreateChallenge={() => challengeSheetRef.current?.present()}
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
                                    refresh: t('socialHub.feed.refresh'),
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
                            onPressCreateChallenge={() => challengeSheetRef.current?.present()}
                            onPressAddSession={() => router.push('/workout' as any)}
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
        </GestureHandlerRootView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.bg,
    },
    topbarWrap: {
        paddingHorizontal: Spacing.lg,
    },
    topbar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    topbarActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    screenTitle: {
        fontSize: 30,
        fontWeight: FontWeight.extrabold,
        color: Colors.text,
        letterSpacing: -0.5,
    },
    notifButton: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlay,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageContent: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
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
