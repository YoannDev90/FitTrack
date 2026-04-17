// ============================================================================
// SOCIAL STORE - Zustand store for social features
// ============================================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '../storage';
import type { Profile, LeaderboardEntry, Encouragement, Friendship, FriendProfile } from '../services/supabase';
import * as SocialService from '../services/supabase/social';
import { isSocialAvailable } from '../services/supabase';
import * as Notifications from '../services/notifications';
import { storeLogger, errorLogger } from '../utils/logger';
import { STORAGE_KEYS } from '../constants/values';

// ============================================================================
// TYPES
// ============================================================================

interface SocialState {
    // Auth state
    isAuthenticated: boolean;
    isLoading: boolean;
    profile: Profile | null;
    
    // Social features enabled
    socialEnabled: boolean;
    
    // Leaderboard
    globalLeaderboard: LeaderboardEntry[];
    friendsLeaderboard: LeaderboardEntry[];
    globalLeaderboardError: 'network' | 'server' | null;
    friendsLeaderboardError: 'network' | 'server' | null;
    
    // Friends
    friends: FriendProfile[];
    pendingRequests: (Friendship & { requester: Profile })[];
    friendsError: 'network' | 'server' | null;
    
    // Blocked users
    blockedUsers: Profile[];
    
    // Encouragements
    unreadEncouragements: (Encouragement & { sender: Profile })[];
    recentEncouragements: (Encouragement & { sender: Profile })[];
    encouragementsError: 'network' | 'server' | null;

    // Internal runtime guards
    lastAuthCheckAt: number;
    lastPushTokenCheckAt: number;
    lastPushToken: string | null;
    isRegisteringPushToken: boolean;
    
