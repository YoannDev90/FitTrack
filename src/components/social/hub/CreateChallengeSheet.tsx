import React from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { TrueSheet } from '@lodev09/react-native-true-sheet';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Clock, Sparkles, Target, Trophy, Users, Zap } from 'lucide-react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SocialChallengeGoalType } from '../../../services/supabase/social';

interface ChallengeFriendOption {
    id: string;
    username: string;
    display_name: string | null;
}

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
    friendOptions: ChallengeFriendOption[];
    selectedFriendIds: string[];
    onToggleFriendId: (friendId: string) => void;
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
        friendsTitle: string;
        noFriends: string;
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
    friendOptions,
    selectedFriendIds,
    onToggleFriendId,
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

    const goalTypes: SocialChallengeGoalType[] = ['workouts', 'distance', 'duration', 'xp'];

    return (
        <TrueSheet
            ref={sheetRef}
            detents={[0.92]}
            cornerRadius={32}
            backgroundColor={Colors.bg}
            grabber={false}
            scrollable={true}
        >
            <View style={styles.container}>
                <View style={styles.grabberWrap}>
                    <View style={styles.grabber} />
                </View>

                <LinearGradient
                    colors={['rgba(43, 25, 63, 0.95)', 'rgba(22, 18, 36, 0.95)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.heroCard}
                >
                    <View style={styles.heroHeaderRow}>
                        <LinearGradient
                            colors={[Colors.overlayCozyWarm15, Colors.overlayViolet12]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroIconWrap}
                        >
                            <Trophy size={18} color={Colors.cta} />
                        </LinearGradient>

                        <View style={styles.heroTextWrap}>
                            <Text style={styles.heroTitle}>{labels.title}</Text>
                            <Text style={styles.heroSubtitle}>{labels.subtitle}</Text>
                        </View>
                    </View>

                    <View style={styles.activeGoalBadge}>
                        <Sparkles size={12} color={Colors.cta} />
                        <Text style={styles.activeGoalBadgeText}>{goalTypeLabels[goalType]}</Text>
                    </View>
                </LinearGradient>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>{labels.placeholderTitle}</Text>
                        <TextInput
                            style={styles.input}
                            placeholder={labels.placeholderTitle}
                            placeholderTextColor={Colors.muted2}
                            value={title}
                            onChangeText={onChangeTitle}
                        />

                        <View style={styles.inputRow}>
                            <TextInput
                                style={[styles.input, styles.inputHalf]}
                                placeholder={labels.placeholderTarget}
                                placeholderTextColor={Colors.muted2}
                                keyboardType="numeric"
                                value={goalTarget}
                                onChangeText={onChangeGoalTarget}
                            />
                            <TextInput
                                style={[styles.input, styles.inputHalf]}
                                placeholder={labels.placeholderDuration}
                                placeholderTextColor={Colors.muted2}
                                keyboardType="numeric"
                                value={durationDays}
                                onChangeText={onChangeDurationDays}
                            />
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <Text style={styles.sectionLabel}>{labels.title}</Text>
                        <View style={styles.goalGrid}>
                            {goalTypes.map(goal => {
                            const isActive = goalType === goal;
                            const Icon = goal === 'workouts'
                                ? Trophy
                                : goal === 'distance'
                                    ? Target
                                    : goal === 'duration'
                                        ? Clock
                                        : Zap;

                            return (
                                <TouchableOpacity
                                    key={goal}
                                    style={[styles.goalChip, isActive && styles.goalChipActive]}
                                    onPress={() => onChangeGoalType(goal)}
                                >
                                    <View style={[styles.goalChipIconWrap, isActive && styles.goalChipIconWrapActive]}>
                                        <Icon size={13} color={isActive ? Colors.cta : Colors.muted2} />
                                    </View>
                                    <Text style={[styles.goalChipText, isActive && styles.goalChipTextActive]}>
                                        {goalTypeLabels[goal]}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                        </View>
                    </View>

                    <View style={styles.sectionCard}>
                        <View style={styles.friendsHeader}>
                            <Users size={13} color={Colors.info} />
                            <Text style={styles.friendsTitleText}>{labels.friendsTitle}</Text>
                        </View>

                        {friendOptions.length === 0 ? (
                            <Text style={styles.friendsEmpty}>{labels.noFriends}</Text>
                        ) : (
                            <View style={styles.friendGrid}>
                                {friendOptions.map(friend => {
                                    const isSelected = selectedFriendIds.includes(friend.id);
                                    const displayName = friend.display_name || friend.username;

                                    return (
                                        <TouchableOpacity
                                            key={friend.id}
                                            style={[styles.friendTile, isSelected && styles.friendTileSelected]}
                                            onPress={() => onToggleFriendId(friend.id)}
                                        >
                                            <View style={[styles.friendAvatar, isSelected && styles.friendAvatarSelected]}>
                                                <Text
                                                    style={[styles.friendAvatarText, isSelected && styles.friendAvatarTextSelected]}
                                                >
                                                    {displayName.charAt(0).toUpperCase()}
                                                </Text>
                                            </View>

                                            <Text
                                                style={[styles.friendName, isSelected && styles.friendNameSelected]}
                                                numberOfLines={1}
                                            >
                                                {displayName}
                                            </Text>

                                            {isSelected && (
                                                <View style={styles.friendCheck}>
                                                    <Check size={10} color={Colors.white} />
                                                </View>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </View>

                    <View style={styles.scrollBottomSpacer} />
                </ScrollView>

                <View style={styles.actionsRow}>
                    <TouchableOpacity style={styles.cancelButton} onPress={() => sheetRef.current?.dismiss()}>
                        <Text style={styles.cancelButtonText}>{labels.cancel}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.createButtonTouch}
                        disabled={isCreating}
                        onPress={onCreate}
                    >
                        <LinearGradient
                            colors={[Colors.cta2, Colors.cta]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.createButton}
                        >
                            <Target size={13} color={Colors.white} />
                            <Text style={styles.createButtonText}>{isCreating ? labels.creating : labels.create}</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
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
    heroCard: {
        borderRadius: BorderRadius.xxl,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        padding: Spacing.md,
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    heroHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    heroIconWrap: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.overlayWhite12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroTextWrap: {
        flex: 1,
    },
    heroTitle: {
        color: Colors.text,
        fontSize: FontSize.xl,
        fontWeight: FontWeight.extrabold,
        letterSpacing: -0.4,
    },
    heroSubtitle: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
        lineHeight: 16,
    },
    activeGoalBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 5,
    },
    activeGoalBadgeText: {
        color: Colors.cta,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    scrollView: {
        flex: 1,
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
    sectionLabel: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    input: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        color: Colors.text,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        fontSize: FontSize.sm,
    },
    inputRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    inputHalf: {
        flex: 1,
    },
    goalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    goalChip: {
        width: '48%',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlayBlack30,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    goalChipActive: {
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
    },
    goalChipIconWrap: {
        width: 24,
        height: 24,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.overlayWhite08,
        alignItems: 'center',
        justifyContent: 'center',
    },
    goalChipIconWrapActive: {
        backgroundColor: Colors.overlayCozyWarm15,
    },
    goalChipText: {
        color: Colors.textSecondary,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    goalChipTextActive: {
        color: Colors.cta,
    },
    friendsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    friendsTitleText: {
        color: Colors.text,
        fontSize: FontSize.sm,
        fontWeight: FontWeight.semibold,
    },
    friendsEmpty: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
    },
    friendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    friendTile: {
        width: '48%',
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        padding: Spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'relative',
    },
    friendTileSelected: {
        borderColor: Colors.overlayCozyWarm40,
        backgroundColor: Colors.overlayCozyWarm15,
    },
    friendAvatar: {
        width: 26,
        height: 26,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.overlayWhite10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    friendAvatarSelected: {
        backgroundColor: Colors.overlayCozyWarm40,
    },
    friendAvatarText: {
        color: Colors.muted,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    friendAvatarTextSelected: {
        color: Colors.white,
    },
    friendName: {
        flex: 1,
        color: Colors.muted,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    friendNameSelected: {
        color: Colors.cta,
    },
    friendCheck: {
        position: 'absolute',
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.cta,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
    },
    sheetInputHalf: {
        flex: 1,
    },
    scrollBottomSpacer: {
        height: Spacing.lg,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
    },
    cancelButton: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        backgroundColor: Colors.overlayBlack25,
    },
    cancelButtonText: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
    createButtonTouch: {
        flex: 1,
        borderRadius: BorderRadius.lg,
        overflow: 'hidden',
    },
    createButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: Spacing.sm,
        borderWidth: 1,
        borderColor: Colors.overlayCozyWarm40,
        flexDirection: 'row',
        gap: 6,
    },
    createButtonText: {
        color: Colors.white,
        fontWeight: FontWeight.bold,
    },
});
