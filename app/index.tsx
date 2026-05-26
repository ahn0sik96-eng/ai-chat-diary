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
        <View style={styles.header}>
          <Text style={styles.greeting}>오늘 어떤 하루였어?</Text>
          <Text style={styles.subtitle}>대화 상대를 골라봐</Text>
        </View>

        <PersonaSelector
          selected={selectedPersona}
          onSelect={setSelectedPersona}
        />

        <View style={[styles.infoCard, { backgroundColor: persona.accentLight }]}>
          <View style={styles.infoLeft}>
            <Text style={styles.infoEmoji}>{persona.emoji}</Text>
          </View>
          <View style={styles.infoText}>
            <Text style={styles.infoName}>{persona.name}</Text>
            <Text style={styles.infoDesc}>{persona.description}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.startButton, { backgroundColor: persona.accentColor }]}
          onPress={startChat}
          activeOpacity={0.82}
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
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    marginTop: Spacing.sm,
  },
  infoLeft: { marginRight: Spacing.md },
  infoEmoji: { fontSize: 32 },
  infoText: { flex: 1 },
  infoName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  infoDesc: { fontSize: FontSize.sm, color: Colors.textSecondary },
  startButton: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius.full,
    paddingVertical: Spacing.md + 4,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    letterSpacing: 0.2,
  },
});
