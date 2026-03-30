import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Trophy, Users, X } from 'lucide-react-native';
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
    onDeleteChallenge,
    labels,
}: ChallengesTabPageProps) {
    return (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
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
                    <Text style={styles.pageTitle}>{labels.pageTitle}</Text>
                </View>

                <Text style={styles.pageSubtitle}>{labels.pageSubtitle}</Text>

                <TouchableOpacity style={styles.createButton} onPress={onPressCreateChallenge}>
                    <Text style={styles.createButtonText}>{labels.createChallenge}</Text>
                </TouchableOpacity>
            </LinearGradient>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            {challenges.length === 0 ? (
                <GlassCard style={styles.emptyCard}>
                    <Text style={styles.emptyTitle}>{labels.noChallengesTitle}</Text>
                    <Text style={styles.emptySubtitle}>{labels.noChallengesSubtitle}</Text>
                </GlassCard>
            ) : (
                challenges.map((item, index) => {
                    const progress = Number(item.my_progress || 0);
                    const target = Number(item.challenge.goal_target || 1);
                    const ratio = Math.min(1, progress / Math.max(target, 1));
                    const endsAt = new Date(item.challenge.ends_at);
                    const remainingDays = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                    const isOwner = item.challenge.creator_id === profileId;
                    const isDeleting = deletingChallengeId === item.challenge.id;

                    return (
                        <GlassCard
                            key={item.challenge.id}
                            style={index === 0 ? [styles.challengeCard, styles.challengeCardFeatured] : styles.challengeCard}
                        >
                            <View style={styles.challengeTop}>
                                <Text style={styles.challengeTitle}>{item.challenge.title}</Text>
                                <View style={styles.challengeTopActions}>
                                    <Text style={styles.challengeDays}>{labels.daysRemaining(remainingDays)}</Text>
                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() => onDeleteChallenge(item)}
                                        disabled={isDeleting}
                                    >
                                        <X size={12} color={Colors.error} />
                                        <Text style={styles.deleteButtonText}>
                                            {isDeleting
                                                ? labels.deletingChallenge
                                                : (isOwner ? labels.deleteChallenge : labels.leaveChallenge)}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {!!item.challenge.description && (
                                <Text style={styles.challengeDescription}>{item.challenge.description}</Text>
                            )}

                            <View style={styles.metaChipRow}>
                                <View style={styles.metaChip}>
                                    <Sparkles size={12} color={Colors.cta} />
                                    <Text style={styles.metaChipText}>{labels.goalLabel(item.challenge.goal_type)}</Text>
                                </View>
                                <View style={styles.metaChip}>
                                    <Users size={12} color={Colors.info} />
                                    <Text style={styles.metaChipText}>{item.participants_count}</Text>
                                </View>
                            </View>

                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
                            </View>

                            <View style={styles.progressLabelRow}>
                                <Text style={styles.metaText}>
                                    {labels.progressLabel}: {Math.round(progress)}/{Math.round(target)} ({Math.round(ratio * 100)}%)
                                </Text>
                                <Text style={styles.progressPct}>{Math.round(ratio * 100)}%</Text>
                            </View>

                            {item.preview_participants.length > 0 && (
                                <View style={styles.participantRow}>
                                    {item.preview_participants.slice(0, 4).map((participant) => {
                                        const displayName = participant.display_name || participant.username;
                                        return (
                                            <View key={participant.id} style={styles.participantAvatar}>
                                                <Text style={styles.participantAvatarText}>{displayName.charAt(0).toUpperCase()}</Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            )}

                            {item.preview_participants.length > 0 && (
                                <Text style={styles.detailText}>
                                    {labels.detailsLabel}: {item.preview_participants
                                        .map((participant) => `${participant.display_name || participant.username} (${Math.round(participant.progress)})`)
                                        .join(' · ')}
                                </Text>
                            )}

                            <TouchableOpacity style={styles.addSessionButton} onPress={onPressAddSession}>
                                <Text style={styles.addSessionText}>{labels.addSession}</Text>
                            </TouchableOpacity>
                        </GlassCard>
                    );
                })
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
    createButton: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.cta,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
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
    emptyCard: {
        padding: Spacing.md,
        gap: Spacing.xs,
        borderRadius: BorderRadius.xxl,
    },
    emptyTitle: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    emptySubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    challengeCard: {
        padding: Spacing.md,
        gap: Spacing.xs,
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.overlayWhite10,
        backgroundColor: Colors.overlayBlack25,
    },
    challengeCardFeatured: {
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
    },
    challengeTop: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    challengeTopActions: {
        alignItems: 'flex-end',
        gap: 6,
    },
    challengeTitle: {
        flex: 1,
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.2,
    },
    challengeDays: {
        color: Colors.violet,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    deleteButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayError30,
        backgroundColor: Colors.overlayError15,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    deleteButtonText: {
        color: Colors.error,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    challengeDescription: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        lineHeight: 16,
    },
    metaChipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    metaChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        backgroundColor: Colors.overlayBlack30,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    metaChipText: {
        color: Colors.muted,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    progressTrack: {
        height: 10,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite20,
        overflow: 'hidden',
        marginTop: 2,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.cta2,
    },
    progressLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    metaText: {
        color: Colors.text,
        fontSize: FontSize.xs,
    },
    progressPct: {
        color: Colors.cta,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    participantAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: Colors.overlayWhite20,
        backgroundColor: Colors.overlayViolet20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: -6,
    },
    participantAvatarText: {
        color: Colors.violet,
        fontSize: 10,
        fontWeight: FontWeight.bold,
    },
    detailText: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        lineHeight: 15,
    },
    addSessionButton: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        alignItems: 'center',
        paddingVertical: Spacing.sm,
    },
    addSessionText: {
        color: Colors.cta,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    bottomSpacer: {
        height: 96,
    },
});
