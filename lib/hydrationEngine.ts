import { HYDRATION_DATA } from '@/constants/hydrationData';
import type { HydrationColor, HydrationResult } from '@/types';

export function analyzeHydration(color: HydrationColor): HydrationResult {
  const data = HYDRATION_DATA[color];
  return { color, ...data };
}
