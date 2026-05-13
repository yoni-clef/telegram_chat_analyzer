/**
 * Comprehensive Analytics Engine for Telegram Chat Data
 */

import type { ChatData, Message, User } from "./telegramParser";

export interface UserStats {
  name: string;
  messageCount: number;
  percentage: number;
  averageMessageLength: number;
  totalCharacters: number;
  firstMessage: Date;
  lastMessage: Date;
  daysActive: number;
  reactionsGiven: number;
  mostUsedEmoji: { emoji: string; count: number } | null;
}

export interface TimelineStats {
  date: string;
  messageCount: number;
  uniqueUsers: number;
  averageMessageLength: number;
}

export interface HourlyStats {
  hour: number;
  messageCount: number;
  averageMessageLength: number;
}

export interface WordFrequency {
  word: string;
  count: number;
  frequency: number;
}

export interface EmojiStats {
  emoji: string;
  count: number;
  frequency: number;
  topReactors: { name: string; count: number }[];
}

export interface UserPairInteraction {
  user1: string;
  user2: string;
  interactionCount: number; // messages sent between consecutive messages
  sharedReactions: number;
}

export interface AnalyticsResult {
  summary: {
    totalMessages: number;
    uniqueUsers: number;
    dateRange: { start: Date; end: Date };
    averageMessageLength: number;
    messagesWithMedia: number;
    mediaPercentage: number;
  };
  userStats: UserStats[];
  topUsers: UserStats[];
  timeline: TimelineStats[];
  hourlyActivity: HourlyStats[];
  wordFrequency: WordFrequency[];
  topWords: WordFrequency[];
  emojiStats: EmojiStats[];
  topEmojis: EmojiStats[];
  userPairs: UserPairInteraction[];
  engagement: {
    totalReactions: number;
    averageReactionsPerMessage: number;
    mostReactedMessages: Array<{
      text: string;
      reactionCount: number;
      sender: string;
    }>;
  };
  contentAnalysis: {
    messagesDayOfWeek: Record<string, number>;
    activityPattern: "night_owl" | "early_bird" | "balanced";
    busyHours: number[];
    quietHours: number[];
  };
}

const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "can",
  "that",
  "this",
  "it",
  "from",
  "by",
  "as",
  "i",
  "you",
  "he",
  "she",
  "we",
  "they",
  "what",
  "which",
  "who",
  "when",
  "where",
  "why",
  "how",
  "",
]);

/**
 * Main analytics function
 */
export function analyzeChat(chatData: ChatData): AnalyticsResult {
  const messages = chatData.messages;
  const users = chatData.users;

  // Calculate summary stats
  const messagesWithMedia = messages.filter((m) => m.hasMedia).length;
  const totalCharacters = messages.reduce((sum, m) => sum + m.messageLength, 0);
  const averageMessageLength = messages.length > 0 ? totalCharacters / messages.length : 0;

  // User statistics
  const userStats = Array.from(users.values())
    .map((user) => getUserStats(user, messages.length))
    .sort((a, b) => b.messageCount - a.messageCount);

  const topUsers = userStats.slice(0, 10);

  // Timeline analysis
  const timeline = generateTimeline(messages);

  // Hourly activity
  const hourlyActivity = generateHourlyStats(messages);

  // Word frequency
  const wordFreq = generateWordFrequency(messages);
  const topWords = wordFreq.slice(0, 20);

  // Emoji statistics
  const emojiStats = generateEmojiStats(chatData, messages);
  const topEmojis = emojiStats.slice(0, 10);

  // User pair interactions
  const userPairs = generateUserPairInteractions(messages);

  // Engagement metrics
  const engagement = calculateEngagement(messages);

  // Content analysis
  const contentAnalysis = analyzeContent(messages, hourlyActivity);

  return {
    summary: {
      totalMessages: messages.length,
      uniqueUsers: users.size,
      dateRange: chatData.dateRange,
      averageMessageLength,
      messagesWithMedia,
      mediaPercentage: messages.length > 0 ? (messagesWithMedia / messages.length) * 100 : 0,
    },
    userStats,
    topUsers,
    timeline,
    hourlyActivity,
    wordFrequency: wordFreq,
    topWords,
    emojiStats,
    topEmojis,
    userPairs,
    engagement,
    contentAnalysis,
  };
}

function getUserStats(user: User, totalMessages: number): UserStats {
  let mostUsedEmoji: { emoji: string; count: number } | null = null;
  let maxCount = 0;

  user.reactions.forEach((count, emoji) => {
    if (count > maxCount) {
      maxCount = count;
      mostUsedEmoji = { emoji, count };
    }
  });

  const firstLast = user.lastMessage.getTime() - user.firstMessage.getTime();
  const daysActive = Math.ceil(firstLast / (1000 * 60 * 60 * 24));

  return {
    name: user.name,
    messageCount: user.messageCount,
    percentage: (user.messageCount / totalMessages) * 100,
    averageMessageLength: user.averageMessageLength,
    totalCharacters: user.totalCharacters,
    firstMessage: user.firstMessage,
    lastMessage: user.lastMessage,
    daysActive: Math.max(1, daysActive),
    reactionsGiven: Array.from(user.reactions.values()).reduce((a, b) => a + b, 0),
    mostUsedEmoji,
  };
}