    // Actions - Auth
    checkAuth: () => Promise<void>;
    signUp: (email: string, password: string, username: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    
    // Actions - Profile
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
    updateUsername: (username: string) => Promise<void>;
    
    // Actions - Social toggle
    setSocialEnabled: (enabled: boolean) => Promise<void>;
    
    // Actions - RGPD
    disableSocialAndDeleteData: () => Promise<void>;
    updateLeaderboardVisibility: (isPublic: boolean) => Promise<void>;
    updateFriendRequestAcceptance: (acceptsFriendRequests: boolean) => Promise<void>;
    
    // Actions - Sync
    syncStats: (stats: {
        workouts: number;
        distance: number;
        duration: number;
        xp: number;
        streak: number;
        bestStreak: number;
        totalXp: number;
        level: number;
    }) => Promise<void>;
    
    // Actions - Leaderboard
    fetchGlobalLeaderboard: () => Promise<void>;
    fetchFriendsLeaderboard: () => Promise<void>;
    
    // Actions - Friends
    fetchFriends: () => Promise<void>;
    fetchPendingRequests: () => Promise<void>;
    sendFriendRequest: (userId: string) => Promise<void>;
    respondToRequest: (friendshipId: string, accept: boolean) => Promise<void>;
    removeFriend: (friendshipId: string) => Promise<void>;
    searchUsers: (query: string) => Promise<SocialSearchResult[]>;
    
    // Actions - Blocked Users
    fetchBlockedUsers: () => Promise<void>;
    blockUser: (userId: string) => Promise<void>;
    unblockUser: (userId: string) => Promise<void>;
    isUserBlocked: (userId: string) => Promise<boolean>;
    
    // Actions - Encouragements
    fetchEncouragements: () => Promise<void>;
    sendEncouragement: (userId: string, message?: string) => Promise<void>;
    markAsRead: (encouragementId: string) => Promise<void>;
    
    // Actions - Notifications
    initializeNotifications: () => Promise<void>;
    setupRealtimeSubscriptions: () => void;
    cleanupSubscriptions: () => void;
    savePushToken: (token: string) => Promise<void>;
    registerPushTokenAfterAuth: () => Promise<void>;
}

type SocialSearchResult = Profile & {
    friendship_status: 'pending' | 'accepted' | 'rejected' | 'blocked' | null;
};

function classifySocialError(error: unknown): 'network' | 'server' {
    const message = (error instanceof Error ? error.message : typeof error === 'string' ? error : '').toLowerCase();
    if (
        message.includes('network') ||
        message.includes('fetch') ||
        message.includes('offline') ||
        message.includes('timed out')
    ) {
        return 'network';
    }
    return 'server';
}

const AUTH_RECHECK_INTERVAL_MS = 60 * 1000;
const PUSH_TOKEN_RECHECK_INTERVAL_MS = 30 * 60 * 1000;

// ============================================================================
// STORE
// ============================================================================

export const useSocialStore = create<SocialState>()(
    persist(
        (set, get) => ({
            // Initial state
            isAuthenticated: false,
            isLoading: false,
            profile: null,
            socialEnabled: true,
            globalLeaderboard: [],
            friendsLeaderboard: [],
            globalLeaderboardError: null,
            friendsLeaderboardError: null,
            friends: [],
            pendingRequests: [],
            friendsError: null,
            blockedUsers: [],
            unreadEncouragements: [],
            recentEncouragements: [],
            encouragementsError: null,
            lastAuthCheckAt: 0,
            lastPushTokenCheckAt: 0,
            lastPushToken: null,
            isRegisteringPushToken: false,

            // ========================================
            // AUTH
            // ========================================

            checkAuth: async () => {
                if (!isSocialAvailable()) return;

                const state = get();
                const now = Date.now();

                if (state.isLoading) return;
                if (state.lastAuthCheckAt > 0 && now - state.lastAuthCheckAt < AUTH_RECHECK_INTERVAL_MS) {
                    return;
                }
                
                set({ isLoading: true });
                try {
                    const profile = await SocialService.getMyProfile();
                    if (!profile) {
                        get().cleanupSubscriptions();
                    }
                    set({ 
                        isAuthenticated: !!profile,
                        profile,
                        isLoading: false,
                        lastAuthCheckAt: now,
                    });
                    
                    // If authenticated, try to register/update push token
                    if (profile) {
                        get().registerPushTokenAfterAuth();
                    }
                } catch (error) {
                    if (__DEV__) {
                        console.warn('[SocialStore] checkAuth failed', error);
                    }
                    get().cleanupSubscriptions();
                    set({ isAuthenticated: false, profile: null, isLoading: false, lastAuthCheckAt: now });
                }
            },

            signUp: async (email, password, username) => {
                if (!isSocialAvailable()) throw new Error('Social features not configured');
                
                set({ isLoading: true });
                try {
                    await SocialService.signUp(email, password, username);
                    const profile = await SocialService.getMyProfile();
                    set({
                        isAuthenticated: true,
                        profile,
                        isLoading: false,
                        lastAuthCheckAt: Date.now(),
                    });
                    
                    // Auto-register push token after successful signup
                    get().registerPushTokenAfterAuth();
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            signIn: async (email, password) => {
                if (!isSocialAvailable()) throw new Error('Social features not configured');
                
                set({ isLoading: true });
                try {
                    await SocialService.signIn(email, password);
                    const profile = await SocialService.getMyProfile();
                    set({
                        isAuthenticated: true,
                        profile,
                        isLoading: false,
                        lastAuthCheckAt: Date.now(),
                    });
                    
                    // Auto-register push token after successful login
                    get().registerPushTokenAfterAuth();
                } catch (error) {
                    set({ isLoading: false });
                    throw error;
                }
            },

            signOut: async () => {
                get().cleanupSubscriptions();
                await SocialService.signOut();
                set({ 
                    isAuthenticated: false, 
                    profile: null,
                    globalLeaderboard: [],
                    friendsLeaderboard: [],
                    globalLeaderboardError: null,
                    friendsLeaderboardError: null,
                    friends: [],
                    pendingRequests: [],
                    friendsError: null,
                    blockedUsers: [],
                    unreadEncouragements: [],
                    recentEncouragements: [],
                    encouragementsError: null,
                    lastAuthCheckAt: 0,
                    lastPushTokenCheckAt: 0,
                    lastPushToken: null,
                    isRegisteringPushToken: false,
                });
            },

            // ========================================
            // PROFILE
            // ========================================

            updateProfile: async (updates) => {
                const profile = await SocialService.updateProfile(updates);
                if (profile) {
                    set({ profile });
                }
            },

            updateUsername: async (username) => {
                await SocialService.updateUsername(username);
                const profile = await SocialService.getMyProfile();
                set({ profile });
            },

            // ========================================
            // SOCIAL TOGGLE
            // ========================================

            setSocialEnabled: async (enabled) => {
                const previousEnabled = get().socialEnabled;

                set({ socialEnabled: enabled });
                if (!enabled) {
                    get().cleanupSubscriptions();
                }

                if (!get().isAuthenticated) {
                    return;
                }

                try {
                    await SocialService.updateProfile({ social_enabled: enabled });
                    const profile = await SocialService.getMyProfile();
                    if (profile) {
                        set({ profile });
                    }
                } catch (error) {
                    set({ socialEnabled: previousEnabled });
                    if (previousEnabled) {
                        get().setupRealtimeSubscriptions();
                    } else {
                        get().cleanupSubscriptions();
                    }
                    throw error;
                }
            },

            // ========================================
            // RGPD - DATA DELETION
            // ========================================

            disableSocialAndDeleteData: async () => {
                try {
                    get().cleanupSubscriptions();
                    // Delete all user data from Supabase
                    await SocialService.deleteAllUserData();
                    
                    // Reset local state
                    set({ 
                        isAuthenticated: false, 
                        profile: null,
                        socialEnabled: false,
                        globalLeaderboard: [],
                        friendsLeaderboard: [],
                        globalLeaderboardError: null,
                        friendsLeaderboardError: null,
                        friends: [],
                        pendingRequests: [],
                        friendsError: null,
                        blockedUsers: [],
                        unreadEncouragements: [],
                        recentEncouragements: [],
                        encouragementsError: null,
                    });
                    storeLogger.debug('User data deleted and social disabled');
                } catch (error) {
                    errorLogger.error('Failed to delete user data:', error);
                    throw error;
                }
            },

            updateLeaderboardVisibility: async (isPublic) => {
                await SocialService.updateLeaderboardVisibility(isPublic);
                // Update local profile
                const profile = get().profile;
                if (profile) {
                    set({ profile: { ...profile, is_public: isPublic } });
                }
            },

            updateFriendRequestAcceptance: async (acceptsFriendRequests) => {
                await SocialService.updateFriendRequestAcceptance(acceptsFriendRequests);
                const profile = get().profile;
                if (profile) {
                    set({ profile: { ...profile, accepts_friend_requests: acceptsFriendRequests } });
                }
            },

            // ========================================
            // SYNC
            // ========================================

            syncStats: async (stats) => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                await SocialService.syncWeeklyStats(stats);
                // Refresh local profile from server so UI shows authoritative weekly stats
                try {
                    const profile = await SocialService.getMyProfile();
                    if (profile) {
                        set({ profile });
                    }
                } catch (err) {
                    storeLogger.warn('Failed to refresh profile after sync', err);
                }

                // Refresh leaderboards to reflect updated values
                get().fetchGlobalLeaderboard();
                get().fetchFriendsLeaderboard();
            },

            // ========================================
            // LEADERBOARD
            // ========================================

            fetchGlobalLeaderboard: async () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                try {
                    const data = await SocialService.getGlobalLeaderboard();
                    set({ globalLeaderboard: data, globalLeaderboardError: null });
                } catch (error) {
                    set({ globalLeaderboardError: classifySocialError(error) });
                }
            },

            fetchFriendsLeaderboard: async () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                try {
                    const data = await SocialService.getFriendsLeaderboard();
                    set({ friendsLeaderboard: data, friendsLeaderboardError: null });
                } catch (error) {
                    set({ friendsLeaderboardError: classifySocialError(error) });
                }
            },

            // ========================================
            // FRIENDS
            // ========================================

            fetchFriends: async () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                try {
                    const data = await SocialService.getFriends();
                    set({ friends: data, friendsError: null });
                } catch (error) {
                    set({ friendsError: classifySocialError(error) });
                }
            },

            fetchPendingRequests: async () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                try {
                    const data = await SocialService.getPendingRequests();
                    set({ pendingRequests: data, friendsError: null });
                } catch (error) {
                    set({ friendsError: classifySocialError(error) });
                }
            },

            sendFriendRequest: async (userId) => {
                await SocialService.sendFriendRequest(userId);
            },

            respondToRequest: async (friendshipId, accept) => {
                await SocialService.respondToFriendRequest(friendshipId, accept);
                // Refresh lists
                get().fetchPendingRequests();
                if (accept) get().fetchFriends();
            },

            removeFriend: async (friendshipId) => {
                await SocialService.removeFriend(friendshipId);
                get().fetchFriends();
            },

            searchUsers: async (query) => {
                if (!get().isAuthenticated) return [];
                return (await SocialService.searchUsers(query)) as SocialSearchResult[];
            },

            // ========================================
            // BLOCKED USERS
            // ========================================

            fetchBlockedUsers: async () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                const data = await SocialService.getBlockedUsers();
                set({ blockedUsers: data });
            },

