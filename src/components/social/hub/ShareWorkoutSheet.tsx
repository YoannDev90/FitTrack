import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Share2, Zap } from 'lucide-react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { ShareableWorkoutItem } from './types';

interface ShareWorkoutSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    workouts: ShareableWorkoutItem[];
    isSharingWorkoutId: string | null;
    onShareWorkout: (workout: ShareableWorkoutItem) => void;
    labels: {
        title: string;
        subtitle: string;
        emptyTitle: string;
        emptySubtitle: string;
        shareAction: string;
        sharingAction: string;
    };
}

function formatDate(isoDate: string) {
    const date = new Date(isoDate);
    return date.toLocaleDateString();
}

function getTypeTone(entryType: ShareableWorkoutItem['entryType']) {
    if (entryType === 'run') {
        return { bg: Colors.overlaySky16, border: Colors.overlaySky30, text: Colors.sky };
    }
    if (entryType === 'beatsaber') {
        return { bg: Colors.overlayViolet20, border: Colors.overlayViolet35, text: Colors.violet };
    }
    if (entryType === 'custom') {
        return { bg: Colors.overlayTeal20, border: Colors.overlayInfo35, text: Colors.info };
    }

    return { bg: Colors.overlayCozyWarm15, border: Colors.overlayCozyWarm40, text: Colors.cta };
}

export function ShareWorkoutSheet({
    sheetRef,
    workouts,
    isSharingWorkoutId,
    onShareWorkout,
    labels,
}: ShareWorkoutSheetProps) {
    const hasWorkouts = workouts.length > 0;

    return (
        <TrueSheet
            ref={sheetRef}
            detents={[0.82]}
            cornerRadius={32}
            backgroundColor={Colors.bg}
            grabber={false}
            scrollable={true}
        >
            <View style={styles.container}>
                <View style={styles.grabberWrap}>
                    <View style={styles.grabber} />
                </View>

                <View style={styles.headerRow}>
                    <LinearGradient
                        colors={[Colors.overlayTeal15, Colors.overlayViolet12]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.headerIconWrap}
                    >
                        <Share2 size={18} color={Colors.info} />
                    </LinearGradient>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.title}>{labels.title}</Text>
                        <Text style={styles.subtitle}>{labels.subtitle}</Text>
                    </View>
                </View>

                <LinearGradient
                    colors={['transparent', Colors.overlayInfo35, 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.headerDivider}
                />

                {!hasWorkouts ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>{labels.emptyTitle}</Text>
                        <Text style={styles.emptySubtitle}>{labels.emptySubtitle}</Text>
                    </View>
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        {workouts.map((workout, index) => (
                            <View key={workout.id} style={[styles.workoutCard, index === 0 && styles.workoutCardFeatured]}>
                                <View style={[styles.workoutAccent, { backgroundColor: getTypeTone(workout.entryType).text }]} />

                                <View style={styles.workoutInfo}>
                                    <View style={styles.workoutTopRow}>
                                        <View
                                            style={[
                                                styles.typeBadge,
                                                {
                                                    backgroundColor: getTypeTone(workout.entryType).bg,
                                                    borderColor: getTypeTone(workout.entryType).border,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.typeBadgeText, { color: getTypeTone(workout.entryType).text }]}>
                                                {workout.entryType}
                                            </Text>
                                        </View>
                                        <Text style={styles.workoutDate}>{formatDate(workout.createdAt)}</Text>
                                    </View>
                                    <Text style={styles.workoutTitle}>{workout.title}</Text>
                                    <Text style={styles.workoutSummary}>{workout.summary}</Text>
                                </View>

                                <TouchableOpacity
                                    style={styles.shareButtonTouch}
                                    onPress={() => onShareWorkout(workout)}
                                    disabled={isSharingWorkoutId === workout.id}
                                >
                                    <LinearGradient
                                        colors={[Colors.cta2, Colors.cta]}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                        style={styles.shareButton}
                                    >
                                        <Zap size={12} color={Colors.white} />
                                        <Text style={styles.shareButtonText}>
                                            {isSharingWorkoutId === workout.id ? labels.sharingAction : labels.shareAction}
                                        </Text>
                                    </LinearGradient>
                                </TouchableOpacity>
                            </View>
                        ))}

                        <View style={styles.listBottomSpacer} />
                    </ScrollView>
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
        gap: Spacing.sm,
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
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    headerIconWrap: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
    },
    title: {
        color: Colors.text,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.4,
    },
    subtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        lineHeight: 16,
    },
    headerDivider: {
        height: 1,
        marginVertical: Spacing.xs,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        gap: Spacing.sm,
    },
    emptyState: {
        paddingVertical: Spacing.xl,
        gap: Spacing.xs,
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
    workoutCard: {
        flexDirection: 'row',
        alignItems: 'stretch',
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.overlayWhite08,
        borderRadius: BorderRadius.xl,
        backgroundColor: Colors.overlayBlack25,
        padding: Spacing.md,
    },
    workoutCardFeatured: {
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
    },
    workoutAccent: {
        width: 3,
        borderRadius: BorderRadius.full,
    },
    workoutInfo: {
        flex: 1,
        gap: 3,
    },
    workoutTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: Spacing.sm,
    },
    typeBadge: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    workoutTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.bold,
    },
    workoutSummary: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        lineHeight: 15,
    },
    workoutDate: {
        color: Colors.muted,
        fontSize: 10,
    },
    shareButtonTouch: {
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
        minWidth: 92,
        alignSelf: 'center',
    },
    shareButton: {
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
    },
    shareButtonText: {
        color: Colors.white,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    listBottomSpacer: {
        height: Spacing.xl,
    },
});
