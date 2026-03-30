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

function medalColorForRank(rank: number): string {
    if (rank === 1) return Colors.gold;
    if (rank === 2) return Colors.silver;
    if (rank === 3) return Colors.bronze;
    return Colors.muted2;
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
            <LinearGradient
                colors={[Colors.overlayInfo12, Colors.overlayViolet12]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <View style={styles.headerTop}>
                    <View style={styles.headerIconWrap}>
                        <Trophy size={16} color={Colors.cta} />
                    </View>
                    <Text style={styles.pageTitle}>{labels.pageTitle}</Text>
                </View>
                <Text style={styles.pageSubtitle}>{labels.pageSubtitle}</Text>

                <View style={styles.segmentedRow}>
                    <TouchableOpacity
                        style={[styles.segmentedBtn, !isGlobal && styles.segmentedBtnActive]}
                        onPress={onShowFriends}
                    >
                        <Text style={[styles.segmentedText, !isGlobal && styles.segmentedTextActive]}>{labels.friendsTab}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.segmentedBtn, isGlobal && styles.segmentedBtnActive]}
                        onPress={onShowGlobal}
                    >
                        <Text style={[styles.segmentedText, isGlobal && styles.segmentedTextActive]}>{labels.globalTab}</Text>
                    </TouchableOpacity>
                </View>
            </LinearGradient>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <GlassCard style={styles.listCard}>
                {isGlobal && loadingGlobal ? (
                    <Text style={styles.loadingText}>{labels.loadingGlobal}</Text>
                ) : rows.length === 0 ? (
                    <Text style={styles.emptyText}>{isGlobal ? labels.emptyGlobal : labels.emptyFriends}</Text>
                ) : (
                    rows.map((entry, index) => (
                        <View
                            key={`${entry.id}-${index}`}
                            style={[
                                styles.rankRow,
                                index < rows.length - 1 && styles.rankRowBorder,
                                entry.rank <= 3 && styles.rankRowTop,
                            ]}
                        >
                            <View style={styles.rankBadgeWrap}>
                                {entry.rank === 1 ? (
                                    <Crown size={16} color={medalColorForRank(entry.rank)} />
                                ) : entry.rank <= 3 ? (
                                    <Medal size={15} color={medalColorForRank(entry.rank)} />
                                ) : (
                                    <Text style={styles.rankNumber}>{entry.rank}</Text>
                                )}
                            </View>
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
                            <Text style={styles.rankXp}>{entry.weekly_xp || 0} {labels.xpSuffix}</Text>
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
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    headerIconWrap: {
        width: 30,
        height: 30,
        borderRadius: BorderRadius.md,
        backgroundColor: Colors.overlayCozyWarm15,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageTitle: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.3,
    },
    pageSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        lineHeight: 16,
    },
    segmentedRow: {
        marginTop: Spacing.xs,
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    segmentedBtn: {
        flex: 1,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack25,
        alignItems: 'center',
        paddingVertical: 8,
    },
    segmentedBtnActive: {
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
    },
    segmentedText: {
        color: Colors.muted,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    segmentedTextActive: {
        color: Colors.cta,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },
    listCard: {
        padding: Spacing.sm,
        borderRadius: BorderRadius.xxl,
    },
    loadingText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    emptyText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    rankRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    rankRowBorder: {
        marginBottom: 2,
    },
    rankRowTop: {
        backgroundColor: Colors.overlayGold10,
        borderWidth: 1,
        borderColor: Colors.overlayGold20,
    },
    rankNumber: {
        color: Colors.muted,
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
    },
    rankBadgeWrap: {
        width: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rankAvatar: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: Colors.overlayViolet20,
        borderWidth: 1,
        borderColor: Colors.overlayViolet35,
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
    rankXp: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    bottomSpacer: {
        height: 96,
    },
});
