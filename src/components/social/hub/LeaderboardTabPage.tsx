import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Trophy } from 'lucide-react-native';
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
            <GlassCard style={styles.headerCard}>
                <View style={styles.headerTop}>
                    <Trophy size={18} color={Colors.cta} />
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
            </GlassCard>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <GlassCard style={styles.listCard}>
                {isGlobal && loadingGlobal ? (
                    <Text style={styles.loadingText}>{labels.loadingGlobal}</Text>
                ) : rows.length === 0 ? (
                    <Text style={styles.emptyText}>{isGlobal ? labels.emptyGlobal : labels.emptyFriends}</Text>
                ) : (
                    rows.map((entry, index) => (
                        <View key={`${entry.id}-${index}`} style={[styles.rankRow, index < rows.length - 1 && styles.rankRowBorder]}>
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
        padding: Spacing.md,
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
    rankXp: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    bottomSpacer: {
        height: 96,
    },
});
