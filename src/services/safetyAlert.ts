import { NativeModules, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import * as SMS from 'expo-sms';
import i18n from '../i18n';
import type { SafetyContact } from '../types';
import type { LatLng } from '../stores/runStore';
import { serviceLogger } from '../utils/logger';
import { WHATSAPP_CAPABILITY_TEST_URL } from '../constants/safety';

export interface AlertPayload {
  type: 'no_response' | 'help_requested' | 'fall_no_response';
  position: LatLng;
  runDurationMinutes: number;
  distanceKm: number;
  timestamp: Date;
}

export interface ContactDeliveryReport {
  contact: SafetyContact;
  channel: 'sms' | 'whatsapp';
  status: 'sent' | 'opened' | 'failed';
  error?: string;
}

export interface SafetyAlertResult {
  success: SafetyContact[];
  failed: SafetyContact[];
  reports: ContactDeliveryReport[];
  iosUserActionRequired: boolean;
}

const DEFAULT_APP_NAME = 'Spix';
const DEFAULT_USER_NAME = 'Utilisateur';

interface AndroidDirectSmsModule {
  sendSmsDirect?: (phone: string, message: string) => Promise<boolean>;
}

const androidDirectSmsModule = NativeModules.SpixSmsSender as AndroidDirectSmsModule | undefined;

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, '');
}

function buildMessage(payload: AlertPayload): string {
  const resolvedUserName = DEFAULT_USER_NAME;
  const resolvedAppName = DEFAULT_APP_NAME;
  const mapsUrl = `https://maps.google.com/?q=${payload.position.latitude},${payload.position.longitude}`;
  const formattedTimestamp = payload.timestamp.toLocaleString();

  const key = payload.type === 'help_requested'
    ? 'safety.alert.message'
    : payload.type === 'fall_no_response'
      ? 'safety.alert.fallNoResponse'
      : 'safety.alert.messageNoResponse';

  return i18n.t(key, {
    userName: resolvedUserName,
    mapsUrl,
    runDurationMinutes: Math.max(0, Math.round(payload.runDurationMinutes)),
    distanceKm: payload.distanceKm.toFixed(2),
    timestamp: formattedTimestamp,
    appName: resolvedAppName,
  });
}

function buildAllClearMessage(userName?: string, appName?: string): string {
  const resolvedUserName = userName?.trim() || DEFAULT_USER_NAME;
  const resolvedAppName = appName?.trim() || DEFAULT_APP_NAME;
  return i18n.t('safety.alert.messageAllClear', {
    userName: resolvedUserName,
    appName: resolvedAppName,
  });
}

async function openSmsComposer(phone: string, message: string): Promise<boolean> {
  const smsUrl = `sms:${phone}?body=${encodeURIComponent(message)}`;
  const canOpenSmsUrl = await Linking.canOpenURL(smsUrl);
  if (!canOpenSmsUrl) {
    return false;
  }

  await Linking.openURL(smsUrl);
  return true;
}

async function trySendAndroidDirectSms(phone: string, message: string): Promise<boolean> {
  // In Expo managed apps, true background SMS sending is only possible through a
  // native bridge with Android SmsManager + SEND_SMS permission.
  if (Platform.OS !== 'android') return false;

  if (androidDirectSmsModule?.sendSmsDirect) {
    try {
      return await androidDirectSmsModule.sendSmsDirect(phone, message);
    } catch (error) {
      serviceLogger.warn('[SafetyAlert] Native Android direct SMS failed', error);
    }
  }

  return false;
}

