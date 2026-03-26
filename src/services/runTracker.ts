// ============================================================================
// RUN TRACKER SERVICE - GPS tracking with expo-location
// ============================================================================

import * as Location from 'expo-location';
import type { LatLng } from '../stores/runStore';

let locationSubscription: Location.LocationSubscription | null = null;

// ============================================================================
// HAVERSINE DISTANCE
// ============================================================================

/** Calculate distance in km between two points using Haversine formula */
export function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ============================================================================
// PACE CALCULATION
// ============================================================================

/** Defensive pace calculation — returns null if data is unreliable */
export function calculatePace(deltaDistanceKm: number, deltaTimeSeconds: number): number | null {
  if (deltaDistanceKm < 0.005) return null;  // less than 5m → no calculation
  if (deltaTimeSeconds <= 0) return null;
  const paceSecPerKm = deltaTimeSeconds / deltaDistanceKm;
  if (paceSecPerKm < 60) return null;   // < 1min/km → aberrant (> 60km/h)
  if (paceSecPerKm > 1800) return null; // > 30min/km → aberrant (quasi immobile)
  return paceSecPerKm;
}

/** Calculate sliding window average pace from last N points (sec/km) */
export function calculateInstantPace(coords: LatLng[], windowSize: number = 5): number {
  if (coords.length < 2) return 0;

  const recentCoords = coords.slice(-Math.min(windowSize + 1, coords.length));
  if (recentCoords.length < 2) return 0;

  let totalDistance = 0;
  for (let i = 1; i < recentCoords.length; i++) {
    totalDistance += haversineDistance(
      recentCoords[i - 1].latitude, recentCoords[i - 1].longitude,
      recentCoords[i].latitude, recentCoords[i].longitude,
    );
  }

  const totalTime = (recentCoords[recentCoords.length - 1].timestamp - recentCoords[0].timestamp) / 1000;
  const pace = calculatePace(totalDistance, totalTime);
  return pace ?? 0;
}

/** Calculate average pace from total distance and elapsed time */
export function calculateAvgPace(distanceKm: number, elapsedSeconds: number): number {
  const pace = calculatePace(distanceKm, elapsedSeconds);
  return pace ?? 0;
}

// ============================================================================
// ELEVATION
// ============================================================================

/** Calculate total positive elevation gain from coords */
export function calculateElevationGain(coords: LatLng[]): number {
  let gain = 0;
  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1].altitude;
    const curr = coords[i].altitude;
    if (prev != null && curr != null && curr > prev) {
      gain += curr - prev;
    }
  }
  return Math.round(gain);
}

// ============================================================================
// CALORIES
// ============================================================================

/** Estimate calories burned based on pace, weight, and duration */
export function calculateRunCalories(
  avgPaceSecPerKm: number,
  weightKg: number,
  durationMinutes: number,
): number {
  const met = avgPaceSecPerKm < 300 ? 11.0
    : avgPaceSecPerKm < 360 ? 9.5
    : avgPaceSecPerKm < 420 ? 8.0
    : 7.0;
  return Math.round(met * weightKg * (durationMinutes / 60));
}

/** Calculate XP for a run */
export function calculateRunXP(distanceKm: number, durationMinutes: number): number {
  return Math.round(distanceKm * 10 + durationMinutes * 0.5);
}

// ============================================================================
// PERMISSION
// ============================================================================

export async function requestLocationPermission(): Promise<boolean> {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    throw new Error('PERMISSION_DENIED');
  }
  return true;
}

// ============================================================================
// TRACKING
// ============================================================================

export type OnPositionCallback = (position: LatLng) => void;

const MAX_ACCURACY_METERS = 25;

export async function startTracking(onPosition: OnPositionCallback): Promise<void> {
  // Stop any existing subscription
  await stopTracking();

  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 2,
    },
    (location) => {
      const { latitude, longitude, altitude, accuracy, speed } = location.coords;

      // Filter out inaccurate readings
      if (accuracy != null && accuracy > MAX_ACCURACY_METERS) return;

      const pos: LatLng = {
        latitude,
        longitude,
        altitude: altitude ?? undefined,
        timestamp: location.timestamp,
        accuracy: accuracy ?? undefined,
        speed: speed ?? undefined,
      };

      onPosition(pos);
    },
  );
}

export async function stopTracking(): Promise<void> {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
}
