import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SocialTopTabId } from './types';

interface TopTabsProps {
    activeTab: SocialTopTabId;
    onPressTab: (tab: SocialTopTabId) => void;
    labels: Record<SocialTopTabId, string>;
}

export function TopTabs({ activeTab, onPressTab, labels }: TopTabsProps) {
    const tabs: SocialTopTabId[] = ['home', 'challenges', 'friends', 'leaderboard'];

    return (
        <View style={styles.container}>
            {tabs.map(tab => {
                const isActive = activeTab === tab;
                return (
                    <TouchableOpacity
                        key={tab}
                        style={[styles.tab, isActive && styles.tabActive]}
                        onPress={() => onPressTab(tab)}
                    >
                        <Text style={[styles.tabText, isActive && styles.tabTextActive]}>{labels[tab]}</Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.xs,
        marginBottom: Spacing.md,
    },
    tab: {
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md,
        paddingVertical: 7,
    },
    tabActive: {
        backgroundColor: Colors.overlay,
        borderWidth: 1,
        borderColor: Colors.stroke,
    },
    tabText: {
        color: Colors.muted2,
        fontSize: FontSize.sm,
    },
    tabTextActive: {
        color: Colors.text,
        fontWeight: FontWeight.semibold,
    },
});