async function sendSms(phone: string, message: string): Promise<{ status: 'sent' | 'opened' | 'failed'; iosRequiresAction: boolean }> {
  const normalizedPhone = normalizePhone(phone);

  if (Platform.OS === 'android') {
    const sentDirectly = await trySendAndroidDirectSms(normalizedPhone, message);
    if (sentDirectly) {
      return { status: 'sent', iosRequiresAction: false };
    }

    try {
      const smsAvailable = await SMS.isAvailableAsync();
      if (smsAvailable) {
        const response = await SMS.sendSMSAsync([normalizedPhone], message);
        if (response.result === 'sent') {
          return { status: 'sent', iosRequiresAction: false };
        }
      }
    } catch (error) {
      serviceLogger.warn('[SafetyAlert] Android SMS API failed', error);
    }

    const opened = await openSmsComposer(normalizedPhone, message);
    return { status: opened ? 'opened' : 'failed', iosRequiresAction: false };
  }

  const opened = await openSmsComposer(normalizedPhone, message);
  return {
    status: opened ? 'opened' : 'failed',
    iosRequiresAction: opened,
  };
}

async function sendWhatsApp(phone: string, message: string): Promise<boolean> {
  const canUseWhatsApp = await Linking.canOpenURL(WHATSAPP_CAPABILITY_TEST_URL);
  if (!canUseWhatsApp) return false;

  const waUrl = `whatsapp://send?phone=${normalizePhone(phone)}&text=${encodeURIComponent(message)}`;
  const canOpen = await Linking.canOpenURL(waUrl);
  if (!canOpen) return false;

  await Linking.openURL(waUrl);
  return true;
}

export async function sendSafetyAlert(
  contacts: SafetyContact[],
  payload: AlertPayload
): Promise<SafetyAlertResult> {
  const success: SafetyContact[] = [];
  const failed: SafetyContact[] = [];
  const reports: ContactDeliveryReport[] = [];
  const message = buildMessage(payload);
  let iosUserActionRequired = false;

  for (const contact of contacts) {
    try {
      if (contact.method === 'whatsapp') {
        const waOpened = await sendWhatsApp(contact.phone, message);
        if (waOpened) {
          success.push(contact);
          reports.push({ contact, channel: 'whatsapp', status: 'opened' });
          if (Platform.OS === 'ios') {
            iosUserActionRequired = true;
          }
          continue;
        }
        serviceLogger.warn(`[SafetyAlert] WhatsApp unavailable, fallback to SMS for ${contact.phone}`);
      }

      const smsResult = await sendSms(contact.phone, message);
      if (smsResult.status === 'failed') {
        failed.push(contact);
        reports.push({ contact, channel: 'sms', status: 'failed' });
      } else {
        success.push(contact);
        reports.push({ contact, channel: 'sms', status: smsResult.status });
        iosUserActionRequired = iosUserActionRequired || smsResult.iosRequiresAction;
      }
    } catch (error) {
      serviceLogger.warn('[SafetyAlert] Failed to send alert', contact.phone, error);
      failed.push(contact);
      reports.push({
        contact,
        channel: contact.method,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success, failed, reports, iosUserActionRequired };
}

export async function sendAllClearSafetyAlert(
  contacts: SafetyContact[],
  userName?: string,
  appName?: string
): Promise<SafetyAlertResult> {
  const success: SafetyContact[] = [];
  const failed: SafetyContact[] = [];
  const reports: ContactDeliveryReport[] = [];
  const message = buildAllClearMessage(userName, appName);
  let iosUserActionRequired = false;

  for (const contact of contacts) {
    try {
      const smsResult = await sendSms(contact.phone, message);
      if (smsResult.status === 'failed') {
        failed.push(contact);
        reports.push({ contact, channel: 'sms', status: 'failed' });
      } else {
        success.push(contact);
        reports.push({ contact, channel: 'sms', status: smsResult.status });
        iosUserActionRequired = iosUserActionRequired || smsResult.iosRequiresAction;
      }
    } catch (error) {
      serviceLogger.warn('[SafetyAlert] Failed to send all-clear', contact.phone, error);
      failed.push(contact);
      reports.push({
        contact,
        channel: 'sms',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { success, failed, reports, iosUserActionRequired };
}
