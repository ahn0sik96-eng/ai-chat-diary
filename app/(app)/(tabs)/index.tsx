import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import { getFeed, toggleReaction } from '@/lib/queries';
import type { FeedEntry } from '@/lib/types';
import {
  GradientBackground,
  FeedCard,
  EmptyState,
  PrimaryButton,
} from '@/components';
import { BrandMark } from '@/components/BrandMark';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function FeedScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      setEntries(await getFeed());
    } catch (e) {
      console.warn('feed load failed', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onReact(item: FeedEntry) {
    if (!session) return;
    // 낙관적 업데이트
    setEntries((prev) =>
      prev.map((e) =>
        e.id === item.id
          ? {
              ...e,
              reacted: !e.reacted,
              reaction_count: e.reaction_count + (e.reacted ? -1 : 1),
            }
          : e
      )
    );
    try {
      await toggleReaction(item.id, session.user.id);
    } catch {
      load();
    }
  }

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <View style={styles.header}>
          <BrandMark size="sm" />
          <Text style={styles.headerTitle}>피드</Text>
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={entries}
            keyExtractor={(e) => e.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  load();
                }}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => (
              <FeedCard
                entry={item}
                onPress={() => router.push(`/(app)/entry/${item.id}`)}
                onToggleReaction={() => onReact(item)}
                onComment={() => router.push(`/(app)/entry/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={Sparkles}
                title="아직 피드가 조용해요"
                subtitle="친구를 팔로우하거나, 첫 일기를 써서 공유해 보세요."
              >
                <PrimaryButton
                  label="오늘 일기 쓰기"
                  onPress={() => router.push('/(app)/chat')}
                />
              </EmptyState>
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  headerTitle: { color: colors.text, fontFamily: fonts.heavy, fontSize: fontSize.xl },
  list: { padding: spacing.lg, paddingBottom: 110, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
