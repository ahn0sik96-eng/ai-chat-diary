/**
 * 다크 + 글래스모피즘 팔레트.
 * 10·20대 여성 타깃의 세련된 무드: 딥 네이비 배경 + 보라-핑크 네온 그라데이션.
 */
export const colors = {
  // 배경
  bg: '#0B0B14',
  bgElevated: '#13131F',

  // 글래스 표면 (반투명 화이트)
  glass: 'rgba(255, 255, 255, 0.06)',
  glassStrong: 'rgba(255, 255, 255, 0.10)',
  glassBorder: 'rgba(255, 255, 255, 0.12)',

  // 텍스트
  text: '#F4F3FB',
  textMuted: 'rgba(244, 243, 251, 0.62)',
  textFaint: 'rgba(244, 243, 251, 0.38)',

  // 포인트 컬러
  primary: '#B57BFF', // 보라
  primarySoft: 'rgba(181, 123, 255, 0.16)',
  pink: '#FF7BC5',
  blue: '#7BC5FF',

  // 상태
  danger: '#FF6B8A',
  success: '#5BE8B5',

  white: '#FFFFFF',
  black: '#000000',
} as const;

/** 그라데이션 프리셋 ([from, to] 형태로 LinearGradient 에 사용). */
export const gradients = {
  brand: ['#B57BFF', '#FF7BC5'] as const, // 보라 → 핑크 (스토리 링/버튼/로고)
  night: ['#1A1530', '#0B0B14'] as const, // 화면 배경
  ocean: ['#7BC5FF', '#B57BFF'] as const,
  sunset: ['#FF9D7B', '#FF7BC5'] as const,
};

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;
