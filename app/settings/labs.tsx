// ============================================================================
// SETTINGS - LABS SUB-SCREEN (Experimental features)
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import * as ExpoLinking from 'expo-linking';
import { 
  ArrowLeft, 
  FlaskConical, 
  Sparkles, 
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ScanBarcode,
  Bot,
} from 'lucide-react-native';
import { GlassCard } from '../../src/components/ui';
import { useAppStore } from '../../src/stores';
import { 
  isPollinationConnected, 
  startPollinationAuth,
  extractApiKeyFromUrl,
  savePollinationApiKey,
  removePollinationApiKey,
} from '../../src/services/pollination';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius } from '../../src/constants';

export default function LabsScreen() {
  const { t } = useTranslation();
  const { settings, updateSettings } = useAppStore();
  const aiFeaturesEnabled = settings.aiFeaturesEnabled ?? false;
  const [pollinationStatus, setPollinationStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');

  const commitSettings = useCallback(async (patch: Parameters<typeof updateSettings>[0]) => {
    await Promise.resolve(updateSettings(patch));
  }, [updateSettings]);

  // Check Pollination connection status
  const checkPollinationStatus = useCallback(async () => {
    const connected = await isPollinationConnected();
    setPollinationStatus(connected ? 'connected' : 'disconnected');
    await commitSettings({ pollinationConnected: connected });
  }, [commitSettings]);

  useEffect(() => {
    void checkPollinationStatus();
  }, [checkPollinationStatus]);

  // Handle deep link callback from Pollination
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      if (__DEV__) {
        console.log('[Labs] Deep link received:', event.url);
      }
      
      if (event.url.includes('pollination-callback')) {
        const apiKey = extractApiKeyFromUrl(event.url);
        
        if (apiKey) {
          await savePollinationApiKey(apiKey);
          setPollinationStatus('connected');
          await commitSettings({ pollinationConnected: true });
          
          Alert.alert(
            t('settings.pollination.successTitle'),
            t('settings.pollination.successMessage')
          );
        } else {
          Alert.alert(
            t('common.error'),
            t('settings.pollination.errorMessage')
          );
        }
      }
    };

    // Get initial URL if app was opened via deep link
    void ExpoLinking.getInitialURL()
      .then((url) => {
        if (url) {
          void handleDeepLink({ url });
        }
      })
      .catch((error) => {
        if (__DEV__) {
          console.warn('[Labs] Failed to read initial URL', error);
        }
      });

    // Listen for deep links while app is running
    const subscription = ExpoLinking.addEventListener('url', handleDeepLink);
    
    return () => {
      subscription.remove();
    };
  }, [t, commitSettings]);

  // Connect to Pollination
  const handleConnectPollination = useCallback(() => {
    Alert.alert(
      t('settings.pollination.warningTitle'),
      t('settings.pollination.warningMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.pollination.continue'), 
          onPress: async () => {
            try {
              await startPollinationAuth();
            } catch (error) {
              Alert.alert(t('common.error'), t('settings.pollination.errorMessage'));
            }
          }
        },
      ]
    );
  }, [t]);

  // Disconnect from Pollination
  const handleDisconnectPollination = useCallback(() => {
    Alert.alert(
      t('settings.pollination.disconnectTitle'),
      t('settings.pollination.disconnectMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('settings.pollination.disconnect'),
          style: 'destructive',
          onPress: async () => {
            await removePollinationApiKey();
            setPollinationStatus('disconnected');
            await commitSettings({ pollinationConnected: false });
          }
        },
      ]
    );
  }, [t, commitSettings]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={[Colors.overlayViolet18, Colors.transparent]}
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
            <Text style={styles.screenTitle}>{t('settings.labs')}</Text>
          </View>
          <View style={styles.headerIconWrap}>
            <FlaskConical size={18} color={Colors.violet} />
          </View>
        </Animated.View>

        {/* Labs toggle: Enable Tools screen (beta) */}
        <GlassCard style={styles.settingsCard}>
          <Animated.View entering={FadeInDown.delay(80).springify()}>
            <View style={styles.settingItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayViolet15 }]}> 
                <FlaskConical size={20} color={Colors.violet} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('settings.enableToolsScreen')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.enableToolsScreenDesc')}</Text>
              </View>
              <View>
                <Switch
                  value={!(settings.hiddenTabs?.tools ?? true)}
                  onValueChange={(value) => {
                    void commitSettings({ hiddenTabs: { ...(settings.hiddenTabs ?? {}), tools: !value } });
                  }}
                  trackColor={{ false: Colors.card, true: Colors.teal }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>
          </Animated.View>
        </GlassCard>

        {/* Pollination AI Section */}
        <Text style={styles.sectionTitle}>{t('settings.pollination.sectionTitle')}</Text>
        
        <GlassCard style={styles.settingsCard}>
          <Animated.View entering={FadeInDown.delay(120).springify()}>
            {/* Connection Status */}
            <View style={styles.settingItem}>
              <View style={[
                styles.settingIconContainer, 
                { backgroundColor: pollinationStatus === 'connected' 
                  ? Colors.overlayConnected15
                  : Colors.overlayViolet15
                }
              ]}> 
                <Sparkles 
                  size={20} 
                  color={pollinationStatus === 'connected' ? Colors.successStrong : Colors.violetStrong} 
                />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('settings.pollination.title')}</Text>
                <View style={styles.statusRow}>
                  {pollinationStatus === 'connected' ? (
                    <>
                      <CheckCircle size={14} color={Colors.successStrong} />
                      <Text style={[styles.statusText, { color: Colors.successStrong }]}> 
                        {t('settings.pollination.connected')}
                      </Text>
                    </>
                  ) : (
                    <>
                      <XCircle size={14} color={Colors.muted} />
                      <Text style={styles.statusText}>
                        {t('settings.pollination.notConnected')}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.connectButton,
                  pollinationStatus === 'connected' && styles.disconnectButton,
                  !aiFeaturesEnabled && styles.connectButtonDisabled,
                ]}
                onPress={pollinationStatus === 'connected' 
                  ? handleDisconnectPollination 
                  : handleConnectPollination
                }
                disabled={!aiFeaturesEnabled}
              >
                {!aiFeaturesEnabled ? (
                  <Text style={styles.connectButtonText}>Indisponible</Text>
                ) : pollinationStatus === 'connected' ? (
                  <Text style={styles.disconnectButtonText}>
                    {t('settings.pollination.disconnect')}
                  </Text>
                ) : (
                  <>
                    <ExternalLink size={14} color={Colors.white} />
                    <Text style={styles.connectButtonText}>
                      {t('settings.pollination.connect')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Beta Warning */}
            <View style={styles.warningBox}>
              <AlertTriangle size={16} color={Colors.warning} />
              <Text style={styles.warningText}>
                {aiFeaturesEnabled
                  ? t('settings.pollination.betaWarning')
                  : 'Fonctionnalites IA en pause pour le moment (budget etudiant).'}
              </Text>
            </View>
          </Animated.View>
        </GlassCard>

        {/* AI – Ploppy Section → Moved to Settings > AI */}
        <Text style={styles.sectionTitle}>{t('settings.ai.title')}</Text>
        
        <GlassCard style={styles.settingsCard}>
          <Animated.View entering={FadeInDown.delay(140).springify()}>
            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => router.push('/settings/ai')}
              activeOpacity={0.7}
            >
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayViolet15 }]}> 
                <Bot size={20} color={Colors.violet} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('settings.aiTab')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.ai.movedToAiTab')}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </GlassCard>

        {/* OpenFoodFacts Integration */}
        <Text style={styles.sectionTitle}>{t('settings.openFoodFacts.sectionTitle')}</Text>
        
        <GlassCard style={styles.settingsCard}>
          <Animated.View entering={FadeInDown.delay(160).springify()}>
            <View style={styles.settingItem}>
              <View style={[styles.settingIconContainer, { backgroundColor: Colors.overlayConnected15 }]}> 
                <ScanBarcode size={20} color={Colors.successStrong} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>{t('settings.openFoodFacts.title')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.openFoodFacts.description')}</Text>
              </View>
              <View>
                <Switch
                  value={settings.openFoodFactsEnabled ?? false}
                  onValueChange={(value) => updateSettings({ openFoodFactsEnabled: value })}
                  trackColor={{ false: Colors.card, true: Colors.teal }}
                  thumbColor={Colors.white}
                />
              </View>
            </View>

            {settings.openFoodFactsEnabled && (
              <View style={styles.featureInfo}>
                <Text style={styles.featureInfoText}>
                  {t('settings.openFoodFacts.enabledInfo')}
                </Text>
              </View>
            )}
            
            {/* OpenFoodFacts Attribution */}
            <View style={styles.attributionBox}>
              <Text style={styles.attributionText}>
                {t('settings.openFoodFacts.attribution')}
              </Text>
            </View>
          </Animated.View>
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
    backgroundColor: Colors.overlayViolet14,
    borderWidth: 1,
    borderColor: Colors.overlayViolet24,
    justifyContent: 'center',
    alignItems: 'center',
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

  // Status Row
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
  },

  // Connect Button
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.violetStrong,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.white,
  },
  disconnectButton: {
    backgroundColor: Colors.overlayError15,
    borderWidth: 1,
    borderColor: Colors.overlayError30,
  },
  disconnectButtonText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.errorStrong,
  },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.overlayWarning10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.overlayWarning20,
  },
  warningText: {
    flex: 1,
    fontSize: FontSize.xs,
    color: Colors.warning,
    lineHeight: 18,
  },

  // Feature Info
  featureInfo: {
    backgroundColor: Colors.overlayTeal10,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  featureInfoText: {
    fontSize: FontSize.xs,
    color: Colors.teal,
    lineHeight: 18,
  },
  
  // Attribution Box
  attributionBox: {
    backgroundColor: Colors.overlayGray10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.sm,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  attributionText: {
    fontSize: FontSize.xs,
    color: Colors.muted,
    lineHeight: 16,
    fontStyle: 'italic',
  },

  // Model Picker
  modelPicker: {
    backgroundColor: Colors.overlayViolet12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.overlayViolet25,
  },
  modelPickerText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.violet,
  },

  // model picker modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlayBlack50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.card,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    width: '80%',
    maxHeight: '60%',
  },
  modelOption: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.lg,
  },
  modelOptionSelected: {
    backgroundColor: Colors.overlayViolet20,
  },
  modelOptionText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  modelOptionTextSelected: {
    fontSize: FontSize.md,
    color: Colors.violet,
    fontWeight: FontWeight.bold,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },

  // removed slider styles - not needed since using dropdown
  toneSliderContainer: {},
  sliderTrack: {},
  sliderThumb: {},
  toneSlider: {},
  toneEmoji: {},
  toneEmojiSelected: {},
});
