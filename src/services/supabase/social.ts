// ============================================================================
// SOCIAL SERVICE - Friends, Leaderboard, Encouragements
// ============================================================================

import { supabase, getSupabaseClient } from './client';
import type { 
    Profile, 
    ProfileUpdate, 
    Friendship, 
    Encouragement, 
    LeaderboardEntry,
    BlockedUser,
} from './database.types';
import type { Entry, HomeWorkoutEntry, RunEntry, BeatSaberEntry, CustomSportEntry } from '../../types';
import { serviceLogger, errorLogger } from '../../utils/logger';
import { MAX_LEADERBOARD_RESULTS } from '../../constants/values';
import { isSportEntryType } from '../../constants/values';
import { fetchWithRetry } from '../network/httpClient';
import { computeChallengeProgressValueFromEntries } from '../../utils/socialChallenges';

function normalizeEnvValue(value: string | undefined): string {
    return `${value || ''}`.trim().replace(/^['"]|['"]$/g, '');
}

// Supabase URL for Edge Functions
const SUPABASE_URL = normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export type FriendProfile = Profile & { friendship_id: string };

export type SocialChallengeGoalType = 'workouts' | 'distance' | 'duration' | 'xp';

export type SocialChallengeFinishReason = 'active' | 'completed' | 'expired' | 'target_reached' | 'cancelled';

export interface SocialChallenge {
    id: string;
    title: string;
    description: string | null;
    goal_type: SocialChallengeGoalType;
    goal_target: number;
    starts_at: string;
    ends_at: string;
    status: 'active' | 'completed' | 'cancelled';
    creator_id: string;
    created_at: string;
}

export interface SocialChallengeProgress {
    challenge: SocialChallenge;
    my_progress: number;
    participants_count: number;
    preview_participants: Array<{ id: string; username: string; display_name: string | null; progress: number }>;
    participants: Array<{
        id: string;
        username: string;
        display_name: string | null;
        progress: number;
        completed_at: string | null;
    }>;
    my_rank: number | null;
    winner: {
        id: string;
        username: string;
        display_name: string | null;
        progress: number;
        completed_at: string | null;
        is_tie: boolean;
        tied_with_count: number;
    } | null;
    is_finished: boolean;
    finish_reason: SocialChallengeFinishReason;
}

export interface SocialFeedEventItem {
    id: string;
    actor_id: string;
    actor_name: string;
    event_type: 'workout' | 'challenge_progress' | 'streak' | 'encouragement';
    message: string;
    metadata: Record<string, unknown>;
    created_at: string;
    reactions_count: number;
    liked_by_me: boolean;
    liked_by_preview: Array<{ id: string; username: string; display_name: string | null }>;
}

const MAX_CHALLENGE_TITLE_LENGTH = 80;
const MAX_CHALLENGE_DESCRIPTION_LENGTH = 280;
const CHALLENGE_PROGRESS_EPSILON = 0.01;
const CHALLENGE_RANKING_EPSILON = 0.001;

interface ChallengeParticipantSummary {
    id: string;
    username: string;
    display_name: string | null;
    progress: number;
    completed_at: string | null;
}

interface SocialLeaderboardBotsFlag {
    is_enabled: boolean;
    config: {
        maxBots?: number;
    };
}

interface SocialLeaderboardBotRow {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    weekly_workouts: number;
    weekly_distance: number;
    weekly_duration: number;
    weekly_xp: number;
    current_streak: number;
    total_xp: number;
    level: number;
    is_enabled: boolean;
}

function toNumberOrZero(value: unknown): number {
    const parsed = Number(value || 0);
    return Number.isFinite(parsed) ? parsed : 0;
}

function sortLeaderboardRows(a: LeaderboardEntry, b: LeaderboardEntry): number {
    const xpDelta = (b.weekly_xp || 0) - (a.weekly_xp || 0);
    if (xpDelta !== 0) return xpDelta;

    const totalXpDelta = (b.total_xp || 0) - (a.total_xp || 0);
    if (totalXpDelta !== 0) return totalXpDelta;

    return (b.weekly_workouts || 0) - (a.weekly_workouts || 0);
}

function isActiveLeaderboardEntry(entry: Pick<LeaderboardEntry, 'weekly_xp' | 'weekly_workouts'>): boolean {
    return (entry.weekly_xp || 0) > 0 || (entry.weekly_workouts || 0) > 0;
}

async function getLeaderboardBots(): Promise<LeaderboardEntry[]> {
    if (!supabase) return [];

    const { data: flagRow, error: flagError } = await (supabase as NonNullable<typeof supabase>)
        .from('social_feature_flags')
        .select('is_enabled, config')
        .eq('flag_key', 'global_leaderboard_bots')
        .maybeSingle();

    if (flagError) {
        serviceLogger.warn('Unable to load leaderboard bot settings', flagError);
        return [];
    }

    const featureFlag = (flagRow || {
        is_enabled: true,
        config: {},
    }) as SocialLeaderboardBotsFlag;

    if (!featureFlag.is_enabled) {
        return [];
    }

    const maxBots = Math.max(0, Math.min(50, Number(featureFlag.config?.maxBots || 8)));
    if (maxBots === 0) {
        return [];
    }

    const { data: botRows, error: botError } = await (supabase as NonNullable<typeof supabase>)
        .from('social_leaderboard_bots')
        .select('*')
        .eq('is_enabled', true)
        .limit(maxBots);

    if (botError) {
        serviceLogger.warn('Unable to load leaderboard bots', botError);
        return [];
    }

    return ((botRows || []) as SocialLeaderboardBotRow[])
        .map((bot) => ({
            id: bot.id,
            username: bot.username,
            display_name: bot.display_name,
            avatar_url: bot.avatar_url,
            weekly_workouts: toNumberOrZero(bot.weekly_workouts),
            weekly_distance: toNumberOrZero(bot.weekly_distance),
            weekly_duration: toNumberOrZero(bot.weekly_duration),
            weekly_xp: toNumberOrZero(bot.weekly_xp),
            current_streak: toNumberOrZero(bot.current_streak),
            total_xp: toNumberOrZero(bot.total_xp),
            level: Math.max(1, toNumberOrZero(bot.level)),
            rank: 0,
        }))
        .filter(isActiveLeaderboardEntry);
}

function sanitizeTrimmedText(value: string, maxLength: number): string {
    return value.trim().slice(0, maxLength);
}

function safeTimestampMs(value: string | null | undefined): number {
    if (!value) return Number.POSITIVE_INFINITY;
    const ms = new Date(value).getTime();
    return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

function getParticipantDisplayName(participant: ChallengeParticipantSummary): string {
    return participant.display_name || participant.username;
}

function sortChallengeParticipants(a: ChallengeParticipantSummary, b: ChallengeParticipantSummary): number {
    const progressDelta = b.progress - a.progress;
    if (Math.abs(progressDelta) > CHALLENGE_RANKING_EPSILON) {
        return progressDelta;
    }

    const completedAtDelta = safeTimestampMs(a.completed_at) - safeTimestampMs(b.completed_at);
    if (completedAtDelta !== 0) {
        return completedAtDelta;
    }

    return getParticipantDisplayName(a).localeCompare(getParticipantDisplayName(b));
}

function deriveChallengeFinishState(
    challenge: SocialChallenge,
    participants: ChallengeParticipantSummary[]
): { isFinished: boolean; reason: SocialChallengeFinishReason } {
    if (challenge.status === 'cancelled') {
        return { isFinished: true, reason: 'cancelled' };
    }

    if (challenge.status === 'completed') {
        return { isFinished: true, reason: 'completed' };
    }

    const goalTarget = Number(challenge.goal_target || 0);
    const topProgress = participants[0]?.progress || 0;
    if (goalTarget > 0 && topProgress >= goalTarget) {
        return { isFinished: true, reason: 'target_reached' };
    }

    const endsAtMs = new Date(challenge.ends_at).getTime();
    if (Number.isFinite(endsAtMs) && Date.now() >= endsAtMs) {
        return { isFinished: true, reason: 'expired' };
    }

    return { isFinished: false, reason: 'active' };
}

export function computeChallengeProgressValue(
    entries: Entry[],
    challenge: Pick<SocialChallenge, 'goal_type' | 'starts_at' | 'ends_at'>
): number {
    return computeChallengeProgressValueFromEntries(entries, challenge);
}

// ============================================================================
// AUTH & PROFILE
// ============================================================================

export async function signUp(email: string, password: string, username: string) {
    const client = getSupabaseClient();
    
    // Check username availability
    const { data: existing } = await client
        .from('profiles')
        .select('id')
        .eq('username', username.toLowerCase())
        .single();
    
    if (existing) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    const { data: authData, error: authError } = await client.auth.signUp({
        email,
        password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Erreur lors de la création du compte');

    // Create profile
    const { error: profileError } = await client
        .from('profiles')
        .insert({
            id: authData.user.id,
            username: username.toLowerCase(),
            display_name: username,
        });

    if (profileError) throw profileError;

    return authData;
}

export async function signIn(email: string, password: string) {
    const client = getSupabaseClient();
    
    const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

export async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}

export async function getCurrentUser() {
    if (!supabase) return null;
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

async function getFreshAccessToken(client = getSupabaseClient()): Promise<string | null> {
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) {
        serviceLogger.warn('Unable to read auth session before edge function call', sessionError);
    }

    if (!session) {
        return null;
    }

    const nowEpoch = Math.floor(Date.now() / 1000);
    const expiresAt = Number(session.expires_at || 0);
    const isExpiringSoon = !expiresAt || expiresAt - nowEpoch <= 45;

    if (!isExpiringSoon) {
        return session.access_token || null;
    }

    const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
    if (refreshError) {
        serviceLogger.warn('Failed to refresh auth session before edge function call', refreshError);
        return session.access_token || null;
    }

    return refreshData.session?.access_token || session.access_token || null;
}

export async function getProfile(userId: string): Promise<Profile | null> {
    if (!supabase) return null;
    
    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) return null;
    return data as Profile;
}

export async function getMyProfile(): Promise<Profile | null> {
    const user = await getCurrentUser();
    if (!user) return null;
    return getProfile(user.id);
}

export async function updateProfile(updates: ProfileUpdate): Promise<Profile | null> {
    if (!supabase) return null;
    const user = await getCurrentUser();
    if (!user) return null;

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

    if (error) throw error;
    return data as Profile;
}

export async function updateUsername(newUsername: string): Promise<void> {
    const client = getSupabaseClient();
    
    // Check availability
    const { data: existing } = await client
        .from('profiles')
        .select('id')
        .eq('username', newUsername.toLowerCase())
        .single();
    
    if (existing) {
        throw new Error('Ce nom d\'utilisateur est déjà pris');
    }

    await updateProfile({ username: newUsername.toLowerCase(), display_name: newUsername });
}

export async function savePushToken(token: string): Promise<void> {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    const sanitizedToken = token.trim();
    if (!sanitizedToken) return;

    const nowIso = new Date().toISOString();
    const { error: privateError } = await (supabase as NonNullable<typeof supabase>)
        .from('profile_private')
        .upsert({
            id: user.id,
            push_token: sanitizedToken,
            updated_at: nowIso,
        }, { onConflict: 'id' });

    if (privateError) {
        serviceLogger.warn('profile_private unavailable, using legacy profiles.push_token fallback', privateError);
        const { error: legacyError } = await (supabase as NonNullable<typeof supabase>)
            .from('profiles')
            .update({ push_token: sanitizedToken })
            .eq('id', user.id);
        if (legacyError) throw legacyError;
        return;
    }

    // Best effort cleanup of legacy public token column.
    await (supabase as NonNullable<typeof supabase>)
        .from('profiles')
        .update({ push_token: null })
        .eq('id', user.id);
}

// ============================================================================
// RGPD - DELETE ALL USER DATA
// ============================================================================

/**
 * Supprime complètement le compte utilisateur (données + auth) via Edge Function
 * Conformité RGPD - suppression irréversible
 */
export async function deleteAllUserData(): Promise<void> {
    const client = getSupabaseClient();

    const accessToken = await getFreshAccessToken(client);
    if (!accessToken) {
        throw new Error('Not authenticated');
    }

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        throw new Error('Supabase Edge function configuration is missing');
    }

    // Appeler l'Edge Function qui a accès à service_role
    const response = await fetchWithRetry(
        `${SUPABASE_URL}/functions/v1/delete-account`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'apikey': SUPABASE_ANON_KEY,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                access_token: accessToken,
            }),
        },
        {
            timeoutMs: 15000,
            retries: 1,
            retryDelayMs: 700,
        }
    );

    if (!response.ok) {
        let errorMessage = 'Failed to delete account';
        try {
            const error = await response.json();
            errorMessage = error?.error || errorMessage;
        } catch (error) {
            if (__DEV__) {
                console.warn('[SocialService] Failed to parse delete-account error payload', error);
            }
        }
        throw new Error(errorMessage);
    }

    // Déconnecter localement (le token est maintenant invalide)
    await client.auth.signOut();
}

