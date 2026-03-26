import { create } from 'zustand';
import type { SafetyContact } from '../types';
import type { LatLng } from './runStore';

export type SafetyAutoAlertType = 'no_response' | 'help_requested' | 'fall_no_response';
export type SafetyPendingReason = 'check' | 'fall';

export type SafetyCheckStatus =
  | 'idle'
  | 'countdown'
  | 'pending'
  | 'fall_detected'
  | 'auto_alerting'
  | 'alert_sent'
  | 'dismissed';

interface SafetyAlertSummary {
  sentAt: number;
  type: SafetyAutoAlertType;
  success: SafetyContact[];
  failed: SafetyContact[];
}

interface SafetyCheckState {
  isEnabled: boolean;
  fallDetectionEnabled: boolean;
  intervalMinutes: number;
  autoAlertDelaySeconds: number;
  contacts: SafetyContact[];
  checkStatus: SafetyCheckStatus;
  pendingReason: SafetyPendingReason | null;
  autoAlertType: SafetyAutoAlertType | null;
  nextCheckAt: number | null;
  countdownSeconds: number;
  pendingSeconds: number;
  lastKnownPosition: LatLng | null;
  alertSentAt: number | null;
  alertSummary: SafetyAlertSummary | null;

  initCheck: (
    intervalMinutes: number,
    autoAlertDelaySeconds?: number,
    contacts?: SafetyContact[],
    fallDetectionEnabled?: boolean
  ) => void;
  tickCountdown: () => void;
  tickPending: () => void;
  dismissCheck: () => void;
  triggerHelp: () => void;
  startPendingCheck: () => void;
  triggerFallCheck: () => void;
  extendCheck: (newIntervalMinutes: number) => void;
  resetCheck: () => void;
  updatePosition: (pos: LatLng) => void;
  setContacts: (contacts: SafetyContact[]) => void;
  setAutoAlertDelaySeconds: (seconds: number) => void;
  setFallDetectionEnabled: (enabled: boolean) => void;
  markAlertSending: (type: SafetyAutoAlertType) => void;
  markAlertSent: (summary: { type: SafetyAutoAlertType; success: SafetyContact[]; failed: SafetyContact[] }) => void;
  clearAlertSummary: () => void;
}

const COUNTDOWN_WARNING_SECONDS = 60;
const DEFAULT_AUTO_ALERT_DELAY_SECONDS = 60;

