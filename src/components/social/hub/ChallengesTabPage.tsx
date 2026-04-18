import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Crown,
    Flag,
    Plus,
    Target,
    Trophy,
    Users,
    X,
    XCircle,
    Zap,
} from 'lucide-react-native';
import type { SocialChallengeProgress } from '../../../services/supabase/social';
import { GlassCard } from '../../ui';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface ChallengesTabPageProps {
    challenges: SocialChallengeProgress[];
    error: string | null;
    profileId?: string;
    deletingChallengeId: string | null;
    onPressCreateChallenge: () => void;
    onPressAddSession: () => void;
    onPressDetails: (challenge: SocialChallengeProgress) => void;
    onDeleteChallenge: (challenge: SocialChallengeProgress) => void;
    labels: {
        pageTitle: string;
        pageSubtitle: string;
        createChallenge: string;
        noChallengesTitle: string;
        noChallengesSubtitle: string;
        participantsLabel: string;
        progressLabel: string;
        detailsLabel: string;
        addSession: string;
        finishedLabel: string;
        winnerLabel: (name: string) => string;
        drawLabel: (count: number) => string;
        finishReasonLabel: (reason: 'active' | 'completed' | 'expired' | 'target_reached' | 'cancelled') => string;
        rankLabel: (rank: number) => string;
        pastChallengesTitle: (count: number) => string;
        showPastChallenges: string;
        hidePastChallenges: string;
        deleteChallenge: string;
        leaveChallenge: string;
        deletingChallenge: string;
        daysRemaining: (count: number) => string;
        goalLabel: (goalType: 'workouts' | 'distance' | 'duration' | 'xp') => string;
    };
}

