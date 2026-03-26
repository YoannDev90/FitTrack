import { PermissionsAndroid, Platform } from 'react-native';
import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
import i18n from '../i18n';
import { serviceLogger } from '../utils/logger';

export const FALL_DETECTION = {
  impactThreshold: 2.5,
  impactDurationMs: 200,
  stillnessThreshold: 1.2,
  stillnessDurationMs: 1500,
  cooldownMs: 30000,
  minRunningSpeedMs: 0.5,
} as const;

interface SensorSample {
  timestamp: number;
  magnitude: number;
}

const SAMPLE_INTERVAL_MS = 50;
const SAMPLE_BUFFER_SIZE = 40;
const IMPACT_WINDOW_MS = 4000;
const STILLNESS_VARIATION_THRESHOLD = 0.25;

function getMagnitude({ x, y, z }: AccelerometerMeasurement): number {
  return Math.sqrt(x * x + y * y + z * z);
}

function getAndroidVersion(): number {
  if (typeof Platform.Version === 'number') {
    return Platform.Version;
  }

  const parsed = Number.parseInt(String(Platform.Version), 10);
  return Number.isNaN(parsed) ? 0 : parsed;
}

async function requestMotionPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (getAndroidVersion() < 29) {
    return true;
  }

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACTIVITY_RECOGNITION,
      {
        title: i18n.t('safety.permission.motionTitle'),
        message: i18n.t('safety.permission.motion'),
        buttonPositive: i18n.t('safety.permission.allow'),
        buttonNegative: i18n.t('common.cancel'),
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    serviceLogger.warn('[FallDetection] Motion permission request failed', error);
    return false;
  }
}

function getSamplesWithinWindow(buffer: SensorSample[], now: number, windowMs: number): SensorSample[] {
  const from = now - windowMs;
  return buffer.filter((sample) => sample.timestamp >= from);
}

function isStillnessWindow(samples: SensorSample[]): boolean {
  if (samples.length < 4) return false;

  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;
  let sum = 0;

  for (const sample of samples) {
    min = Math.min(min, sample.magnitude);
    max = Math.max(max, sample.magnitude);
    sum += sample.magnitude;
  }

  const average = sum / samples.length;
  const variation = max - min;

  return average <= FALL_DETECTION.stillnessThreshold && variation <= STILLNESS_VARIATION_THRESHOLD;
}

export function startFallDetection(
  onFallDetected: () => void,
  isRunning: () => boolean,
  getCurrentSpeed: () => number
): () => void {
  const buffer: SensorSample[] = [];
  let impactStartAt: number | null = null;
  let impactPeakMagnitude = 0;
  let pendingImpactAt: number | null = null;
  let pendingImpactSpeed = 0;
  let stillnessStartAt: number | null = null;
  let lastDetectionAt = 0;
  let isActive = true;
  let subscription: { remove: () => void } | null = null;

  const resetPendingImpact = () => {
    pendingImpactAt = null;
    pendingImpactSpeed = 0;
    stillnessStartAt = null;
  };

  const onAccelUpdate = (measurement: AccelerometerMeasurement) => {
    if (!isActive) return;

    const now = Date.now();
    const magnitude = getMagnitude(measurement);

    buffer.push({ timestamp: now, magnitude });
    if (buffer.length > SAMPLE_BUFFER_SIZE) {
      buffer.shift();
    }

    if (impactStartAt === null && magnitude > FALL_DETECTION.impactThreshold) {
      impactStartAt = now;
      impactPeakMagnitude = magnitude;
    }

    if (impactStartAt !== null) {
      if (magnitude > FALL_DETECTION.impactThreshold) {
        impactPeakMagnitude = Math.max(impactPeakMagnitude, magnitude);

        if (now - impactStartAt > FALL_DETECTION.impactDurationMs) {
          impactStartAt = null;
          impactPeakMagnitude = 0;
          resetPendingImpact();
        }
        return;
      }

      const impactDuration = now - impactStartAt;
      impactStartAt = null;
      if (impactDuration <= FALL_DETECTION.impactDurationMs && impactPeakMagnitude >= FALL_DETECTION.impactThreshold) {
        pendingImpactAt = now;
        pendingImpactSpeed = Math.max(0, getCurrentSpeed());
        stillnessStartAt = null;
      }
      impactPeakMagnitude = 0;
    }

    if (pendingImpactAt === null) return;

    if (now - pendingImpactAt > IMPACT_WINDOW_MS) {
      resetPendingImpact();
      return;
    }

    if (!isRunning()) {
      resetPendingImpact();
      return;
    }

    if (pendingImpactSpeed <= FALL_DETECTION.minRunningSpeedMs) {
      resetPendingImpact();
      return;
    }

    if (magnitude > FALL_DETECTION.stillnessThreshold) {
      stillnessStartAt = null;
      return;
    }

    if (stillnessStartAt === null) {
      stillnessStartAt = now;
      return;
    }

    const stillForMs = now - stillnessStartAt;
    if (stillForMs < FALL_DETECTION.stillnessDurationMs) return;

    const stillnessSamples = getSamplesWithinWindow(buffer, now, FALL_DETECTION.stillnessDurationMs);
    if (!isStillnessWindow(stillnessSamples)) {
      stillnessStartAt = now;
      return;
    }

    if (now - lastDetectionAt < FALL_DETECTION.cooldownMs) {
      resetPendingImpact();
      return;
    }

    lastDetectionAt = now;
    resetPendingImpact();

    try {
      onFallDetected();
    } catch (error) {
      serviceLogger.warn('[FallDetection] onFallDetected callback failed', error);
    }
  };

  const initializeDetection = async () => {
    try {
      const isAvailable = await Accelerometer.isAvailableAsync();
      if (!isAvailable || !isActive) {
        serviceLogger.warn('[FallDetection] Accelerometer not available on this device');
        return;
      }

      const hasPermission = await requestMotionPermission();
      if (!hasPermission || !isActive) {
        serviceLogger.warn('[FallDetection] Motion permission denied, disabling fall detection for this run');
        return;
      }

      // Sensor interval must be set before subscribing.
      Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);
      subscription = Accelerometer.addListener(onAccelUpdate);
    } catch (error) {
      serviceLogger.warn('[FallDetection] Unable to initialize accelerometer listener', error);
    }
  };

  void initializeDetection();

  return () => {
    isActive = false;
    if (subscription) {
      subscription.remove();
      subscription = null;
    }
  };
}
