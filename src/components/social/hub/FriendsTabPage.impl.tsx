import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, UserMinus, UserPlus, Users } from 'lucide-react-native';
import type { FriendProfile } from '../../../services/supabase/social';
import type { Friendship, Profile } from '../../../services/supabase/database.types';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface FriendsTabPageProps {
    friends: FriendProfile[];
    pendingRequests: (Friendship & { requester: Profile })[];
    profileId?: string;
    onPressAddFriend: () => void;
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

const AVATAR_PALETTES = [
    { bg: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.35)', text: '#a78bfa' },
    { bg: 'rgba(215,150,134,0.2)', border: 'rgba(215,150,134,0.35)', text: '#d79686' },
    { bg: 'rgba(34,211,238,0.15)', border: 'rgba(34,211,238,0.28)', text: '#22d3ee' },
    { bg: 'rgba(74,222,128,0.15)', border: 'rgba(74,222,128,0.28)', text: '#4ade80' },
    { bg: 'rgba(245,200,66,0.15)', border: 'rgba(245,200,66,0.28)', text: '#f5c842' },
];

function paletteForName(name: string) {
    return AVATAR_PALETTES[name.charCodeAt(0) % AVATAR_PALETTES.length];
}

export function FriendsTabPage({
    friends,
    pendingRequests,
    profileId,
    onPressAddFriend,
    onInvite,
    onRespondToRequest,
    onRemoveFriend,
    labels,
}: FriendsTabPageProps) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Header */}
            <LinearGradient
                colors={[Colors.overlayTeal15, Colors.overlayViolet12]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <View style={styles.headerTop}>
                    <View style={styles.headerIconWrap}>
                        <Users size={16} color={Colors.info} />
                    </View>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.pageTitle}>{labels.pageTitle}</Text>
                        <Text style={styles.pageSubtitle}>{labels.pageSubtitle}</Text>
                    </View>
                </View>

                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.headerPrimaryBtn} onPress={onPressAddFriend} activeOpacity={0.85}>
                        <UserPlus size={13} color={Colors.cta} />
                        <Text style={styles.headerPrimaryBtnText}>{labels.addFriend}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerGhostBtn} onPress={onInvite} activeOpacity={0.85}>
                        <Share2 size={13} color={Colors.muted} />
                        <Text style={styles.headerGhostBtnText}>{labels.invite}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {/* Pending requests */}
            {pendingRequests.length > 0 && (
                <GlassCard style={styles.section}>
                    <View style={styles.sectionHeaderRow}>
                        <Text style={styles.sectionTitle}>{labels.pendingTitle(pendingRequests.length)}</Text>
                        <View style={styles.pendingBadge}>
                            <Text style={styles.pendingBadgeText}>{pendingRequests.length}</Text>
                        </View>
                    </View>
                    {pendingRequests.map((request, idx) => (
                        <View key={request.id}>
                            <View style={styles.requestRow}>
                                <View style={styles.requestAvatar}>
                                    <Text style={styles.requestAvatarText}>
                                        {(request.requester.display_name || request.requester.username).charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                                <View style={styles.requestInfo}>
                                    <Text style={styles.requestName}>
                                        {request.requester.display_name || request.requester.username}
                                    </Text>
                                    <Text style={styles.requestSub}>@{request.requester.username}</Text>
                                </View>
                                <View style={styles.requestActions}>
                                    <TouchableOpacity
                                        style={styles.acceptBtn}
                                        onPress={() => onRespondToRequest(request.id, true)}
                                    >
                                        <Text style={styles.acceptBtnText}>{labels.accept}</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.declineBtn}
                                        onPress={() => onRespondToRequest(request.id, false)}
                                    >
                                        <Text style={styles.declineBtnText}>{labels.decline}</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                            {idx < pendingRequests.length - 1 && <View style={styles.divider} />}
                        </View>
                    ))}
                </GlassCard>
            )}

            {/* Friends list */}
            <GlassCard style={styles.section}>
                <Text style={styles.sectionTitle}>{labels.myFriendsTitle(friends.length)}</Text>

                {friends.length === 0 ? (
                    <View style={styles.emptyWrap}>
                        <Users size={24} color={Colors.muted2} />
                        <Text style={styles.emptyTitle}>{labels.noFriendsTitle}</Text>
                        <Text style={styles.emptyText}>{labels.noFriendsSubtitle}</Text>
                    </View>
                ) : (
                    friends.map((friend, idx) => {
                        const palette = paletteForName(friend.display_name || friend.username);
                        const isMe = friend.id === profileId;
                        return (
                            <View key={friend.id}>
                                <View style={styles.friendRow}>
                                    <View style={[styles.friendAvatar, {
                                        backgroundColor: palette.bg,
                                        borderColor: palette.border,
                                    }]}>
                                        <Text style={[styles.friendAvatarText, { color: palette.text }]}>
                                            {(friend.display_name || friend.username).charAt(0).toUpperCase()}
                                        </Text>
                                    </View>

                                    <View style={styles.friendInfo}>
                                        <View style={styles.friendNameRow}>
                                            <Text style={styles.friendName} numberOfLines={1}>
                                                {friend.display_name || friend.username}
                                            </Text>
                                            {isMe && (
                                                <View style={styles.meBadge}>
                                                    <Text style={styles.meBadgeText}>{labels.meBadge}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.friendSub}>
                                            {labels.workoutsWeek(friend.weekly_workouts || 0)}
                                        </Text>
                                    </View>

                                    <View style={styles.friendRight}>
                                        <Text style={styles.friendXp}>
                                            {friend.weekly_xp || 0}
                                            <Text style={styles.friendXpSuffix}> {labels.xpSuffix}</Text>
                                        </Text>
                                        {!isMe && (
                                            <TouchableOpacity
                                                style={styles.removeBtn}
                                                onPress={() => onRemoveFriend(
                                                    friend.friendship_id,
                                                    friend.display_name || friend.username
                                                )}
                                            >
                                                <UserMinus size={11} color={Colors.error} />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                </View>
                                {idx < friends.length - 1 && <View style={styles.divider} />}
                            </View>
                        );
                    })
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

    // Header
    headerCard: {
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerIconWrap: {
        width: 36,
        height: 36,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.overlayInfo12,
        borderWidth: 1,
        borderColor: Colors.overlayInfo15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
        gap: 2,
    },
    pageTitle: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.3,
    },
    pageSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        lineHeight: 15,
    },
    headerActions: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    headerPrimaryBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingVertical: 9,
    },
    headerPrimaryBtnText: {
        color: Colors.cta,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    headerGhostBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack25,
        paddingHorizontal: Spacing.md,
        paddingVertical: 9,
    },
    headerGhostBtnText: {
        color: Colors.muted,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },

    // Section card
    section: {
        padding: 0,
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xs,
    },
    pendingBadge: {
        height: 18,
        minWidth: 18,
        borderRadius: 9,
        backgroundColor: Colors.overlayCozyWarm40,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    pendingBadgeText: {
        color: Colors.cta,
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.overlayWhite08,
        marginHorizontal: Spacing.md,
    },

    // Request row
    requestRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
    },
    requestAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.overlayWarning10,
        borderWidth: 1,
        borderColor: Colors.overlayWarning20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    requestAvatarText: {
        color: Colors.warning,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.sm,
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
        gap: Spacing.xs,
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
        backgroundColor: Colors.overlayBlack25,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
    },
    declineBtnText: {
        color: Colors.muted,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },

    // Friend row
    friendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingHorizontal: Spacing.md,
        paddingVertical: 10,
    },
    friendAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    friendAvatarText: {
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
    friendInfo: {
        flex: 1,
        gap: 2,
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
        flex: 1,
    },
    meBadge: {
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.overlayViolet20,
        borderWidth: 1,
        borderColor: Colors.overlayViolet35,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    meBadgeText: {
        color: Colors.violet,
        fontSize: 9,
        fontWeight: FontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    friendSub: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    friendRight: {
        alignItems: 'flex-end',
        gap: 6,
        flexShrink: 0,
    },
    friendXp: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    friendXpSuffix: {
        color: Colors.muted2,
        fontWeight: FontWeight.regular,
        fontSize: FontSize.xs,
    },
    removeBtn: {
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.overlayError10,
        borderWidth: 1,
        borderColor: Colors.overlayError20,
    },

    // Empty state
    emptyWrap: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.xs,
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
    },
    emptyText: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        textAlign: 'center',
        lineHeight: 16,
    },

    bottomSpacer: {
        height: 96,
    },
});