            blockUser: async (userId) => {
                await SocialService.blockUser(userId);
                // Refresh blocked list and friends/leaderboards
                get().fetchBlockedUsers();
                get().fetchFriends();
                get().fetchGlobalLeaderboard();
                get().fetchFriendsLeaderboard();
            },

            unblockUser: async (userId) => {
                await SocialService.unblockUser(userId);
                get().fetchBlockedUsers();
                get().fetchGlobalLeaderboard();
            },

            isUserBlocked: async (userId) => {
                if (!get().isAuthenticated) return false;
                return SocialService.isUserBlocked(userId);
            },

            // ========================================
            // ENCOURAGEMENTS
            // ========================================

            fetchEncouragements: async () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;
                try {
                    const [unread, recent] = await Promise.all([
                        SocialService.getUnreadEncouragements(),
                        SocialService.getRecentEncouragements(),
                    ]);
                    set({ unreadEncouragements: unread, recentEncouragements: recent, encouragementsError: null });
                } catch (error) {
                    set({ encouragementsError: classifySocialError(error) });
                }
            },

            sendEncouragement: async (userId, message) => {
                await SocialService.sendEncouragement(userId, message);
            },

            markAsRead: async (encouragementId) => {
                await SocialService.markEncouragementAsRead(encouragementId);
                set(state => ({
                    unreadEncouragements: state.unreadEncouragements.filter(e => e.id !== encouragementId),
                }));
            },

            // ========================================
            // NOTIFICATIONS
            // ========================================

            initializeNotifications: async () => {
                try {
                    const result = await Notifications.registerForPushNotifications();
                    if (result.success) {
                        storeLogger.debug('Push token obtained successfully');
                        // Optionally save token to backend for remote push
                    } else if (result.reason !== 'permission_denied') {
                        // Only log non-permission errors (user chose to deny = silent)
                        storeLogger.debug('Push notifications unavailable:', result.reason);
                    }
                } catch (error) {
                    errorLogger.error('Failed to register for notifications:', error);
                }
            },

            setupRealtimeSubscriptions: () => {
                if (!get().isAuthenticated || !get().socialEnabled) return;

                const profile = get().profile;
                if (!profile) return;

                // Prevent duplicate subscriptions when screen re-mounts.
                SocialService.unsubscribeAll();

                // Subscribe to encouragements
                SocialService.subscribeToEncouragements(profile.id, async (encouragement) => {
                    const sender = (encouragement as Encouragement & { sender?: Profile }).sender;
                    if (!sender) return;

                    const encouragementWithSender = encouragement as Encouragement & { sender: Profile };

                    // Add to unread list
                    set(state => ({
                        unreadEncouragements: [encouragementWithSender, ...state.unreadEncouragements],
                    }));

                    // Show notification
                    await Notifications.showEncouragementNotification(
                        sender.display_name || sender.username,
                        encouragement.message || 'Continue comme ça ! 💪',
                        encouragement.emoji
                    );
                });

                // Subscribe to friend requests
                SocialService.subscribeToFriendRequests(profile.id, async (friendship) => {
                    // Refresh pending requests
                    get().fetchPendingRequests();

                    // Show notification
                    const requester = (friendship as Friendship & { requester?: Profile }).requester;
                    if (requester) {
                        await Notifications.showFriendRequestNotification(
                            requester.display_name || requester.username
                        );
                    }
                });
            },

            cleanupSubscriptions: () => {
                SocialService.unsubscribeAll();
            },

            savePushToken: async (token) => {
                const state = get();
                if (!state.isAuthenticated) return;

                if (token === state.lastPushToken) {
                    storeLogger.debug('Push token unchanged locally, skipping backend save');
                    return;
                }

                try {
                    await SocialService.savePushToken(token);
                    set({
                        lastPushToken: token,
                    });
                    storeLogger.debug('Push token saved successfully');
                } catch (error) {
                    errorLogger.error('Failed to save push token:', error);
                }
            },

            registerPushTokenAfterAuth: async () => {
                // Non-blocking call to register push token
                // This runs in background after login/signup
                const state = get();
                if (!state.isAuthenticated) return;
                if (state.isRegisteringPushToken) return;

                const now = Date.now();
                if (
                    state.lastPushToken &&
                    state.lastPushTokenCheckAt > 0 &&
                    now - state.lastPushTokenCheckAt < PUSH_TOKEN_RECHECK_INTERVAL_MS
                ) {
                    return;
                }

                set({ isRegisteringPushToken: true, lastPushTokenCheckAt: now });

                try {
                    const result = await Notifications.registerForPushNotifications();
                    if (result.success) {
                        const latest = get();

                        if (result.token === latest.lastPushToken) {
                            set({ lastPushToken: result.token });
                            storeLogger.debug('Push token unchanged, skipping backend update');
                            return;
                        }

                        await latest.savePushToken(result.token);
                    } else {
                        storeLogger.debug('Push token registration failed:', result.reason);
                    }
                } catch (error) {
                    errorLogger.error('Error registering push token:', error);
                } finally {
                    set({ isRegisteringPushToken: false });
                }
            },
        }),
        {
            name: STORAGE_KEYS.socialStore,
            storage: createJSONStorage(() => zustandStorage),
            partialize: (state) => ({
                socialEnabled: state.socialEnabled,
                // Don't persist auth state - check on app start
            }),
        }
    )
);
