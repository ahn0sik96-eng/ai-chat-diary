import { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Backdrop } from "@/components/screen";
import { ChatBubble, TypingIndicator } from "@/components/chat-bubble";
import { useDiary } from "@/lib/store";
import { MOOD_LIST } from "@/lib/moods";
import { distill, inferMood, opener, replyDelay, replyTo } from "@/lib/ai";
import { now, todayISO, uid } from "@/lib/utils";
import type { ChatMessage, MoodKey } from "@/lib/types";
import { ACCENT_GRADIENT, colors, fonts, radius, TAB_BAR_SPACE } from "@/theme";

const PROMPTS = [
  "오늘 가장 기억에 남는 순간은?",
  "지금 마음은 어떤 색깔인가요?",
  "스스로에게 해주고 싶은 말이 있다면?",
];

export default function WriteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saveEntry } = useDiary();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: uid("m"), role: "assistant", content: opener(), createdAt: now() },
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [moodTouched, setMoodTouched] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const userTurns = messages.filter((m) => m.role === "user").length;
  const canSave = userTurns >= 1;

  function send(text: string) {
    const content = text.trim();
    if (!content || typing) return;
    const userMsg: ChatMessage = {
      id: uid("m"),
      role: "user",
      content,
      createdAt: now(),
    };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setDraft("");
    if (!moodTouched) setMood(inferMood(nextMsgs));

    setTyping(true);
    const turn = userTurns;
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: uid("m"), role: "assistant", content: replyTo(content, turn), createdAt: now() },
      ]);
      setTyping(false);
    }, replyDelay());
  }

  function handleSave() {
    if (!canSave) return;
    const finalMood = mood ?? inferMood(messages);
    const { title, summary, tags } = distill(messages);
    const ts = now();
    const id = uid("entry");
    saveEntry({
      id,
      date: todayISO(),
      title,
      summary,
      mood: finalMood,
      tags,
      messages,
      createdAt: ts,
      updatedAt: ts,
    });
    router.replace(`/entry/${id}`);
  }

  return (
    <Backdrop>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <View style={{ flex: 1 }}>
            <View style={styles.titleRow}>
              <Ionicons name="sparkles" size={16} color={colors.accent} />
              <Text style={styles.title}>Lumi와 대화하기</Text>
            </View>
            <Text style={styles.subtitle}>편하게 이야기하면 일기로 정리해드릴게요</Text>
          </View>
          <Pressable onPress={handleSave} disabled={!canSave}>
            {canSave ? (
              <LinearGradient
                colors={ACCENT_GRADIENT}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.saveBtn}
              >
                <Ionicons name="checkmark" size={16} color={colors.white} />
                <Text style={styles.saveText}>저장</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.saveBtn, styles.saveDisabled]}>
                <Ionicons name="checkmark" size={16} color={colors.textGhost} />
                <Text style={[styles.saveText, { color: colors.textGhost }]}>저장</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          style={styles.convo}
          contentContainerStyle={{ padding: 16, gap: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {typing && <TypingIndicator />}
        </ScrollView>

        {/* Footer: mood + prompts + composer */}
        <View
          style={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + TAB_BAR_SPACE,
          }}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodRow}
          >
            <Text style={styles.moodHint}>오늘의 기분</Text>
            {MOOD_LIST.map((mItem) =>
              mood === mItem.key ? (
                <LinearGradient
                  key={mItem.key}
                  colors={ACCENT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.moodChipActive}
                >
                  <Pressable
                    onPress={() => {
                      setMood(mItem.key);
                      setMoodTouched(true);
                    }}
                    style={styles.moodChipInner}
                  >
                    <Text style={{ fontSize: 12 }}>{mItem.emoji}</Text>
                    <Text style={styles.moodChipActiveText}>{mItem.label}</Text>
                  </Pressable>
                </LinearGradient>
              ) : (
                <Pressable
                  key={mItem.key}
                  onPress={() => {
                    setMood(mItem.key);
                    setMoodTouched(true);
                  }}
                  style={styles.moodChip}
                >
                  <Text style={{ fontSize: 12 }}>{mItem.emoji}</Text>
                  <Text style={styles.moodChipText}>{mItem.label}</Text>
                </Pressable>
              ),
            )}
          </ScrollView>

          {userTurns === 0 && (
            <View style={styles.promptRow}>
              {PROMPTS.map((p) => (
                <Pressable key={p} onPress={() => send(p)} style={styles.prompt}>
                  <Text style={styles.promptText}>{p}</Text>
                </Pressable>
              ))}
            </View>
          )}

          <View style={styles.composer}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="오늘 있었던 일을 적어보세요…"
              placeholderTextColor={colors.textGhost}
              style={styles.input}
              multiline
              onSubmitEditing={() => send(draft)}
            />
            <Pressable onPress={() => send(draft)} disabled={!draft.trim() || typing}>
              {draft.trim() && !typing ? (
                <LinearGradient
                  colors={ACCENT_GRADIENT}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sendBtn}
                >
                  <Ionicons name="send" size={18} color={colors.white} />
                </LinearGradient>
              ) : (
                <View style={[styles.sendBtn, { backgroundColor: colors.glass }]}>
                  <Ionicons name="send" size={18} color={colors.textGhost} />
                </View>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Backdrop>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { color: colors.text, fontSize: 20, fontWeight: "700", fontFamily: fonts.serif },
  subtitle: { color: colors.textFaint, fontSize: 12, marginTop: 2 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.lg,
  },
  saveDisabled: { backgroundColor: colors.glass },
  saveText: { color: colors.white, fontSize: 14, fontWeight: "700" },

  convo: {
    flex: 1,
    marginHorizontal: 16,
    borderRadius: radius["2xl"],
    backgroundColor: colors.glass,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderSoft,
  },

  moodRow: { alignItems: "center", gap: 8, paddingVertical: 10 },
  moodHint: { color: colors.textFaint, fontSize: 12, marginRight: 2 },
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  moodChipText: { color: colors.textMuted, fontSize: 12 },
  moodChipActive: { borderRadius: radius.pill },
  moodChipInner: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7 },
  moodChipActiveText: { color: colors.white, fontSize: 12, fontWeight: "600" },

  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  prompt: {
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.glass,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  promptText: { color: colors.textMuted, fontSize: 12 },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    backgroundColor: colors.glassStrong,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    borderRadius: radius["2xl"],
    padding: 8,
    paddingLeft: 16,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    maxHeight: 120,
    paddingVertical: 9,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
