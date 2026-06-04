import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { PERSONAS } from '@/data/personas';
import type { PersonaId } from '@/lib/types';
import {
  GradientBackground,
  GlassCard,
  ScreenHeader,
  PersonaAvatar,
} from '@/components';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function PersonasScreen() {
  const { session, profile, refreshProfile } = useAuth();
  const [selected, setSelected] = useState<PersonaId>(
    profile?.default_persona ?? 'bestie'
  );

  async function onSelect(id: PersonaId) {
    setSelected(id);
    if (!session) return;
    try {
      await supabase
        .from('profiles')
        .update({ default_persona: id })
        .eq('id', session.user.id);
      await refreshProfile();
    } catch (e) {
      console.warn('persona update failed', e);
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title="AI 페르소나" back />
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <Text style={styles.intro}>
            오늘의 기분에 맞는 친구를 골라보세요. 기본 페르소나로 저장돼요.
          </Text>
          {PERSONAS.map((p) => {
            const active = p.id === selected;
            return (
              <Pressable key={p.id} onPress={() => onSelect(p.id)}>
                <GlassCard style={[styles.card, active && styles.cardActive]}>
                  <PersonaAvatar persona={p.id} size={52} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.tagline}>{p.tagline}</Text>
                  </View>
                  {active ? (
                    <View style={styles.checkWrap}>
                      <Check size={16} color={colors.white} strokeWidth={3} />
                    </View>
                  ) : null}
                </GlassCard>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  list: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  intro: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md, lineHeight: 22, marginBottom: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardActive: { borderColor: colors.primary, borderWidth: 1 },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.md },
  tagline: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm, marginTop: 2 },
  checkWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
