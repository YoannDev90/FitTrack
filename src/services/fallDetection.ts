import { Accelerometer, type AccelerometerMeasurement } from 'expo-sensors';
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

function getMagnitude({ x, y, z }: AccelerometerMeasurement): number {
  return Math.sqrt(x * x + y * y + z * z);
}

export function startFallDetection(
  onFallDetected: () => void,
  isRunning: () => boolean,
  getCurrentSpeed: () => number
): () => void {
  Accelerometer.setUpdateInterval(SAMPLE_INTERVAL_MS);

  const buffer: SensorSample[] = [];
  let impactStartAt: number | null = null;
  let pendingImpactAt: number | null = null;
  let stillnessStartAt: number | null = null;
  let lastDetectionAt = 0;

  const subscription = Accelerometer.addListener((measurement) => {
    const now = Date.now();
    const magnitude = getMagnitude(measurement);

    buffer.push({ timestamp: now, magnitude });
    if (buffer.length > SAMPLE_BUFFER_SIZE) {
      buffer.shift();
    }

    if (impactStartAt === null && magnitude > FALL_DETECTION.impactThreshold) {
      impactStartAt = now;
    }

    if (impactStartAt !== null) {
      if (magnitude > FALL_DETECTION.impactThreshold) {
        if (now - impactStartAt > FALL_DETECTION.impactDurationMs) {
          impactStartAt = null;
          pendingImpactAt = null;
          stillnessStartAt = null;
        }
        return;
      }

      const impactDuration = now - impactStartAt;
      impactStartAt = null;
      if (impactDuration <= FALL_DETECTION.impactDurationMs) {
        pendingImpactAt = now;
        stillnessStartAt = null;
      }
    }

    if (pendingImpactAt === null) return;

    if (now - pendingImpactAt > 4000) {
      pendingImpactAt = null;
      stillnessStartAt = null;
      return;
    }

    if (magnitude <= FALL_DETECTION.stillnessThreshold) {
      if (stillnessStartAt === null) {
        stillnessStartAt = now;
      }

      const stillForMs = now - stillnessStartAt;
      if (stillForMs < FALL_DETECTION.stillnessDurationMs) return;

      if (!isRunning()) {
        pendingImpactAt = null;
        stillnessStartAt = null;
        return;
      }

      const speed = getCurrentSpeed();
      if (speed <= FALL_DETECTION.minRunningSpeedMs) {
        pendingImpactAt = null;
        stillnessStartAt = null;
        return;
      }

      if (now - lastDetectionAt < FALL_DETECTION.cooldownMs) {
        pendingImpactAt = null;
        stillnessStartAt = null;
        return;
      }

      lastDetectionAt = now;
      pendingImpactAt = null;
      stillnessStartAt = null;

      try {
        onFallDetected();
      } catch (error) {
        serviceLogger.warn('[FallDetection] onFallDetected callback failed', error);
      }
      return;
    }

    stillnessStartAt = null;
  });

  return () => {
    subscription.remove();
  };
}
