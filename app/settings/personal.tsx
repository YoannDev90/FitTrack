// ============================================================================
// SETTINGS - PERSONAL INFO SCREEN
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react-native';
import { GlassCard, InputField } from '../../src/components/ui';
import { useAppStore } from '../../src/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';

const GENDER_OPTIONS: Array<{ value: 'male' | 'female' | 'other'; label: string }> = [
  { value: 'male', label: 'M' },
  { value: 'female', label: 'F' },
  { value: 'other', label: '—' },
];

export default function PersonalInfoScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();

  const [gender, setGender] = useState<'male' | 'female' | 'other'>(settings.gender ?? 'other');
  const [height, setHeight] = useState(settings.heightCm?.toString() || '');
  const [weight, setWeight] = useState(settings.bodyWeightKg?.toString() || '');

  const handleSave = useCallback(() => {
    // sanitize
    const hClean = height.trim().replace(',', '.');
    const wClean = weight.trim().replace(',', '.');

    if (hClean && isNaN(parseFloat(hClean))) {
      Alert.alert(t('common.error'), t('settings.heightError'));
      return;
    }
    if (wClean && isNaN(parseFloat(wClean))) {
      Alert.alert(t('common.error'), t('settings.weightError'));
      return;
    }

    updateSettings({
      gender,
      heightCm: hClean ? parseFloat(hClean) : undefined,
      bodyWeightKg: wClean ? parseFloat(wClean) : undefined,
    });

    Alert.alert(t('common.success'), t('settings.personalInfoSaved'));
  }, [gender, height, weight, t, updateSettings]);

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

        {/* Explanation */}
        <GlassCard style={styles.card}>
          <Text style={styles.paragraph}>{t('settings.personalInfoDesc')}</Text>
          <Text style={[styles.paragraph, { marginTop: Spacing.sm, fontSize: FontSize.xs, color: Colors.muted }]}> 
            {t('settings.privacyNote')}
          </Text>
        </GlassCard>

        {/* Fields */}
        <GlassCard style={styles.card}>
          <Text style={styles.fieldLabel}>{t('settings.gender')}</Text>
          <View style={styles.genderRow}>
            {GENDER_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.genderOption,
                  gender === opt.value && styles.genderOptionActive,
                ]}
                onPress={() => setGender(opt.value)}
              >
                <Text
                  style={[
                    styles.genderOptionText,
                    gender === opt.value && { color: Colors.text },
                  ]}
                >
                  {t(`settings.genderOptions.${opt.value}`)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <InputField
            label={t('settings.height')}
            placeholder="170"
            value={height}
            onChangeText={setHeight}
            keyboardType="decimal-pad"
            containerStyle={{ marginTop: Spacing.md }}
          />

          <InputField
            label={t('settings.weight')}
            placeholder="65"
            value={weight}
            onChangeText={setWeight}
            keyboardType="decimal-pad"
            containerStyle={{ marginTop: Spacing.md }}
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
          >
            <Text style={styles.saveText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </GlassCard>

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
  screenTitle: {
    fontSize: 24,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    flex: 1,
  },
  headerSpacer: { width: 44 },
  card: { marginBottom: Spacing.md, padding: Spacing.md },
  paragraph: { fontSize: FontSize.sm, color: Colors.text },
  fieldLabel: { fontSize: FontSize.sm, color: Colors.muted, marginBottom: Spacing.xs },
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.muted,
  },
  genderOptionActive: {
    backgroundColor: Colors.cta,
    borderColor: Colors.cta,
  },
  genderOptionText: { fontSize: FontSize.md, color: Colors.text },
  saveButton: {
    marginTop: Spacing.lg,
    backgroundColor: Colors.cta,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  saveText: { color: Colors.bg, fontWeight: FontWeight.semibold },
});