/**
 * Met à jour la visibilité dans le classement global
 */
export async function updateLeaderboardVisibility(isPublic: boolean): Promise<void> {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    await (supabase as NonNullable<typeof supabase>)
        .from('profiles')
        .update({ is_public: isPublic })
        .eq('id', user.id);
}

/**
 * Met a jour la preference "accepter les demandes d'ami"
 */
export async function updateFriendRequestAcceptance(acceptsFriendRequests: boolean): Promise<void> {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    await (supabase as NonNullable<typeof supabase>)
        .from('profiles')
        .update({ accepts_friend_requests: acceptsFriendRequests })
        .eq('id', user.id);
}

// ============================================================================
// SYNC STATS
// ============================================================================

export async function syncWeeklyStats(stats: {
    workouts: number;
    distance: number;
    duration: number;
    xp: number;
    streak: number;
    bestStreak: number;
    totalXp: number;
    level: number;
}) {
    if (!supabase) return;
    const user = await getCurrentUser();
    if (!user) return;

    await (supabase as NonNullable<typeof supabase>)
        .from('profiles')
        .update({
            weekly_workouts: stats.workouts,
            weekly_distance: stats.distance,
            weekly_duration: stats.duration,
            weekly_xp: stats.xp,
            current_streak: stats.streak,
            best_streak: stats.bestStreak,
            total_xp: stats.totalXp,
            level: stats.level,
        })
        .eq('id', user.id);
}

