import { Ionicons } from "@expo/vector-icons";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { ConversationTurn, getConversations } from "../../lib/api";
import { colors, font, radius, spacing } from "../../lib/theme";
import { timeAgo } from "../../lib/utils";

export default function ActivityScreen() {
  const [turns, setTurns] = useState<ConversationTurn[]>([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    try {
      const res = await getConversations();
      setTurns(res.conversations);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const renderMessage = ({ item, index }: { item: ConversationTurn; index: number }) => {
    const isUser = item.role === "user";
    const isFirst = index === 0 || turns[index - 1]?.role !== item.role;

    return (
      <View style={[styles.messageRow, isUser ? styles.userRow : styles.lumiRow]}>
        {/* Avatar — solo en el primer mensaje de un grupo */}
        {!isUser && isFirst ? (
          <View style={styles.lumiAvatar}>
            <View style={{ flexDirection: "row", gap: 4, marginTop: 1 }}>
              <View style={styles.eyeDot} />
              <View style={styles.eyeDot} />
            </View>
            <View style={styles.mouthDot} />
          </View>
        ) : !isUser ? (
          <View style={{ width: 32 }} />
        ) : null}

        <View style={{ flex: 1, alignItems: isUser ? "flex-end" : "flex-start" }}>
          <View style={[styles.bubble, isUser ? styles.userBubble : styles.lumiBubble]}>
            <Text style={[styles.bubbleText, isUser && { color: colors.warmWhite }]}>
              {item.content}
            </Text>
          </View>
          {isFirst && (
            <Text style={[styles.timestamp, isUser && { textAlign: "right" }]}>
              {timeAgo(item.timestamp)}
            </Text>
          )}
        </View>

        {isUser && isFirst ? (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={14} color={colors.walnut} />
          </View>
        ) : isUser ? (
          <View style={{ width: 32 }} />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header fijo */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.header}>
        <View style={styles.headerBot}>
          <View style={{ flexDirection: "row", gap: 5 }}>
            <View style={[styles.eyeDot, { width: 5, height: 5 }]} />
            <View style={[styles.eyeDot, { width: 5, height: 5 }]} />
          </View>
          <View style={[styles.mouthDot, { width: 9, height: 4.5 }]} />
        </View>
        <View>
          <Text style={font.title}>Lumi</Text>
          <Text style={font.caption}>Conversación completa</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Text style={[font.caption, { marginRight: 4 }]}>
          {turns.length} mensajes
        </Text>
      </Animated.View>

      {/* Chat */}
      {loading && turns.length === 0 ? (
        <ActivityIndicator size="large" color={colors.ember} style={{ marginTop: 80 }} />
      ) : turns.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyBot}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[styles.eyeDot, { width: 8, height: 8, borderRadius: 4 }]} />
              <View style={[styles.eyeDot, { width: 8, height: 8, borderRadius: 4 }]} />
            </View>
            <View style={[styles.mouthDot, { width: 14, height: 7, marginTop: 4 }]} />
          </View>
          <Text style={[font.title, { marginTop: spacing.md }]}>Aún no hay conversaciones</Text>
          <Text style={font.secondary}>Cuando Lumi platique, las verás aquí</Text>
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={turns}
          renderItem={renderMessage}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.chatContent}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ember} />
          }
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.warmWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.creamDeep,
  },
  headerBot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  chatContent: {
    padding: spacing.md,
    paddingBottom: 20,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 4,
    gap: 8,
    alignItems: "flex-end",
  },
  userRow: {
    justifyContent: "flex-end",
  },
  lumiRow: {
    justifyContent: "flex-start",
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  userBubble: {
    backgroundColor: colors.ember,
    borderRadius: radius.lg,
    borderBottomRightRadius: 4,
  },
  lumiBubble: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    borderBottomLeftRadius: 4,
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  bubbleText: {
    fontSize: 15,
    color: colors.walnut,
    lineHeight: 21,
  },
  timestamp: {
    fontSize: 11,
    color: colors.sandstone,
    marginTop: 4,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  lumiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  eyeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.espresso,
  },
  mouthDot: {
    width: 7,
    height: 3.5,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    backgroundColor: colors.ember,
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  emptyBot: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
