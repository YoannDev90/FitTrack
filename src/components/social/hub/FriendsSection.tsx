import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { Search, UserPlus } from 'lucide-react-native';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SearchResult } from './types';

interface LeaderboardRow {
    id: string;
    rank: number;
    username: string;
    display_name: string | null;
    weekly_xp?: number;
    weekly_workouts?: number;
}

interface FriendsSectionProps {
    hasFriends: boolean;
    profileId?: string;
    leaderboardRows: LeaderboardRow[];
    showAddFriendPanel: boolean;
    setShowAddFriendPanel: (next: boolean) => void;
    searchQuery: string;
    onChangeSearchQuery: (value: string) => void;
    isSearching: boolean;
    searchError: string | null;
    searchResults: SearchResult[];
    onSendRequest: (userId: string) => void;
    onInvite: () => void;
    labels: {
        sectionTitle: string;
        period: string;
        emptyTitle: string;
        emptySubtitle: string;
        addFriend: string;
        invite: string;
        searchPlaceholder: string;
        badgeFriend: string;
        badgePending: string;
        addAction: string;
        workoutsWeek: (count: number) => string;
        meBadge: string;
        xpSuffix: string;
    };
}

export function FriendsSection({
    hasFriends,
    profileId,
    leaderboardRows,
    showAddFriendPanel,
    setShowAddFriendPanel,
    searchQuery,
    onChangeSearchQuery,
    isSearching,
    searchError,
    searchResults,
    onSendRequest,
    onInvite,
    labels,
}: FriendsSectionProps) {
    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{labels.sectionTitle}</Text>
                {hasFriends && <Text style={styles.sectionLink}>{labels.period}</Text>}
            </View>

            {!hasFriends ? (
                <GlassCard style={styles.emptyFriendsCard}>
                    <Text style={styles.emptyFriendsTitle}>{labels.emptyTitle}</Text>
                    <Text style={styles.emptyFriendsText}>{labels.emptySubtitle}</Text>
                    <View style={styles.emptyFriendsActions}>
                        <TouchableOpacity style={styles.inlinePrimaryBtn} onPress={() => setShowAddFriendPanel(!showAddFriendPanel)}>
                            <UserPlus size={16} color={Colors.cta} />
                            <Text style={styles.inlinePrimaryBtnText}>{labels.addFriend}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.inlineGhostBtn} onPress={onInvite}>
                            <Text style={styles.inlineGhostBtnText}>{labels.invite}</Text>
                        </TouchableOpacity>
                    </View>

                    {showAddFriendPanel && (
                        <View style={styles.searchPanel}>
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
                                    {entry.id === profileId && <Text style={styles.rankMeBadge}>{labels.meBadge}</Text>}
                                </View>
                                <Text style={styles.rankSub}>{labels.workoutsWeek(entry.weekly_workouts || 0)}</Text>
                            </View>
                            <View style={styles.rankStatWrap}>
                                <Text style={styles.rankXp}>{entry.weekly_xp || 0} {labels.xpSuffix}</Text>
                            </View>
                        </View>
                    ))}
                </GlassCard>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
});