// ============================================================================
// LEADERBOARD
// ============================================================================

export async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();

    const [botRows, blockedIds] = await Promise.all([
        getLeaderboardBots(),
        user ? getBlockedUserIds() : Promise.resolve([]),
    ]);

    const overfetchAllowance = Math.min(30, blockedIds.length + botRows.length + 5);

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('weekly_leaderboard')
        .select('*')
        .limit(MAX_LEADERBOARD_RESULTS + overfetchAllowance);

    if (error) {
        errorLogger.error('Error fetching global leaderboard:', error);
        throw error;
    }

    const realRows = ((data || []) as LeaderboardEntry[])
        .filter(isActiveLeaderboardEntry);

    const visibleRealRows = blockedIds.length > 0
        ? realRows.filter((entry) => !blockedIds.includes(entry.id))
        : realRows;

    return [...visibleRealRows, ...botRows]
        .sort(sortLeaderboardRows)
        .slice(0, MAX_LEADERBOARD_RESULTS)
        .map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));
}

export async function getFriendsLeaderboard(): Promise<LeaderboardEntry[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .rpc('get_friends_leaderboard', { user_id: user.id });

    if (error) throw error;

    return ((data || []) as LeaderboardEntry[])
        .filter(isActiveLeaderboardEntry)
        .sort(sortLeaderboardRows)
        .map((entry, index) => ({
            ...entry,
            rank: index + 1,
        }));
}

// ============================================================================
// FRIENDS
// ============================================================================

export async function searchUsers(query: string) {
    if (!supabase || query.length < 2) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .rpc('search_users', { 
            search_query: query, 
            current_user_id: user.id 
        });

    if (error) throw error;
    return data || [];
}

export async function sendFriendRequest(addresseeId: string) {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client
        .from('friendships')
        .insert({
            requester_id: user.id,
            addressee_id: addresseeId,
        });

    if (error) throw error;
    
    // Call edge function to send push notification
    await sendPushNotification(addresseeId, 'friend_request', {
        route: '/social',
        rate_limit_key: `friend-request:${addresseeId}`,
        rate_limit_seconds: 30 * 60,
    });
}

export async function respondToFriendRequest(friendshipId: string, accept: boolean) {
    const client = getSupabaseClient();

    const { error } = await client
        .from('friendships')
        .update({ status: accept ? 'accepted' : 'rejected' })
        .eq('id', friendshipId);

    if (error) throw error;
}

export async function removeFriend(friendshipId: string) {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client
        .from('friendships')
        .delete()
        .or(
            `id.eq.${friendshipId},and(requester_id.eq.${user.id},addressee_id.eq.${friendshipId}),and(requester_id.eq.${friendshipId},addressee_id.eq.${user.id})`
        )
        .eq('status', 'accepted');

    if (error) throw error;
}

