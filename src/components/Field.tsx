import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { colors, fonts, fontSize, radius } from '@/theme';

/** 라벨 + 글래스 인풋. */
export function Field({
  label,
  style,
  ...props
}: TextInputProps & { label?: string }) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textFaint}
        style={[styles.input, style]}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: fontSize.sm, marginLeft: 4 },
  input: {
    height: 52,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    color: colors.text,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
  },
});
