import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { ChallengeSectionProps } from './types';

export function ChallengeCarouselSection({
    activeChallenges,
    challengeCardWidth,
    challengeIndex,
    setChallengeIndex,
    onAddSession,
    strings,
}: ChallengeSectionProps) {
    if (activeChallenges.length === 0) {
        return null;
    }

    return (
        <View>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>{strings.sectionTitle}</Text>
                <Text style={styles.sectionLink}>{strings.swipeHint}</Text>
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
                    const endsAt = new Date(item.challenge.ends_at);
                    const remainingDays = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
                    const participantsPreview = item.preview_participants
                        .slice(0, 2)
                        .map(participant => `${participant.display_name || participant.username}: ${Math.round(participant.progress)}`)
                        .join(' · ');

                    return (
                        <LinearGradient
                            key={item.challenge.id}
                            colors={[Colors.violetStrong, Colors.violetDeep]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={[styles.challengeCard, { width: challengeCardWidth }]}
                        >
                            <Text style={styles.challengeKicker}>{strings.daysRemaining(remainingDays)}</Text>
                            <Text style={styles.challengeTitle}>{item.challenge.title}</Text>

                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${ratio * 100}%` }]} />
                            </View>

                            <View style={styles.challengeMetaRow}>
                                <Text style={styles.challengeMetaText}>
                                    {progress}/{target} {strings.goalLabel(item.challenge.goal_type)}
                                </Text>
                                <Text style={styles.challengeMetaText}>{participantsPreview || strings.noParticipants}</Text>
                            </View>

                            <View style={styles.challengeActions}>
                                <TouchableOpacity style={styles.challengeGhostBtn}>
                                    <Text style={styles.challengeGhostBtnText}>{strings.details}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.challengeSolidBtn} onPress={onAddSession}>
                                    <Text style={styles.challengeSolidBtnText}>{strings.addSession}</Text>
                                </TouchableOpacity>
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
    challengeCarousel: {
        gap: Spacing.md,
        paddingRight: Spacing.md,
    },
    challengeCard: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
    },
    challengeKicker: {
        color: Colors.textWhite80,
        fontSize: FontSize.xs,
        marginBottom: 6,
    },
    challengeTitle: {
        color: Colors.white,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        marginBottom: Spacing.md,
    },
    progressTrack: {
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.overlayWhite20,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: Colors.violet,
    },
    challengeMetaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: Spacing.md,
        gap: Spacing.sm,
    },
    challengeMetaText: {
        color: Colors.textWhite80,
        fontSize: FontSize.xs,
        flexShrink: 1,
    },
    challengeActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    challengeGhostBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlayWhite12,
        alignItems: 'center',
    },
    challengeGhostBtnText: {
        color: Colors.white,
        fontWeight: FontWeight.semibold,
        fontSize: FontSize.sm,
    },
    challengeSolidBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.white,
        alignItems: 'center',
    },
    challengeSolidBtnText: {
        color: Colors.violetDeep,
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
