import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Compass } from 'lucide-react-native';

import { getExplore } from '@/lib/queries';
import type { FeedEntry } from '@/lib/types';
import { GradientBackground, EmptyState, MoodBadge } from '@/components';
import { getPersona } from '@/data/personas';
import { colors, fonts, fontSize, radius, spacing } from '@/theme';

export default function ExploreScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setEntries(await getExplore());
    } catch (e) {
      console.warn('explore load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <Text style={styles.title}>탐색</Text>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            numColumns={2}
            columnWrapperStyle={styles.col}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const persona = getPersona(item.persona);
              return (
                <Pressable
                  style={styles.cell}
                  onPress={() => router.push(`/(app)/entry/${item.id}`)}
                >
                  <LinearGradient
                    colors={persona.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.cellGradient}
                  >
                    <View style={styles.cellOverlay}>
                      <MoodBadge mood={item.mood} size="sm" />
                      <Text style={styles.cellTitle} numberOfLines={2}>
                        {item.title ?? '오늘의 일기'}
                      </Text>
                      <Text style={styles.cellAuthor} numberOfLines={1}>
                        @{item.author.username}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <EmptyState
                icon={Compass}
                title="둘러볼 일기가 아직 없어요"
                subtitle="누군가 공개 일기를 남기면 여기에 나타나요."
              />
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontFamily: fonts.heavy,
    fontSize: fontSize.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  list: { padding: spacing.lg, paddingBottom: 110, flexGrow: 1 },
  col: { gap: spacing.md },
  cell: { flex: 1, aspectRatio: 0.82, marginBottom: spacing.md },
  cellGradient: { flex: 1, borderRadius: radius.lg, overflow: 'hidden' },
  cellOverlay: {
    flex: 1,
    padding: spacing.md,
    justifyContent: 'flex-end',
    gap: 6,
    backgroundColor: 'rgba(11,11,20,0.32)',
  },
  cellTitle: { color: colors.white, fontFamily: fonts.hand, fontSize: fontSize.lg },
  cellAuthor: { color: 'rgba(255,255,255,0.85)', fontFamily: fonts.medium, fontSize: fontSize.xs },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
