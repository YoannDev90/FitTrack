import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
    Bell,
    ChevronRight,
    Heart,
    Plus,
    Search,
    Sparkles,
    UserPlus,
    Users,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { GlassCard } from '../ui';
import { BuildConfig } from '../../config';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants';
import { useSocialStore } from '../../stores';
import { isSocialAvailable } from '../../services/supabase';
import {
    createSocialChallenge,
    getActiveSocialChallenges,
    getSocialFeed,
    setSocialFeedReaction,
    type SocialChallengeGoalType,
    type SocialChallengeProgress,
    type SocialFeedEventItem,
} from '../../services/supabase/social';

type SearchResult = {
    id: string;
    username: string;
    display_name: string | null;
    level: number;
    friendship_status: 'pending' | 'accepted' | 'rejected' | 'blocked' | null;
};

type FeedViewItem = {
    id: string;
    actorId: string;
    actorName: string;
    detail: string;
    message: string;
    createdAt: string;
    eventId?: string;
};

type SocialTopTabId = 'home' | 'challenges' | 'friends' | 'leaderboard';

const SOCIAL_TOP_TABS: Array<{ id: SocialTopTabId; label: string }> = [
    { id: 'home', label: 'Accueil' },
    { id: 'challenges', label: 'Challenges' },
    { id: 'friends', label: 'Amis' },
    { id: 'leaderboard', label: 'Classement' },
];

function relativeTimeLabel(dateIso: string): string {
    const created = new Date(dateIso).getTime();
    const now = Date.now();
    const delta = Math.max(0, Math.floor((now - created) / 1000));

    if (delta < 60) return 'À l\'instant';
    if (delta < 3600) return `Il y a ${Math.floor(delta / 60)} min`;
    if (delta < 86400) return `Il y a ${Math.floor(delta / 3600)} h`;
    return `Il y a ${Math.floor(delta / 86400)} j`;
}

function mapFeedEvent(event: SocialFeedEventItem): FeedViewItem {
    let detail = 'Activité';
    if (event.event_type === 'workout') detail = 'Séance';
    if (event.event_type === 'challenge_progress') detail = 'Challenge';
    if (event.event_type === 'streak') detail = 'Série';
    if (event.event_type === 'encouragement') detail = 'Encouragement';

    return {
        id: event.id,
        actorId: event.actor_id,
        actorName: event.actor_name,
        detail,
        message: event.message,
        createdAt: event.created_at,
        eventId: event.id,
    };
}

function getGoalLabel(goalType: SocialChallengeGoalType): string {
    if (goalType === 'workouts') return 'séances';
    if (goalType === 'distance') return 'km';
    if (goalType === 'duration') return 'min';
    return 'XP';
}

