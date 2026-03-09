type MapLibreModule = {
  setAccessToken?: (token: string | null) => void;
  MapView: any;
  Camera: any;
  ShapeSource: any;
  LineLayer: any;
  CircleLayer: any;
};

let cachedMapLibre: MapLibreModule | null | undefined;

export function getMapLibreModule(): MapLibreModule | null {
  if (cachedMapLibre !== undefined) return cachedMapLibre;

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