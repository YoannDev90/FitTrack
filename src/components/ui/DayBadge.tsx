// ============================================================================
// DAY BADGE - Jour de la semaine avec état (Optimisé avec React.memo)
// ============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight } from '../../constants';

interface DayBadgeProps {
    dayOfWeek: string;
    dayNumber: number;
    isToday: boolean;
    isDone: boolean;
    onPress?: () => void;
}

export const DayBadge = React.memo(function DayBadge({
    dayOfWeek,
    dayNumber,
    isToday,
    isDone,
    onPress,
}: DayBadgeProps) {
    const Container = onPress ? TouchableOpacity : View;

    return (
        <Container
            style={[
                styles.day,
                isDone && styles.dayDone,
                isToday && styles.dayToday,
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.dow}>{dayOfWeek}</Text>
            {isDone ? (
                <View style={styles.checkCircle}>
                    <Text style={styles.check}>✓</Text>
                </View>
            ) : (
                <Text style={[styles.date, isToday && styles.dateToday]}>{dayNumber}</Text>
            )}
        </Container>
    );
});

const styles = StyleSheet.create({
    day: {
        flex: 1,
        borderRadius: BorderRadius.md,
        paddingVertical: 12,
        paddingHorizontal: 6,
        backgroundColor: Colors.overlay,
        borderWidth: 1,
        borderColor: Colors.stroke,
        alignItems: 'center',
        minWidth: 40,
    },
    dayDone: {
        backgroundColor: Colors.overlaySuccess20,
        borderColor: Colors.success,
    },
    dayToday: {
        borderColor: Colors.overlayWhite30,
        backgroundColor: Colors.overlayWhite10,
    },
    dow: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginBottom: 6,
        fontWeight: FontWeight.medium,
    },
    date: {
        fontSize: FontSize.lg,
        fontWeight: FontWeight.semibold,
        color: Colors.text,
    },
    dateToday: {
        color: Colors.text,
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.25)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    check: {
        color: Colors.text,
        fontSize: 11,
        fontWeight: FontWeight.bold,
    },
});
