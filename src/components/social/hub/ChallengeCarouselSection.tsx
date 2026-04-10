import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Compass, Crown, Users } from 'lucide-react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { ChallengeSectionProps } from './types';

export function ChallengeCarouselSection({
    activeChallenges,
    challengeCardWidth,
    challengeIndex,
    setChallengeIndex,
    onAddSession,
    onViewDetails,
    strings,
}: ChallengeSectionProps) {
    if (activeChallenges.length === 0) {
        return null;
    }

    return (
        <View>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionLabelWrap}>
                    <Compass size={13} color={Colors.violet} />
                    <Text style={styles.sectionLabel}>{strings.sectionTitle}</Text>
                </View>
            </View>

            <ScrollView
                horizontal
                pagingEnabled
                snapToInterval={challengeCardWidth + Spacing.md}
                decelerationRate="fast"
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.challengeCarousel}
                onMomentumScrollEnd={(event) => {
                    const page = Math.round(event.nativeEvent.contentOffset.x / (challengeCardWidth + Spacing.md));
                    setChallengeIndex(Math.max(0, Math.min(activeChallenges.length - 1, page)));
                }}
            >
                {activeChallenges.map((item) => {
                    const progress = Number(item.my_progress || 0);
                    const target = Number(item.challenge.goal_target || 1);
                    const ratio = Math.min(1, progress / Math.max(target, 1));
                    const isFinished = item.is_finished;
                    const endsAt = new Date(item.challenge.ends_at);
                    const remainingDays = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                    const participantsPreview = item.preview_participants
                        .slice(0, 2)
                        .map(participant => `${participant.display_name || participant.username}: ${Math.round(participant.progress)}`)
                        .join(' · ');
                    const winnerName = item.winner ? (item.winner.display_name || item.winner.username) : null;
                    const cardColors: [string, string, string] = isFinished
                        ? [Colors.overlaySuccess24, Colors.overlayViolet14, Colors.overlayBlack60]
                        : [Colors.overlayViolet24, Colors.overlayViolet18, Colors.overlayBlack60];

                    return (
                        <LinearGradient
                            key={item.challenge.id}
                            colors={cardColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.challengeCard, { width: challengeCardWidth }]}
                        >
                            <View style={styles.challengeTopRow}>
                                <View style={isFinished ? [styles.challengeKickerPill, styles.challengeKickerPillFinished] : styles.challengeKickerPill}>
                                    <Text style={styles.challengeKicker}>
                                        {isFinished ? strings.finishedLabel : strings.daysRemaining(remainingDays)}
                                    </Text>
                                </View>
                                <View style={styles.goalPill}>
                                    <Text style={styles.goalPillText}>{strings.goalLabel(item.challenge.goal_type)}</Text>
                                </View>
                            </View>

                            <Text style={styles.challengeTitle}>{item.challenge.title}</Text>

                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
                            </View>

                            <Text style={styles.progressLabel}>
                                {Math.round(progress)}/{Math.round(target)} ({Math.round(ratio * 100)}%)
                            </Text>

                            {isFinished && (
                                <View style={styles.winnerRow}>
                                    <Crown size={13} color={Colors.gold} />
                                    <Text style={styles.winnerText} numberOfLines={1}>
                                        {item.winner
                                            ? (item.winner.is_tie
                                                ? strings.drawLabel(item.winner.tied_with_count)
                                                : strings.winnerLabel(winnerName || ''))
                                            : strings.finishReasonLabel(item.finish_reason)}
                                    </Text>
                                </View>
                            )}

                            {isFinished && (
                                <Text style={styles.finishReasonText}>{strings.finishReasonLabel(item.finish_reason)}</Text>
                            )}

                            <View style={styles.challengeParticipantsRow}>
                                <Users size={12} color={Colors.textWhite80} />
                                <Text style={styles.challengeMetaText} numberOfLines={1}>
                                    {participantsPreview || strings.noParticipants}
                                </Text>
                            </View>

                            <View style={styles.challengeActions}>
                                <TouchableOpacity style={styles.challengeGhostBtn} onPress={() => onViewDetails(item)}>
                                    <Text style={styles.challengeGhostBtnText}>{strings.details}</Text>
                                </TouchableOpacity>
                                {isFinished ? null : (
                                    <TouchableOpacity style={styles.challengeSolidBtn} onPress={onAddSession}>
                                        <Text style={styles.challengeSolidBtnText}>{strings.addSession}</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </LinearGradient>
                    );
                })}
            </ScrollView>

            <View style={styles.dotRow}>
                {activeChallenges.map((item, idx) => (
                    <View
                        key={item.challenge.id}
                        style={[styles.dot, idx === challengeIndex && styles.dotActive]}
                    />
                ))}
            </View>
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
    sectionLabelWrap: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    sectionLabel: {
        color: Colors.text,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    challengeCarousel: {
        gap: Spacing.md,
        paddingRight: Spacing.md,
    },
    challengeCard: {
        borderRadius: BorderRadius.xxl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        gap: Spacing.xs,
    },
    challengeTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 2,
    },
    challengeKickerPill: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayWhite20,
        backgroundColor: Colors.overlayWhite10,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    challengeKickerPillFinished: {
        borderColor: Colors.overlaySuccess20,
        backgroundColor: Colors.overlaySuccess10,
    },
    goalPill: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    goalPillText: {
        color: Colors.cta,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
    },
    challengeKicker: {
        color: Colors.textWhite80,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    challengeTitle: {
        color: Colors.white,
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        letterSpacing: -0.5,
        marginTop: 2,
        marginBottom: Spacing.xs,
    },
    progressTrack: {
        height: 10,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite20,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.cta2,
    },
    progressLabel: {
        color: Colors.textWhite80,
        fontSize: 10,
        fontWeight: FontWeight.semibold,
    },
    winnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2,
    },
    winnerText: {
        flex: 1,
        color: Colors.gold,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    finishReasonText: {
        color: Colors.textWhite80,
        fontSize: 10,
    },
    challengeParticipantsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: Spacing.xs,
    },
    challengeMetaText: {
        color: Colors.textWhite80,
        fontSize: FontSize.xs,
        flex: 1,
    },
    challengeActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: 2,
    },
    challengeGhostBtn: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlayWhite12,
        borderWidth: 1,
        borderColor: Colors.overlayWhite20,
        alignItems: 'center',
    },
    challengeGhostBtnText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    challengeSolidBtn: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.cta,
        alignItems: 'center',
    },
    challengeSolidBtnText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    dotRow: {
        marginTop: Spacing.sm,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite20,
    },
    dotActive: {
        backgroundColor: Colors.violet,
        width: 20,
    },
});