export async function getPendingRequests(): Promise<(Friendship & { requester: Profile })[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('friendships')
        .select(`
            *,
            requester:profiles!friendships_requester_id_fkey(*)
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

    if (error) throw error;
    return (data || []) as (Friendship & { requester: Profile })[];
}

export async function getFriends(): Promise<FriendProfile[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('friendships')
        .select(`
            id,
            requester:profiles!friendships_requester_id_fkey(*),
            addressee:profiles!friendships_addressee_id_fkey(*)
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq('status', 'accepted');

    if (error) throw error;

    type FriendshipRowWithProfiles = {
        id: string;
        requester: Profile;
        addressee: Profile;
    };
    const rows = (data || []) as FriendshipRowWithProfiles[];
    
    // Extract friend profiles
    return rows.map((f) => 
        ({
            ...(f.requester.id === user.id ? f.addressee : f.requester),
            friendship_id: f.id,
        })
    ) as FriendProfile[];
}

async function getFriendIdsForUser(userId: string): Promise<string[]> {
    if (!supabase) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('friendships')
        .select('requester_id, addressee_id')
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

    if (error) throw error;

    type FriendshipPairRow = {
        requester_id?: string;
        addressee_id?: string;
    };
    const rows = (data || []) as FriendshipPairRow[];

    return Array.from(new Set(
        rows
            .map((row) => (row.requester_id === userId ? row.addressee_id : row.requester_id))
            .filter((id): id is string => Boolean(id) && id !== userId)
    ));
}

// ============================================================================
// ENCOURAGEMENTS
// ============================================================================

const ENCOURAGEMENT_MESSAGES = [
    { emoji: '🔥', message: 'Tu gères ! Continue comme ça !' },
    { emoji: '💪', message: 'Force et honneur !' },
    { emoji: '⚡', message: 'Tu es inarrêtable !' },
    { emoji: '🚀', message: 'Direction les étoiles !' },
    { emoji: '👏', message: 'Bravo pour ta motivation !' },
    { emoji: '🏆', message: 'Tu es un champion !' },
    { emoji: '✨', message: 'Continue, tu brilles !' },
    { emoji: '🎯', message: 'Objectif en vue !' },
];

export async function sendEncouragement(receiverId: string, customMessage?: string) {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const random = ENCOURAGEMENT_MESSAGES[Math.floor(Math.random() * ENCOURAGEMENT_MESSAGES.length)];

    const { error } = await client
        .from('encouragements')
        .insert({
            sender_id: user.id,
            receiver_id: receiverId,
            message: customMessage || random.message,
            emoji: random.emoji,
        });

    if (error) throw error;
    
    // Call edge function to send push notification
    await sendPushNotification(receiverId, 'encouragement', {
        message: customMessage || random.message,
        emoji: random.emoji,
        route: '/social',
        rate_limit_key: `encouragement:${receiverId}`,
        rate_limit_seconds: 60 * 60,
    });
}

export async function getUnreadEncouragements(): Promise<(Encouragement & { sender: Profile })[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('encouragements')
        .select(`
            *,
            sender:profiles!encouragements_sender_id_fkey(*)
        `)
        .eq('receiver_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as (Encouragement & { sender: Profile })[];
}

export async function markEncouragementAsRead(encouragementId: string) {
    if (!supabase) return;

    await (supabase as NonNullable<typeof supabase>)
        .from('encouragements')
        .update({ read_at: new Date().toISOString() })
        .eq('id', encouragementId);
}

export async function getRecentEncouragements(limit = 10): Promise<(Encouragement & { sender: Profile })[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('encouragements')
        .select(`
            *,
            sender:profiles!encouragements_sender_id_fkey(*)
        `)
        .eq('receiver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return (data || []) as (Encouragement & { sender: Profile })[];
}

// ============================================================================
// CHALLENGES + FEED (Phase 2)
// ============================================================================

export async function getActiveSocialChallenges(): Promise<SocialChallengeProgress[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('social_challenge_participants')
        .select(`
            challenge_id,
            progress_value,
            challenge:social_challenges(*)
        `)
        .eq('user_id', user.id);

    if (error) throw error;

    type MyChallengeProgressRow = {
        challenge_id?: string;
        progress_value?: number;
        challenge?: SocialChallenge | null;
    };
    const rows = ((data || []) as MyChallengeProgressRow[])
        .filter(row => !!row.challenge);

    const challengeIds = rows
        .map(row => row.challenge_id as string)
        .filter(Boolean);

    if (challengeIds.length === 0) return [];

    const { data: participantsWithProfiles, error: participantsError } = await (supabase as NonNullable<typeof supabase>)
        .from('social_challenge_participants')
        .select(`
            challenge_id,
            progress_value,
            completed_at,
            user:profiles(id, username, display_name)
        `)
        .in('challenge_id', challengeIds)
        .order('progress_value', { ascending: false })
        .order('completed_at', { ascending: true, nullsFirst: false });

    if (participantsError) throw participantsError;

    const participantsByChallengeId = new Map<string, ChallengeParticipantSummary[]>();
    type ParticipantWithProfileRow = {
        challenge_id?: string;
        progress_value?: number;
        completed_at?: string | null;
        user?: {
            id: string;
            username: string;
            display_name: string | null;
        } | null;
    };
    ((participantsWithProfiles || []) as ParticipantWithProfileRow[]).forEach(item => {
        const challengeId = item.challenge_id as string;
        const userProfile = item.user;
        if (!challengeId || !userProfile) return;

        const current = participantsByChallengeId.get(challengeId) || [];
        participantsByChallengeId.set(challengeId, [
            ...current,
            {
                id: userProfile.id,
                username: userProfile.username,
                display_name: userProfile.display_name,
                progress: Number(item.progress_value || 0),
                completed_at: item.completed_at || null,
            },
        ]);
    });

    const enriched = rows
        .map(row => {
            const challenge = row.challenge as SocialChallenge;
            if (!challenge) return null;

            const participants = [...(participantsByChallengeId.get(challenge.id) || [])]
                .sort(sortChallengeParticipants);
            const previewParticipants = participants
                .slice(0, 3)
                .map((participant) => ({
                    id: participant.id,
                    username: participant.username,
                    display_name: participant.display_name,
                    progress: participant.progress,
                }));
            const finishState = deriveChallengeFinishState(challenge, participants);
            const myRank = participants.findIndex((participant) => participant.id === user.id);

            const winner = participants.length > 0 && finishState.isFinished
                ? (() => {
                    const topProgress = participants[0].progress;
                    const tiedParticipants = participants.filter((participant) => (
                        Math.abs(participant.progress - topProgress) <= CHALLENGE_RANKING_EPSILON
                    ));
                    const leadingParticipant = tiedParticipants[0] || participants[0];

                    return {
                        id: leadingParticipant.id,
                        username: leadingParticipant.username,
                        display_name: leadingParticipant.display_name,
                        progress: leadingParticipant.progress,
                        completed_at: leadingParticipant.completed_at,
                        is_tie: tiedParticipants.length > 1,
                        tied_with_count: tiedParticipants.length,
                    };
                })()
                : null;

            return {
                challenge,
                my_progress: Number(row.progress_value || 0),
                participants_count: participants.length,
                preview_participants: previewParticipants,
                participants,
                my_rank: myRank >= 0 ? myRank + 1 : null,
                winner,
                is_finished: finishState.isFinished,
                finish_reason: finishState.reason,
            } as SocialChallengeProgress;
        })
        .filter(Boolean) as SocialChallengeProgress[];

    return enriched.sort((a, b) => {
        if (a.is_finished !== b.is_finished) {
            return a.is_finished ? 1 : -1;
        }

        const aEndsAt = new Date(a.challenge.ends_at).getTime();
        const bEndsAt = new Date(b.challenge.ends_at).getTime();

        if (!a.is_finished) {
            return aEndsAt - bEndsAt;
        }

        return bEndsAt - aEndsAt;
    });
}

export async function createSocialChallenge(input: {
    title: string;
    description?: string;
    goalType: SocialChallengeGoalType;
    goalTarget: number;
    durationDays: number;
    invitedFriendIds: string[];
}): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + input.durationDays * 24 * 60 * 60 * 1000);
    const safeTitle = sanitizeTrimmedText(input.title, MAX_CHALLENGE_TITLE_LENGTH);
    const safeDescription = input.description
        ? sanitizeTrimmedText(input.description, MAX_CHALLENGE_DESCRIPTION_LENGTH)
        : null;

    if (!safeTitle) {
        throw new Error('Challenge title is required');
    }

    const invitedFriendIds = Array.from(new Set((input.invitedFriendIds || []).filter(Boolean)))
        .filter(friendId => friendId !== user.id);

    if (invitedFriendIds.length === 0) {
        throw new Error('At least one invited friend is required');
    }

    const { data: challenge, error: challengeError } = await client
        .from('social_challenges')
        .insert({
            creator_id: user.id,
            title: safeTitle,
            description: safeDescription,
            goal_type: input.goalType,
            goal_target: input.goalTarget,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            status: 'active',
        })
        .select('*')
        .single();

    if (challengeError) throw challengeError;

    const challengeId = challenge.id as string;

    const participantRows = [
        {
            challenge_id: challengeId,
            user_id: user.id,
            progress_value: 0,
        },
        ...invitedFriendIds.map(friendId => ({
            challenge_id: challengeId,
            user_id: friendId,
            progress_value: 0,
        })),
    ];

    const { error: participantError } = await client
        .from('social_challenge_participants')
        .insert(participantRows);

    if (participantError) throw participantError;

    // Create a feed event for visibility in the social hub.
    await client
        .from('social_feed_events')
        .insert({
            actor_id: user.id,
            event_type: 'challenge_progress',
            message: 'challenge_created',
            metadata: {
                challenge_id: challengeId,
                challenge_title: safeTitle,
                goal_type: input.goalType,
                goal_target: input.goalTarget,
                invited_count: invitedFriendIds.length,
            },
        });
}

export async function deleteSocialChallenge(challengeId: string): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client
        .from('social_challenges')
        .delete()
        .eq('id', challengeId)
        .eq('creator_id', user.id);

    if (error) throw error;
}

