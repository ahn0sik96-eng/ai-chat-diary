import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PERSONAS, getPersona } from '@/config/personas';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { ChatSession, PersonaId } from '@/types';
import { useSettingsStore } from '@/state/settingsStore';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, radius, spacing, typography } from '@/theme/tokens';

export default function ChatHome() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const insets = useSafeAreaInsets();
  const setLastPersona = useSettingsStore((s) => s.setLastPersona);

  useFocusEffect(
    useCallback(() => {
      ChatRepository.listSessions().then(setSessions);
    }, []),
  );

  const startChat = async (personaId: PersonaId) => {
    setLastPersona(personaId);
    const session = await ChatRepository.createSession(personaId, '새 대화');
    router.push(`/session/${session.id}`);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.appbar}>
        <Text style={styles.appTitle}>채팅</Text>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.personaRow}
            >
              {PERSONAS.map((p) => (
                <Pressable key={p.id} style={styles.persona} onPress={() => startChat(p.id)}>
                  <PersonaAvatar name={p.displayName} color={p.accent} size={62} ring />
                  <Text style={styles.personaName} numberOfLines={1}>
                    {p.displayName}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={styles.sectionLabel}>최근 대화</Text>
          </View>
        }
        renderItem={({ item }) => <SessionRow session={item} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>아직 대화가 없어요.{'\n'}위에서 상대를 골라 시작해보세요.</Text>
          </View>
        }
      />
    </View>
  );
}

function SessionRow({ session }: { session: ChatSession }) {
  const persona = getPersona(session.personaId);
  return (
    <Pressable style={styles.sessionRow} onPress={() => router.push(`/session/${session.id}`)}>
      <PersonaAvatar name={persona.displayName} color={persona.accent} size={50} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={styles.sessionMeta} numberOfLines={1}>
          {persona.displayName}
          {session.diaryId ? ' · 일기 작성됨' : ''}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  appbar: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  appTitle: { ...typography.display, fontSize: 26 },
  listContent: { paddingBottom: spacing.xxl },
  personaRow: { gap: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  persona: { alignItems: 'center', width: 72, gap: spacing.sm },
  personaName: { ...typography.tiny, color: colors.text, fontWeight: '600' },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sessionTitle: { ...typography.bodyStrong },
  sessionMeta: { ...typography.caption, marginTop: 2 },
  empty: { paddingTop: spacing.xxl * 2, alignItems: 'center' },
  emptyText: { ...typography.caption, textAlign: 'center', lineHeight: 20 },
});
