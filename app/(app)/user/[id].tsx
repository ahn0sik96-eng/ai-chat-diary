import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NotebookPen } from 'lucide-react-native';

import { useAuth } from '@/hooks/useAuth';
import {
  getProfile,
  getUserEntries,
  getFollowCounts,
  isFollowing,
  toggleFollow,
} from '@/lib/queries';
import type { FeedEntry, Profile } from '@/lib/types';
import {
  GradientBackground,
  ScreenHeader,
  Avatar,
  EntryGridCell,
  PrimaryButton,
  EmptyState,
} from '@/components';
import { colors, fonts, fontSize, spacing } from '@/theme';

export default function UserProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [entries, setEntries] = useState<FeedEntry[]>([]);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMe = session?.user.id === id;

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [p, e, c] = await Promise.all([
        getProfile(id),
        getUserEntries(id),
        getFollowCounts(id),
      ]);
      setProfile(p);
      setEntries(e);
      setCounts(c);
      if (session && !isMe) setFollowing(await isFollowing(session.user.id, id));
    } catch (err) {
      console.warn('user load failed', err);
    } finally {
      setLoading(false);
    }
  }, [id, session, isMe]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onToggleFollow() {
    if (!session || !id) return;
    const next = !following;
    setFollowing(next);
    setCounts((c) => ({ ...c, followers: c.followers + (next ? 1 : -1) }));
    try {
      await toggleFollow(session.user.id, id);
    } catch {
      load();
    }
  }

  const name = profile?.display_name || profile?.username || '사용자';

  const header = (
    <View style={styles.headerBlock}>
      <View style={styles.identity}>
        <Avatar uri={profile?.avatar_url} name={name} size={76} ring />
        <View style={styles.stats}>
          <Stat label="일기" value={entries.length} />
          <Stat label="팔로워" value={counts.followers} />
          <Stat label="팔로잉" value={counts.following} />
        </View>
      </View>
      <Text style={styles.name}>{name}</Text>
      <Text style={styles.handle}>@{profile?.username ?? '...'}</Text>
      {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      {!isMe ? (
        <PrimaryButton
          label={following ? '팔로잉' : '팔로우'}
          variant={following ? 'secondary' : 'primary'}
          style={{ marginTop: spacing.md }}
          onPress={onToggleFollow}
        />
      ) : null}
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScreenHeader title={profile?.username ? `@${profile.username}` : '프로필'} back />
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
            ListHeaderComponent={header}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <EntryGridCell
                item={item}
                onPress={() => router.push(`/(app)/entry/${item.id}`)}
              />
            )}
            ListEmptyComponent={
              <EmptyState
                icon={NotebookPen}
                title="공개된 일기가 없어요"
                subtitle="이 사용자가 공유한 일기가 아직 없네요."
              />
            }
          />
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBlock: { marginBottom: spacing.lg },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
  stats: { flexDirection: 'row', flex: 1, justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { color: colors.text, fontFamily: fonts.heavy, fontSize: fontSize.lg },
  statLabel: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.xs },
  name: { color: colors.text, fontFamily: fonts.bold, fontSize: fontSize.lg, marginTop: spacing.md },
  handle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.sm },
  bio: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: fontSize.md, marginTop: 6, lineHeight: 21 },
  list: { padding: spacing.lg, paddingBottom: 110, flexGrow: 1 },
  col: { gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
