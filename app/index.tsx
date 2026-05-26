import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import PersonaSelector from '../components/PersonaSelector';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';
import { DEFAULT_PERSONA_ID, PersonaId, PERSONAS } from '../constants/personas';

export default function HomeScreen() {
  const [selectedPersona, setSelectedPersona] = useState<PersonaId>(DEFAULT_PERSONA_ID);
  const router = useRouter();

  const persona = PERSONAS.find((p) => p.id === selectedPersona)!;

  function startChat() {
    router.push({ pathname: '/chat', params: { personaId: selectedPersona } });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>안녕하세요 🌸</Text>
          <Text style={styles.subtitle}>오늘 하루 어떠셨나요?</Text>
        </View>

        {/* Persona selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>대화 상대를 선택해 주세요</Text>
          <PersonaSelector
            selected={selectedPersona}
            onSelect={setSelectedPersona}
          />
        </View>

        {/* Selected persona info */}
        <View
          style={[styles.infoCard, { backgroundColor: persona.accentLight }]}
        >
          <Text style={styles.infoEmoji}>{persona.emoji}</Text>
          <View style={styles.infoText}>
            <Text style={styles.infoName}>{persona.name}</Text>
            <Text style={styles.infoDesc}>{persona.description}</Text>
          </View>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: persona.accentColor }]}
          onPress={startChat}
          activeOpacity={0.85}
        >
          <Text style={styles.startButtonText}>대화 시작하기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, paddingTop: Spacing.lg },
  header: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.xl },
  greeting: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: { fontSize: FontSize.lg, color: Colors.textSecondary },
  section: { marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  infoEmoji: { fontSize: 36, marginRight: Spacing.md },
  infoText: { flex: 1 },
  infoName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  infoDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  startButton: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 2,
    alignItems: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
});
