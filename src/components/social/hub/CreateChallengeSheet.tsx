import React from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SocialChallengeGoalType } from '../../../services/supabase/social';

interface CreateChallengeSheetProps {
    sheetRef: React.RefObject<TrueSheet | null>;
    title: string;
    onChangeTitle: (value: string) => void;
    goalType: SocialChallengeGoalType;
    onChangeGoalType: (value: SocialChallengeGoalType) => void;
    goalTarget: string;
    onChangeGoalTarget: (value: string) => void;
    durationDays: string;
    onChangeDurationDays: (value: string) => void;
    isCreating: boolean;
    onCreate: () => void;
    labels: {
        title: string;
        subtitle: string;
        placeholderTitle: string;
        placeholderTarget: string;
        placeholderDuration: string;
        cancel: string;
        create: string;
        creating: string;
        workouts: string;
        distance: string;
        duration: string;
        xp: string;
    };
}

export function CreateChallengeSheet({
    sheetRef,
    title,
    onChangeTitle,
    goalType,
    onChangeGoalType,
    goalTarget,
    onChangeGoalTarget,
    durationDays,
    onChangeDurationDays,
    isCreating,
    onCreate,
    labels,
}: CreateChallengeSheetProps) {
    const goalTypeLabels: Record<SocialChallengeGoalType, string> = {
        workouts: labels.workouts,
        distance: labels.distance,
        duration: labels.duration,
        xp: labels.xp,
    };

    return (
        <TrueSheet
            ref={sheetRef}
            detents={[0.65]}
            cornerRadius={30}
            backgroundColor={Colors.bg}
            grabber={true}
            scrollable={true}
        >
            <View style={styles.sheetBody}>
                <Text style={styles.sheetTitle}>{labels.title}</Text>
                <Text style={styles.sheetSubtitle}>{labels.subtitle}</Text>

                <TextInput
                    style={styles.sheetInput}
                    placeholder={labels.placeholderTitle}
                    placeholderTextColor={Colors.muted2}
                    value={title}
                    onChangeText={onChangeTitle}
                />

                <View style={styles.goalTypeRow}>
                    {(['workouts', 'distance', 'duration', 'xp'] as SocialChallengeGoalType[]).map(goal => (
                        <TouchableOpacity
                            key={goal}
                            style={[styles.goalTypeChip, goalType === goal && styles.goalTypeChipActive]}
                            onPress={() => onChangeGoalType(goal)}
                        >
                            <Text style={[styles.goalTypeChipText, goalType === goal && styles.goalTypeChipTextActive]}>
                                {goalTypeLabels[goal]}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.sheetInputRow}>
                    <TextInput
                        style={[styles.sheetInput, styles.sheetInputHalf]}
                        placeholder={labels.placeholderTarget}
                        placeholderTextColor={Colors.muted2}
                        keyboardType="numeric"
                        value={goalTarget}
                        onChangeText={onChangeGoalTarget}
                    />
                    <TextInput
                        style={[styles.sheetInput, styles.sheetInputHalf]}
                        placeholder={labels.placeholderDuration}
                        placeholderTextColor={Colors.muted2}
                        keyboardType="numeric"
                        value={durationDays}
                        onChangeText={onChangeDurationDays}
                    />
                </View>

                <View style={styles.sheetActions}>
                    <TouchableOpacity style={styles.sheetCancelBtn} onPress={() => sheetRef.current?.dismiss()}>
                        <Text style={styles.sheetCancelText}>{labels.cancel}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.sheetCreateBtn}
                        disabled={isCreating}
                        onPress={onCreate}
                    >
                        <Text style={styles.sheetCreateText}>{isCreating ? labels.creating : labels.create}</Text>
                    </TouchableOpacity>
                </View>
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
    sheetInput: {
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        color: Colors.text,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSize.sm,
    },
    goalTypeRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginVertical: Spacing.xs,
    },
    goalTypeChip: {
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.stroke,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
        backgroundColor: Colors.overlay,
    },
    goalTypeChipActive: {
        borderColor: Colors.overlayViolet35,
        backgroundColor: Colors.overlayViolet20,
    },
    goalTypeChipText: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    goalTypeChipTextActive: {
        color: Colors.violet,
    },
    sheetInputRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    sheetInputHalf: {
        flex: 1,
    },
    sheetActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.sm,
    },
    sheetCancelBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        borderColor: Colors.stroke,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlay,
    },
    sheetCancelText: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
    sheetCreateBtn: {
        flex: 1,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.cta,
    },
    sheetCreateText: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
});
