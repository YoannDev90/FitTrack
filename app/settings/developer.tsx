// ============================================================================
// SETTINGS - DEVELOPER SUB-SCREEN (Hidden developer options)
// ============================================================================

import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft,
  Sparkles,
  Code2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Flower2,
  Coins,
  CheckCircle,
  XCircle,
  RotateCcw,
  Camera,
} from 'lucide-react-native';
import { GlassCard, CustomAlertModal, type AlertButton } from '../../src/components/ui';
import { useAppStore, useGamificationStore } from '../../src/stores';
import { useSafetyStore } from '../../src/stores/safetyStore';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';
import { getPollinationsAccountInfo, PollinationsAccountInfo } from '../../src/services/pollinations';

// Setting Item Component
function SettingItem({
  icon,
  iconColor,
  title,
  subtitle,
  onPress,
  rightElement,
  delay = 0,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
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

// Section Title
function SectionTitle({ title, delay = 0 }: { title: string; delay?: number }) {
  return (
    <Animated.View entering={FadeIn.delay(delay)}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </Animated.View>
  );
}

export default function DeveloperScreen() {
  const { t } = useTranslation();
  const { updateSettings, entries, settings } = useAppStore();
  const { xp, level, clearHistory, recalculateFromEntries } = useGamificationStore();
  const triggerFallCheck = useSafetyStore((state) => state.triggerFallCheck);
  const isFossSimulationEnabled = settings.simulateFossBuild ?? false;
  
  // Pollinations account info
  const [pollinationsInfo, setPollinationsInfo] = useState<PollinationsAccountInfo | null>(null);
  const [loadingPollinations, setLoadingPollinations] = useState(true);
  const [modalState, setModalState] = useState<{
    visible: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons: AlertButton[];
  }>({
    visible: false,
    type: 'info',
    title: '',
    message: '',
    buttons: [],
  });

  const openModal = (config: {
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
    buttons?: AlertButton[];
  }) => {
    setModalState({
      visible: true,
      type: config.type,
      title: config.title,
      message: config.message,
      buttons: config.buttons ?? [{ text: t('common.ok') }],
    });
  };

  const closeModal = () => {
    setModalState((previous) => ({ ...previous, visible: false }));
  };
  
  useEffect(() => {
    const loadPollinationsInfo = async () => {
      setLoadingPollinations(true);
      const info = await getPollinationsAccountInfo();
      setPollinationsInfo(info);
      setLoadingPollinations(false);
    };
    loadPollinationsInfo();
  }, []);

  // Handle recalculate gamification
  const handleRecalculateGamification = () => {
    const sportEntriesCount = entries.filter((entry) => ['home', 'run', 'beatsaber', 'custom'].includes(entry.type)).length;

    openModal({
      type: 'warning',
      title: t('settings.developer.recalculateConfirmTitle'),
      message: t('settings.developer.recalculateConfirmMessage', {
        count: sportEntriesCount,
        level,
        xp,
      }),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.developer.recalculateAction'),
          onPress: () => {
            recalculateFromEntries(entries);
            setTimeout(() => {
              const updatedGamification = useGamificationStore.getState();
              openModal({
                type: 'success',
                title: t('settings.developer.recalculateDoneTitle'),
                message: t('settings.developer.recalculateDoneMessage', {
                  level: updatedGamification.level,
                  xp: updatedGamification.xp,
                }),
              });
            }, 0);
          },
        },
      ],
    });
  };

  // Handle clear gamification history
  const handleClearHistory = () => {
    openModal({
      type: 'warning',
      title: t('settings.developer.clearHistoryConfirmTitle'),
      message: t('settings.developer.clearHistoryConfirmMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.developer.clearHistoryAction'),
          style: 'destructive',
          onPress: () => {
            clearHistory();
            setTimeout(() => {
              openModal({
                type: 'success',
                title: t('settings.developer.clearHistoryDoneTitle'),
                message: t('settings.developer.clearHistoryDoneMessage'),
              });
            }, 0);
          },
        },
      ],
    });
  };

  // Handle disable developer mode
  const handleDisableDeveloperMode = () => {
    openModal({
      type: 'warning',
      title: t('settings.developer.disableConfirmTitle'),
      message: t('settings.developer.disableConfirmMessage'),
      buttons: [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.developer.disableAction'),
          style: 'destructive',
          onPress: () => {
            updateSettings({
              developerMode: false,
              simulateFossBuild: false,
            });
            router.back();
          },
        },
      ],
    });
  };

  const handleResetPloppyOnboarding = () => {
    updateSettings({ ploppyOnboardingShown: false });
    openModal({
      type: 'success',
      title: t('settings.developer.onboardingResetDoneTitle'),
      message: t('settings.developer.onboardingResetDoneMessage'),
    });
  };

  const handleTriggerFallTest = () => {
    triggerFallCheck(true);
    openModal({
      type: 'success',
      title: t('settings.developer.testFallDoneTitle'),
      message: t('settings.developer.testFallDoneMessage'),
    });
  };

  const handleToggleFossSimulation = (enabled: boolean) => {
    updateSettings({ simulateFossBuild: enabled });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.overlayOrange16, Colors.transparent]}
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
            <Text style={styles.screenTitle}>
              {t('settings.developerMode')}
            </Text>
          </View>
          <View style={styles.headerIconWrap}>
            <Code2 size={18} color={Colors.orange} />
          </View>
        </Animated.View>

        {/* Warning Banner */}
        <Animated.View entering={FadeInDown.delay(80).springify()}>
          <View style={styles.warningBanner}>
            <AlertTriangle size={20} color={Colors.warning} />
            <Text style={styles.warningText}>
              {t('settings.developerWarning')}
            </Text>
          </View>
        </Animated.View>


        {/* Pollinations Status */}
        <SectionTitle title={t('settings.developer.sections.pollinations')} delay={130} />
        <Animated.View entering={FadeInDown.delay(140).springify()}>
          <GlassCard style={styles.pollinationsCard}>
            <View style={styles.pollinationsHeader}>
              <View style={styles.pollinationsIconContainer}>
                <Flower2 size={24} color={Colors.violetStrong} />
              </View>
              <View style={styles.pollinationsInfo}>
                <Text style={styles.pollinationsTitle}>{t('settings.developer.pollinations.title')}</Text>
                {loadingPollinations ? (
                  <ActivityIndicator size="small" color={Colors.muted} style={{ marginTop: 4 }} />
                ) : pollinationsInfo?.connected ? (
                  <View style={styles.pollinationsStatus}>
                    <CheckCircle size={14} color={Colors.successStrong} />
                    <Text style={styles.pollinationsStatusText}>{t('settings.developer.pollinations.connected')}</Text>
                  </View>
                ) : (
                  <View style={styles.pollinationsStatus}>
                    <XCircle size={14} color={Colors.muted} />
                    <Text style={[styles.pollinationsStatusText, { color: Colors.muted }]}>{t('settings.developer.pollinations.disconnected')}</Text>
                  </View>
                )}
              </View>
            </View>
            
            {!loadingPollinations && pollinationsInfo?.connected && (
              <View style={styles.pollinationsBalanceContainer}>
                <Coins size={18} color={Colors.warning} />
                <Text style={styles.pollinationsBalanceLabel}>{t('settings.developer.pollinations.remainingCredit')}</Text>
                <Text style={styles.pollinationsBalanceValue}>
                  {pollinationsInfo.balance !== undefined 
                    ? `${pollinationsInfo.balance} ${t('settings.developer.pollinations.unit')}` 
                    : t('settings.developer.pollinations.notAvailable')}
                </Text>
              </View>
            )}
            
            {pollinationsInfo?.error && (
              <Text style={styles.pollinationsError}>
                {t('settings.developer.pollinations.errorPrefix')} {pollinationsInfo.error}
              </Text>
            )}
          </GlassCard>
        </Animated.View>

        {/* Onboarding */}
        <SectionTitle title={t('settings.developer.sections.interface')} delay={140} />
        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<Code2 size={20} color={Colors.orange} />}
            iconColor={Colors.orange}
            title={t('settings.developer.simulateFossTitle')}
            subtitle={t('settings.developer.simulateFossSubtitle')}
            onPress={() => handleToggleFossSimulation(!isFossSimulationEnabled)}
            rightElement={(
              <Switch
                value={isFossSimulationEnabled}
                onValueChange={handleToggleFossSimulation}
                trackColor={{ false: Colors.overlayWhite20, true: Colors.overlayOrange24 }}
                thumbColor={isFossSimulationEnabled ? Colors.orange : Colors.muted}
                ios_backgroundColor={Colors.overlayWhite20}
              />
            )}
            delay={150}
          />
          <SettingItem
            icon={<Sparkles size={20} color={Colors.violet} />}
            iconColor={Colors.violet}
            title={t('settings.onboarding')}
            subtitle={t('settings.onboardingDesc')}
            onPress={() => {
              updateSettings({ onboardingCompleted: false });
              router.push('/onboarding');
            }}
            delay={160}
          />
          <SettingItem
            icon={<RotateCcw size={20} color={Colors.warning} />}
            iconColor={Colors.warning}
            title={t('settings.developer.onboardingResetTitle')}
            subtitle={t('settings.developer.onboardingResetSubtitle')}
            onPress={handleResetPloppyOnboarding}
            delay={180}
          />
          <SettingItem
            icon={<Camera size={20} color={Colors.teal} />}
            iconColor={Colors.teal}
            title={t('settings.developer.poseCaptureTitle')}
            subtitle={t('settings.developer.poseCaptureSubtitle')}
            onPress={() => router.push('/settings/pose-debug' as never)}
            delay={200}
          />
        </GlassCard>

        {/* Gamification */}
        <SectionTitle title={t('settings.developer.sections.gamification')} delay={180} />
        <GlassCard style={styles.settingsCard}>
          <SettingItem
            icon={<RefreshCw size={20} color={Colors.teal} />}
            iconColor={Colors.teal}
            title={t('settings.developer.recalculateTitle')}
            subtitle={t('settings.developer.recalculateSubtitle', { xp, level })}
            onPress={handleRecalculateGamification}
            delay={200}
          />
          <SettingItem
            icon={<Trash2 size={20} color={Colors.orange} />}
            iconColor={Colors.orange}
            title={t('settings.developer.clearHistoryTitle')}
            subtitle={t('settings.developer.clearHistorySubtitle')}
            onPress={handleClearHistory}
            delay={220}
          />
        </GlassCard>

        {/* Safety Test */}
        {__DEV__ && (
          <>
            <SectionTitle title={t('settings.developer.sections.safety')} delay={220} />
            <GlassCard style={styles.settingsCard}>
              <SettingItem
                icon={<AlertTriangle size={20} color={Colors.warning} />}
                iconColor={Colors.warning}
                title={t('settings.developer.testFallTitle')}
                subtitle={t('settings.developer.testFallSubtitle')}
                onPress={handleTriggerFallTest}
                delay={240}
              />
            </GlassCard>
          </>
        )}

        {/* Disable Developer Mode */}
        <SectionTitle title={t('settings.developer.sections.developerMode')} delay={240} />
        <GlassCard style={[styles.settingsCard, styles.dangerCard]}>
          <SettingItem
            icon={<Code2 size={20} color={Colors.error} />}
            iconColor={Colors.error}
            title={t('settings.disableDeveloperMode')}
            subtitle={t('settings.disableDeveloperModeDesc')}
            onPress={handleDisableDeveloperMode}
            delay={260}
          />
        </GlassCard>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      <CustomAlertModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        buttons={modalState.buttons}
        onClose={closeModal}
      />
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
    marginBottom: Spacing.lg,
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
    borderRadius: 12,
    backgroundColor: Colors.overlayOrange14,
    borderWidth: 1,
    borderColor: Colors.overlayOrange24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Warning Banner
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.overlayWarning15,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.overlayWarning30,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.warning,
    lineHeight: 18,
  },

  // Section Title
  sectionTitle: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
    marginTop: Spacing.sm,
  },

  // Settings Card
  settingsCard: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  dangerCard: {
    borderColor: Colors.overlayErrorSoft30,
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
  
  // Pollinations Card
  pollinationsCard: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
  },
  pollinationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  pollinationsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.overlayVioletStrong15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pollinationsInfo: {
    flex: 1,
  },
  pollinationsTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  pollinationsStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  pollinationsStatusText: {
    fontSize: FontSize.sm,
    color: Colors.successStrong,
  },
  pollinationsBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.overlayWhite10,
  },
  pollinationsBalanceLabel: {
    fontSize: FontSize.sm,
    color: Colors.muted,
  },
  pollinationsBalanceValue: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.warning,
  },
  pollinationsError: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.sm,
  },
});
