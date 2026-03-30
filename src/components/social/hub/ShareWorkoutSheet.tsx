import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
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

export function ShareWorkoutSheet({
    sheetRef,
    workouts,
    isSharingWorkoutId,
    onShareWorkout,
    labels,
}: ShareWorkoutSheetProps) {
    return (
        <TrueSheet
            ref={sheetRef}
            detents={[0.7]}
            cornerRadius={30}
            backgroundColor={Colors.bg}
            grabber={true}
            scrollable={true}
        >
            <View style={styles.sheetBody}>
                <Text style={styles.sheetTitle}>{labels.title}</Text>
                <Text style={styles.sheetSubtitle}>{labels.subtitle}</Text>

                {workouts.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyTitle}>{labels.emptyTitle}</Text>
                        <Text style={styles.emptySubtitle}>{labels.emptySubtitle}</Text>
                    </View>
                ) : (
                    workouts.map(workout => (
                        <View key={workout.id} style={styles.workoutItem}>
                            <View style={styles.workoutInfo}>
                                <Text style={styles.workoutTitle}>{workout.title}</Text>
                                <Text style={styles.workoutSummary}>{workout.summary}</Text>
                                <Text style={styles.workoutDate}>{formatDate(workout.createdAt)}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.shareBtn}
                                onPress={() => onShareWorkout(workout)}
                                disabled={isSharingWorkoutId === workout.id}
                            >
                                <Text style={styles.shareBtnText}>
                                    {isSharingWorkoutId === workout.id ? labels.sharingAction : labels.shareAction}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>
        </TrueSheet>
    );
}

const styles = StyleSheet.create({
    sheetBody: {
        padding: Spacing.lg,
        gap: Spacing.sm,
    },
    sheetTitle: {
        color: Colors.text,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
    },
    sheetSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        marginBottom: Spacing.sm,
    },
    emptyState: {
        paddingVertical: Spacing.lg,
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
    workoutItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.stroke,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.overlay,
        padding: Spacing.md,
    },
    workoutInfo: {
        flex: 1,
        gap: 2,
    },
    workoutTitle: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    workoutSummary: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    workoutDate: {
        color: Colors.muted,
        fontSize: FontSize.xs,
    },
    shareBtn: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
    },
    shareBtnText: {
        color: Colors.cta,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
});
