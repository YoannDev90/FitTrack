import type { LatLng } from '../stores/runStore';

function perpendicularDistance(point: LatLng, start: LatLng, end: LatLng): number {
  const x = point.longitude;
  const y = point.latitude;
  const x1 = start.longitude;
  const y1 = start.latitude;
  const x2 = end.longitude;
  const y2 = end.latitude;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return Math.hypot(x - x1, y - y1);
  }

  const numerator = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1);
  const denominator = Math.hypot(dx, dy);
  return numerator / denominator;
}

function simplifySegment(points: LatLng[], epsilon: number): LatLng[] {
  if (points.length < 3) return points;

  let maxDistance = 0;
  let index = 0;
  const lastIndex = points.length - 1;

  for (let i = 1; i < lastIndex; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[lastIndex]);
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }

  if (maxDistance <= epsilon) {
    return [points[0], points[lastIndex]];
  }

  const left = simplifySegment(points.slice(0, index + 1), epsilon);
  const right = simplifySegment(points.slice(index), epsilon);

  return [...left.slice(0, -1), ...right];
}

export function simplifyRouteRdp(points: LatLng[], epsilon = 0.00001): LatLng[] {
  if (points.length < 3) return points;
  return simplifySegment(points, epsilon);
}
