import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { House, Medal, Swords, Users } from 'lucide-react-native';
import { BorderRadius, Colors, FontSize, FontWeight, Spacing } from '../../../constants';
import type { SocialTopTabId } from './types';

interface TopTabsProps {
    activeTab: SocialTopTabId;
    onPressTab: (tab: SocialTopTabId) => void;
    labels: Record<SocialTopTabId, string>;
}

export function TopTabs({ activeTab, onPressTab, labels }: TopTabsProps) {
    const tabs: SocialTopTabId[] = ['home', 'challenges', 'friends', 'leaderboard'];
    const iconByTab: Record<SocialTopTabId, React.ComponentType<any>> = {
        home: House,
        challenges: Swords,
        friends: Users,
        leaderboard: Medal,
    };

    return (
        <View style={styles.shell}>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.container}
            >
                {tabs.map(tab => {
                    const isActive = activeTab === tab;
                    const Icon = iconByTab[tab];

                    return (
                        <TouchableOpacity
                            key={tab}
                            style={styles.tabTouch}
                            activeOpacity={0.88}
                            onPress={() => onPressTab(tab)}
                        >
                            {isActive ? (
                                <LinearGradient
                                    colors={[Colors.overlayCozyWarm15, Colors.overlayViolet12]}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={[styles.tab, styles.tabActive]}
                                >
                                    <Icon size={14} color={Colors.cta} />
                                    <Text style={[styles.tabText, styles.tabTextActive]}>{labels[tab]}</Text>
                                </LinearGradient>
                            ) : (
                                <View style={styles.tab}>
                                    <Icon size={14} color={Colors.muted2} />
                                    <Text style={styles.tabText}>{labels[tab]}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    shell: {
        marginBottom: Spacing.md,
    },
    container: {
        flexDirection: 'row',
        gap: Spacing.xs,
        paddingRight: Spacing.xs,
    },
    tabTouch: {
        minWidth: 112,
    },
    tab: {
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.stroke,
        backgroundColor: Colors.overlayBlack30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: Spacing.md,
        paddingVertical: 9,
    },
    tabActive: {
        borderColor: Colors.overlayCozyWarm40,
    },
    tabText: {
        color: Colors.muted2,
        fontSize: FontSize.xs,
        fontWeight: FontWeight.semibold,
    },
    tabTextActive: {
        color: Colors.cta,
    },
});