export default function SocialHubScreen() {
    const { t } = useTranslation();
    const { width } = useWindowDimensions();
    const challengeCardWidth = Math.max(260, width - Spacing.lg * 2);

    const challengeSheetRef = useRef<TrueSheet>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const [activeChallenges, setActiveChallenges] = useState<SocialChallengeProgress[]>([]);
    const [challengesError, setChallengesError] = useState<string | null>(null);
    const [challengeIndex, setChallengeIndex] = useState(0);

    const [feedItems, setFeedItems] = useState<FeedViewItem[]>([]);
    const [feedError, setFeedError] = useState<string | null>(null);
    const [reactingFeedItemId, setReactingFeedItemId] = useState<string | null>(null);
    const [activeTopTab, setActiveTopTab] = useState<SocialTopTabId>('home');

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

    const {
        isAuthenticated,
        socialEnabled,
        profile,
        friends,
        friendsLeaderboard,
        unreadEncouragements,
        recentEncouragements,
        checkAuth,
        fetchFriends,
        fetchFriendsLeaderboard,
        fetchEncouragements,
        sendEncouragement,
        sendFriendRequest,
        searchUsers,
    } = useSocialStore();

    const friendIds = useMemo(() => new Set(friends.map(friend => friend.id)), [friends]);

    const leaderboardRows = useMemo(() => {
        const friendRows = friendsLeaderboard
            .filter(entry => friendIds.has(entry.id))
            .slice();

        const normalizedFriendRows = friendRows.length > 0
            ? friendRows
            : [...friends]
            .sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0))
            .map(friend => ({
                ...friend,
            }));

        const rowsWithSelf = profile
            ? [
                ...normalizedFriendRows,
                {
                    ...profile,
                },
            ]
            : normalizedFriendRows;

        return rowsWithSelf
            .sort((a, b) => (b.weekly_xp || 0) - (a.weekly_xp || 0))
            .slice(0, 5)
            .map((entry, index) => ({
                ...entry,
                rank: index + 1,
            })) as any[];
    }, [friendsLeaderboard, friendIds, friends, profile]);

    const fallbackFeedItems = useMemo(() => {
        const merged = [...unreadEncouragements, ...recentEncouragements];
        const unique = new Map<string, FeedViewItem>();

        merged.forEach(enc => {
            if (unique.has(enc.id)) return;
            unique.set(enc.id, {
                id: enc.id,
                actorId: (enc as any).sender?.id || '',
                actorName: (enc as any).sender?.display_name || (enc as any).sender?.username || 'Ami',
                detail: 'Encouragement',
                message: enc.message,
                createdAt: enc.created_at,
            });
        });

        return Array.from(unique.values()).slice(0, 8);
    }, [recentEncouragements, unreadEncouragements]);

    const displayedFeedItems = feedItems.length > 0 ? feedItems : fallbackFeedItems;

    const loadChallenges = useCallback(async () => {
        try {
            const data = await getActiveSocialChallenges();
            setActiveChallenges(data);
            setChallengesError(null);
            setChallengeIndex(0);
        } catch {
            setChallengesError('Impossible de charger les challenges pour le moment.');
            setActiveChallenges([]);
        }
    }, []);

    const loadFeed = useCallback(async () => {
        try {
            const events = await getSocialFeed(20);
            setFeedItems(events.map(mapFeedEvent));
            setFeedError(null);
        } catch {
            setFeedError('Le feed social est temporairement indisponible.');
            setFeedItems([]);
        }
    }, []);

    const loadHubData = useCallback(async () => {
        await Promise.all([
            fetchFriends(),
            fetchFriendsLeaderboard(),
            fetchEncouragements(),
            loadChallenges(),
            loadFeed(),
        ]);
    }, [fetchFriends, fetchFriendsLeaderboard, fetchEncouragements, loadChallenges, loadFeed]);

    useEffect(() => {
        const init = async () => {
            setIsInitialLoading(true);
            await checkAuth();
            setIsInitialLoading(false);
        };

        init();
    }, [checkAuth]);

    useEffect(() => {
        if (!isAuthenticated || !socialEnabled) return;
        loadHubData();
    }, [isAuthenticated, socialEnabled, loadHubData]);

    const onRefresh = useCallback(async () => {
        if (!isAuthenticated || !socialEnabled) return;
        setRefreshing(true);
        try {
            await loadHubData();
        } finally {
            setRefreshing(false);
        }
    }, [isAuthenticated, socialEnabled, loadHubData]);

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
                setSearchError('La recherche est indisponible pour le moment.');
                setSearchResults([]);
            } finally {
                if (requestId === searchRequestRef.current) {
                    setIsSearching(false);
                }
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [showAddFriendPanel, searchQuery, searchUsers]);

    const handleSendRequest = useCallback(async (userId: string) => {
        try {
            await sendFriendRequest(userId);
            Alert.alert('Demande envoyée', 'La demande d\'ami a bien été envoyée.');
            setSearchResults(prev =>
                prev.map(item => (item.id === userId ? { ...item, friendship_status: 'pending' } : item))
            );
        } catch {
            Alert.alert('Erreur', 'Impossible d\'envoyer la demande pour le moment.');
        }
    }, [sendFriendRequest]);

    const handleEncourage = useCallback(async (receiverId: string, receiverName: string) => {
        try {
            await sendEncouragement(receiverId);
            Alert.alert('Encouragement envoyé', `Tu as encouragé ${receiverName}.`);
            await fetchEncouragements();
            await loadFeed();
        } catch {
            Alert.alert('Erreur', 'Impossible d\'envoyer un encouragement pour le moment.');
        }
    }, [sendEncouragement, fetchEncouragements, loadFeed]);

    const handleReactFeed = useCallback(async (item: FeedViewItem, reaction: string) => {
        if (!item.actorId || item.actorId === profile?.id) return;

        setReactingFeedItemId(item.id);
        try {
            if (item.eventId) {
                await setSocialFeedReaction(item.eventId, reaction);
            }
            await sendEncouragement(item.actorId);
        } catch {
            Alert.alert('Erreur', 'Impossible d\'envoyer la réaction pour le moment.');
        } finally {
            setReactingFeedItemId(null);
        }
    }, [profile?.id, sendEncouragement]);

    const handleInviteFriend = useCallback(async () => {
        try {
            const username = profile?.username || 'spix';
            await Share.share({
                title: 'Rejoins-moi sur Spix',
                message: `On se challenge sur Spix ? Ajoute-moi: @${username}`,
            });
        } catch {
            Alert.alert('Erreur', 'Impossible de partager l\'invitation.');
        }
    }, [profile?.username]);

    const resetChallengeForm = useCallback(() => {
        setChallengeTitle('');
        setChallengeGoalType('workouts');
        setChallengeGoalTarget('10');
        setChallengeDurationDays('7');
    }, []);

    const handleCreateChallenge = useCallback(async () => {
        const title = challengeTitle.trim();
        const target = Number(challengeGoalTarget);
        const durationDays = Number(challengeDurationDays);

        if (!title) {
            Alert.alert('Validation', 'Ajoute un titre au challenge.');
            return;
        }

        if (!Number.isFinite(target) || target <= 0) {
            Alert.alert('Validation', 'Objectif invalide.');
            return;
        }

        if (!Number.isFinite(durationDays) || durationDays <= 0 || durationDays > 90) {
            Alert.alert('Validation', 'Durée invalide (1 à 90 jours).');
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
            resetChallengeForm();
            await loadChallenges();
            await loadFeed();
            Alert.alert('Challenge créé', 'Ton challenge est maintenant visible sur le Social Hub.');
        } catch {
            Alert.alert('Erreur', 'Impossible de créer le challenge pour le moment.');
        } finally {
            setIsCreatingChallenge(false);
        }
    }, [challengeDurationDays, challengeGoalTarget, challengeGoalType, challengeTitle, loadChallenges, loadFeed, resetChallengeForm]);

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
                    style={styles.scroll}
                    contentContainerStyle={styles.content}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.cta} />}
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeIn.delay(100)} style={styles.topbar}>
                        <Text style={styles.screenTitle}>Social</Text>
                        <TouchableOpacity style={styles.notifButton} onPress={() => router.push('/settings/notifications' as any)}>
                            <Bell size={18} color={Colors.text} />
                        </TouchableOpacity>
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(120)} style={styles.topTabs}>
                        {SOCIAL_TOP_TABS.map(tab => {
                            const isActive = tab.id === activeTopTab;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[styles.topTab, isActive && styles.topTabActive]}
                                    onPress={() => setActiveTopTab(tab.id)}
                                >
                                    <Text style={[styles.topTabText, isActive && styles.topTabTextActive]}>{tab.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </Animated.View>

                    {activeChallenges.length > 0 && (
                        <Animated.View entering={FadeInDown.delay(120).springify()} style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionLabel}>Challenge en cours</Text>
                                <Text style={styles.sectionLink}>Swipe</Text>
                            </View>

                            <ScrollView
                                horizontal
                                pagingEnabled
                                snapToInterval={challengeCardWidth + Spacing.md}
                                decelerationRate="fast"
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.challengeCarousel}
                                onMomentumScrollEnd={(event) => {
                                    const page = Math.round(event.nativeEvent.contentOffset.x / (challengeCardWidth + Spacing.md));
                                    setChallengeIndex(Math.max(0, Math.min(activeChallenges.length - 1, page)));
                                }}
                            >
                                {activeChallenges.map((item) => {
                                    const progress = Number(item.my_progress || 0);
                                    const target = Number(item.challenge.goal_target || 1);
                                    const ratio = Math.min(1, progress / Math.max(target, 1));
                                    const endsAt = new Date(item.challenge.ends_at);
                                    const remainingDays = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));

                                    return (
                                        <LinearGradient
                                            key={item.challenge.id}
                                            colors={[Colors.violetStrong, Colors.violetDeep]}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 1 }}
                                            style={[styles.challengeCard, { width: challengeCardWidth }]}
                                        >
                                            <Text style={styles.challengeKicker}>{remainingDays}j restants</Text>
                                            <Text style={styles.challengeTitle}>{item.challenge.title}</Text>

                                            <View style={styles.progressTrack}>
                                                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
                                            </View>

                                            <View style={styles.challengeMetaRow}>
                                                <Text style={styles.challengeMetaText}>
                                                    {progress}/{target} {getGoalLabel(item.challenge.goal_type)}
                                                </Text>
                                                <Text style={styles.challengeMetaText}>
                                                    {item.preview_participants.length > 0
                                                        ? item.preview_participants
                                                            .slice(0, 2)
                                                            .map(participant => `${participant.display_name || participant.username}: ${Math.round(participant.progress)}`)
                                                            .join(' · ')
                                                        : 'Aucun participant'}
                                                </Text>
                                            </View>

                                            <View style={styles.challengeActions}>
                                                <TouchableOpacity style={styles.challengeGhostBtn}>
                                                    <Text style={styles.challengeGhostBtnText}>Voir détail</Text>
                                                </TouchableOpacity>
                                                <TouchableOpacity style={styles.challengeSolidBtn} onPress={() => router.push('/workout' as any)}>
                                                    <Text style={styles.challengeSolidBtnText}>Ajouter séance</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </LinearGradient>
                                    );
                                })}
                            </ScrollView>

                            <View style={styles.dotRow}>
                                {activeChallenges.map((item, idx) => (
                                    <View
                                        key={item.challenge.id}
                                        style={[styles.dot, idx === challengeIndex && styles.dotActive]}
                                    />
                                ))}
                            </View>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInDown.delay(160).springify()} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Classement amis</Text>
                            {friends.length > 0 && <Text style={styles.sectionLink}>Semaine</Text>}
                        </View>

                        {friends.length === 0 ? (
                            <GlassCard style={styles.emptyFriendsCard}>
                                <Text style={styles.emptyFriendsTitle}>Aucun ami pour le moment</Text>
                                <Text style={styles.emptyFriendsText}>
                                    Ajoute un ami ou envoie une invitation pour lancer tes premiers challenges.
                                </Text>
                                <View style={styles.emptyFriendsActions}>
                                    <TouchableOpacity style={styles.inlinePrimaryBtn} onPress={() => setShowAddFriendPanel(v => !v)}>
                                        <UserPlus size={16} color={Colors.cta} />
                                        <Text style={styles.inlinePrimaryBtnText}>Ajouter un ami</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.inlineGhostBtn} onPress={handleInviteFriend}>
                                        <Text style={styles.inlineGhostBtnText}>Inviter</Text>
                                    </TouchableOpacity>
                                </View>

                                {showAddFriendPanel && (
                                    <View style={styles.searchPanel}>
                                        <View style={styles.searchInputWrap}>
                                            <Search size={16} color={Colors.muted} />
                                            <TextInput
                                                style={styles.searchInput}
                                                placeholder="Rechercher un utilisateur"
                                                placeholderTextColor={Colors.muted2}
                                                value={searchQuery}
                                                onChangeText={setSearchQuery}
                                            />
                                        </View>
                                        {isSearching && <ActivityIndicator size="small" color={Colors.cta} style={{ marginTop: 8 }} />}
                                        {searchError && <Text style={styles.errorText}>{searchError}</Text>}
                                        {searchResults.map(user => (
                                            <View key={user.id} style={styles.searchResultRow}>
                                                <Text style={styles.searchResultName}>{user.display_name || user.username}</Text>
                                                {user.friendship_status === 'accepted' ? (
                                                    <Text style={styles.searchResultBadge}>Ami</Text>
                                                ) : user.friendship_status === 'pending' ? (
                                                    <Text style={styles.searchResultBadge}>En attente</Text>
                                                ) : (
                                                    <TouchableOpacity onPress={() => handleSendRequest(user.id)}>
                                                        <Text style={styles.searchResultAction}>Ajouter</Text>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </GlassCard>
                        ) : (
                            <GlassCard style={styles.leaderboardCard}>
                                {leaderboardRows.map((entry, index) => (
                                    <View key={`${entry.id}-${index}`} style={[styles.rankRow, index < leaderboardRows.length - 1 && styles.rankRowBorder]}>
                                        <Text style={styles.rankNumber}>{entry.rank}</Text>
                                        <View style={styles.rankAvatar}>
                                            <Text style={styles.rankAvatarText}>
                                                {(entry.display_name || entry.username).charAt(0).toUpperCase()}
                                            </Text>
                                        </View>
                                        <View style={styles.rankInfo}>
                                            <View style={styles.rankNameRow}>
                                                <Text style={styles.rankName}>{entry.display_name || entry.username}</Text>
                                                {entry.id === profile?.id && <Text style={styles.rankMeBadge}>toi</Text>}
                                            </View>
                                            <Text style={styles.rankSub}>{entry.weekly_workouts || 0} séances cette semaine</Text>
                                        </View>
                                        <View style={styles.rankStatWrap}>
                                            <Text style={styles.rankXp}>{entry.weekly_xp} xp</Text>
                                            {entry.id !== profile?.id && (
                                                <TouchableOpacity
                                                    style={styles.encourageIconButton}
                                                    onPress={() => handleEncourage(entry.id, entry.display_name || entry.username)}
                                                >
                                                    <Heart size={15} color={Colors.cta} />
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                ))}
                            </GlassCard>
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionLabel}>Feed amis</Text>
                            <TouchableOpacity onPress={loadFeed}>
                                <Text style={styles.sectionLink}>Actualiser</Text>
                            </TouchableOpacity>
                        </View>

                        {feedError && <Text style={styles.errorText}>{feedError}</Text>}

                        <GlassCard style={styles.feedCard}>
                            {displayedFeedItems.length === 0 ? (
                                <View style={styles.emptyFeed}>
                                    <Text style={styles.emptyFriendsTitle}>Pas d'activité récente</Text>
                                    <Text style={styles.emptyFriendsText}>Encourage tes amis pour démarrer le feed social.</Text>
                                </View>
                            ) : (
                                displayedFeedItems.slice(0, 8).map((item, index) => (
                                    <View key={item.id} style={[styles.feedRow, index < Math.min(displayedFeedItems.length, 8) - 1 && styles.feedRowBorder]}>
                                        <View style={styles.feedAvatar}>
                                            <Text style={styles.feedAvatarText}>{item.actorName.charAt(0).toUpperCase()}</Text>
                                        </View>
                                        <View style={styles.feedContent}>
                                            <Text style={styles.feedTitle}>{item.actorName}</Text>
                                            <Text style={styles.feedDetail}>{item.detail} · {item.message}</Text>
                                            <View style={styles.feedFooter}>
                                                <Text style={styles.feedTime}>{relativeTimeLabel(item.createdAt)}</Text>
                                                <View style={styles.feedReactions}>
                                                    <TouchableOpacity
                                                        style={styles.feedReactionBtn}
                                                        disabled={reactingFeedItemId === item.id}
                                                        onPress={() => handleReactFeed(item, 'bravo')}
                                                    >
                                                        <Text style={styles.feedReactionText}>Bravo</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.feedReactionBtn}
                                                        disabled={reactingFeedItemId === item.id}
                                                        onPress={() => handleReactFeed(item, 'feu')}
                                                    >
                                                        <Text style={styles.feedReactionText}>Feu</Text>
                                                    </TouchableOpacity>
                                                    <TouchableOpacity
                                                        style={styles.feedReactionBtn}
                                                        disabled={reactingFeedItemId === item.id}
                                                        onPress={() => handleReactFeed(item, 'courage')}
                                                    >
                                                        <Text style={styles.feedReactionText}>Courage</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            </View>
                                        </View>
                                    </View>
                                ))
                            )}
                        </GlassCard>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(240).springify()} style={styles.section}>
                        <TouchableOpacity style={styles.newChallengeCard} onPress={() => challengeSheetRef.current?.present()}>
                            <View style={styles.newChallengeIconWrap}>
                                <Plus size={22} color={Colors.cta} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.newChallengeTitle}>Lancer un nouveau challenge</Text>
                                <Text style={styles.newChallengeSubtitle}>Défie tes amis sur la semaine ou le mois</Text>
                            </View>
                            <ChevronRight size={18} color={Colors.muted} />
                        </TouchableOpacity>
                    </Animated.View>

                    <View style={{ height: 96 }} />
                </ScrollView>

                <TrueSheet
                    ref={challengeSheetRef}
                    detents={[0.65]}
                    cornerRadius={30}
                    backgroundColor={Colors.bg}
                    grabber={true}
                    scrollable={true}
                >
                    <View style={styles.sheetBody}>
                        <Text style={styles.sheetTitle}>Nouveau challenge</Text>
                        <Text style={styles.sheetSubtitle}>Crée un challenge et commence à motiver tes amis.</Text>

                        <TextInput
                            style={styles.sheetInput}
                            placeholder="Titre du challenge"
                            placeholderTextColor={Colors.muted2}
                            value={challengeTitle}
                            onChangeText={setChallengeTitle}
                        />

                        <View style={styles.goalTypeRow}>
                            {(['workouts', 'distance', 'duration', 'xp'] as SocialChallengeGoalType[]).map(goal => (
                                <TouchableOpacity
                                    key={goal}
                                    style={[styles.goalTypeChip, challengeGoalType === goal && styles.goalTypeChipActive]}
                                    onPress={() => setChallengeGoalType(goal)}
                                >
                                    <Text style={[styles.goalTypeChipText, challengeGoalType === goal && styles.goalTypeChipTextActive]}>
                                        {goal === 'workouts' ? 'Séances' : goal === 'distance' ? 'Distance' : goal === 'duration' ? 'Durée' : 'XP'}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.sheetInputRow}>
                            <TextInput
                                style={[styles.sheetInput, styles.sheetInputHalf]}
                                placeholder="Objectif"
                                placeholderTextColor={Colors.muted2}
                                keyboardType="numeric"
                                value={challengeGoalTarget}
                                onChangeText={setChallengeGoalTarget}
                            />
                            <TextInput
                                style={[styles.sheetInput, styles.sheetInputHalf]}
                                placeholder="Durée (jours)"
                                placeholderTextColor={Colors.muted2}
                                keyboardType="numeric"
                                value={challengeDurationDays}
                                onChangeText={setChallengeDurationDays}
                            />
                        </View>

                        <View style={styles.sheetActions}>
                            <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => challengeSheetRef.current?.dismiss()}>
                                <Text style={styles.sheetCancelText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.sheetCreateBtn}
                                disabled={isCreatingChallenge}
                                onPress={handleCreateChallenge}
                            >
                                <Text style={styles.sheetCreateText}>{isCreatingChallenge ? 'Création...' : 'Créer'}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TrueSheet>
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
    topTabs: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    topTab: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
    },
    topTabActive: {
        backgroundColor: Colors.overlay,
        borderWidth: 1,
        borderColor: Colors.stroke,
    },
    topTabText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    topTabTextActive: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
    section: {
        marginBottom: Spacing.md,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.7,
    },
    sectionLink: {
        color: Colors.violet,
        fontSize: FontSize.sm,
    },
    challengeCarousel: {
        gap: Spacing.md,
        paddingRight: Spacing.md,
    },
    challengeCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
    },
    challengeKicker: {
        color: Colors.textWhite80,
        fontSize: FontSize.xs,
        marginBottom: 6,
    },
    challengeTitle: {
        color: Colors.white,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.md,
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite20,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.violet,
    },
    challengeMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
    },
    challengeMetaText: {
        color: Colors.textWhite80,
        fontSize: FontSize.xs,
    },
    challengeActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    challengeGhostBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlayWhite12,
        alignItems: 'center',
    },
    challengeGhostBtnText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    challengeSolidBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        alignItems: 'center',
    },
    challengeSolidBtnText: {
        color: Colors.violetDeep,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    dotRow: {
        marginTop: Spacing.sm,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite20,
    },
    dotActive: {
        backgroundColor: Colors.violet,
        width: 20,
    },
    leaderboardCard: {
        padding: Spacing.md,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    rankRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.overlayWhite08,
    },
    rankNumber: {
        width: 24,
        color: Colors.muted,
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
    },
    rankAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.overlayViolet15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankAvatarText: {
        color: Colors.violet,
        fontWeight: FontWeight.bold,
    },
    rankInfo: {
        flex: 1,
    },
    rankNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rankName: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.md,
    },
    rankMeBadge: {
        fontSize: 10,
        color: Colors.violetDeep,
        backgroundColor: Colors.overlayWhite20,
        borderRadius: BorderRadius.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    rankSub: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    rankStatWrap: {
        alignItems: 'flex-end',
        gap: 4,
    },
    rankXp: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    encourageIconButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.overlayCozyWarm15,
    },
    emptyFriendsCard: {
        padding: Spacing.md,
        gap: Spacing.sm,
    },
    emptyFriendsTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    emptyFriendsText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    emptyFriendsActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: 4,
    },
    inlinePrimaryBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: Spacing.sm,
    },
    inlinePrimaryBtnText: {
        color: Colors.cta,
        fontWeight: FontWeight.semibold,
    },
    inlineGhostBtn: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        paddingHorizontal: Spacing.md,
        justifyContent: 'center',
    },
    inlineGhostBtnText: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
    searchPanel: {
        marginTop: Spacing.sm,
        gap: Spacing.xs,
    },
    searchInputWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        paddingHorizontal: Spacing.sm,
    },
    searchInput: {
        flex: 1,
        color: Colors.text,
        fontSize: FontSize.sm,
        paddingVertical: 10,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    searchResultName: {
        color: Colors.text,
        fontSize: FontSize.sm,
    },
    searchResultAction: {
        color: Colors.violet,
        fontWeight: FontWeight.semibold,
    },
    searchResultBadge: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    feedCard: {
        padding: Spacing.md,
    },
    feedRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    feedRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: Colors.overlayWhite08,
    },
    feedAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.overlayTeal20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    feedAvatarText: {
        color: Colors.teal,
        fontWeight: FontWeight.bold,
    },
    feedContent: {
        flex: 1,
    },
    feedTitle: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    feedDetail: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        marginTop: 2,
    },
    feedFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    feedTime: {
        color: Colors.muted2,
        fontSize: 11,
    },
    feedReactions: {
        flexDirection: 'row',
        gap: 6,
    },
    feedReactionBtn: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.stroke,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        backgroundColor: Colors.overlay,
    },
    feedReactionText: {
        color: Colors.textSecondary,
        fontSize: 11,
        fontWeight: FontWeight.semibold,
    },
    emptyFeed: {
        paddingVertical: Spacing.md,
        gap: Spacing.xs,
    },
    newChallengeCard: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.overlayViolet35,
        borderStyle: 'dashed',
        backgroundColor: Colors.overlayViolet12,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    newChallengeIconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.overlayViolet20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    newChallengeTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    newChallengeSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        marginTop: 2,
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
        marginBottom: Spacing.xs,
    },
    sheetBody: {
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    sheetTitle: {
        color: Colors.text,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    sheetSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    sheetInput: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        color: Colors.text,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSize.sm,
    },
    goalTypeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: Spacing.xs,
    },
    goalTypeChip: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.stroke,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        backgroundColor: Colors.overlay,
    },
    goalTypeChipActive: {
        borderColor: Colors.overlayViolet35,
        backgroundColor: Colors.overlayViolet20,
    },
    goalTypeChipText: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    goalTypeChipTextActive: {
        color: Colors.violet,
    },
    sheetInputRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    sheetInputHalf: {
        flex: 1,
    },
    sheetActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    sheetCancelBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlay,
    },
    sheetCancelText: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
    sheetCreateBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.cta,
    },
    sheetCreateText: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
});
