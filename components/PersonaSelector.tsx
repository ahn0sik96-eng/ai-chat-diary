import React from 'react';
import {
  ScrollView,
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { PERSONAS, Persona, PersonaId } from '../constants/personas';
import { Colors, Radius, Spacing, FontSize } from '../constants/theme';

interface PersonaSelectorProps {
  selected: PersonaId;
  onSelect: (id: PersonaId) => void;
}

export default function PersonaSelector({
  selected,
  onSelect,
}: PersonaSelectorProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {PERSONAS.map((persona) => (
        <PersonaCard
          key={persona.id}
          persona={persona}
          isSelected={persona.id === selected}
          onPress={() => onSelect(persona.id)}
        />
      ))}
    </ScrollView>
  );
}

function PersonaCard({
  persona,
  isSelected,
  onPress,
}: {
  persona: Persona;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.card,
        { backgroundColor: isSelected ? persona.accentColor : Colors.surface },
        isSelected && styles.cardSelected,
      ]}
    >
      <Text style={styles.emoji}>{persona.emoji}</Text>
      <Text style={[styles.name, isSelected && styles.nameSelected]}>
        {persona.name}
      </Text>
      <Text style={styles.description}>{persona.description}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  card: {
    width: 120,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardSelected: {
    borderColor: 'transparent',
    shadowOpacity: 0.12,
  },
  emoji: {
    fontSize: 28,
    marginBottom: Spacing.xs,
  },
  name: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  nameSelected: {
    color: Colors.text,
  },
  description: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },
});
