import { BuildConfig } from '../config/buildConfig';

type MapLibreModule = {
  setAccessToken?: (token: string | null) => void;
  MapView: any;
  Camera: any;
  ShapeSource: any;
  LineLayer: any;
  CircleLayer: any;
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
  } catch {
    cachedMapLibre = null;
    return cachedMapLibre;
  }
}

export function isMapLibreAvailable(): boolean {
  return getMapLibreModule() !== null;
}