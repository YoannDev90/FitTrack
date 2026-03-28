// ============================================================================
// SETTINGS - APPEARANCE SUB-SCREEN
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  DevSettings,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Eye, Trophy, Palette, RotateCcw } from 'lucide-react-native';
import { GlassCard } from '../../src/components/ui';
import { useAppStore } from '../../src/stores';
import {
  Colors,
  Spacing,
  FontSize,
  FontWeight,
  BorderRadius,
  applyThemeFromUserSettings,
  DEFAULT_THEME_CUSTOM_COLORS,
  THEME_PRESET_COLORS,
  normalizeThemeHexColor,
} from '../../src/constants';
import type { ThemeCustomColors, ThemePreset } from '../../src/types';

const THEME_PRESETS: Array<{ id: Exclude<ThemePreset, 'custom'>; label: string }> = [
  { id: 'default', label: 'Default' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'sunset', label: 'Sunset' },
  { id: 'forest', label: 'Forest' },
  { id: 'midnight', label: 'Midnight' },
];

const CUSTOM_FIELDS: Array<{ key: keyof ThemeCustomColors; label: string }> = [
  { key: 'bg', label: 'Background' },
  { key: 'surface', label: 'Surface' },
  { key: 'text', label: 'Text' },
  { key: 'muted', label: 'Muted text' },
  { key: 'primary', label: 'Primary action' },
  { key: 'secondary', label: 'Secondary accent' },
  { key: 'success', label: 'Success' },
  { key: 'warning', label: 'Warning' },
  { key: 'error', label: 'Error' },
  { key: 'info', label: 'Info' },
  { key: 'violet', label: 'Violet' },
  { key: 'rose', label: 'Rose' },
  { key: 'gold', label: 'Gold' },
];

function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  rightElement,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <View style={styles.settingItem}>
        <View style={[styles.settingIconContainer, { backgroundColor: `${iconColor}20` }]}>{icon}</View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
        </View>
        {rightElement}
      </View>
    </Animated.View>
  );
}

function PresetChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.presetChip, active && styles.presetChipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.presetChipText, active && styles.presetChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AppearanceScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();

  const activePreset = (settings.themePreset ?? 'default') as ThemePreset;
  const mergedCustomColors = useMemo<ThemeCustomColors>(
    () => ({ ...DEFAULT_THEME_CUSTOM_COLORS, ...(settings.customThemeColors ?? {}) }),
    [settings.customThemeColors]
  );

  const [customColorsDraft, setCustomColorsDraft] = useState<ThemeCustomColors>(mergedCustomColors);

  useEffect(() => {
    setCustomColorsDraft(mergedCustomColors);
  }, [mergedCustomColors]);

  const applyWithSettings = (partial: Partial<typeof settings>) => {
    updateSettings(partial);
    applyThemeFromUserSettings({ ...settings, ...partial });
  };

  const applyPreset = (preset: Exclude<ThemePreset, 'custom'>) => {
    applyWithSettings({ themePreset: preset });
    reloadIfNeeded();
  };

  const normalizeCustomField = (field: keyof ThemeCustomColors, value: string) => {
    const normalized = normalizeThemeHexColor(value);

    if (!normalized) {
      Alert.alert(
        t('settings.appearance.invalidColorTitle', 'Invalid color'),
        t('settings.appearance.invalidColorMessage', 'Use hex format like #1f6a66 or #abc.')
      );
      return;
    }

    setCustomColorsDraft((prev) => ({
      ...prev,
      [field]: normalized,
    }));
  };

  const applyCustomTheme = () => {
    const normalized = { ...customColorsDraft };

    for (const field of CUSTOM_FIELDS) {
      const parsed = normalizeThemeHexColor(normalized[field.key]);
      if (!parsed) {
        Alert.alert(
          t('settings.appearance.invalidColorTitle', 'Invalid color'),
          t('settings.appearance.invalidColorMessage', 'Use hex format like #1f6a66 or #abc.')
        );
        return;
      }
      normalized[field.key] = parsed;
    }

    setCustomColorsDraft(normalized);
    applyWithSettings({
      themePreset: 'custom',
      customThemeColors: normalized,
    });
    reloadIfNeeded();
  };

  const resetCustomTheme = () => {
    setCustomColorsDraft(DEFAULT_THEME_CUSTOM_COLORS);
    applyWithSettings({
      themePreset: 'default',
      customThemeColors: DEFAULT_THEME_CUSTOM_COLORS,
    });
    reloadIfNeeded();
  };

  const reloadIfNeeded = () => {
    if (__DEV__) {
      DevSettings.reload();
      return;
    }

    Alert.alert(
      t('settings.appearance.restartTitle', 'Redemarrage conseille'),
      t(
        'settings.appearance.restartMessage',
        'La personnalisation est appliquee. Si certains ecrans ouverts gardent l ancien style, relance l application pour appliquer le theme partout.'
      )
    );
  };

  const preview =
    activePreset === 'custom'
      ? customColorsDraft
      : THEME_PRESET_COLORS[(activePreset as Exclude<ThemePreset, 'custom'>) || 'default'];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.overlayViolet24, Colors.transparent]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.topGlow}
        pointerEvents="none"
      />
      <LinearGradient
        colors={[Colors.transparent, Colors.overlayModal95]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomGlow}
        pointerEvents="none"
      />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>{t('settings.eyebrow', 'SPIX')}</Text>
            <Text style={styles.screenTitle}>{t('settings.appearance')}</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Palette size={18} color={Colors.violet} />
          </View>
        </Animated.View>

        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Eye size={20} color={Colors.violet} />}
            iconColor={Colors.violet}
            title={t('settings.fullOpacityNavbar')}
            subtitle={t('settings.fullOpacityNavbarDesc')}
            rightElement={
              <Switch
                value={settings.fullOpacityNavbar ?? false}
                onValueChange={(value) => updateSettings({ fullOpacityNavbar: value })}
                trackColor={{ false: Colors.card, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            }
            delay={100}
          />
        </GlassCard>

        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Trophy size={20} color={Colors.goldStrong} />}
            iconColor={Colors.goldStrong}
            title={t('settings.showGamificationTab')}
            subtitle={t('settings.showGamificationTabDesc')}
            rightElement={
              <Switch
                value={!(settings.hiddenTabs?.gamification ?? false)}
                onValueChange={(value) =>
                  updateSettings({
                    hiddenTabs: {
                      ...settings.hiddenTabs,
                      gamification: !value,
                    },
                  })
                }
                trackColor={{ false: Colors.card, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            }
            delay={150}
          />
        </GlassCard>

        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <GlassCard style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>{t('settings.appearance.presetsTitle', 'Themes predefinis')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t('settings.appearance.presetsSubtitle', 'Choisis un style complet pret a l emploi.')}
            </Text>

            <View style={styles.presetList}>
              {THEME_PRESETS.map((preset) => (
                <PresetChip
                  key={preset.id}
                  label={preset.label}
                  active={activePreset === preset.id}
                  onPress={() => applyPreset(preset.id)}
                />
              ))}
            </View>

            <View style={[styles.previewCard, { backgroundColor: preview.surface, borderColor: preview.primary }]}> 
              <Text style={[styles.previewTitle, { color: preview.text }]}>
                {t('settings.appearance.previewTitle', 'Apercu du theme')}
              </Text>
              <Text style={[styles.previewSubtitle, { color: preview.muted }]}> 
                {t('settings.appearance.previewSubtitle', 'Texte, cartes, accents et etats sont derives de cette palette.')}
              </Text>
              <View style={styles.previewSwatches}>
                <View style={[styles.swatch, { backgroundColor: preview.primary }]} />
                <View style={[styles.swatch, { backgroundColor: preview.secondary }]} />
                <View style={[styles.swatch, { backgroundColor: preview.success }]} />
                <View style={[styles.swatch, { backgroundColor: preview.warning }]} />
                <View style={[styles.swatch, { backgroundColor: preview.error }]} />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(220).springify()}>
          <GlassCard style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>{t('settings.appearance.customTitle', 'Theme personnalise complet')}</Text>
            <Text style={styles.sectionSubtitle}>
              {t(
                'settings.appearance.customSubtitle',
                'Modifie chaque couleur de base. Toutes les couleurs du design sont regenerees depuis ces valeurs.'
              )}
            </Text>

            {CUSTOM_FIELDS.map((field) => (
              <View key={field.key} style={styles.customRow}>
                <View style={styles.customLabelWrap}>
                  <View style={[styles.customColorDot, { backgroundColor: customColorsDraft[field.key] }]} />
                  <Text style={styles.customLabel}>{field.label}</Text>
                </View>

                <TextInput
                  value={customColorsDraft[field.key]}
                  onChangeText={(value) => setCustomColorsDraft((prev) => ({ ...prev, [field.key]: value }))}
                  onEndEditing={(event) => normalizeCustomField(field.key, event.nativeEvent.text)}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={styles.hexInput}
                  placeholder="#000000"
                  placeholderTextColor={Colors.muted2}
                />
              </View>
            ))}

            <View style={styles.customActions}>
              <TouchableOpacity style={styles.actionSecondary} onPress={resetCustomTheme}>
                <RotateCcw size={16} color={Colors.muted} />
                <Text style={styles.actionSecondaryText}>{t('settings.appearance.resetDefault', 'Revenir au theme par defaut')}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionPrimary} onPress={applyCustomTheme}>
                <Text style={styles.actionPrimaryText}>{t('settings.appearance.applyCustomTheme', 'Appliquer le theme perso')}</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        </Animated.View>

        <View style={{ height: 40 }} />
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
    zIndex: 0,
  },
  bottomGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 300,
    zIndex: 0,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: 100,
    zIndex: 1,
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
    borderWidth: 1,
    borderColor: Colors.stroke,
  },
  headerTitleWrap: {
    flex: 1,
  },
  eyebrow: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  screenTitle: {
    fontSize: 26,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  headerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.overlayViolet35,
    backgroundColor: Colors.overlayViolet14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.overlayWhite10,
    backgroundColor: Colors.overlayPanel82,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
    borderRadius: 14,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  settingSubtitle: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: Colors.muted,
    marginBottom: Spacing.md,
    lineHeight: 18,
  },
  presetList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  presetChip: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.stroke,
    backgroundColor: Colors.overlay,
  },
  presetChipActive: {
    borderColor: Colors.cta,
    backgroundColor: Colors.overlayCozyWarm15,
  },
  presetChipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  presetChipTextActive: {
    color: Colors.cta,
    fontWeight: FontWeight.bold,
  },
  previewCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  previewTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: FontSize.xs,
    lineHeight: 18,
  },
  previewSwatches: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  swatch: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: Colors.overlayWhite20,
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  customLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  customColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: Colors.overlayWhite30,
  },
  customLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
  },
  hexInput: {
    width: 116,
    borderWidth: 1,
    borderColor: Colors.stroke,
    borderRadius: BorderRadius.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    color: Colors.text,
    fontSize: FontSize.sm,
    backgroundColor: Colors.overlay,
  },
  customActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  actionSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.stroke,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.overlay,
  },
  actionSecondaryText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
  },
  actionPrimary: {
    flex: 1,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.cta,
  },
  actionPrimaryText: {
    color: Colors.bg,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
});