export const useSafetyStore = create<SafetyCheckState>((set, get) => ({
  isEnabled: false,
  fallDetectionEnabled: false,
  intervalMinutes: 30,
  autoAlertDelaySeconds: DEFAULT_AUTO_ALERT_DELAY_SECONDS,
  contacts: [],
  checkStatus: 'idle',
  pendingReason: null,
  autoAlertType: null,
  nextCheckAt: null,
  countdownSeconds: 0,
  pendingSeconds: DEFAULT_AUTO_ALERT_DELAY_SECONDS,
  lastKnownPosition: null,
  alertSentAt: null,
  alertSummary: null,

  initCheck: (
    intervalMinutes,
    autoAlertDelaySeconds = DEFAULT_AUTO_ALERT_DELAY_SECONDS,
    contacts = [],
    fallDetectionEnabled = false
  ) => {
    const now = Date.now();
    const nextCheckAt = now + intervalMinutes * 60 * 1000;
    set({
      isEnabled: true,
      fallDetectionEnabled,
      intervalMinutes,
      autoAlertDelaySeconds,
      contacts,
      checkStatus: 'idle',
      pendingReason: null,
      autoAlertType: null,
      nextCheckAt,
      countdownSeconds: Math.max(0, Math.ceil((nextCheckAt - now) / 1000)),
      pendingSeconds: autoAlertDelaySeconds,
      alertSentAt: null,
      alertSummary: null,
    });
  },

  tickCountdown: () => {
    const state = get();
    if (!state.isEnabled) return;
    if (!state.nextCheckAt) return;
    if (state.checkStatus === 'pending' || state.checkStatus === 'fall_detected' || state.checkStatus === 'auto_alerting' || state.checkStatus === 'alert_sent') return;

    const remainingSeconds = Math.max(0, Math.ceil((state.nextCheckAt - Date.now()) / 1000));

    if (remainingSeconds <= 0) {
      set({
        checkStatus: 'pending',
        pendingReason: 'check',
        autoAlertType: null,
        countdownSeconds: 0,
        pendingSeconds: state.autoAlertDelaySeconds,
      });
      return;
    }

    if (remainingSeconds <= COUNTDOWN_WARNING_SECONDS) {
      set({
        checkStatus: 'countdown',
        countdownSeconds: remainingSeconds,
      });
      return;
    }

    set({
      checkStatus: 'idle',
      countdownSeconds: remainingSeconds,
    });
  },

  tickPending: () => {
    const state = get();
    if (!state.isEnabled) return;
    if (state.checkStatus !== 'pending' && state.checkStatus !== 'fall_detected') return;

    const nextPending = Math.max(0, state.pendingSeconds - 1);
    if (nextPending <= 0) {
      const autoAlertType: SafetyAutoAlertType = state.checkStatus === 'fall_detected'
        ? 'fall_no_response'
        : 'no_response';
      set({
        pendingSeconds: 0,
        checkStatus: 'auto_alerting',
        autoAlertType,
      });
      return;
    }

    set({ pendingSeconds: nextPending });
  },

  dismissCheck: () => {
    const state = get();
    if (!state.isEnabled) return;
    const now = Date.now();
    const nextCheckAt = now + state.intervalMinutes * 60 * 1000;
    set({
      checkStatus: 'dismissed',
      pendingReason: null,
      autoAlertType: null,
      nextCheckAt,
      countdownSeconds: Math.max(0, Math.ceil((nextCheckAt - now) / 1000)),
      pendingSeconds: state.autoAlertDelaySeconds,
    });
  },

  triggerHelp: () => {
    if (!get().isEnabled) return;
    set({
      checkStatus: 'auto_alerting',
      autoAlertType: 'help_requested',
    });
  },

  startPendingCheck: () => {
    const state = get();
    if (!state.isEnabled) return;
    set({
      checkStatus: 'pending',
      pendingReason: 'check',
      autoAlertType: null,
      pendingSeconds: state.autoAlertDelaySeconds,
      countdownSeconds: 0,
    });
  },

  triggerFallCheck: () => {
    const state = get();
    if (!state.isEnabled || !state.fallDetectionEnabled) return;
    if (state.checkStatus === 'auto_alerting' || state.checkStatus === 'alert_sent') return;

    set({
      checkStatus: 'fall_detected',
      pendingReason: 'fall',
      autoAlertType: null,
      pendingSeconds: state.autoAlertDelaySeconds,
      countdownSeconds: 0,
    });
  },

  extendCheck: (newIntervalMinutes) => {
    const state = get();
    if (!state.isEnabled) return;
    const now = Date.now();
    const nextCheckAt = now + newIntervalMinutes * 60 * 1000;
    set({
      intervalMinutes: newIntervalMinutes,
      checkStatus: 'dismissed',
      pendingReason: null,
      autoAlertType: null,
      nextCheckAt,
      countdownSeconds: Math.max(0, Math.ceil((nextCheckAt - now) / 1000)),
      pendingSeconds: state.autoAlertDelaySeconds,
    });
  },

  resetCheck: () => {
    set({
      isEnabled: false,
      fallDetectionEnabled: false,
      checkStatus: 'idle',
      pendingReason: null,
      autoAlertType: null,
      nextCheckAt: null,
      countdownSeconds: 0,
      pendingSeconds: DEFAULT_AUTO_ALERT_DELAY_SECONDS,
      lastKnownPosition: null,
      alertSentAt: null,
      alertSummary: null,
    });
  },

  updatePosition: (pos) => {
    set({ lastKnownPosition: pos });
  },

  setContacts: (contacts) => {
    set({ contacts });
  },

  setAutoAlertDelaySeconds: (seconds) => {
    set({
      autoAlertDelaySeconds: seconds,
      pendingSeconds: seconds,
    });
  },

  setFallDetectionEnabled: (enabled) => {
    set({ fallDetectionEnabled: enabled });
  },

  markAlertSending: (type) => {
    set({
      checkStatus: 'auto_alerting',
      autoAlertType: type,
    });
  },

  markAlertSent: ({ type, success, failed }) => {
    const sentAt = Date.now();
    set({
      alertSentAt: sentAt,
      checkStatus: 'alert_sent',
      autoAlertType: type,
      alertSummary: {
        sentAt,
        type,
        success,
        failed,
      },
    });
  },

  clearAlertSummary: () => {
    const state = get();
    const now = Date.now();
    const nextCheckAt = now + state.intervalMinutes * 60 * 1000;
    set({
      alertSummary: null,
      alertSentAt: null,
      checkStatus: 'dismissed',
      pendingReason: null,
      autoAlertType: null,
      nextCheckAt,
      countdownSeconds: Math.max(0, Math.ceil((nextCheckAt - now) / 1000)),
      pendingSeconds: state.autoAlertDelaySeconds,
    });
  },
}));
