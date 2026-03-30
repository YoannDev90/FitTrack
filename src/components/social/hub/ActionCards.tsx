import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ChevronRight, Plus, Share2 } from 'lucide-react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';

interface ActionCardsProps {
    onPressShareWorkout: () => void;
    onPressCreateChallenge: () => void;
    labels: {
        shareTitle: string;
        shareSubtitle: string;
        challengeTitle: string;
        challengeSubtitle: string;
    };
}

export function ActionCards({ onPressShareWorkout, onPressCreateChallenge, labels }: ActionCardsProps) {
    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.card} onPress={onPressShareWorkout}>
                <View style={styles.iconWrap}>
                    <Share2 size={18} color={Colors.cta} />
                </View>
                <View style={styles.textWrap}>
                    <Text style={styles.title}>{labels.shareTitle}</Text>
                    <Text style={styles.subtitle}>{labels.shareSubtitle}</Text>
                </View>
                <ChevronRight size={18} color={Colors.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={onPressCreateChallenge}>
                <View style={styles.iconWrap}>
                    <Plus size={20} color={Colors.cta} />
                </View>
                <View style={styles.textWrap}>
                    <Text style={styles.title}>{labels.challengeTitle}</Text>
                    <Text style={styles.subtitle}>{labels.challengeSubtitle}</Text>
                </View>
                <ChevronRight size={18} color={Colors.muted} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        gap: Spacing.sm,
    },
    card: {
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Colors.overlayViolet35,
        borderStyle: 'dashed',
        backgroundColor: Colors.overlayViolet12,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    iconWrap: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: Colors.overlayViolet20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textWrap: {
        flex: 1,
    },
    title: {
        color: Colors.text,
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
    },
    subtitle: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        marginTop: 2,
    },
});