export async function leaveSocialChallenge(challengeId: string): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client
        .from('social_challenge_participants')
        .delete()
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

    if (error) throw error;
}

export async function syncActiveChallengeProgressFromEntries(entries: Entry[]): Promise<void> {
    let client;
    try {
        client = getSupabaseClient();
    } catch (error) {
        if (__DEV__) {
            console.warn('[SocialService] Supabase client unavailable for challenge sync', error);
        }
        return;
    }

    const user = await getCurrentUser();
    if (!user) return;

    const { data, error } = await client
        .from('social_challenge_participants')
        .select(`
            challenge_id,
            progress_value,
            completed_at,
            challenge:social_challenges(id, goal_type, goal_target, starts_at, ends_at, status)
        `)
        .eq('user_id', user.id);

    if (error) throw error;

    type ParticipantSyncRow = {
        challenge?: (SocialChallenge & { status?: string }) | null;
        progress_value?: number;
        completed_at?: string | null;
    };
    const rows = ((data || []) as ParticipantSyncRow[])
        .filter(row => row.challenge?.status === 'active');

    if (rows.length === 0) return;

    const nowIso = new Date().toISOString();

    await Promise.all(rows.map(async (row) => {
        const challenge = row.challenge as SocialChallenge | undefined;
        if (!challenge?.id) return;

        const nextProgress = computeChallengeProgressValue(entries, challenge);
        const safeProgress = Math.max(0, Math.round(nextProgress * 100) / 100);
        const currentProgress = Number(row.progress_value || 0);
        const goalTarget = Number(challenge.goal_target || 0);
        const isNowCompleted = goalTarget > 0 && safeProgress >= goalTarget;
        const nextCompletedAt = isNowCompleted ? (row.completed_at || nowIso) : null;

        const isProgressSame = Math.abs(currentProgress - safeProgress) < CHALLENGE_PROGRESS_EPSILON;
        const isCompletedAtSame = (row.completed_at || null) === nextCompletedAt;

        if (isProgressSame && isCompletedAtSame) {
            return;
        }

        const { error: updateError } = await client
            .from('social_challenge_participants')
            .update({
                progress_value: safeProgress,
                completed_at: nextCompletedAt,
            })
            .eq('challenge_id', challenge.id)
            .eq('user_id', user.id);

        if (updateError) throw updateError;
    }));
}