function generateTimeline(messages: Message[]): TimelineStats[] {
  const timeline = new Map<string, { count: number; lengths: number[]; users: Set<string> }>();

  messages.forEach((msg) => {
    const dateKey = msg.timestamp.toISOString().split("T")[0];
    const entry = timeline.get(dateKey) || { count: 0, lengths: [], users: new Set() };
    entry.count++;
    entry.lengths.push(msg.messageLength);
    entry.users.add(msg.senderId);
    timeline.set(dateKey, entry);
  });

  return Array.from(timeline.entries())
    .map(([date, data]) => ({
      date,
      messageCount: data.count,
      uniqueUsers: data.users.size,
      averageMessageLength: data.lengths.reduce((a, b) => a + b, 0) / data.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function generateHourlyStats(messages: Message[]): HourlyStats[] {
  const hourly: Record<number, { count: number; lengths: number[] }> = {};

  for (let i = 0; i < 24; i++) {
    hourly[i] = { count: 0, lengths: [] };
  }

  messages.forEach((msg) => {
    const hour = msg.timestamp.getHours();
    hourly[hour].count++;
    hourly[hour].lengths.push(msg.messageLength);
  });

  return Object.entries(hourly).map(([hour, data]) => ({
    hour: parseInt(hour),
    messageCount: data.count,
    averageMessageLength: data.count > 0 ? data.lengths.reduce((a, b) => a + b, 0) / data.count : 0,
  }));
}

function generateWordFrequency(messages: Message[]): WordFrequency[] {
  const wordCount = new Map<string, number>();
  const totalWords: string[] = [];

  messages.forEach((msg) => {
    const words = msg.text
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word));

    words.forEach((word) => {
      const cleaned = word.replace(/[^\w\s-]/g, "");
      if (cleaned) {
        wordCount.set(cleaned, (wordCount.get(cleaned) || 0) + 1);
        totalWords.push(cleaned);
      }
    });
  });

  return Array.from(wordCount.entries())
    .filter(([_, count]) => count > 1)
    .map(([word, count]) => ({
      word,
      count,
      frequency: count / totalWords.length,
    }))
    .sort((a, b) => b.count - a.count);
}

function generateEmojiStats(chatData: ChatData, messages: Message[]): EmojiStats[] {
  const emojiCount = new Map<string, number>();
  const emojiReactors = new Map<string, Map<string, number>>();

  messages.forEach((msg) => {
    msg.reactions.forEach((reactors, emoji) => {
      emojiCount.set(emoji, (emojiCount.get(emoji) || 0) + reactors.length);

      if (!emojiReactors.has(emoji)) {
        emojiReactors.set(emoji, new Map());
      }

      const reactorMap = emojiReactors.get(emoji)!;
      reactors.forEach((reactor) => {
        reactorMap.set(reactor, (reactorMap.get(reactor) || 0) + 1);
      });
    });
  });

  const totalReactions = Array.from(emojiCount.values()).reduce((a, b) => a + b, 0);

  return Array.from(emojiCount.entries())
    .map(([emoji, count]) => {
      const topReactors = Array.from(emojiReactors.get(emoji)!.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return {
        emoji,
        count,
        frequency: totalReactions > 0 ? count / totalReactions : 0,
        topReactors,
      };
    })
    .sort((a, b) => b.count - a.count);
}

function generateUserPairInteractions(messages: Message[]): UserPairInteraction[] {
  const interactions = new Map<string, UserPairInteraction>();

  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];

    if (current.senderId !== next.senderId) {
      const key = [current.senderId, next.senderId].sort().join("_");
      const existing = interactions.get(key);

      if (!existing) {
        interactions.set(key, {
          user1: current.senderName,
          user2: next.senderName,
          interactionCount: 1,
          sharedReactions: 0,
        });
      } else {
        existing.interactionCount++;
      }
    }
  }

  return Array.from(interactions.values())
    .sort((a, b) => b.interactionCount - a.interactionCount)
    .slice(0, 10);
}

function calculateEngagement(messages: Message[]) {
  let totalReactions = 0;
  const mostReacted: Array<{ text: string; reactionCount: number; sender: string }> = [];

  messages.forEach((msg) => {
    const reactionCount = Array.from(msg.reactions.values()).reduce((sum, arr) => sum + arr.length, 0);
    totalReactions += reactionCount;

    if (reactionCount > 0) {
      mostReacted.push({
        text: msg.text.substring(0, 100),
        reactionCount,
        sender: msg.senderName,
      });
    }
  });

  mostReacted.sort((a, b) => b.reactionCount - a.reactionCount);

  return {
    totalReactions,
    averageReactionsPerMessage: messages.length > 0 ? totalReactions / messages.length : 0,
    mostReactedMessages: mostReacted.slice(0, 10),
  };
}

function analyzeContent(messages: Message[], hourlyActivity: HourlyStats[]) {
  const dayOfWeek: Record<string, number> = {
    Sunday: 0,
    Monday: 0,
    Tuesday: 0,
    Wednesday: 0,
    Thursday: 0,
    Friday: 0,
    Saturday: 0,
  };

  messages.forEach((msg) => {
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][
      msg.timestamp.getDay()
    ];
    dayOfWeek[day]++;
  });

  // Determine activity pattern
  const sorted = [...hourlyActivity].sort((a, b) => b.messageCount - a.messageCount);
  const topHours = sorted.slice(0, 5).map((s) => s.hour);
  const nightOwlHours = topHours.filter((h) => h >= 22 || h <= 6).length >= 3;
  const earlyBirdHours = topHours.filter((h) => h >= 6 && h <= 10).length >= 3;

  const activityPattern: "night_owl" | "early_bird" | "balanced" = nightOwlHours
    ? "night_owl"
    : earlyBirdHours
      ? "early_bird"
      : "balanced";

  const busyHours = sorted.slice(0, 5).map((s) => s.hour);
  const quietHours = [...hourlyActivity].sort((a, b) => a.messageCount - b.messageCount).slice(0, 3).map((s) => s.hour);

  return {
    messagesDayOfWeek: dayOfWeek,
    activityPattern,
    busyHours,
    quietHours,
  };
}
