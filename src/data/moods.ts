import type { LucideIcon } from 'lucide-react-native';
import {
  Sun,
  Waves,
  CloudRain,
  Wind,
  Zap,
  Moon,
  Heart,
  Sparkle,
} from 'lucide-react-native';

import type { Mood } from '@/lib/types';

export interface MoodMeta {
  id: Mood;
  label: string;
  icon: LucideIcon; // 기본 이모티콘 대신 커스텀 라인 아이콘 사용
  color: string;
}

export const MOODS: Record<Mood, MoodMeta> = {
  joy: { id: 'joy', label: '기쁨', icon: Sun, color: '#FFC85B' },
  calm: { id: 'calm', label: '평온', icon: Waves, color: '#7BC5FF' },
  sad: { id: 'sad', label: '슬픔', icon: CloudRain, color: '#8AA0FF' },
  anxious: { id: 'anxious', label: '불안', icon: Wind, color: '#B57BFF' },
  angry: { id: 'angry', label: '화남', icon: Zap, color: '#FF6B8A' },
  tired: { id: 'tired', label: '지침', icon: Moon, color: '#9B8AC4' },
  love: { id: 'love', label: '설렘', icon: Heart, color: '#FF7BC5' },
  grateful: { id: 'grateful', label: '감사', icon: Sparkle, color: '#5BE8B5' },
};

export const MOOD_LIST = Object.values(MOODS);

export function getMood(id: Mood | null | undefined): MoodMeta | null {
  if (!id) return null;
  return MOODS[id] ?? null;
}
