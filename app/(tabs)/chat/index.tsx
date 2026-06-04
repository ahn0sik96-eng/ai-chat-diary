import React, { useCallback, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { PERSONAS, getPersona } from '@/config/personas';
import { ChatRepository } from '@/data/repositories/ChatRepository';
import { ChatSession, PersonaId } from '@/types';
import { useSettingsStore } from '@/state/settingsStore';
import { PersonaAvatar } from '@/components/ui/PersonaAvatar';
import { colors, radius, shadow, spacing, typography } from '@/theme/tokens';

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
    router.push(`/session/${session.id}`);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <Text style={styles.sectionTitle}>누구와 이야기할까요?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.personaRow}
            >
              {PERSONAS.map((p) => (
                <Pressable
                  key={p.id}
                  style={styles.personaCard}
                  onPress={() => startChat(p.id)}
                >
                  <PersonaAvatar emoji={p.emoji} color={p.accent} size={64} />
                  <Text style={styles.personaName}>{p.displayName}</Text>
                  <Text style={styles.personaTag} numberOfLines={2}>
                    {p.tagline}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Text style={[styles.sectionTitle, { marginTop: spacing.xl }]}>최근 대화</Text>
          </View>
        }
        renderItem={({ item }) => <SessionRow session={item} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            아직 대화가 없어요.{'\n'}위에서 친구를 골라 이야기를 시작해보세요 :)
          </Text>
        }
      />
    </View>
  );
}

function SessionRow({ session }: { session: ChatSession }) {
  const persona = getPersona(session.personaId);
  return (
    <Pressable style={styles.sessionRow} onPress={() => router.push(`/session/${session.id}`)}>
      <PersonaAvatar emoji={persona.emoji} color={persona.accent} size={48} />
      <View style={{ flex: 1 }}>
        <Text style={styles.sessionTitle} numberOfLines={1}>
          {session.title}
        </Text>
        <Text style={styles.sessionMeta}>
          {persona.displayName}
          {session.diaryId ? ' · 일기 작성됨' : ''}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
  sectionTitle: { ...typography.heading, marginBottom: spacing.md },
  personaRow: { gap: spacing.md, paddingBottom: spacing.sm },
  personaCard: {
    width: 110,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    ...shadow.card,
  },
  personaName: { ...typography.bodyStrong, marginTop: spacing.xs },
  personaTag: { ...typography.tiny, textAlign: 'center' },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionTitle: { ...typography.bodyStrong },
  sessionMeta: { ...typography.caption, marginTop: 2 },
  chevron: { fontSize: 24, color: colors.textFaint },
  empty: {
    ...typography.caption,
    textAlign: 'center',
    marginTop: spacing.xl,
    lineHeight: 20,
  },
});
