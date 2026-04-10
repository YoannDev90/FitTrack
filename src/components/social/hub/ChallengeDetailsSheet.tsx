import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Crown, Sparkles, Target, Users } from 'lucide-react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SocialChallengeFinishReason, SocialChallengeProgress } from '../../../services/supabase/social';

interface ChallengeDetailsSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    challenge: SocialChallengeProgress | null;
    profileId?: string;
    onPressAddSession: () => void;
    onPressOpenChallenges: () => void;
    onPressDeleteOrLeave: (challenge: SocialChallengeProgress) => void;
    labels: {
        title: string;
        activeSubtitle: string;
        finishedSubtitle: string;
        close: string;
        openChallenges: string;
        addSession: string;
        participantsTitle: string;
        statsTitle: string;
        targetLabel: string;
        progressLabel: string;
        participantsLabel: string;
        rankTitle: string;
        finishedLabel: string;
        winnerLabel: (name: string) => string;
        drawLabel: (count: number) => string;
        finishReasonLabel: (reason: SocialChallengeFinishReason) => string;
        deleteChallenge: string;
        leaveChallenge: string;
    };
}

export function ChallengeDetailsSheet({
    sheetRef,
    challenge,
    profileId,
    onPressAddSession,
    onPressOpenChallenges,
    onPressDeleteOrLeave,
    labels,
}: ChallengeDetailsSheetProps) {
    const isFinished = challenge?.is_finished ?? false;
    const isOwner = challenge?.challenge.creator_id === profileId;
    const winnerName = challenge?.winner ? (challenge.winner.display_name || challenge.winner.username) : null;
    const progress = Number(challenge?.my_progress || 0);
    const target = Number(challenge?.challenge.goal_target || 0);

    return (
        <TrueSheet
            ref={sheetRef}
            detents={[0.84]}
            cornerRadius={32}
            backgroundColor={Colors.bg}
            grabber={false}
            scrollable={true}
        >
            <View style={styles.container}>
                <View style={styles.grabberWrap}>
                    <View style={styles.grabber} />
                </View>

                {!challenge ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>{labels.title}</Text>
                    </View>
                ) : (
                    <>
                        <LinearGradient
                            colors={isFinished
                                ? [Colors.overlaySuccess20, Colors.overlayViolet12]
                                : [Colors.overlayViolet20, Colors.overlayCozyWarm15]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroCard}
                        >
                            <View style={styles.heroTopRow}>
                                <View style={styles.heroBadge}>
                                    <Sparkles size={12} color={Colors.cta} />
                                    <Text style={styles.heroBadgeText}>{isFinished ? labels.finishedLabel : labels.activeSubtitle}</Text>
                                </View>
                                <Text style={styles.heroSubtitle}>{isFinished ? labels.finishedSubtitle : labels.activeSubtitle}</Text>
                            </View>

                            <Text style={styles.heroTitle}>{challenge.challenge.title}</Text>

                            {challenge.winner ? (
                                <View style={styles.winnerRow}>
                                    <Crown size={14} color={Colors.gold} />
                                    <Text style={styles.winnerText}>
                                        {challenge.winner.is_tie
                                            ? labels.drawLabel(challenge.winner.tied_with_count)
                                            : labels.winnerLabel(winnerName || '')}
                                    </Text>
                                </View>
                            ) : null}

                            <Text style={styles.reasonText}>{labels.finishReasonLabel(challenge.finish_reason)}</Text>
                        </LinearGradient>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={styles.scrollContent}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        >
                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>{labels.statsTitle}</Text>

                                <View style={styles.statsGrid}>
                                    <View style={styles.statCard}>
                                        <Target size={12} color={Colors.info} />
                                        <Text style={styles.statLabel}>{labels.targetLabel}</Text>
                                        <Text style={styles.statValue}>{Math.round(target)}</Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <Sparkles size={12} color={Colors.cta} />
                                        <Text style={styles.statLabel}>{labels.progressLabel}</Text>
                                        <Text style={styles.statValue}>{Math.round(progress)}</Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <Users size={12} color={Colors.violet} />
                                        <Text style={styles.statLabel}>{labels.participantsLabel}</Text>
                                        <Text style={styles.statValue}>{challenge.participants_count}</Text>
                                    </View>

                                    <View style={styles.statCard}>
                                        <Crown size={12} color={Colors.gold} />
                                        <Text style={styles.statLabel}>{labels.rankTitle}</Text>
                                        <Text style={styles.statValue}>{challenge.my_rank ? `#${challenge.my_rank}` : '-'}</Text>
                                    </View>
                                </View>
                            </View>

                            <View style={styles.sectionCard}>
                                <Text style={styles.sectionTitle}>{labels.participantsTitle}</Text>
                                <View style={styles.participantsList}>
                                    {challenge.participants.map((participant, index) => {
                                        const participantName = participant.display_name || participant.username;
                                        return (
                                            <View key={participant.id} style={styles.participantRow}>
                                                <View style={styles.participantRankPill}>
                                                    <Text style={styles.participantRankText}>#{index + 1}</Text>
                                                </View>
                                                <Text style={styles.participantName} numberOfLines={1}>{participantName}</Text>
                                                <Text style={styles.participantProgress}>{Math.round(participant.progress)}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>

                            <View style={styles.scrollBottomSpacer} />
                        </ScrollView>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity style={styles.secondaryButton} onPress={onPressOpenChallenges}>
                                <Text style={styles.secondaryButtonText}>{labels.openChallenges}</Text>
                            </TouchableOpacity>

                            {isFinished ? null : (
                                <TouchableOpacity style={styles.addSessionButton} onPress={onPressAddSession}>
                                    <Text style={styles.addSessionButtonText}>{labels.addSession}</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.actionsRow}>
                            <TouchableOpacity
                                style={styles.destructiveButton}
                                onPress={() => onPressDeleteOrLeave(challenge)}
                            >
                                <Text style={styles.destructiveButtonText}>{isOwner ? labels.deleteChallenge : labels.leaveChallenge}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.closeButton} onPress={() => sheetRef.current?.dismiss()}>
                                <Text style={styles.closeButtonText}>{labels.close}</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </View>
        </TrueSheet>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    grabberWrap: {
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    grabber: {
        width: 42,
        height: 4,
        borderRadius: 2,
        backgroundColor: Colors.overlayWhite20,
    },
    emptyState: {
        paddingVertical: Spacing.xl,
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    heroCard: {
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        padding: Spacing.md,
        gap: Spacing.xs,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    heroBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    heroBadgeText: {
        color: Colors.cta,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    heroSubtitle: {
        color: Colors.muted2,
        fontSize: 10,
    },
    heroTitle: {
        color: Colors.text,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.extrabold,
    },
    winnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    winnerText: {
        color: Colors.gold,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
        flex: 1,
    },
    reasonText: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
    },
    scrollView: {
        flex: 1,
        marginTop: Spacing.sm,
    },
    scrollContent: {
        gap: Spacing.sm,
        paddingBottom: Spacing.sm,
    },
    sectionCard: {
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.overlayWhite08,
        backgroundColor: Colors.overlayBlack25,
        padding: Spacing.sm,
        gap: Spacing.sm,
    },
    sectionTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
    },
    statCard: {
        width: '48%',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        backgroundColor: Colors.overlayBlack30,
        padding: Spacing.sm,
        gap: 4,
    },
    statLabel: {
        color: Colors.muted,
        fontSize: 10,
    },
    statValue: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.bold,
    },
    participantsList: {
        gap: 6,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite10,
        backgroundColor: Colors.overlayBlack30,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
    },
    participantRankPill: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayInfo35,
        backgroundColor: Colors.overlayInfo12,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    participantRankText: {
        color: Colors.info,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    participantName: {
        flex: 1,
        color: Colors.text,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.medium,
    },
    participantProgress: {
        color: Colors.cta,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.bold,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginTop: Spacing.sm,
    },
    secondaryButton: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite20,
        backgroundColor: Colors.overlayBlack30,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    secondaryButtonText: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    addSessionButton: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    addSessionButtonText: {
        color: Colors.cta,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    destructiveButton: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayError30,
        backgroundColor: Colors.overlayError10,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    destructiveButtonText: {
        color: Colors.error,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    closeButton: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    closeButtonText: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    scrollBottomSpacer: {
        height: Spacing.md,
    },
});