export async function shareWorkoutToFeed(input: {
    entryId: string;
    entryType: 'home' | 'run' | 'beatsaber' | 'custom';
    title: string;
    summary: string;
    createdAtIso: string;
    metadata?: Record<string, unknown>;
}): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const safeTitle = sanitizeTrimmedText(input.title, 120);
    const safeSummary = sanitizeTrimmedText(input.summary, 220);

    if (!safeTitle || !safeSummary) {
        throw new Error('Invalid workout payload');
    }

    const { data: insertedEvent, error } = await client
        .from('social_feed_events')
        .insert({
            actor_id: user.id,
            event_type: 'workout',
            message: 'workout_shared',
            metadata: {
                entry_id: input.entryId,
                entry_type: input.entryType,
                title: safeTitle,
                summary: safeSummary,
                source_created_at: input.createdAtIso,
                ...(input.metadata || {}),
            },
        })
        .select('id')
        .single();

    if (error) throw error;

    const eventId = insertedEvent?.id as string | undefined;
    if (!eventId) return;

    const friendIds = await getFriendIdsForUser(user.id);
    if (friendIds.length === 0) return;

    let senderName = 'Quelqu\'un';
    try {
        const senderProfile = await getProfile(user.id);
        senderName = senderProfile?.display_name || senderProfile?.username || senderName;
    } catch (error) {
        if (__DEV__) {
            console.warn('[SocialService] Failed to resolve sender profile for workout share notification', error);
        }
    }

    const notificationSummary = `${safeTitle} · ${safeSummary}`.slice(0, 140);

    await Promise.allSettled(friendIds.map((friendId) => (
        sendPushNotification(friendId, 'workout_shared', {
            sender_name: senderName,
            route: '/social',
            message: notificationSummary,
            social_event_id: eventId,
            workout_type: input.entryType,
            rate_limit_key: `workout-shared:${friendId}`,
            rate_limit_seconds: 20 * 60,
        })
    )));
}

function buildWorkoutShareSummary(entry: HomeWorkoutEntry | RunEntry | BeatSaberEntry | CustomSportEntry): {
    entryType: 'home' | 'run' | 'beatsaber' | 'custom';
    title: string;
    summary: string;
    metadata?: Record<string, unknown>;
} {
    if (entry.type === 'run') {
        const distance = Number(entry.distanceKm || 0).toFixed(2);
        const duration = Math.max(0, Math.round(Number(entry.durationMinutes || 0)));
        return {
            entryType: 'run',
            title: 'Sortie running',
            summary: `${distance} km en ${duration} min`,
        };
    }

    if (entry.type === 'beatsaber') {
        const duration = Math.max(0, Math.round(Number(entry.durationMinutes || 0)));
        return {
            entryType: 'beatsaber',
            title: 'Session Beat Saber',
            summary: `Session de ${duration} min`,
        };
    }

    if (entry.type === 'custom') {
        const customName = sanitizeTrimmedText(entry.name || 'Séance personnalisée', 80) || 'Séance personnalisée';

        const customParts: string[] = [];
        if (Number(entry.distanceKm || 0) > 0) {
            customParts.push(`${Number(entry.distanceKm).toFixed(2)} km`);
        }
        if (Number(entry.durationMinutes || 0) > 0) {
            customParts.push(`${Math.round(Number(entry.durationMinutes))} min`);
        }
        if (Number(entry.totalReps || 0) > 0) {
            customParts.push(`${Math.round(Number(entry.totalReps))} reps`);
        }

        return {
            entryType: 'custom',
            title: customName,
            summary: customParts.join(' · ') || 'Nouvelle séance enregistrée',
            metadata: {
                sport_id: entry.sportId,
            },
        };
    }

    const title = sanitizeTrimmedText(entry.name || 'Séance maison', 80) || 'Séance maison';
    const reps = Math.max(0, Math.round(Number(entry.totalReps || 0)));
    const duration = Math.max(0, Math.round(Number(entry.durationMinutes || 0)));

    let summary = '';
    if (reps > 0 && duration > 0) {
        summary = `${reps} reps en ${duration} min`;
    } else if (reps > 0) {
        summary = `${reps} reps`;
    } else if (duration > 0) {
        summary = `Session de ${duration} min`;
    } else {
        const firstExerciseLine = sanitizeTrimmedText((entry.exercises || '').split('\n')[0] || '', 120);
        summary = firstExerciseLine || 'Nouvelle séance enregistrée';
    }

    return {
        entryType: 'home',
        title,
        summary,
    };
}

export async function shareSportEntryToFeed(
    entry: HomeWorkoutEntry | RunEntry | BeatSaberEntry | CustomSportEntry
): Promise<void> {
    const shareData = buildWorkoutShareSummary(entry);
    await shareWorkoutToFeed({
        entryId: entry.id,
        entryType: shareData.entryType,
        title: shareData.title,
        summary: shareData.summary,
        createdAtIso: entry.createdAt,
        metadata: shareData.metadata,
    });
}

