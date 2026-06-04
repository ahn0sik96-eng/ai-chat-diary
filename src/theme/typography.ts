/**
 * 폰트 토큰. Nunito(본문/UI) + Gaegu(감성 손글씨 느낌, 일기 제목 등).
 * 폰트는 app/_layout.tsx 에서 로드한다.
 */
export const fonts = {
  regular: 'Nunito_400Regular',
  medium: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  heavy: 'Nunito_800ExtraBold',
  hand: 'Gaegu_700Bold', // 감성 손글씨
} as const;

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 22,
  xxl: 28,
  display: 34,
} as const;
