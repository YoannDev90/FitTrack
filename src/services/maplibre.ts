import type { ComponentType } from 'react';
import { BuildConfig } from '../config/buildConfig';

type MapLibreComponent = ComponentType<Record<string, unknown>>;

type MapLibreModule = {
  setAccessToken?: (token: string | null) => void;
  MapView: MapLibreComponent;
  Camera: MapLibreComponent;
  ShapeSource: MapLibreComponent;
  LineLayer: MapLibreComponent;
  CircleLayer: MapLibreComponent;
};

let cachedMapLibre: MapLibreModule | null | undefined;
let cachedForFossMode: boolean | undefined;

export function getMapLibreModule(): MapLibreModule | null {
  const isFossMode = BuildConfig.isFoss;
  if (cachedMapLibre !== undefined && cachedForFossMode === isFossMode) {
    return cachedMapLibre;
  }
  cachedForFossMode = isFossMode;

  if (isFossMode) {
    cachedMapLibre = null;
    return cachedMapLibre;
  }

  try {
    // Use require so apps without the native module do not crash at import time.
    const mod = require('@maplibre/maplibre-react-native');
    const lib = (mod?.default ?? mod) as MapLibreModule | undefined;

    if (!lib?.MapView || !lib?.Camera) {
      cachedMapLibre = null;
      return cachedMapLibre;
    }

    if (typeof lib.setAccessToken === 'function') {
      lib.setAccessToken(null);
    }

    cachedMapLibre = lib;
    return cachedMapLibre;
  } catch (error) {
    if (__DEV__) {
      console.warn('[MapLibre] Native module unavailable', error);
    }
    cachedMapLibre = null;
    return cachedMapLibre;
  }
}

export function isMapLibreAvailable(): boolean {
  return getMapLibreModule() !== null;
}