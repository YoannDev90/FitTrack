import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Medal, Trophy } from 'lucide-react-native';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface LeaderboardRow {
    id: string;
    rank: number;
    username: string;
    display_name: string | null;
    weekly_xp?: number;
    weekly_workouts?: number;
}

interface LeaderboardTabPageProps {
    isGlobal: boolean;
    onShowFriends: () => void;
    onShowGlobal: () => void;
    rows: LeaderboardRow[];
    loadingGlobal: boolean;
    error?: string | null;
    profileId?: string;
    labels: {
        pageTitle: string;
        pageSubtitle: string;
        friendsTab: string;
        globalTab: string;
        loadingGlobal: string;
        emptyFriends: string;
        emptyGlobal: string;
        workoutsWeek: (count: number) => string;
        meBadge: string;
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

function medalColorForRank(rank: number): string {
    if (rank === 1) return Colors.gold;
    if (rank === 2) return Colors.silver;
    if (rank === 3) return Colors.bronze;
    return Colors.muted2;
}

function rankBgColorsForRank(rank: number): [string, string] {
    if (rank === 1) return [Colors.overlayGold14, Colors.overlayGold10];
    if (rank === 2) return ['rgba(148, 163, 184, 0.12)', 'rgba(148, 163, 184, 0.06)'];
    if (rank === 3) return ['rgba(205, 127, 50, 0.12)', 'rgba(205, 127, 50, 0.06)'];
    return [Colors.overlayBlack25, Colors.overlayBlack25];
}

export function LeaderboardTabPage({
    isGlobal,
    onShowFriends,
    onShowGlobal,
    rows,
    loadingGlobal,
    error,
    profileId,
    labels,
}: LeaderboardTabPageProps) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Header */}
            <LinearGradient
                colors={[Colors.overlayInfo12, Colors.overlayViolet12]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <View style={styles.headerTop}>
                    <View style={styles.headerIconWrap}>
                        <Trophy size={16} color={Colors.gold} />
                    </View>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.pageTitle}>{labels.pageTitle}</Text>
                        <Text style={styles.pageSubtitle}>{labels.pageSubtitle}</Text>
                    </View>
                </View>

