import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Search, UserMinus, UserPlus, Users } from 'lucide-react-native';
import type { FriendProfile } from '../../../services/supabase/social';
import type { Friendship, Profile } from '../../../services/supabase/database.types';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SearchResult } from './types';

interface FriendsTabPageProps {
    friends: FriendProfile[];
    pendingRequests: (Friendship & { requester: Profile })[];
    profileId?: string;
    showAddFriendPanel: boolean;
    setShowAddFriendPanel: (next: boolean) => void;
    searchQuery: string;
    onChangeSearchQuery: (value: string) => void;
    isSearching: boolean;
    searchError: string | null;
    searchResults: SearchResult[];
    onSendRequest: (userId: string) => void;
    onInvite: () => void;
    onRespondToRequest: (friendshipId: string, accept: boolean) => void;
    onRemoveFriend: (friendshipId: string, friendName: string) => void;
    labels: {
        pageTitle: string;
        pageSubtitle: string;
        addFriend: string;
        invite: string;
        searchPlaceholder: string;
        pendingTitle: (count: number) => string;
        myFriendsTitle: (count: number) => string;
        accept: string;
        decline: string;
        remove: string;
        noFriendsTitle: string;
        noFriendsSubtitle: string;
        noRequests: string;
        badgeFriend: string;
        badgePending: string;
        addAction: string;
        meBadge: string;
        workoutsWeek: (count: number) => string;
        xpSuffix: string;
    };
}

