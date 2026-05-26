import { Pedometer } from 'expo-sensors';

export interface HealthData {
  todaySteps: number;
  isHighActivity: boolean;  // 8000+ 걸음
  isLowActivity: boolean;   // 2000 미만
}

export async function getTodaySteps(): Promise<HealthData | null> {
  try {
    const isAvailable = await Pedometer.isAvailableAsync();
    if (!isAvailable) return null;

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const result = await Pedometer.getStepCountAsync(startOfDay, now);

    return {
      todaySteps: result.steps,
      isHighActivity: result.steps >= 8000,
      isLowActivity: result.steps < 2000,
    };
  } catch {
    return null;
  }
}

// Soft Contextualization: 걸음수를 감성 언어로 변환 (spec §2-A)
export function stepsToContext(data: HealthData): string | null {
  if (data.isHighActivity) return '오늘 많이 돌아다녔네!';
  if (data.isLowActivity && data.todaySteps === 0) return '오늘 많이 쉬었구나';
  return null;
}
