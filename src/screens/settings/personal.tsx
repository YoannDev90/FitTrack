// ============================================================================
// SETTINGS - PERSONAL INFO SCREEN (Redesigned)
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, User, Ruler, Weight, Heart, Shield, Activity } from 'lucide-react-native';
import { GlassCard, InputField } from '../../components/ui';
import { useAppStore } from '../../stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../constants';

const GENDER_OPTIONS: Array<{ value: 'male' | 'female' | 'other' | 'prefer_not_to_say'; emoji: string }> = [
  { value: 'male', emoji: '♂️' },
  { value: 'female', emoji: '♀️' },
  { value: 'other', emoji: '⚧️' },
  { value: 'prefer_not_to_say', emoji: '—' },
];

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();

  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>(settings.gender ?? 'prefer_not_to_say');
  const [age, setAge] = useState(settings.age?.toString() || '');
  const [height, setHeight] = useState(settings.heightCm?.toString() || '');
  const [weight, setWeight] = useState(settings.bodyWeightKg?.toString() || '');
  const [fitnessLevel, setFitnessLevel] = useState<typeof FITNESS_LEVELS[number]>(settings.fitnessLevel ?? 'intermediate');
  const [shareWithAI, setShareWithAI] = useState(settings.sharePersonalWithAI ?? false);

  const handleSave = useCallback(() => {
    const hClean = height.trim().replace(',', '.');
    const wClean = weight.trim().replace(',', '.');
    const aClean = age.trim();

    if (hClean && isNaN(parseFloat(hClean))) {
      Alert.alert(t('common.error'), t('settings.heightError'));
      return;
    }
    if (wClean && isNaN(parseFloat(wClean))) {
      Alert.alert(t('common.error'), t('settings.weightError'));
      return;
    }
    if (aClean && (isNaN(parseInt(aClean, 10)) || parseInt(aClean, 10) < 10 || parseInt(aClean, 10) > 120)) {
      Alert.alert(t('common.error'), t('settings.ageError'));
      return;
    }

    updateSettings({
      gender,
      age: aClean ? parseInt(aClean, 10) : undefined,
      heightCm: hClean ? parseFloat(hClean) : undefined,
      bodyWeightKg: wClean ? parseFloat(wClean) : undefined,
      fitnessLevel,
      sharePersonalWithAI: shareWithAI,
    });

    Alert.alert(t('common.success'), t('settings.personalInfoSaved'));
  }, [gender, age, height, weight, fitnessLevel, shareWithAI, t, updateSettings]);

  // Compute max HR from age (220 - age formula)
  const computedMaxHR = age && !isNaN(parseInt(age, 10)) ? 220 - parseInt(age, 10) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeIn.delay(50)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.screenTitle}>{t('settings.personalInfo')}</Text>
          <View style={styles.headerSpacer} />
        </Animated.View>

        {/* Avatar / Identity */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.overlayInfo15 }]}> 
                <User size={20} color={Colors.info} />
              </View>
              <Text style={styles.sectionLabel}>{t('settings.personalInfo')}</Text>
            </View>

            {/* Gender */}
            <Text style={styles.fieldLabel}>{t('settings.gender')}</Text>
            <View style={styles.genderRow}>
              {GENDER_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.genderChip, gender === opt.value && styles.genderChipActive]}
                  onPress={() => setGender(opt.value)}
                >
                  <Text style={styles.genderEmoji}>{opt.emoji}</Text>
                  <Text style={[styles.genderText, gender === opt.value && styles.genderTextActive]}>
                    {t(`settings.genderOptions.${opt.value}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Age */}
            <InputField
              label={t('settings.ageLabel')}
              placeholder="25"
              value={age}
              onChangeText={setAge}
              keyboardType="number-pad"
              maxLength={3}
              containerStyle={{ marginTop: Spacing.md }}
            />

            {/* Max HR computed */}
            {computedMaxHR && (
              <View style={styles.hrRow}>
                <Heart size={14} color={Colors.rose} />
                <Text style={styles.hrText}>
                  {t('settings.maxHRCalc')}: {computedMaxHR} bpm
                </Text>
              </View>
            )}
          </GlassCard>
        </Animated.View>

        {/* Measurements */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.overlaySuccess15 }]}>
                <Ruler size={20} color={Colors.success} />
              </View>
              <Text style={styles.sectionLabel}>{t('settings.measurements')}</Text>
            </View>

            <View style={styles.fieldsRow}>
              <View style={{ flex: 1 }}>
                <InputField
                  label={t('settings.heightLabel')}
                  placeholder="170"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <InputField
                  label={t('settings.weightLabel')}
                  placeholder="65"
                  value={weight}
                  onChangeText={setWeight}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </GlassCard>
        </Animated.View>

        {/* Sport Profile */}
        <Animated.View entering={FadeInDown.delay(160).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.overlayViolet15 }]}>
                <Activity size={20} color={Colors.violet} />
              </View>
              <Text style={styles.sectionLabel}>{t('settings.sportProfile')}</Text>
            </View>

            <Text style={styles.fieldLabel}>{t('settings.fitnessLevel')}</Text>
            <View style={styles.levelRow}>
              {FITNESS_LEVELS.map((level) => (
                <TouchableOpacity
                  key={level}
                  style={[styles.levelChip, fitnessLevel === level && styles.levelChipActive]}
                  onPress={() => setFitnessLevel(level)}
                >
                  <Text style={[styles.levelText, fitnessLevel === level && styles.levelTextActive]}>
                    {t(`settings.fitnessLevels.${level}`)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </GlassCard>
        </Animated.View>

        {/* Privacy & Sharing */}
        <Animated.View entering={FadeInDown.delay(200).springify()}>
          <GlassCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: Colors.overlaySuccess15 }]}>
                <Shield size={20} color={Colors.success} />
              </View>
              <Text style={styles.sectionLabel}>{t('settings.ai.privacyTitle')}</Text>
            </View>

            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleTitle}>
                  {t('settings.shareWithPloppy')}
                </Text>
                <Text style={styles.toggleDesc}>
                  {t('settings.shareWithPloppyDesc')}
                </Text>
              </View>
              <Switch
                value={shareWithAI}
                onValueChange={setShareWithAI}
                trackColor={{ false: Colors.card, true: Colors.success }}
                thumbColor={Colors.white}
              />
            </View>

            <Text style={styles.privacyNote}>{t('settings.privacyNote')}</Text>
          </GlassCard>
        </Animated.View>

        {/* Save */}
        <Animated.View entering={FadeInDown.delay(240).springify()}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollView: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    marginBottom: Spacing.xl, gap: Spacing.md,
  },
  backButton: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.overlay,
    justifyContent: 'center', alignItems: 'center',
  },
  screenTitle: {
    fontSize: 24, fontWeight: FontWeight.bold,
    color: Colors.text, flex: 1,
  },
  headerSpacer: { width: 44 },

  // Cards
  card: { marginBottom: Spacing.md, padding: Spacing.md },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, marginBottom: Spacing.lg,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  sectionLabel: {
    fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text,
  },

  // Fields
  fieldLabel: {
    fontSize: FontSize.xs, fontWeight: FontWeight.semibold,
    color: Colors.muted, textTransform: 'uppercase',
    letterSpacing: 1, marginBottom: Spacing.sm,
  },
  fieldsRow: {
    flexDirection: 'row', gap: Spacing.md,
  },

  // Gender chips
  genderRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  genderChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.overlayWhite05,
    borderWidth: 1, borderColor: Colors.overlayWhite08,
  },
  genderChipActive: {
    backgroundColor: Colors.overlayInfo12,
    borderColor: Colors.overlayInfo35,
  },
  genderEmoji: { fontSize: 16 },
  genderText: { fontSize: FontSize.sm, color: Colors.muted },
  genderTextActive: { color: Colors.info, fontWeight: FontWeight.semibold },

  // HR
  hrRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm,
    paddingVertical: Spacing.xs, paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.overlayRose08,
    borderRadius: BorderRadius.md,
  },
  hrText: { fontSize: FontSize.xs, color: Colors.rose },

  // Level chips
  levelRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  levelChip: {
    paddingVertical: Spacing.sm, paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.overlayWhite05,
    borderWidth: 1, borderColor: Colors.overlayWhite08,
  },
  levelChipActive: {
    backgroundColor: Colors.overlayViolet12,
    borderColor: Colors.overlayViolet35,
  },
  levelText: { fontSize: FontSize.sm, color: Colors.muted },
  levelTextActive: { color: Colors.violet, fontWeight: FontWeight.semibold },

  // Toggle row
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  toggleTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  toggleDesc: { fontSize: FontSize.xs, color: Colors.muted, marginTop: 2 },

  // Privacy note
  privacyNote: {
    fontSize: FontSize.xs, color: Colors.muted, lineHeight: 18,
    marginTop: Spacing.sm,
  },

  // Save
  saveButton: {
    backgroundColor: Colors.cta,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  saveText: {
    color: Colors.bg, fontWeight: FontWeight.bold, fontSize: FontSize.md,
  },
});