export function FriendsTabPage({
    friends,
    pendingRequests,
    profileId,
    showAddFriendPanel,
    setShowAddFriendPanel,
    searchQuery,
    onChangeSearchQuery,
    isSearching,
    searchError,
    searchResults,
    onSendRequest,
    onInvite,
    onRespondToRequest,
    onRemoveFriend,
    labels,
}: FriendsTabPageProps) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            <GlassCard style={styles.headerCard}>
                <View style={styles.headerTop}>
                    <Users size={18} color={Colors.cta} />
                    <Text style={styles.pageTitle}>{labels.pageTitle}</Text>
                </View>
                <Text style={styles.pageSubtitle}>{labels.pageSubtitle}</Text>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerPrimaryBtn} onPress={() => setShowAddFriendPanel(!showAddFriendPanel)}>
                        <UserPlus size={14} color={Colors.cta} />
                        <Text style={styles.headerPrimaryBtnText}>{labels.addFriend}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerGhostBtn} onPress={onInvite}>
                        <Text style={styles.headerGhostBtnText}>{labels.invite}</Text>
                    </TouchableOpacity>
                </View>
            </GlassCard>

            {showAddFriendPanel && (
                <GlassCard style={styles.searchCard}>
                    <View style={styles.searchInputWrap}>
                        <Search size={16} color={Colors.muted} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={labels.searchPlaceholder}
                            placeholderTextColor={Colors.muted2}
                            value={searchQuery}
                            onChangeText={onChangeSearchQuery}
                        />
                    </View>
                    {isSearching && <ActivityIndicator size="small" color={Colors.cta} style={styles.searchLoader} />}
                    {searchError && <Text style={styles.errorText}>{searchError}</Text>}
                    {searchResults.map(user => (
                        <View key={user.id} style={styles.searchResultRow}>
                            <Text style={styles.searchResultName}>{user.display_name || user.username}</Text>
                            {user.friendship_status === 'accepted' ? (
                                <Text style={styles.searchResultBadge}>{labels.badgeFriend}</Text>
                            ) : user.friendship_status === 'pending' ? (
                                <Text style={styles.searchResultBadge}>{labels.badgePending}</Text>
                            ) : (
                                <TouchableOpacity onPress={() => onSendRequest(user.id)}>
                                    <Text style={styles.searchResultAction}>{labels.addAction}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))}
                </GlassCard>
            )}

            <GlassCard style={styles.requestCard}>
                <Text style={styles.sectionTitle}>{labels.pendingTitle(pendingRequests.length)}</Text>
                {pendingRequests.length === 0 ? (
                    <Text style={styles.emptyText}>{labels.noRequests}</Text>
                ) : (
                    pendingRequests.map((request) => (
                        <View key={request.id} style={styles.requestRow}>
                            <View style={styles.requestInfo}>
                                <Text style={styles.requestName}>{request.requester.display_name || request.requester.username}</Text>
                                <Text style={styles.requestSub}>@{request.requester.username}</Text>
                            </View>
                            <View style={styles.requestActions}>
                                <TouchableOpacity style={styles.acceptBtn} onPress={() => onRespondToRequest(request.id, true)}>
                                    <Text style={styles.acceptBtnText}>{labels.accept}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.declineBtn} onPress={() => onRespondToRequest(request.id, false)}>
                                    <Text style={styles.declineBtnText}>{labels.decline}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </GlassCard>

            <GlassCard style={styles.friendsCard}>
                <Text style={styles.sectionTitle}>{labels.myFriendsTitle(friends.length)}</Text>
                {friends.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Text style={styles.emptyTitle}>{labels.noFriendsTitle}</Text>
                        <Text style={styles.emptyText}>{labels.noFriendsSubtitle}</Text>
                    </View>
                ) : (
                    friends.map((friend) => (
                        <View key={friend.id} style={styles.friendRow}>
                            <View style={styles.friendAvatar}>
                                <Text style={styles.friendAvatarText}>
                                    {(friend.display_name || friend.username).charAt(0).toUpperCase()}
                                </Text>
                            </View>
                            <View style={styles.friendInfo}>
                                <View style={styles.friendNameRow}>
                                    <Text style={styles.friendName}>{friend.display_name || friend.username}</Text>
                                    {friend.id === profileId && <Text style={styles.meBadge}>{labels.meBadge}</Text>}
                                </View>
                                <Text style={styles.friendSub}>{labels.workoutsWeek(friend.weekly_workouts || 0)}</Text>
                            </View>
                            <View style={styles.friendActions}>
                                <Text style={styles.friendXp}>{friend.weekly_xp || 0} {labels.xpSuffix}</Text>
                                <TouchableOpacity style={styles.removeBtn} onPress={() => onRemoveFriend(friend.friendship_id, friend.display_name || friend.username)}>
                                    <UserMinus size={12} color={Colors.error} />
                                    <Text style={styles.removeBtnText}>{labels.remove}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))
                )}
            </GlassCard>

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 24,
        gap: Spacing.sm,
    },
    headerCard: {
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    pageTitle: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.bold,
    },
    pageSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginTop: Spacing.xs,
    },
    headerPrimaryBtn: {
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
    headerPrimaryBtnText: {
        color: Colors.cta,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    headerGhostBtn: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.md,
    },
    headerGhostBtnText: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    searchCard: {
        padding: Spacing.md,
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
    searchLoader: {
        marginTop: 8,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 6,
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
    requestCard: {
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    requestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
        paddingVertical: 8,
    },
    requestInfo: {
        flex: 1,
    },
    requestName: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    requestSub: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    requestActions: {
        flexDirection: 'row',
        gap: 8,
    },
    acceptBtn: {
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.cta,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
    },
    acceptBtnText: {
        color: Colors.white,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    declineBtn: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.stroke,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
    },
    declineBtnText: {
        color: Colors.muted,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    friendsCard: {
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 8,
    },
    friendAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.overlayViolet15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    friendAvatarText: {
        color: Colors.violet,
        fontWeight: FontWeight.bold,
    },
    friendInfo: {
        flex: 1,
    },
    friendNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    friendName: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    meBadge: {
        fontSize: 10,
        color: Colors.violetDeep,
        backgroundColor: Colors.overlayWhite20,
        borderRadius: BorderRadius.full,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    friendSub: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    friendActions: {
        alignItems: 'flex-end',
        gap: 6,
    },
    friendXp: {
        color: Colors.text,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    removeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.error,
        backgroundColor: Colors.overlayRose08,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    removeBtnText: {
        color: Colors.error,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    emptyWrap: {
        gap: Spacing.xs,
        paddingVertical: Spacing.xs,
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    emptyText: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    bottomSpacer: {
        height: 96,
    },
});
