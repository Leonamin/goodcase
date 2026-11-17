export const cropZoomStops = [0.5, 1, 2];
export const cropRotationStops = [-180, -90, 0, 90, 180];

/** Wider release threshold prevents chatter. The caller must retain raw input. */
export function cropSnapTarget(
  value: number,
  stops: readonly number[],
  current: number | null,
  isRelative: boolean,
): number | null {
  const distance = (stop: number) =>
    isRelative ? Math.abs(value / stop - 1) : Math.abs(value - stop);
  if (current !== null && distance(current) <= (isRelative ? 0.05 : 5) + 1e-9)
    return current;
  const nearest = stops.reduce((best, stop) =>
    distance(stop) < distance(best) ? stop : best,
  );
  return distance(nearest) <= (isRelative ? 0.03 : 3) + 1e-9 ? nearest : null;
}
