import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    LayoutChangeEvent,
    RefreshControl,
    ScrollView,
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
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
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
import { ActionCards } from './hub/ActionCards';
import { ChallengeCarouselSection } from './hub/ChallengeCarouselSection';
import { CreateChallengeSheet } from './hub/CreateChallengeSheet';
import { FeedSection } from './hub/FeedSection';
import { FriendsSection } from './hub/FriendsSection';
import { ShareWorkoutSheet } from './hub/ShareWorkoutSheet';
import { TopTabs } from './hub/TopTabs';
import type { FeedViewItem, SearchResult, ShareableWorkoutItem, SocialTopTabId } from './hub/types';

type ScrollSectionKey = 'challenges' | 'friends' | 'feed' | 'actions';

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

    const scrollRef = useRef<ScrollView>(null);
    const challengeSheetRef = useRef<TrueSheet>(null);
    const shareWorkoutSheetRef = useRef<TrueSheet>(null);
    const sectionOffsets = useRef<Record<ScrollSectionKey, number>>({
        challenges: 0,
        friends: 0,
        feed: 0,
        actions: 0,
    });

    const [activeTopTab, setActiveTopTab] = useState<SocialTopTabId>('home');
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [isHydratingHub, setIsHydratingHub] = useState(false);
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
        friendsLeaderboard,
        checkAuth,
        fetchFriends,
        fetchFriendsLeaderboard,
        sendEncouragement,
        sendFriendRequest,
        searchUsers,
    } = useSocialStore();

    const friendIds = useMemo(() => new Set(friends.map(friend => friend.id)), [friends]);

    const shareableWorkouts = useMemo(() => {
        return entries
            .filter(isWorkoutEntry)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 12)
            .map(entry => formatSportEntry(entry, t));
    }, [entries, t]);

    const leaderboardRows = useMemo(() => {
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

    const loadHubData = useCallback(async () => {
        setIsHydratingHub(true);
        try {
            await Promise.allSettled([
                fetchFriends(),
                fetchFriendsLeaderboard(),
                loadChallenges(),
                loadFeed(),
            ]);
        } finally {
            setIsHydratingHub(false);
        }
    }, [fetchFriends, fetchFriendsLeaderboard, loadChallenges, loadFeed]);

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
        loadHubData();
    }, [isInitialLoading, isAuthenticated, socialEnabled, loadHubData]);

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

    const registerSectionOffset = useCallback((key: ScrollSectionKey) => (event: LayoutChangeEvent) => {
        sectionOffsets.current[key] = event.nativeEvent.layout.y;
    }, []);

    const scrollToSection = useCallback((tab: SocialTopTabId) => {
        let key: ScrollSectionKey = 'challenges';

        if (tab === 'home') {
            scrollRef.current?.scrollTo({ y: 0, animated: true });
            return;
        }

        if (tab === 'challenges') {
            key = activeChallenges.length > 0 ? 'challenges' : 'actions';
        } else if (tab === 'friends' || tab === 'leaderboard') {
            key = 'friends';
        }

        const y = sectionOffsets.current[key] || 0;
        scrollRef.current?.scrollTo({ y, animated: true });
    }, [activeChallenges.length]);

    const handlePressTopTab = useCallback((tab: SocialTopTabId) => {
        setActiveTopTab(tab);
        scrollToSection(tab);
    }, [scrollToSection]);

    const onRefresh = useCallback(async () => {
        if (!isAuthenticated || !socialEnabled) return;
        setRefreshing(true);
        try {
            await loadHubData();
        } finally {
            setRefreshing(false);
        }
    }, [isAuthenticated, socialEnabled, loadHubData]);

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
                <ScrollView
                    ref={scrollRef}
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cta} />}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeIn.delay(100)} style={styles.topbar}>
                        <Text style={styles.screenTitle}>{t('social.title')}</Text>
                        <View style={styles.topbarActions}>
                            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/settings/notifications' as any)}>
                                <Bell size={18} color={Colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/profile' as any)}>
                                <UserCircle2 size={18} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(120)}>
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

                    {isHydratingHub && (
                        <View style={styles.hubLoadingRow}>
                            <ActivityIndicator size="small" color={Colors.cta} />
                            <Text style={styles.hubLoadingText}>{t('common.loading')}</Text>
                        </View>
                    )}

                    <Animated.View entering={FadeInDown.delay(140).springify()} style={styles.section} onLayout={registerSectionOffset('challenges')}>
                        <ChallengeCarouselSection
                            activeChallenges={activeChallenges}
                            challengeCardWidth={challengeCardWidth}
                            challengeIndex={challengeIndex}
                            setChallengeIndex={setChallengeIndex}
                            onAddSession={() => router.push('/workout' as any)}
                            strings={{
                                sectionTitle: t('socialHub.challenge.sectionTitle'),
                                swipeHint: t('socialHub.challenge.swipeHint'),
                                noParticipants: t('socialHub.challenge.noParticipants'),
                                details: t('socialHub.challenge.details'),
                                addSession: t('socialHub.challenge.addSession'),
                                daysRemaining: (count) => t('socialHub.challenge.daysRemaining', { count }),
                                goalLabel: (goalType) => t(`socialHub.challenge.goalTypes.${goalType}`),
                            }}
                        />
                        {!!challengesError && <Text style={styles.errorText}>{challengesError}</Text>}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(170).springify()} style={styles.section} onLayout={registerSectionOffset('friends')}>
                        <FriendsSection
                            hasFriends={friends.length > 0}
                            profileId={profile?.id}
                            leaderboardRows={leaderboardRows as any}
                            showAddFriendPanel={showAddFriendPanel}
                            setShowAddFriendPanel={setShowAddFriendPanel}
                            searchQuery={searchQuery}
                            onChangeSearchQuery={setSearchQuery}
                            isSearching={isSearching}
                            searchError={searchError}
                            searchResults={searchResults}
                            onSendRequest={handleSendRequest}
                            onInvite={handleInviteFriend}
                            labels={{
                                sectionTitle: t('socialHub.friends.sectionTitle'),
                                period: t('socialHub.friends.period'),
                                emptyTitle: t('socialHub.friends.emptyTitle'),
                                emptySubtitle: t('socialHub.friends.emptySubtitle'),
                                addFriend: t('socialHub.friends.addFriend'),
                                invite: t('socialHub.friends.invite'),
                                searchPlaceholder: t('socialHub.friends.searchPlaceholder'),
                                badgeFriend: t('socialHub.friends.badgeFriend'),
                                badgePending: t('socialHub.friends.badgePending'),
                                addAction: t('socialHub.friends.addAction'),
                                workoutsWeek: (count) => t('socialHub.friends.workoutsWeek', { count }),
                                meBadge: t('socialHub.friends.meBadge'),
                                xpSuffix: t('socialHub.friends.xpSuffix'),
                            }}
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section} onLayout={registerSectionOffset('feed')}>
                        <FeedSection
                            items={feedItems}
                            isSendingLikeForId={isSendingLikeForId}
                            onSendLike={handleSendLike}
                            onRefresh={loadFeed}
                            error={feedError}
                            labels={{
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
                            }}
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(230).springify()} style={styles.section} onLayout={registerSectionOffset('actions')}>
                        <ActionCards
                            onPressShareWorkout={() => shareWorkoutSheetRef.current?.present()}
                            onPressCreateChallenge={() => challengeSheetRef.current?.present()}
                            labels={{
                                shareTitle: t('socialHub.cards.shareTitle'),
                                shareSubtitle: t('socialHub.cards.shareSubtitle'),
                                challengeTitle: t('socialHub.cards.challengeTitle'),
                                challengeSubtitle: t('socialHub.cards.challengeSubtitle'),
                            }}
                        />
                    </Animated.View>

                    <View style={styles.bottomSpacer} />
                </ScrollView>

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
    scroll: {
        flex: 1,
    },
    content: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 24,
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
    section: {
        marginBottom: Spacing.md,
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
    bottomSpacer: {
        height: 96,
    },
});
