// ============================================================================
// CATEGORY SCREEN — Première étape : Sport / Repas / Mesures
// ============================================================================

import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Dumbbell, UtensilsCrossed, Ruler } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { FC, FS, FR, FT, FW } from './formStyles';

type CategoryType = 'sport' | 'meal' | 'measure';

interface CategoryScreenProps {
    onSelect: (category: CategoryType) => void;
}

interface CategoryItemConfig {
    id: CategoryType;
    titleKey: string;
    descKey: string;
    defaultTitle: string;
    defaultDesc: string;
    icon: React.ReactNode;
    gradient: [string, string];
    border: string;
    iconBg: string;
}

export function CategoryScreen({ onSelect }: CategoryScreenProps) {
    const { t } = useTranslation();

    // Animations d'entrée staggerées
    const anims = [
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
        useRef(new Animated.Value(0)).current,
    ];

    useEffect(() => {
        Animated.stagger(90, anims.map(a =>
            Animated.spring(a, { toValue: 1, useNativeDriver: true, tension: 75, friction: 11 })
        )).start();
    }, []);

    const categories: CategoryItemConfig[] = [
        {
            id: 'sport',
            titleKey: 'addEntry.sportCategory',
            descKey: 'addEntry.sportCategoryDesc',
            defaultTitle: 'Sport',
            defaultDesc: 'Musculation, course, yoga…',
            icon: <Dumbbell size={28} color={FC.violet} strokeWidth={2} />,
            gradient: ['rgba(167,139,250,0.18)', 'rgba(167,139,250,0.05)'],
            border: FC.violetBorder,
            iconBg: FC.violetSoft,
        },
        {
            id: 'meal',
            titleKey: 'addEntry.meal',
            descKey: 'addEntry.mealCategoryDesc',
            defaultTitle: 'Repas',
            defaultDesc: 'Petit-déj, déjeuner, dîner…',
            icon: <UtensilsCrossed size={28} color={FC.green} strokeWidth={2} />,
            gradient: ['rgba(61,214,140,0.15)', 'rgba(61,214,140,0.04)'],
            border: FC.greenBorder,
            iconBg: FC.greenSoft,
        },
        {
            id: 'measure',
            titleKey: 'addEntry.measure',
            descKey: 'addEntry.measureCategoryDesc',
            defaultTitle: 'Mesures',
            defaultDesc: 'Poids, tour de taille…',
            icon: <Ruler size={28} color={FC.amber} strokeWidth={2} />,
            gradient: ['rgba(255,176,64,0.15)', 'rgba(255,176,64,0.04)'],
            border: 'rgba(255,176,64,0.28)',
            iconBg: 'rgba(255,176,64,0.12)',
        },
    ];

    return (
        <View style={st.container}>
            {/* Titre */}
            <Animated.View style={{
                opacity: anims[0],
                transform: [{ translateY: anims[0].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
                marginBottom: FS.xxl,
            }}>
                <Text style={st.title}>
                    {t('addEntry.title', 'Ajouter une entrée')}
                </Text>
                <Text style={st.subtitle}>
                    {t('addEntry.subtitle', 'Que veux-tu enregistrer ?')}
                </Text>
                {/* Ligne accent */}
                <View style={st.accentLine} />
            </Animated.View>

            {/* Cards catégories */}
            {categories.map((cat, i) => (
                <Animated.View key={cat.id} style={{
                    opacity: anims[Math.min(i, 2)],
                    transform: [{ translateY: anims[Math.min(i, 2)].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
                    marginBottom: FS.md,
                }}>
                    <TouchableOpacity
                        onPress={() => onSelect(cat.id)}
                        activeOpacity={0.78}
                    >
                        <LinearGradient
                            colors={cat.gradient}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={[st.categoryCard, { borderColor: cat.border }]}
                        >
                            {/* Glow coin */}
                            <View style={[st.cardGlow, { backgroundColor: cat.gradient[0] }]} />

                            {/* Icône */}
                            <View style={[st.iconWrap, { backgroundColor: cat.iconBg }]}>
                                {cat.icon}
                            </View>

                            {/* Textes */}
                            <View style={st.cardText}>
                                <Text style={st.cardTitle}>
                                    {t(cat.titleKey, cat.defaultTitle)}
                                </Text>
                                <Text style={st.cardDesc}>
                                    {t(cat.descKey, cat.defaultDesc)}
                                </Text>
                            </View>

                            {/* Chevron */}
                            <Text style={[st.chevron, { color: cat.border }]}>›</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>
            ))}
        </View>
    );
}

const st = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: FS.sm,
    },
    title: {
        fontSize: FT.xxl,
        fontWeight: FW.black,
        color: FC.text,
        letterSpacing: -0.8,
        marginBottom: FS.xs,
    },
    subtitle: {
        fontSize: FT.md,
        fontWeight: FW.med,
        color: FC.textMuted,
    },
    accentLine: {
        marginTop: FS.lg,
        height: 3,
        width: 40,
        borderRadius: FR.pill,
        backgroundColor: FC.coral,
        shadowColor: FC.coral,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 6,
        elevation: 3,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: FS.lg,
        borderRadius: FR.xxl,
        borderWidth: 1,
        padding: FS.xl,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 5,
    },
    cardGlow: {
        position: 'absolute',
        top: -30, right: -30,
        width: 100, height: 100,
        borderRadius: 50,
        opacity: 0.4,
    },
    iconWrap: {
        width: 56, height: 56,
        borderRadius: FR.xl,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardText: {
        flex: 1,
        gap: FS.xs,
    },
    cardTitle: {
        fontSize: FT.lg,
        fontWeight: FW.xbold,
        color: FC.text,
        letterSpacing: -0.3,
    },
    cardDesc: {
        fontSize: FT.sm,
        color: FC.textMuted,
        fontWeight: FW.med,
    },
    chevron: {
        fontSize: 28,
        fontWeight: FW.light,
        lineHeight: 32,
    },
});