export function ChallengesTabPage({
    challenges,
    error,
    profileId,
    deletingChallengeId,
    onPressCreateChallenge,
    onPressAddSession,
    onPressDetails,
    onDeleteChallenge,
    labels,
}: ChallengesTabPageProps) {
    const [showPastChallenges, setShowPastChallenges] = React.useState(false);
    const activeChallenges = challenges.filter((item) => !item.is_finished);
    const pastChallenges = challenges.filter((item) => item.is_finished);

    const renderActiveCard = (item: SocialChallengeProgress) => {
        const progress = Number(item.my_progress || 0);
        const target = Number(item.challenge.goal_target || 1);
        const ratio = Math.min(1, progress / Math.max(target, 1));
        const endsAt = new Date(item.challenge.ends_at);
        const remainingDays = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
        const isOwner = item.challenge.creator_id === profileId;
        const isDeleting = deletingChallengeId === item.challenge.id;
        const topParticipants = item.preview_participants.slice(0, 3);

        return (
            <GlassCard key={item.challenge.id} style={styles.activeCard}>
                {/* Card top */}
                <View style={styles.activeCardHeader}>
                    <View style={styles.activeCardTitleArea}>
                        <View style={styles.chipRow}>
                            <View style={styles.goalChip}>
                                <Zap size={9} color={Colors.cta} />
                                <Text style={styles.goalChipText}>{labels.goalLabel(item.challenge.goal_type)}</Text>
                            </View>
                            <View style={styles.daysChip}>
                                <Flag size={9} color={Colors.violet} />
                                <Text style={styles.daysChipText}>{labels.daysRemaining(remainingDays)}</Text>
                            </View>
                        </View>
                        <Text style={styles.activeChallengeTitle}>{item.challenge.title}</Text>
                        {!!item.challenge.description && (
                            <Text style={styles.activeChallengeDesc} numberOfLines={2}>{item.challenge.description}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => onDeleteChallenge(item)}
                        disabled={isDeleting}
                    >
                        <X size={11} color={Colors.error} />
                        <Text style={styles.deleteBtnText}>
                            {isDeleting ? labels.deletingChallenge : (isOwner ? labels.deleteChallenge : labels.leaveChallenge)}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Progress */}
                <View style={styles.progressBlock}>
                    <View style={styles.progressTrack}>
                        <LinearGradient
                            colors={[Colors.cta, Colors.cta2]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={[styles.progressFill, { width: `${ratio * 100}%` }]}
                        />
                    </View>
                    <View style={styles.progressMeta}>
                        <Text style={styles.progressNumbers}>
                            <Text style={styles.progressCurrent}>{Math.round(progress)}</Text>
                            <Text style={styles.progressSep}>/{Math.round(target)}</Text>
                        </Text>
                        <Text style={styles.progressPct}>{Math.round(ratio * 100)}%</Text>
                    </View>
                </View>

                {/* Participants */}
                {topParticipants.length > 0 && (
                    <View style={styles.participantsBlock}>
                        <View style={styles.avatarStack}>
                            {topParticipants.map((p, i) => (
                                <View key={p.id} style={[styles.avatar, { marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i }]}>
                                    <Text style={styles.avatarText}>
                                        {(p.display_name || p.username).charAt(0).toUpperCase()}
                                    </Text>
                                </View>
                            ))}
                        </View>
                        <Text style={styles.participantsText} numberOfLines={1}>
                            {item.preview_participants
                                .slice(0, 3)
                                .map((p) => `${p.display_name || p.username} (${Math.round(p.progress)})`)
                                .join(' · ')}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.detailsBtn} onPress={() => onPressDetails(item)}>
                        <Text style={styles.detailsBtnText}>{labels.detailsLabel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addSessionBtn} onPress={onPressAddSession}>
                        <Plus size={13} color={Colors.white} />
                        <Text style={styles.addSessionText}>{labels.addSession}</Text>
                    </TouchableOpacity>
                </View>
            </GlassCard>
        );
    };

    const renderPastCard = (item: SocialChallengeProgress) => {
        const progress = Number(item.my_progress || 0);
        const target = Number(item.challenge.goal_target || 1);
        const ratio = Math.min(1, progress / Math.max(target, 1));
        const isOwner = item.challenge.creator_id === profileId;
        const isDeleting = deletingChallengeId === item.challenge.id;
        const winnerName = item.winner ? (item.winner.display_name || item.winner.username) : null;
        const myRank = item.my_rank;
        const iWon = myRank === 1;
        const isDraw = item.winner?.is_tie;

        return (
            <View key={item.challenge.id} style={styles.pastCard}>
                {/* Left accent line */}
                <View style={[styles.pastAccent, iWon || isDraw ? styles.pastAccentWin : styles.pastAccentLoss]} />

                <View style={styles.pastCardContent}>
                    {/* Top */}
                    <View style={styles.pastCardTop}>
                        <View style={styles.pastResultIcon}>
                            {iWon || isDraw ? (
                                <Crown size={14} color={Colors.gold} />
                            ) : (
                                <XCircle size={14} color={Colors.error} />
                            )}
                        </View>
                        <View style={styles.pastCardTitleArea}>
                            <Text style={styles.pastChallengeTitle} numberOfLines={1}>{item.challenge.title}</Text>
                            <Text style={styles.pastChallengeResult} numberOfLines={1}>
                                {item.winner
                                    ? (item.winner.is_tie
                                        ? labels.drawLabel(item.winner.tied_with_count)
                                        : labels.winnerLabel(winnerName || ''))
                                    : labels.finishReasonLabel(item.finish_reason)}
                            </Text>
                        </View>
                        <View style={styles.pastCardRight}>
                            {myRank != null && (
                                <View style={[styles.rankBadge, iWon || isDraw ? styles.rankBadgeWin : styles.rankBadgeLoss]}>
                                    <Text style={[styles.rankBadgeText, iWon || isDraw ? styles.rankBadgeTextWin : styles.rankBadgeTextLoss]}>
                                        #{myRank}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Progress line */}
                    <View style={styles.pastProgressRow}>
                        <View style={styles.pastProgressTrack}>
                            <View style={[
                                styles.pastProgressFill,
                                { width: `${ratio * 100}%` },
                                (iWon || isDraw) ? styles.pastProgressFillWin : styles.pastProgressFillLoss,
                            ]} />
                        </View>
                        <Text style={styles.pastProgressText}>{Math.round(progress)}/{Math.round(target)}</Text>
                    </View>

                    {/* Bottom meta */}
                    <View style={styles.pastMeta}>
                        <View style={styles.pastMetaLeft}>
                            <View style={styles.pastChip}>
                                <Zap size={9} color={Colors.muted2} />
                                <Text style={styles.pastChipText}>{labels.goalLabel(item.challenge.goal_type)}</Text>
                            </View>
                            <View style={styles.pastChip}>
                                <Users size={9} color={Colors.muted2} />
                                <Text style={styles.pastChipText}>{item.participants_count}</Text>
                            </View>
                        </View>
                        <View style={styles.pastActions}>
                            <TouchableOpacity style={styles.pastDetailsBtn} onPress={() => onPressDetails(item)}>
                                <Text style={styles.pastDetailsBtnText}>{labels.detailsLabel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.pastDeleteBtn}
                                onPress={() => onDeleteChallenge(item)}
                                disabled={isDeleting}
                            >
                                <X size={10} color={Colors.error} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {/* Header */}
            <LinearGradient
                colors={[Colors.overlayCozyWarm15, Colors.overlayViolet12]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerCard}
            >
                <View style={styles.headerTop}>
                    <View style={styles.headerIconWrap}>
                        <Trophy size={16} color={Colors.cta} />
                    </View>
                    <View style={styles.headerText}>
                        <Text style={styles.pageTitle}>{labels.pageTitle}</Text>
                        <Text style={styles.pageSubtitle}>{labels.pageSubtitle}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.createButton} onPress={onPressCreateChallenge} activeOpacity={0.85}>
                    <Plus size={14} color={Colors.white} />
                    <Text style={styles.createButtonText}>{labels.createChallenge}</Text>
                </TouchableOpacity>
            </LinearGradient>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {challenges.length === 0 ? (
                <GlassCard style={styles.emptyCard}>
                    <Trophy size={28} color={Colors.muted2} />
                    <Text style={styles.emptyTitle}>{labels.noChallengesTitle}</Text>
                    <Text style={styles.emptySubtitle}>{labels.noChallengesSubtitle}</Text>
                </GlassCard>
            ) : (
                <>
                    {activeChallenges.map((item) => renderActiveCard(item))}

                    {pastChallenges.length > 0 && (
                        <>
                            <TouchableOpacity
                                style={styles.pastToggleRow}
                                onPress={() => setShowPastChallenges((prev) => !prev)}
                                activeOpacity={0.8}
                            >
                                <View style={styles.pastToggleLeft}>
                                    <View style={styles.pastToggleIconWrap}>
                                        <CheckCircle2 size={13} color={Colors.muted2} />
                                    </View>
                                    <Text style={styles.pastToggleTitle}>{labels.pastChallengesTitle(pastChallenges.length)}</Text>
                                </View>
                                <View style={styles.pastToggleRight}>
                                    <Text style={styles.pastToggleAction}>
                                        {showPastChallenges ? labels.hidePastChallenges : labels.showPastChallenges}
                                    </Text>
                                    {showPastChallenges
                                        ? <ChevronUp size={13} color={Colors.muted2} />
                                        : <ChevronDown size={13} color={Colors.muted2} />}
                                </View>
                            </TouchableOpacity>

                            {showPastChallenges && (
                                <GlassCard style={styles.pastList}>
                                    {pastChallenges.map((item, idx) => (
                                        <View key={item.challenge.id}>
                                            {renderPastCard(item)}
                                            {idx < pastChallenges.length - 1 && <View style={styles.pastDivider} />}
                                        </View>
                                    ))}
                                </GlassCard>
                            )}
                        </>
                    )}
                </>
            )}

            <View style={styles.bottomSpacer} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    content: {
        paddingBottom: 24,
        gap: Spacing.sm,
    },

    // Header card
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
        backgroundColor: Colors.overlayCozyWarm15,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerText: {
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
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.xs,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.cta,
        paddingVertical: 10,
    },
    createButtonText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },

    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
    },

    // Empty state
    emptyCard: {
        padding: Spacing.xl,
        gap: Spacing.sm,
        borderRadius: BorderRadius.xxl,
        alignItems: 'center',
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        textAlign: 'center',
    },
    emptySubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        textAlign: 'center',
        lineHeight: 18,
    },

    // Active challenge card
    activeCard: {
        padding: Spacing.lg,
        gap: Spacing.md,
        borderRadius: BorderRadius.xxl,
    },
    activeCardHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
    },
    activeCardTitleArea: {
        flex: 1,
        gap: Spacing.xs,
    },
    chipRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
    },
    goalChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    goalChipText: {
        color: Colors.cta,
        fontSize: 9,
        fontWeight: FontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    daysChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayViolet20,
        backgroundColor: Colors.overlayViolet12,
        paddingHorizontal: 8,
        paddingVertical: 3,
    },
    daysChipText: {
        color: Colors.violet,
        fontSize: 9,
        fontWeight: FontWeight.bold,
    },
    activeChallengeTitle: {
        color: Colors.text,
        fontSize: FontSize.lg,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.3,
    },
    activeChallengeDesc: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        lineHeight: 16,
    },
    deleteBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayError20,
        backgroundColor: Colors.overlayError10,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
    },
    deleteBtnText: {
        color: Colors.error,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },

    // Progress
    progressBlock: {
        gap: 6,
    },
    progressTrack: {
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite12,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    progressNumbers: {
        fontSize: FontSize.xs,
    },
    progressCurrent: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
    progressSep: {
        color: Colors.muted2,
        fontWeight: FontWeight.regular,
    },
    progressPct: {
        color: Colors.cta,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },

    // Participants
    participantsBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    avatarStack: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 1.5,
        borderColor: Colors.overlayWhite20,
        backgroundColor: Colors.overlayViolet20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        color: Colors.violet,
        fontSize: 9,
        fontWeight: FontWeight.bold,
    },
    participantsText: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        flex: 1,
        lineHeight: 15,
    },

    // Active card actions
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    detailsBtn: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite15,
        backgroundColor: Colors.overlayWhite08,
        alignItems: 'center',
        paddingVertical: 9,
        paddingHorizontal: Spacing.md,
    },
    detailsBtnText: {
        color: Colors.textWhite80,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.xs,
    },
    addSessionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.cta,
        paddingVertical: 9,
    },
    addSessionText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.xs,
    },

    // Past challenges toggle
    pastToggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite10,
        backgroundColor: Colors.overlayBlack25,
    },
    pastToggleLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    pastToggleIconWrap: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: Colors.overlayWhite08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pastToggleTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    pastToggleRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pastToggleAction: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },

    // Past challenges list
    pastList: {
        padding: 0,
        borderRadius: BorderRadius.xxl,
        overflow: 'hidden',
    },
    pastDivider: {
        height: 1,
        backgroundColor: Colors.overlayWhite08,
        marginHorizontal: Spacing.lg,
    },

    // Past challenge card
    pastCard: {
        flexDirection: 'row',
        paddingVertical: Spacing.md,
        paddingRight: Spacing.md,
    },
    pastAccent: {
        width: 3,
        borderRadius: 2,
        marginLeft: Spacing.md,
        marginRight: Spacing.sm,
        backgroundColor: Colors.muted2,
    },
    pastAccentWin: {
        backgroundColor: Colors.gold,
    },
    pastAccentLoss: {
        backgroundColor: Colors.error,
    },
    pastCardContent: {
        flex: 1,
        gap: 8,
    },
    pastCardTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.xs,
    },
    pastResultIcon: {
        marginTop: 1,
    },
    pastCardTitleArea: {
        flex: 1,
    },
    pastChallengeTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        letterSpacing: -0.1,
    },
    pastChallengeResult: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        marginTop: 1,
        lineHeight: 14,
    },
    pastCardRight: {
        alignItems: 'flex-end',
    },
    rankBadge: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: 8,
        paddingVertical: 3,
        backgroundColor: Colors.overlayBlack30,
        borderWidth: 1,
        borderColor: Colors.overlayWhite10,
    },
    rankBadgeWin: {
        backgroundColor: Colors.overlayGold10,
        borderColor: Colors.overlayGold20,
    },
    rankBadgeLoss: {
        backgroundColor: Colors.overlayError10,
        borderColor: Colors.overlayError20,
    },
    rankBadgeText: {
        color: Colors.muted,
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    rankBadgeTextWin: {
        color: Colors.gold,
    },
    rankBadgeTextLoss: {
        color: Colors.error,
    },

    // Past progress
    pastProgressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    pastProgressTrack: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.overlayWhite10,
        overflow: 'hidden',
    },
    pastProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    pastProgressFillWin: {
        backgroundColor: Colors.gold,
    },
    pastProgressFillLoss: {
        backgroundColor: Colors.error,
    },
    pastProgressText: {
        color: Colors.muted2,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        minWidth: 44,
        textAlign: 'right',
    },

    // Past meta row
    pastMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    pastMetaLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    pastChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayWhite10,
        backgroundColor: Colors.overlayBlack25,
        paddingHorizontal: 7,
        paddingVertical: 3,
    },
    pastChipText: {
        color: Colors.muted2,
        fontSize: 9,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    pastActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    pastDetailsBtn: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayWhite15,
        backgroundColor: Colors.overlayWhite08,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    pastDetailsBtnText: {
        color: Colors.textWhite80,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    pastDeleteBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.overlayError10,
        borderWidth: 1,
        borderColor: Colors.overlayError20,
    },

    bottomSpacer: {
        height: 96,
    },
});
