// ============================================================================
// SETTINGS - PREFERENCES SUB-SCREEN
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
import * as FileSystem from 'expo-file-system/legacy';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Target,
  Zap,
  Camera,
  Sparkles,
  SlidersHorizontal,
} from 'lucide-react-native';
import { GlassCard, InputField } from '../../src/components/ui';
import { useAppStore } from '../../src/stores';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';

const POSE_MODEL_LITE_FILE = 'pose_landmarker_lite.task';
const POSE_MODEL_LITE_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const getLiteModelCachePath = (): string | null => {
  if (FileSystem.documentDirectory) {
    return `${FileSystem.documentDirectory}${POSE_MODEL_LITE_FILE}`;
  }
  if (FileSystem.cacheDirectory) {
    return `${FileSystem.cacheDirectory}${POSE_MODEL_LITE_FILE}`;
  }
  return null;
};

// Setting Item Component
function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  showChevron = false,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  delay?: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify()}>
      <TouchableOpacity 
        style={styles.settingItem}
        onPress={onPress}
        activeOpacity={onPress ? 0.7 : 1}
        disabled={!onPress}
      >
        <View style={[styles.settingIconContainer, { backgroundColor: `${iconColor}20` }]}>
          {icon}
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
        {rightElement}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PreferencesScreen() {
  const { t } = useTranslation();
  const { settings, updateWeeklyGoal, updateSettings } = useAppStore();

  const [weeklyGoalInput, setWeeklyGoalInput] = useState(settings.weeklyGoal.toString());
  const [keepGoingInput, setKeepGoingInput] = useState((settings.keepGoingIntervalMinutes ?? 5).toString());

  // Save weekly goal
  const handleSaveGoal = useCallback(() => {
    const goal = parseInt(weeklyGoalInput, 10);
    if (isNaN(goal) || goal < 1 || goal > 14) {
      Alert.alert(t('common.error'), t('settings.weeklyGoalError'));
      return;
    }
    updateWeeklyGoal(goal);
    Alert.alert(t('common.success'), t('settings.goalSaved', { goal }));
  }, [weeklyGoalInput, updateWeeklyGoal, t]);

  // Save motivation interval
  const handleSaveKeepGoing = useCallback(() => {
    const interval = parseInt(keepGoingInput, 10);
    if (isNaN(interval) || interval < 1 || interval > 60) {
      Alert.alert(t('common.error'), t('settings.keepGoingError'));
      return;
    }
    updateSettings({ keepGoingIntervalMinutes: interval });
    Alert.alert(t('common.success'), t('settings.keepGoingSaved', { interval }));
  }, [keepGoingInput, updateSettings, t]);

  const handlePoseModelToggle = useCallback(async (enabled: boolean) => {
    updateSettings({ useLitePoseModel: enabled });

    const litePath = getLiteModelCachePath();
    if (!litePath) return;

    try {
      const info = await FileSystem.getInfoAsync(litePath);

      if (enabled) {
        if (!info.exists) {
          await FileSystem.downloadAsync(POSE_MODEL_LITE_URL, litePath);
        }
      } else if (info.exists) {
        await FileSystem.deleteAsync(litePath, { idempotent: true });
      }
    } catch (error) {
      console.warn('[PoseModel] Unable to sync lite model cache', error);
    }
  }, [updateSettings]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['rgba(232,184,75,0.14)', Colors.transparent]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.topGlow}
        pointerEvents="none"
      />
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
          <View style={styles.headerTitleWrap}>
            <Text style={styles.eyebrow}>{t('settings.eyebrow', 'SPIX')}</Text>
            <Text style={styles.screenTitle}>{t('settings.preferences')}</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <SlidersHorizontal size={18} color={Colors.gold} />
          </View>
        </Animated.View>

        {/* Weekly Goal */}
        <GlassCard style={styles.settingsCard}>
          <View style={styles.goalSection}>
            <View style={styles.goalHeader}>
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlaySuccess20 }]}>
                <Target size={20} color={Colors.success} />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.settingTitle}>{t('settings.weeklyGoal')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('settings.weeklyGoalDesc', { count: settings.weeklyGoal })}
                </Text>
              </View>
            </View>
            <View style={styles.goalInputRow}>
              <InputField
                value={weeklyGoalInput}
                onChangeText={setWeeklyGoalInput}
                keyboardType="number-pad"
                containerStyle={styles.goalInput}
                maxLength={2}
              />
              <Text style={styles.goalUnit}>/ semaine</Text>
              <TouchableOpacity 
                style={styles.goalSaveButton}
                onPress={handleSaveGoal}
              >
                <Text style={styles.goalSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {/* Motivation Interval */}
        <GlassCard style={styles.settingsCard}>
          <View style={styles.goalSection}>
            <View style={styles.goalHeader}>
              <View style={[styles.settingIconContainer, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <Zap size={20} color={Colors.emerald} />
              </View>
              <View style={styles.goalInfo}>
                <Text style={styles.settingTitle}>{t('settings.keepGoingInterval')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('settings.keepGoingIntervalDesc', { count: settings.keepGoingIntervalMinutes ?? 5 })}
                </Text>
                <Text style={[styles.settingSubtitle, { fontSize: 11, color: Colors.muted, marginTop: 2 }]}>
                  🚴 {t('settings.keepGoingEllipticalOnly')}
                </Text>
              </View>
            </View>
            <View style={styles.goalInputRow}>
              <InputField
                value={keepGoingInput}
                onChangeText={setKeepGoingInput}
                keyboardType="number-pad"
                containerStyle={styles.goalInput}
                maxLength={2}
              />
              <Text style={styles.goalUnit}>min</Text>
              <TouchableOpacity 
                style={styles.goalSaveButton}
                onPress={handleSaveKeepGoing}
              >
                <Text style={styles.goalSaveText}>{t('common.save')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </GlassCard>

        {/* Camera Preview */}
        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Camera size={20} color={Colors.blue} />}
            iconColor={Colors.blue}
            title={t('settings.cameraPreview', { defaultValue: 'Aperçu caméra' })}
            subtitle={t('settings.cameraPreviewDesc', { defaultValue: 'Voir le flux caméra lors du tracking' })}
            rightElement={
              <Switch
                value={settings.preferCameraDetection ?? false}
                onValueChange={(value) => updateSettings({ preferCameraDetection: value })}
                trackColor={{ false: Colors.card, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            }
            delay={200}
          />
        </GlassCard>

        {/* Camera debug points (formerly in dev tab) */}
        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Camera size={20} color={Colors.warning} />}
            iconColor={Colors.warning}
            title={t('settings.debugCamera')}
            subtitle={t('settings.debugCameraDesc')}
            rightElement={
              <Switch
                value={settings.debugCamera ?? false}
                onValueChange={(value) => updateSettings({ debugCamera: value })}
                trackColor={{ false: Colors.card, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            }
            delay={210}
          />
        </GlassCard>

        {/* Pose model quality */}
        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Zap size={20} color={Colors.gold} />}
            iconColor={Colors.gold}
            title={t('settings.poseModelLite')}
            subtitle={t('settings.poseModelLiteDesc')}
            rightElement={
              <Switch
                value={settings.useLitePoseModel ?? false}
                onValueChange={handlePoseModelToggle}
                trackColor={{ false: Colors.card, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            }
            delay={230}
          />
        </GlassCard>

        {/* Skip Sensor Selection */}
        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Sparkles size={20} color={Colors.violet} />}
            iconColor={Colors.violet}
            title={t('settings.skipSensorSelection', { defaultValue: 'Afficher le mode capteur dans le tracking' })}
            subtitle={t('settings.skipSensorSelectionDesc', { defaultValue: 'Désactiver pour passer directement à l\'écran de positionnement' })}
            rightElement={
              <Switch
                value={!(settings.skipSensorSelection ?? false)}
                onValueChange={(value) => updateSettings({ skipSensorSelection: !value })}
                trackColor={{ false: Colors.card, true: Colors.teal }}
                thumbColor={Colors.white}
              />
            }
            delay={250}
          />
        </GlassCard>


        {/* Spacer */}
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
    borderColor: 'rgba(232,184,75,0.30)',
    backgroundColor: 'rgba(232,184,75,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Section Title
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    marginLeft: Spacing.xs,
  },

  // Settings Card
  settingsCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.overlayWhite10,
    backgroundColor: 'rgba(14,19,30,0.82)',
  },

  // Setting Item
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: Spacing.md,
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

  // Goal Section
  goalSection: {
    padding: Spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  goalInfo: {
    flex: 1,
  },
  goalInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: 52,
  },
  goalInput: {
    width: 70,
    marginBottom: 0,
  },
  goalUnit: {
    fontSize: FontSize.md,
    color: Colors.muted,
    flex: 1,
  },
  goalSaveButton: {
    backgroundColor: Colors.cta,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  goalSaveText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.bg,
  },
});
