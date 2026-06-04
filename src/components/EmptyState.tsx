import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';

import { colors, fonts, fontSize, spacing } from '@/theme';

export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.wrap}>
      <View style={styles.iconWrap}>
        <Icon size={34} color={colors.primary} strokeWidth={1.8} />
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children ? <View style={styles.children}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.sm },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
    marginBottom: spacing.sm,
  },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.lg, textAlign: 'center' },
  subtitle: {
    color: colors.textMuted,
    fontFamily: fonts.regular,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  children: { marginTop: spacing.md, alignSelf: 'stretch' },
});
