import React, { useCallback, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { PERSONAS, getPersona } from '@/config/personas';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { ChatSession, PersonaId } from '@/types';
import { useSettingsStore } from '@/state/settingsStore';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, spacing, typography } from '@/theme/tokens';

export default function ChatHome() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const setLastPersona = useSettingsStore((s) => s.setLastPersona);

  useFocusEffect(
    useCallback(() => {
      ChatRepository.listSessions().then(setSessions);
    }, []),
  );

  const startChat = async (personaId: PersonaId) => {
    setLastPersona(personaId);
    const session = await ChatRepository.createSession(personaId, '새 대화');
    router.replace(`/session/${session.id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionLabel}>누구와 이야기할까요?</Text>
            <View style={styles.personaList}>
              {PERSONAS.map((p) => (
                <Pressable key={p.id} style={styles.personaCard} onPress={() => startChat(p.id)}>
                  <PersonaAvatar icon={p.icon} size={52} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personaName}>{p.displayName}</Text>
                    <Text style={styles.personaTag} numberOfLines={1}>
                      {p.tagline}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
                </Pressable>
              ))}
            </View>
            {sessions.length > 0 && <Text style={styles.sectionLabel}>최근 대화</Text>}
          </View>
        }
        renderItem={({ item }) => <SessionRow session={item} />}
      />
    </View>
  );
}

function SessionRow({ session }: { session: ChatSession }) {
  const persona = getPersona(session.personaId);
  return (
    <Pressable style={styles.sessionRow} onPress={() => router.push(`/session/${session.id}`)}>
      <PersonaAvatar icon={persona.icon} size={46} />
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
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textMuted,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  personaList: { gap: spacing.xs },
  personaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  personaName: { ...typography.bodyStrong },
  personaTag: { ...typography.caption, marginTop: 1 },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  sessionTitle: { ...typography.bodyStrong },
  sessionMeta: { ...typography.caption, marginTop: 2 },
});