export async function getSocialFeed(limit = 10): Promise<SocialFeedEventItem[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('social_feed_events')
        .select(`
            id,
            actor_id,
            event_type,
            message,
            metadata,
            created_at,
            actor:profiles!social_feed_events_actor_id_fkey(id, username, display_name),
            reactions:social_feed_reactions(
                user_id,
                reaction,
                user:profiles!social_feed_reactions_user_id_fkey(id, username, display_name)
            )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) throw error;

    type FeedReactionRow = {
        user_id?: string;
        reaction?: string;
        user?: {
            id: string;
            username: string;
            display_name: string | null;
        } | null;
    };

    type FeedEventRow = {
        id: string;
        actor_id: string;
        actor?: {
            display_name?: string | null;
            username?: string | null;
        } | null;
        event_type: SocialFeedEventItem['event_type'];
        message: string;
        metadata?: Record<string, unknown>;
        created_at: string;
        reactions?: FeedReactionRow[];
    };

    return ((data || []) as FeedEventRow[]).map(item => {
        const reactions = item.reactions || [];
        const likes = reactions.filter((reactionItem) => reactionItem?.reaction === 'like');

        return {
        id: item.id,
        actor_id: item.actor_id,
        actor_name: item.actor?.display_name || item.actor?.username || 'Utilisateur',
        event_type: item.event_type,
        message: item.message,
        metadata: item.metadata || {},
        created_at: item.created_at,
        reactions_count: likes.length,
        liked_by_me: likes.some((reactionItem) => reactionItem?.user_id === user.id),
        liked_by_preview: likes
            .filter((reactionItem) => reactionItem?.user)
            .map((reactionItem) => ({
                id: reactionItem.user.id,
                username: reactionItem.user.username,
                display_name: reactionItem.user.display_name,
            }))
            .slice(0, 4),
    };
    }) as SocialFeedEventItem[];
}

export async function deleteMySharedWorkoutEvent(eventId: string): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client
        .from('social_feed_events')
        .delete()
        .eq('id', eventId)
        .eq('actor_id', user.id)
        .eq('event_type', 'workout');

    if (error) throw error;
}

export async function setSocialFeedReaction(eventId: string, reaction: string): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    if (reaction !== 'like') {
        throw new Error('Unsupported reaction');
    }

    const { error } = await client
        .from('social_feed_reactions')
        .upsert(
            {
                event_id: eventId,
                user_id: user.id,
                reaction,
            },
            { onConflict: 'event_id,user_id' }
        );

    if (error) throw error;
}

export async function toggleSocialFeedReaction(eventId: string): Promise<{ liked: boolean }> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existingReaction, error: existingReactionError } = await client
        .from('social_feed_reactions')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .eq('reaction', 'like')
        .maybeSingle();

    if (existingReactionError) throw existingReactionError;

    if (existingReaction?.id) {
        const { error: removeError } = await client
            .from('social_feed_reactions')
            .delete()
            .eq('id', existingReaction.id);

        if (removeError) throw removeError;
        return { liked: false };
    }

    await setSocialFeedReaction(eventId, 'like');

    const { data: feedEvent, error: feedEventError } = await client
        .from('social_feed_events')
        .select('id, actor_id, metadata')
        .eq('id', eventId)
        .single();

    if (!feedEventError && feedEvent?.actor_id && feedEvent.actor_id !== user.id) {
        const workoutTitle = (feedEvent.metadata?.title as string | undefined)?.slice(0, 80);
        await sendPushNotification(feedEvent.actor_id as string, 'workout_liked', {
            route: '/social',
            message: workoutTitle,
            social_event_id: eventId,
            rate_limit_key: `workout-liked:${eventId}:${user.id}`,
            rate_limit_seconds: 12 * 60 * 60,
        });
    }

    return { liked: true };
}

// ============================================================================
// PUSH NOTIFICATIONS via Edge Function
// ============================================================================

let senderNameCache: { userId: string; name: string; expiresAt: number } | null = null;

async function resolveSenderName(userId: string, explicitName?: string): Promise<string> {
    if (explicitName && explicitName.trim()) {
        return explicitName.trim();
    }

    const now = Date.now();
    if (senderNameCache && senderNameCache.userId === userId && senderNameCache.expiresAt > now) {
        return senderNameCache.name;
    }

    const senderProfile = await getProfile(userId);
    const senderName = senderProfile?.display_name || senderProfile?.username || 'Quelqu\'un';
    senderNameCache = {
        userId,
        name: senderName,
        expiresAt: now + 60 * 1000,
    };
    return senderName;
}

async function sendPushNotification(
    receiverId: string,
    type: 'friend_request' | 'encouragement' | 'workout_shared' | 'workout_liked',
    data?: {
        sender_name?: string;
        message?: string;
        emoji?: string;
        route?: string;
        rate_limit_key?: string;
        rate_limit_seconds?: number;
        social_event_id?: string;
        workout_type?: string;
    }
) {
    if (!supabase) return;
    
    const user = await getCurrentUser();
    if (!user) return;

    let senderName = 'Quelqu\'un';
    try {
        senderName = await resolveSenderName(user.id, data?.sender_name);
    } catch (error) {
        if (__DEV__) {
            console.warn('[SocialService] Failed to resolve sender name for push notification', error);
        }
    }
    
    let title: string;
    let body: string;
    
    if (type === 'friend_request') {
        title = '👋 Nouvelle demande d\'ami';
        body = `${senderName} veut être ton ami !`;
    } else if (type === 'encouragement') {
        title = `${data?.emoji || '💪'} ${senderName} t'encourage !`;
        body = data?.message || 'Continue comme ça !';
    } else if (type === 'workout_shared') {
        title = 'Nouveau partage sportif';
        body = `${senderName} vient de terminer une séance`;
    } else {
        title = 'Nouveau like';
        body = `${senderName} a aimé ta séance`;
    }
    
    try {
        const accessToken = await getFreshAccessToken();
        if (!accessToken) {
            return;
        }

        const { data: invokeData, error: invokeError } = await supabase.functions.invoke('send-push-notification', {
            headers: {
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
                apikey: SUPABASE_ANON_KEY,
            },
            body: {
                access_token: accessToken,
                receiver_id: receiverId,
                title,
                body,
                data: {
                    type,
                    sender_id: user.id,
                    route: data?.route,
                    social_event_id: data?.social_event_id,
                    workout_type: data?.workout_type,
                    workout_summary: data?.message,
                    rate_limit_key: data?.rate_limit_key,
                    rate_limit_seconds: data?.rate_limit_seconds,
                },
            },
        });

        if (invokeError) {
            console.warn('[push] Edge function call failed', {
                type,
                receiverId,
                message: invokeError.message,
            });
            return;
        }

        const invokePayload = (invokeData && typeof invokeData === 'object')
            ? (invokeData as {
                success?: boolean;
                provider_error?: unknown;
                provider_message?: unknown;
            })
            : null;

        if (invokePayload?.success === false) {
            console.warn('[push] Provider rejected notification', {
                type,
                receiverId,
                providerError: invokePayload.provider_error,
                providerMessage: invokePayload.provider_message,
            });
        }
    } catch (error) {
        // Fail silently - notifications are optional
        console.log('Push notification failed:', error);
    }
}

