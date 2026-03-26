import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Switch, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Linking from 'expo-linking';
import { Shield, Clock3, Settings, MessageCircleMore, MessageSquareText, AlertTriangle } from 'lucide-react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing } from '../../constants';
import { GlassCard } from '../ui';
import type { SafetyContact } from '../../types';
import { SAFETY_AUTO_ALERT_OPTIONS, SAFETY_INTERVAL_OPTIONS, WHATSAPP_CAPABILITY_TEST_URL } from '../../constants/safety';
import { formatSafetyDelay, formatSafetyInterval } from '../../utils/safety';

interface SafetyCheckConfigProps {
  visible: boolean;
  contacts: SafetyContact[];
  initialEnabled: boolean;
  defaultIntervalMinutes: number;
  defaultAutoAlertDelaySeconds: number;
  defaultFallDetectionEnabled: boolean;
  onClose: () => void;
  onGoToSettings: () => void;
  onActivate: (config: {
    intervalMinutes: number;
    autoAlertDelaySeconds: number;
    enabled: boolean;
    fallDetectionEnabled: boolean;
  }) => void;
}

function getAvatarColor(name: string): string {
  const palette = ['#4f8cff', '#32b27b', '#e89b4d', '#bc7cff', '#e06767', '#4fb9d1'];
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash |= 0;
  }
  return palette[Math.abs(hash) % palette.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function SafetyCheckConfig({
  visible,
  contacts,
  defaultIntervalMinutes,
  defaultAutoAlertDelaySeconds,
  defaultFallDetectionEnabled,
  onClose,
  onGoToSettings,
  onActivate,
}: SafetyCheckConfigProps) {
  const { t } = useTranslation();
  const [intervalMinutes, setIntervalMinutes] = useState(defaultIntervalMinutes);
  const [customIntervalText, setCustomIntervalText] = useState('');
  const [isCustomInterval, setIsCustomInterval] = useState(false);
  const [customIntervalError, setCustomIntervalError] = useState<string | null>(null);
  const [autoAlertDelaySeconds, setAutoAlertDelaySeconds] = useState(defaultAutoAlertDelaySeconds);
  const [fallDetectionEnabled, setFallDetectionEnabled] = useState(defaultFallDetectionEnabled);
  const [whatsAppAvailable, setWhatsAppAvailable] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if ((SAFETY_INTERVAL_OPTIONS as readonly number[]).includes(defaultIntervalMinutes)) {
      setIsCustomInterval(false);
      setIntervalMinutes(defaultIntervalMinutes);
      setCustomIntervalText('');
      setCustomIntervalError(null);
    } else {
      setIsCustomInterval(true);
      setIntervalMinutes(defaultIntervalMinutes);
      setCustomIntervalText(defaultIntervalMinutes.toString());
      setCustomIntervalError(null);
    }
    setAutoAlertDelaySeconds(defaultAutoAlertDelaySeconds);
    setFallDetectionEnabled(defaultFallDetectionEnabled);
  }, [defaultAutoAlertDelaySeconds, defaultFallDetectionEnabled, defaultIntervalMinutes, visible]);

  useEffect(() => {
    let cancelled = false;
    if (!visible) return;

    const checkWhatsApp = async () => {
      const canUseWhatsApp = await Linking.canOpenURL(WHATSAPP_CAPABILITY_TEST_URL);
      if (!cancelled) {
        setWhatsAppAvailable(canUseWhatsApp);
      }
    };

    checkWhatsApp();

    return () => {
      cancelled = true;
    };
  }, [visible]);

  const visibleContacts = useMemo(() => contacts.slice(0, 3), [contacts]);
  const hiddenContactsCount = Math.max(0, contacts.length - visibleContacts.length);
  const canActivate = contacts.length > 0;

  const handleActivate = () => {
    if (!canActivate) return;
    if (isCustomInterval) {
      const parsed = Number(customIntervalText);
      if (!customIntervalText || Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
        setCustomIntervalError(t('safety.config.customError'));
        return;
      }
      setIntervalMinutes(parsed);
    }

    onActivate({
      enabled: true,
      intervalMinutes: isCustomInterval ? Number(customIntervalText) : intervalMinutes,
      autoAlertDelaySeconds,
      fallDetectionEnabled,
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlassCard style={styles.card} variant="solid">
          <View style={styles.header}>
            <View style={styles.shieldGlowOuter}>
              <View style={styles.shieldGlowInner}>
                <Shield size={34} color="#80bfff" />
              </View>
            </View>
            <Text style={styles.title}>{t('safety.config.title')}</Text>
            <Text style={styles.subtitle}>{t('safety.config.subtitle')}</Text>
            <View style={styles.separator} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.sectionOverline}>{t('safety.config.intervalCaps')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {SAFETY_INTERVAL_OPTIONS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, !isCustomInterval && intervalMinutes === value && styles.chipActive]}
                  onPress={() => {
                    setIsCustomInterval(false);
                    setIntervalMinutes(value);
                    setCustomIntervalText('');
                    setCustomIntervalError(null);
                  }}
                >
                  <Text style={[styles.chipText, !isCustomInterval && intervalMinutes === value && styles.chipTextActive]}>
                    {formatSafetyInterval(value, t('common.minShort'), t('common.hour'))}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                key="custom"
                style={[styles.chip, isCustomInterval && styles.chipActive]}
                onPress={() => {
                  setIsCustomInterval(true);
                  setCustomIntervalText(isCustomInterval ? customIntervalText : intervalMinutes.toString());
                  setCustomIntervalError(null);
                }}
              >
                <Text style={[styles.chipText, isCustomInterval && styles.chipTextActive]}>
                  {t('safety.config.custom')}
                </Text>
              </TouchableOpacity>
            </ScrollView>

            {isCustomInterval && (
              <View style={styles.customIntervalInputRow}>
                <TextInput
                  style={[styles.input, customIntervalError && styles.inputError]}
                  placeholder={t('safety.config.customPlaceholder')}
                  placeholderTextColor={Colors.muted2}
                  keyboardType="numeric"
                  value={customIntervalText}
                  onChangeText={(value) => {
                    const parsed = Number(value);
                    setCustomIntervalText(value);
                    if (!value || Number.isNaN(parsed) || parsed <= 0 || !Number.isInteger(parsed)) {
                      setCustomIntervalError(t('safety.config.customError'));
                      return;
                    }
                    setCustomIntervalError(null);
                    setIntervalMinutes(parsed);
                  }}
                  onBlur={() => {
                    const parsed = Number(customIntervalText);
                    if (customIntervalText && !Number.isNaN(parsed) && parsed > 0 && Number.isInteger(parsed)) {
                      setIntervalMinutes(parsed);
                    }
                  }}
                  returnKeyType="done"
                />
                {customIntervalError ? (
                  <Text style={styles.errorText}>{customIntervalError}</Text>
                ) : (
                  <Text style={styles.customHintText}>{t('safety.config.customHint')}</Text>
                )}
              </View>
            )}

            <View style={styles.delayHeaderRow}>
              <Clock3 size={14} color={Colors.muted} />
              <Text style={styles.sectionOverline}>{t('safety.config.autoAlertCaps')}</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {SAFETY_AUTO_ALERT_OPTIONS.map((value) => (
                <TouchableOpacity
                  key={value}
                  style={[styles.chip, autoAlertDelaySeconds === value && styles.chipActive]}
                  onPress={() => setAutoAlertDelaySeconds(value)}
                >
                  <Text style={[styles.chipText, autoAlertDelaySeconds === value && styles.chipTextActive]}>
                    {formatSafetyDelay(value, t('common.minShort'))}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.sectionOverline}>{t('safety.config.contactsCaps')}</Text>
            {contacts.length === 0 ? (
              <View style={styles.warningCard}>
                <AlertTriangle size={18} color={Colors.warning} />
                <Text style={styles.warningText}>{t('safety.config.noContacts')}</Text>
                <TouchableOpacity style={styles.settingsButton} onPress={onGoToSettings}>
                  <Settings size={14} color={Colors.bg} />
                  <Text style={styles.settingsButtonText}>{t('safety.config.addContacts')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.contactsList}>
                {visibleContacts.map((contact) => {
                  const reachable = contact.method === 'sms' || whatsAppAvailable;
                  const methodIsWhatsApp = contact.method === 'whatsapp';
                  return (
                    <View key={contact.id} style={styles.contactCard}>
                      <View style={[styles.avatar, { backgroundColor: getAvatarColor(contact.name) }]}>
                        <Text style={styles.avatarText}>{getInitials(contact.name)}</Text>
                      </View>

                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactPhone}>{contact.phone}</Text>
                      </View>

                      <View style={styles.contactMeta}>
                        <View style={[styles.methodBadge, methodIsWhatsApp ? styles.whatsAppBadge : styles.smsBadge]}>
                          {methodIsWhatsApp ? (
                            <MessageCircleMore size={12} color={methodIsWhatsApp ? '#22c55e' : '#60a5fa'} />
                          ) : (
                            <MessageSquareText size={12} color={methodIsWhatsApp ? '#22c55e' : '#60a5fa'} />
                          )}
                          <Text style={[styles.methodBadgeText, methodIsWhatsApp ? styles.whatsAppBadgeText : styles.smsBadgeText]}>
                            {methodIsWhatsApp ? t('settings.safety.methodWhatsApp') : t('settings.safety.methodSMS')}
                          </Text>
                        </View>
                        <View style={styles.reachableRow}>
                          <View style={[styles.reachableDot, reachable ? styles.reachableDotOn : styles.reachableDotOff]} />
                          <Text style={styles.reachableText}>
                            {reachable ? t('safety.config.reachable') : t('safety.config.unreachable')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}

                {hiddenContactsCount > 0 && (
                  <Text style={styles.moreContactsText}>{t('safety.config.moreContacts', { count: hiddenContactsCount })}</Text>
                )}
              </View>
            )}

            <View style={styles.fallCard}>
              <View style={styles.fallTextWrap}>
                <View style={styles.fallTitleRow}>
                  <AlertTriangle size={15} color="#ffbe55" />
                  <Text style={styles.fallTitle}>{t('settings.safety.fallDetection')}</Text>
                </View>
                <Text style={styles.fallDescription}>{t('settings.safety.fallDetectionDesc')}</Text>
              </View>
              <Switch
                value={fallDetectionEnabled}
                onValueChange={setFallDetectionEnabled}
                trackColor={{ true: Colors.success, false: Colors.cardSolid }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.activateButton, !canActivate && styles.activateButtonDisabled]} onPress={handleActivate} disabled={!canActivate}>
              <Shield size={18} color="#fff" />
              <Text style={styles.activateText}>{t('safety.config.activate')}</Text>
            </TouchableOpacity>
            {!canActivate && (
              <Text style={styles.tooltip}>{t('safety.config.activateTooltip')}</Text>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2,6,13,0.78)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    maxHeight: '94%',
    borderColor: 'rgba(153,190,255,0.22)',
    backgroundColor: '#0b111c',
  },
  scrollContent: {
    paddingBottom: Spacing.md,
    gap: Spacing.md,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  shieldGlowOuter: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(78,145,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  shieldGlowInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(78,145,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(145,189,255,0.35)',
  },
  title: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: FontWeight.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.muted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  separator: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(153,190,255,0.24)',
    marginTop: Spacing.md,
  },
  sectionOverline: {
    color: Colors.muted2,
    fontSize: FontSize.xs,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: FontWeight.semibold,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  chip: {
    borderWidth: 1,
    borderColor: 'rgba(158,175,200,0.35)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: 'rgba(132,152,176,0.15)',
  },
  chipActive: {
    backgroundColor: '#4f8cff',
    borderColor: '#7fb2ff',
    shadowColor: '#4f8cff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
  chipTextActive: {
    color: '#fff',
  },
  customIntervalInputRow: {
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(158,175,200,0.45)',
    borderRadius: BorderRadius.lg,
    color: Colors.text,
    fontSize: FontSize.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.card,
  },
  inputError: {
    borderColor: Colors.error,
  },
  customHintText: {
    color: Colors.muted,
    fontSize: FontSize.xs,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
  },
  delayHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  contactsList: {
    gap: Spacing.sm,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(153,190,255,0.2)',
    backgroundColor: 'rgba(20,30,46,0.75)',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  contactPhone: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  contactMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: 1,
  },
  smsBadge: {
    backgroundColor: 'rgba(96,165,250,0.14)',
    borderColor: 'rgba(96,165,250,0.35)',
  },
  whatsAppBadge: {
    backgroundColor: 'rgba(34,197,94,0.14)',
    borderColor: 'rgba(34,197,94,0.35)',
  },
  methodBadgeText: {
    fontSize: 10,
    fontWeight: FontWeight.semibold,
  },
  smsBadgeText: {
    color: '#80b6ff',
  },
  whatsAppBadgeText: {
    color: '#54d48f',
  },
  reachableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reachableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  reachableDotOn: {
    backgroundColor: '#4ade80',
  },
  reachableDotOff: {
    backgroundColor: '#f87171',
  },
  reachableText: {
    color: Colors.muted2,
    fontSize: 10,
  },
  moreContactsText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    textAlign: 'right',
  },
  warningCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(251,191,36,0.45)',
    backgroundColor: 'rgba(251,191,36,0.12)',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  warningText: {
    color: '#ffd68a',
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  settingsButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
    borderRadius: BorderRadius.full,
    backgroundColor: '#f0b95b',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  settingsButtonText: {
    color: Colors.bg,
    fontWeight: FontWeight.bold,
    fontSize: FontSize.sm,
  },
  fallCard: {
    marginTop: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,190,85,0.3)',
    backgroundColor: 'rgba(255,190,85,0.1)',
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  fallTextWrap: {
    flex: 1,
  },
  fallTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: 4,
  },
  fallTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
  },
  fallDescription: {
    color: Colors.muted,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },
  actions: {
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  activateButton: {
    borderRadius: 18,
    backgroundColor: '#16a34a',
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  activateButtonDisabled: {
    backgroundColor: 'rgba(107,114,128,0.45)',
    shadowOpacity: 0,
    elevation: 0,
  },
  activateText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
  },
  tooltip: {
    color: Colors.warning,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  closeButton: {
    alignSelf: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  closeButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
  },
});
