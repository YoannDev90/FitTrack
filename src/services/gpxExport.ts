// ============================================================================
// GPX EXPORT SERVICE - Generate, save, and share GPX files
// ============================================================================

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import type { LatLng } from '../stores/runStore';

// ============================================================================
// GPX GENERATION
// ============================================================================

interface GPXMetadata {
  name: string;
  startTime: Date;
  distanceKm: number;
  durationSeconds: number;
  avgPaceSecPerKm: number;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function generateGPX(coords: LatLng[], metadata: GPXMetadata): string {
  const trackpoints = coords
    .map((c) => {
      const time = new Date(c.timestamp).toISOString();
      let trkpt = `      <trkpt lat="${c.latitude}" lon="${c.longitude}">`;
      if (c.altitude != null) {
        trkpt += `\n        <ele>${c.altitude.toFixed(1)}</ele>`;
      }
      trkpt += `\n        <time>${time}</time>`;
      if (c.speed != null) {
        trkpt += `\n        <extensions>\n          <speed>${c.speed.toFixed(2)}</speed>\n        </extensions>`;
      }
      trkpt += '\n      </trkpt>';
      return trkpt;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="SpixApp"
  xmlns="http://www.topografix.com/GPX/1/1"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">
  <metadata>
    <name>${escapeXml(metadata.name)}</name>
    <time>${metadata.startTime.toISOString()}</time>
  </metadata>
  <trk>
    <name>${escapeXml(metadata.name)}</name>
    <trkseg>
${trackpoints}
    </trkseg>
  </trk>
</gpx>`;
}

// ============================================================================
// FILE OPERATIONS
// ============================================================================

export async function saveGPXFile(gpxContent: string, filename: string): Promise<string> {
  const dir = `${FileSystem.documentDirectory}gpx/`;
  const dirInfo = await FileSystem.getInfoAsync(dir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  }

  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  const filePath = `${dir}${sanitizedFilename}.gpx`;
  await FileSystem.writeAsStringAsync(filePath, gpxContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return filePath;
}

export async function shareGPXFile(filePath: string): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) return;
  await Sharing.shareAsync(filePath, {
    mimeType: 'application/gpx+xml',
    dialogTitle: 'Export GPX',
  });
}