// ============================================================================
// REALTIME SUBSCRIPTIONS
// ============================================================================

// Store active subscriptions for cleanup
const activeSubscriptions: (() => void)[] = [];

export function subscribeToEncouragements(
    userId: string,
    callback: (encouragement: Encouragement) => void
) {
    if (!supabase) return () => {};

    const client = supabase;
    const subscription = client
        .channel(`encouragements:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'encouragements',
                filter: `receiver_id=eq.${userId}`,
            },
            async (payload) => {
                // Fetch the complete encouragement with sender info
                const insertedId = (payload.new as { id?: string }).id;
                if (!insertedId) return;

                const { data } = await client
                    .from('encouragements')
                    .select(`
                        *,
                        sender:profiles!encouragements_sender_id_fkey(id, username, display_name)
                    `)
                    .eq('id', insertedId)
                    .single();
                
                if (data) {
                    callback(data as Encouragement);
                }
            }
        )
        .subscribe();

    const cleanup = () => subscription.unsubscribe();
    activeSubscriptions.push(cleanup);
    return cleanup;
}

export function subscribeToFriendRequests(
    userId: string,
    callback: (friendship: Friendship) => void
) {
    if (!supabase) return () => {};

    const client = supabase;
    const subscription = client
        .channel(`friendships:${userId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'friendships',
                filter: `addressee_id=eq.${userId}`,
            },
            async (payload) => {
                // Fetch the complete friendship with requester info
                const insertedId = (payload.new as { id?: string }).id;
                if (!insertedId) return;

                const { data } = await client
                    .from('friendships')
                    .select(`
                        *,
                        requester:profiles!friendships_requester_id_fkey(id, username, display_name)
                    `)
                    .eq('id', insertedId)
                    .single();
                
                if (data) {
                    callback(data as Friendship);
                }
            }
        )
        .subscribe();

    const cleanup = () => subscription.unsubscribe();
    activeSubscriptions.push(cleanup);
    return cleanup;
}

export function unsubscribeAll() {
    activeSubscriptions.forEach(cleanup => cleanup());
    activeSubscriptions.length = 0;
}

// ============================================================================
// BLOCK USERS
// ============================================================================

/**
 * Block a user - prevents all interactions (friend requests, encouragements, visibility in leaderboards)
 */
export async function blockUser(blockedUserId: string): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    // Insert blocked_users record
    const { error } = await client
        .from('blocked_users')
        .insert({
            blocker_id: user.id,
            blocked_id: blockedUserId,
        });

    if (error) throw error;

    // Also remove any existing friendship
    await client
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${blockedUserId}),and(requester_id.eq.${blockedUserId},addressee_id.eq.${user.id})`);
}

/**
 * Unblock a user
 */
export async function unblockUser(blockedUserId: string): Promise<void> {
    const client = getSupabaseClient();
    const user = await getCurrentUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await client
        .from('blocked_users')
        .delete()
        .eq('blocker_id', user.id)
        .eq('blocked_id', blockedUserId);

    if (error) throw error;
}

/**
 * Get list of blocked users
 */
export async function getBlockedUsers(): Promise<Profile[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('blocked_users')
        .select(`
            blocked:profiles!blocked_users_blocked_id_fkey(*)
        `)
        .eq('blocker_id', user.id);

    if (error) return [];

    type BlockedUserRow = {
        blocked?: Profile | null;
    };

    return ((data || []) as BlockedUserRow[])
        .map((item) => item.blocked)
        .filter((blocked): blocked is Profile => Boolean(blocked));
}

/**
 * Get IDs of blocked users (for filtering)
 */
export async function getBlockedUserIds(): Promise<string[]> {
    if (!supabase) return [];
    const user = await getCurrentUser();
    if (!user) return [];

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

    if (error) return [];

    type BlockedIdRow = {
        blocked_id?: string | null;
    };

    return ((data || []) as BlockedIdRow[])
        .map((item) => item.blocked_id)
        .filter((blockedId): blockedId is string => Boolean(blockedId));
}

/**
 * Check if a user is blocked
 */
export async function isUserBlocked(userId: string): Promise<boolean> {
    if (!supabase) return false;
    const user = await getCurrentUser();
    if (!user) return false;

    const { data, error } = await (supabase as NonNullable<typeof supabase>)
        .from('blocked_users')
        .select('id')
        .eq('blocker_id', user.id)
        .eq('blocked_id', userId)
        .single();

    return !error && !!data;
}
