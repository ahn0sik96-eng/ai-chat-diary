import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { useRouter } from 'expo-router';

import { colors, fonts, fontSize, spacing } from '@/theme';

/** 화면 상단 헤더. 뒤로가기 + 제목 + 우측 액션 슬롯. */
export function ScreenHeader({
  title,
  back = false,
  right,
}: {
  title?: string;
  back?: boolean;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {back ? (
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={styles.backBtn}
          >
            <ChevronLeft size={26} color={colors.text} />
          </Pressable>
        ) : null}
      </View>
      {title ? (
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      ) : (
        <View />
      )}
      <View style={[styles.side, styles.right]}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  side: { minWidth: 40, justifyContent: 'center' },
  right: { alignItems: 'flex-end' },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.glass,
  },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.lg, flex: 1, textAlign: 'center' },
});