                {/* Segmented control */}
                <View style={styles.segmentShell}>
                    <TouchableOpacity
                        style={[styles.segmentBtn, !isGlobal && styles.segmentBtnActive]}
                        onPress={onShowFriends}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.segmentText, !isGlobal && styles.segmentTextActive]}>
                            {labels.friendsTab}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentBtn, isGlobal && styles.segmentBtnActive]}
                        onPress={onShowGlobal}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.segmentText, isGlobal && styles.segmentTextActive]}>
                            {labels.globalTab}
                        </Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <GlassCard style={styles.listCard}>
                {isGlobal && loadingGlobal ? (
                    <View style={styles.centerWrap}>
                        <Text style={styles.loadingText}>{labels.loadingGlobal}</Text>
                    </View>
                ) : rows.length === 0 ? (
                    <View style={styles.centerWrap}>
                        <Trophy size={24} color={Colors.muted2} />
                        <Text style={styles.emptyText}>
                            {isGlobal ? labels.emptyGlobal : labels.emptyFriends}
                        </Text>
                    </View>
                ) : (
                    rows.map((entry, index) => {
                        const palette = paletteForName(entry.display_name || entry.username);
                        const isTop3 = entry.rank <= 3;
                        const isMe = entry.id === profileId;
                        const podiumColors = rankBgColorsForRank(entry.rank);

                        return (
                            <View key={`${entry.id}-${index}`}>
                                <LinearGradient
                                    colors={isTop3 ? podiumColors : ['transparent', 'transparent']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.rankRow}
                                >
                                    {/* Rank indicator */}
                                    <View style={styles.rankBadgeWrap}>
                                        {entry.rank === 1 ? (
                                            <Crown size={17} color={Colors.gold} />
                                        ) : entry.rank === 2 ? (
                                            <Medal size={16} color={Colors.silver} />
                                        ) : entry.rank === 3 ? (
                                            <Medal size={16} color={Colors.bronze} />
                                        ) : (
                                            <Text style={styles.rankNumber}>#{entry.rank}</Text>
                                        )}
                                    </View>

                                    {/* Avatar */}
                                    <View style={[styles.rankAvatar, {
                                        backgroundColor: isTop3
                                            ? `rgba(0,0,0,0.15)`
                                            : palette.bg,
                                        borderColor: isTop3
                                            ? medalColorForRank(entry.rank) + '44'
                                            : palette.border,
                                    }]}>
                                        <Text style={[styles.rankAvatarText, {
                                            color: isTop3 ? medalColorForRank(entry.rank) : palette.text,
                                        }]}>
                                            {(entry.display_name || entry.username).charAt(0).toUpperCase()}
                                        </Text>
                                    </View>

                                    {/* Name + workouts */}
                                    <View style={styles.rankInfo}>
                                        <View style={styles.rankNameRow}>
                                            <Text style={[
                                                styles.rankName,
                                                isTop3 && { color: isMe ? Colors.cta : Colors.text },
                                            ]} numberOfLines={1}>
                                                {entry.display_name || entry.username}
                                            </Text>
                                            {isMe && (
                                                <View style={styles.meBadge}>
                                                    <Text style={styles.meBadgeText}>{labels.meBadge}</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={styles.rankSub}>
                                            {labels.workoutsWeek(entry.weekly_workouts || 0)}
                                        </Text>
                                    </View>

                                    {/* XP */}
                                    <Text style={[
                                        styles.rankXp,
                                        isTop3 && { color: medalColorForRank(entry.rank) },
                                    ]}>
                                        {entry.weekly_xp || 0}
                                        <Text style={styles.rankXpSuffix}> {labels.xpSuffix}</Text>
                                    </Text>
                                </LinearGradient>
                                {index < rows.length - 1 && <View style={styles.divider} />}
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
        backgroundColor: Colors.overlayGold12,
        borderWidth: 1,
        borderColor: Colors.overlayGold20,
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

    // Segmented control
    segmentShell: {
        flexDirection: 'row',
        gap: Spacing.xs,
        backgroundColor: Colors.overlayBlack25,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite10,
        padding: 3,
    },
    segmentBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 7,
        borderRadius: BorderRadius.md,
    },
    segmentBtnActive: {
        backgroundColor: Colors.overlayCozyWarm15,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
    },
    segmentText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    segmentTextActive: {
        color: Colors.cta,
    },

    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },

    // List card
    listCard: {
        padding: 0,
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
    },
    centerWrap: {
        padding: Spacing.xl,
        alignItems: 'center',
        gap: Spacing.sm,
    },
    loadingText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    emptyText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        textAlign: 'center',
    },
    divider: {
        height: 1,
        backgroundColor: Colors.overlayWhite08,
        marginHorizontal: Spacing.md,
    },

    // Rank row
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: 10,
        paddingHorizontal: Spacing.md,
    },
    rankBadgeWrap: {
        width: 26,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankNumber: {
        color: Colors.muted2,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.xs,
        textAlign: 'center',
    },
    rankAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    rankAvatarText: {
        fontWeight: FontWeight.bold,
        fontSize: FontSize.md,
    },
    rankInfo: {
        flex: 1,
        gap: 2,
    },
    rankNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    rankName: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
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
    rankSub: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    rankXp: {
        color: Colors.text,
        fontWeight: FontWeight.bold,
        fontSize: FontSize.sm,
        flexShrink: 0,
    },
    rankXpSuffix: {
        color: Colors.muted2,
        fontWeight: FontWeight.regular,
        fontSize: FontSize.xs,
    },

    bottomSpacer: {
        height: 96,
    },
});
