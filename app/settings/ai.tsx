// ============================================================================
// SETTINGS - AI SUB-SCREEN (temporarily locked)
// ============================================================================

import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import {
  ArrowLeft,
  Bot,
  Lock,
  Sparkles,
  Footprints,
  Dumbbell,
  UtensilsCrossed,
  Activity,
  Heart,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/ui';
import { useAppStore } from '../../src/stores';
import { useTranslation } from 'react-i18next';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';

interface LockedFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function AISettingsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();

  // Safety lock: keep every AI path disabled even if old persisted values exist.
  useEffect(() => {
    const shouldForceDisable =
      (settings.aiFeaturesEnabled ?? false) ||
      (settings.aiProgressEnabled ?? false) ||
      (settings.aiWorkoutEnabled ?? false) ||
      (settings.ploppyEnabled ?? false) ||
      (settings.pollinationsConnected ?? false) ||
      (settings.sharePersonalWithAI ?? false) ||
      !(settings.ploppyOnboardingShown ?? true);

    if (!shouldForceDisable) {
      return;
    }

    updateSettings({
      aiFeaturesEnabled: false,
      aiProgressEnabled: false,
      aiWorkoutEnabled: false,
      ploppyEnabled: false,
      pollinationsConnected: false,
      sharePersonalWithAI: false,
      ploppyOnboardingShown: true,
    });
  }, [
    settings.aiFeaturesEnabled,
    settings.aiProgressEnabled,
    settings.aiWorkoutEnabled,
    settings.ploppyEnabled,
    settings.pollinationsConnected,
    settings.sharePersonalWithAI,
    settings.ploppyOnboardingShown,
    updateSettings,
  ]);

  const lockedFeatures = useMemo<LockedFeature[]>(() => [
    {
      id: 'run-analysis',
      title: t('settings.ai.featureTitles.runAnalysis'),
      description: t('settings.ai.featureDescriptions.runAnalysis'),
      icon: <Footprints size={18} color={Colors.blue} />,
    },
    {
      id: 'workout-analysis',
      title: t('settings.ai.featureTitles.workoutAnalysis'),
      description: t('settings.ai.featureDescriptions.workoutAnalysis'),
      icon: <Dumbbell size={18} color={Colors.violet} />,
    },
    {
      id: 'meal-analysis',
      title: t('settings.ai.featureTitles.mealAnalysis'),
      description: t('settings.ai.featureDescriptions.mealAnalysis'),
      icon: <UtensilsCrossed size={18} color={Colors.gold} />,
    },
    {
      id: 'weekly-summary',
      title: t('settings.ai.featureTitles.weeklySummary'),
      description: t('settings.ai.featureDescriptions.weeklySummary'),
      icon: <Activity size={18} color={Colors.success} />,
    },
    {
      id: 'coaching',
      title: t('settings.ai.featureTitles.coaching'),
      description: t('settings.ai.featureDescriptions.coaching'),
      icon: <Heart size={18} color={Colors.rose} />,
    },
  ], [t]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.overlayViolet15, Colors.overlayWarning10, Colors.transparent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topGlow}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.delay(40)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>

          <View style={styles.titleWrap}>
            <Text style={styles.eyebrow}>{t('settings.ai.screenBrand')}</Text>
            <Text style={styles.screenTitle}>{t('settings.ai.screenTitle')}</Text>
          </View>

          <View style={styles.lockBadge}>
            <Lock size={12} color={Colors.warningDeep} />
            <Text style={styles.lockBadgeText}>{t('settings.ai.statusBadge')}</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.heroCard}>
            <LinearGradient
              colors={[Colors.overlayViolet20, Colors.overlayWarning10]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroGradient}
            />

            <View style={styles.heroHeader}>
              <View style={styles.heroIconWrap}>
                <Bot size={20} color={Colors.violet} />
              </View>
              <Text style={styles.heroTitle}>{t('settings.ai.hero.title')}</Text>
            </View>

            <Text style={styles.heroText}>{t('settings.ai.hero.description')}</Text>

            <View style={styles.heroFooter}>
              <Sparkles size={14} color={Colors.warning} />
              <Text style={styles.heroFooterText}>{t('settings.ai.hero.note')}</Text>
            </View>
          </GlassCard>
        </Animated.View>

        

        <Text style={styles.sectionTitle}>{t('settings.ai.featuresTitle')}</Text>

        <GlassCard style={styles.featuresCard}>
          {lockedFeatures.map((feature, index) => (
            <Animated.View
              key={feature.id}
              entering={FadeInDown.delay(150 + index * 40).springify()}
              style={[styles.featureRow, index === lockedFeatures.length - 1 && styles.featureRowLast]}
            >
              <View style={styles.featureIconWrap}>
                {feature.icon}
              </View>

              <View style={styles.featureTextWrap}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>

              <View style={styles.disabledChip}>
                <Text style={styles.disabledChipText}>{t('settings.ai.disabledChip')}</Text>
              </View>
            </Animated.View>
          ))}
        </GlassCard>

        <View style={{ height: 50 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 260,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: 10,
    color: Colors.warning,
    fontWeight: FontWeight.bold,
    letterSpacing: 2,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.overlayWarning15,
    borderWidth: 1,
    borderColor: Colors.overlayWarning20,
  },
  lockBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.bold,
    color: Colors.warningDeep,
    letterSpacing: 1,
  },
  heroCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.55,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  heroIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.overlayViolet15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  heroText: {
    fontSize: FontSize.sm,
    color: Colors.text,
    lineHeight: 20,
    opacity: 0.92,
  },
  heroFooter: {
    marginTop: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  heroFooterText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.warning,
  },
  switchCard: {
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  switchInfo: {
    flex: 1,
  },
  switchTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  switchSubtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: Colors.muted,
  },
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },
  featuresCard: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.overlay,
  },
  featureRowLast: {
    borderBottomWidth: 0,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.overlay,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  featureDesc: {
    marginTop: 1,
    fontSize: FontSize.xs,
    color: Colors.muted,
    lineHeight: 17,
  },
  disabledChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.overlayWarning15,
    borderWidth: 1,
    borderColor: Colors.overlayWarning20,
  },
  disabledChipText: {
    fontSize: 10,
    color: Colors.warningDeep,
    fontWeight: FontWeight.bold,
    letterSpacing: 0.4,
  },
});
