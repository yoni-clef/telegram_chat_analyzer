/**
 * Advanced Analytics Module
 * Extends base analytics with detailed metrics and AI features
 */

import type { Message, User } from "./telegramParser";
import type { UserStats } from "./analytics";

// Core Statistics
export interface CoreStats {
  totalMessages: number;
  messagesPerParticipant: Record<string, number>;
  averageMessagesPerDay: number;
  activeDaysCount: number;
  firstMessageDate: Date;
  lastMessageDate: Date;
  conversationDurationDays: number;
}

// Response Analytics
export interface ResponseAnalytics {
  averageReplyTime: number;
  fastestReply: number;
  slowestReply: number;
  ignoredMessagesCount: number;
}

// Conversation Metrics
export interface ConversationMetrics {
  longestConversationStreak: number;
  longestInactivePeriod: number;
  mostActiveDay: string;
  mostActiveMonth: string;
  mostActiveHour: number;
}

// Text Analytics
export interface PhraseData {
  phrase: string;
  count: number;
  frequency: number;
  examples: string[];
}

export interface SentimentAnalysis {
  overall: "positive" | "negative" | "neutral";
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  trend: Array<{
    date: string;
    sentiment: "positive" | "negative" | "neutral";
    score: number;
  }>;
  userSentiment: Record<string, { positive: number; negative: number; neutral: number }>;
}

// Media Analytics
export interface MediaAnalytics {
  photos: number;
  videos: number;
  voiceNotes: number;
  gifs: number;
  stickers: number;
  documents: number;
  links: number;
  totalMedia: number;
  mediaByUser: Record<string, number>;
}

// Relationship Insights
export interface RelationshipInsights {
  mutualEngagementScore: number;
  communicationBalanceScore: number;
  interactionConsistency: number;
  emotionalIntensityIndex: number;
  activitySynchronization: number;
  insights: string[];
}

// AI Features
export interface AIAnalysis {
  relationshipSummary: string;
  communicationStyle: string;
  mainTopics: Array<{ topic: string; frequency: number; score: number }>;
  keyEvents: Array<{ date: string; event: string }>;
}

export interface ComprehensiveAnalytics {
  coreStats: CoreStats;
  responseAnalytics: ResponseAnalytics;
  conversationMetrics: ConversationMetrics;
  mediaAnalytics: MediaAnalytics;
  sentimentAnalysis: SentimentAnalysis;
  relationshipInsights: RelationshipInsights;
  topPhrases: PhraseData[];
  aiAnalysis: AIAnalysis;
}

// Sentiment words
const POSITIVE_WORDS = new Set([
  "good", "great", "excellent", "amazing", "wonderful", "fantastic", "love", "happy", "joy",
  "beautiful", "perfect", "awesome", "nice", "lovely", "brilliant", "superb", "outstanding",
  "thanks", "thank", "grateful", "appreciate", "best", "fantastic", "wonderful", "incredible",
]);

const NEGATIVE_WORDS = new Set([
  "bad", "terrible", "awful", "horrible", "hate", "sad", "angry", "upset", "annoyed", "frustrated",
  "disappointed", "poor", "worst", "useless", "stupid", "ugly", "disgusting", "pathetic",
  "sorry", "apologize", "blame", "wrong", "fail", "failed", "error", "problem", "broken",
]);

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "is", "are",
  "was", "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "will",
  "would", "could", "should", "may", "might", "must", "can", "that", "this", "it", "from",
  "by", "as", "i", "you", "he", "she", "we", "they", "what", "which", "who", "when", "where",
  "why", "how", "", "me", "my", "him", "her", "us", "your", "our", "their",
]);

/**
 * Helper function to convert users Map or object to array
 */
function getUsersArray(users: Map<string, User> | Record<string, User>): User[] {
  if (users instanceof Map) {
    return Array.from(users.values());
  }
  return Object.values(users);
}

/**
 * Calculate core statistics
 */
export function calculateCoreStats(
  messages: Message[],
  users: Map<string, User> | Record<string, User>,
  dateRange: { start: Date; end: Date }
): CoreStats {
  const messagesPerParticipant: Record<string, number> = {};

  getUsersArray(users).forEach((user) => {
    messagesPerParticipant[user.name] = user.messageCount;
  });

  const activeDays = new Set(
    messages.map((m) => m.timestamp.toISOString().split("T")[0])
  ).size;

  const durationMs = dateRange.end.getTime() - dateRange.start.getTime();
  const conversationDurationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
  const averageMessagesPerDay =
    conversationDurationDays > 0 ? messages.length / conversationDurationDays : 0;

  return {
    totalMessages: messages.length,
    messagesPerParticipant,
    averageMessagesPerDay,
    activeDaysCount: activeDays,
    firstMessageDate: messages[0]?.timestamp || dateRange.start,
    lastMessageDate: messages[messages.length - 1]?.timestamp || dateRange.end,
    conversationDurationDays,
  };
}

/**
 * Calculate response analytics
 */
export function calculateResponseAnalytics(messages: Message[]): ResponseAnalytics {
  let totalReplyTime = 0;
  let replyCount = 0;
  let fastestReply = Infinity;
  let slowestReply = 0;
  let ignoredMessages = 0;

  for (let i = 0; i < messages.length - 1; i++) {
    const current = messages[i];
    const next = messages[i + 1];

    if (current.senderId !== next.senderId) {
      const timeDiff = (next.timestamp.getTime() - current.timestamp.getTime()) / (1000 * 60);
      totalReplyTime += timeDiff;
      replyCount++;
      fastestReply = Math.min(fastestReply, timeDiff);
      slowestReply = Math.max(slowestReply, timeDiff);

      if (timeDiff > 1440) {
        ignoredMessages++;
      }
    }
  }

  return {
    averageReplyTime: replyCount > 0 ? Math.round(totalReplyTime / replyCount * 10) / 10 : 0,
    fastestReply: fastestReply === Infinity ? 0 : Math.round(fastestReply * 10) / 10,
    slowestReply: Math.round(slowestReply),
    ignoredMessagesCount: ignoredMessages,
  };
}

/**
 * Calculate conversation metrics
 */
export function calculateConversationMetrics(messages: Message[]): ConversationMetrics {
  let maxStreak = 0;
  let currentStreak = 0;
  let lastSenderId = "";
  let maxInactiveMs = 0;
  let lastTime = messages[0]?.timestamp || new Date();

  messages.forEach((msg) => {
    if (msg.senderId === lastSenderId) {
      currentStreak++;
    } else {
      maxStreak = Math.max(maxStreak, currentStreak);
      currentStreak = 1;
      lastSenderId = msg.senderId;
    }

    const inactiveMs = msg.timestamp.getTime() - lastTime.getTime();
    maxInactiveMs = Math.max(maxInactiveMs, inactiveMs);
    lastTime = msg.timestamp;
  });

  const dayOfWeekCounts: Record<string, number> = {
    Sunday: 0, Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0, Saturday: 0,
  };
  const monthlyCounts: Record<string, number> = {};
  const hourlyCounts: Record<number, number> = {};

  messages.forEach((msg) => {
    const day = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][msg.timestamp.getDay()];
    dayOfWeekCounts[day]++;

    const month = msg.timestamp.toLocaleString("en-US", { year: "numeric", month: "long" });
    monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;

    const hour = msg.timestamp.getHours();
    hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
  });

  const mostActiveDay = Object.entries(dayOfWeekCounts).sort((a, b) => b[1] - a[1])[0][0];
  const mostActiveMonth = Object.entries(monthlyCounts).sort((a, b) => b[1] - a[1])[0][0];
  const mostActiveHour = Math.max(...Object.entries(hourlyCounts).map(([h, c]) => c > 0 ? parseInt(h) : 0));

  return {
    longestConversationStreak: maxStreak,
    longestInactivePeriod: Math.ceil(maxInactiveMs / (1000 * 60 * 60)),
    mostActiveDay,
    mostActiveMonth,
    mostActiveHour,
  };
}

/**
 * Analyze media
 */
export function analyzeMedia(messages: Message[]): MediaAnalytics {
  const media = {
    photos: 0, videos: 0, voiceNotes: 0, gifs: 0, stickers: 0, documents: 0, links: 0,
  };
  const mediaByUser: Record<string, number> = {};

  messages.forEach((msg) => {
    if (msg.hasMedia) {
      if (msg.mediaType === "photo") media.photos++;
      else if (msg.mediaType === "video") media.videos++;
      else if (msg.mediaType === "voice_file" || msg.mediaType === "audio_file") media.voiceNotes++;
      else if (msg.mediaType === "animation") media.gifs++;
      else if (msg.mediaType === "sticker") media.stickers++;
      else media.documents++;

      mediaByUser[msg.senderName] = (mediaByUser[msg.senderName] || 0) + 1;
    }

    const links = msg.text.match(/https?:\/\/[^\s]+/g) || [];
    media.links += links.length;
  });

  return { ...media, totalMedia: Object.values(media).slice(0, 7).reduce((a, b) => a + b, 0), mediaByUser };
}

/**
 * Analyze sentiment
 */
export function analyzeSentiment(messages: Message[]): SentimentAnalysis {
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  const dailySentiment: Record<string, { positive: number; negative: number; neutral: number }> = {};
  const userSentiment: Record<string, { positive: number; negative: number; neutral: number }> = {};

  messages.forEach((msg) => {
    const words = msg.text.toLowerCase().split(/\s+/);
    const hasPositive = words.some((w) => POSITIVE_WORDS.has(w));
    const hasNegative = words.some((w) => NEGATIVE_WORDS.has(w));
    const sentiment: "positive" | "negative" | "neutral" = hasPositive && !hasNegative ? "positive" : hasNegative && !hasPositive ? "negative" : "neutral";

    const date = msg.timestamp.toISOString().split("T")[0];
    if (!dailySentiment[date]) dailySentiment[date] = { positive: 0, negative: 0, neutral: 0 };
    dailySentiment[date][sentiment]++;

    if (!userSentiment[msg.senderName]) userSentiment[msg.senderName] = { positive: 0, negative: 0, neutral: 0 };
    userSentiment[msg.senderName][sentiment]++;

    if (sentiment === "positive") positiveCount++;
    else if (sentiment === "negative") negativeCount++;
    else neutralCount++;
  });

  const total = positiveCount + negativeCount + neutralCount;
  const overall: "positive" | "negative" | "neutral" = positiveCount > negativeCount ? "positive" : negativeCount > positiveCount ? "negative" : "neutral";

  const trend = Object.entries(dailySentiment).map(([date, counts]) => {
    const dayTotal = counts.positive + counts.negative + counts.neutral;
    const sentiment = counts.positive > counts.negative ? "positive" : counts.negative > counts.positive ? "negative" : "neutral";
    const score = (counts.positive - counts.negative) / Math.max(dayTotal, 1);
    return { date, sentiment, score };
  });

  return {
    overall,
    positivePercentage: total > 0 ? Math.round((positiveCount / total) * 100) : 0,
    negativePercentage: total > 0 ? Math.round((negativeCount / total) * 100) : 0,
    neutralPercentage: total > 0 ? Math.round((neutralCount / total) * 100) : 0,
    trend,
    userSentiment,
  };
}

/**
 * Calculate relationship insights
 */
export function calculateRelationshipInsights(messages: Message[], users: Map<string, User> | Record<string, User>): RelationshipInsights {
  const userArray = getUsersArray(users);
  const userCount = userArray.length;

  if (userCount < 2) {
    return {
      mutualEngagementScore: 0,
      communicationBalanceScore: 0,
      interactionConsistency: 0,
      emotionalIntensityIndex: 0,
      activitySynchronization: 0,
      insights: ["Insufficient data for relationship analysis"],
    };
  }

  const userMessages = userArray.map((u) => u.messageCount);
  const avgMessages = userMessages.reduce((a, b) => a + b) / userMessages.length;
  const engagedUsers = userMessages.filter((m) => m > avgMessages * 0.5).length;
  const mutualEngagementScore = (engagedUsers / Math.max(userCount, 2)) * 100;

  const maxMessages = Math.max(...userMessages);
  const minMessages = Math.min(...userMessages);
  const balance = 100 - ((maxMessages - minMessages) / maxMessages) * 100;
  const communicationBalanceScore = Math.max(0, balance);

  const days = new Set(messages.map((m) => m.timestamp.toISOString().split("T")[0])).size;
  const messagePerDay = messages.length / Math.max(days, 1);
  const interactionConsistency = Math.min(100, messagePerDay * 10);

  const totalReactions = messages.reduce((sum, m) => sum + Array.from(m.reactions.values()).reduce((a, b) => a + b.length, 0), 0);
  const emotionalIntensityIndex = Math.min(100, (totalReactions / messages.length) * 50);

  let quickResponses = 0;
  for (let i = 0; i < messages.length - 1; i++) {
    if (messages[i].senderId !== messages[i + 1].senderId && messages[i + 1].timestamp.getTime() - messages[i].timestamp.getTime() < 5 * 60 * 1000) {
      quickResponses++;
    }
  }
  const activitySynchronization = Math.min(100, (quickResponses / messages.length) * 100);

  const insights: string[] = [];
  if (mutualEngagementScore > 80) insights.push("🟢 Highly mutual engagement - both participants are equally involved");
  if (communicationBalanceScore > 80) insights.push("⚖️ Well-balanced communication - both contribute equally");
  if (interactionConsistency > 80) insights.push("📈 Consistent communication pattern - regular messaging");
  if (emotionalIntensityIndex > 70) insights.push("❤️ High emotional engagement - frequent reactions and expressions");
  if (activitySynchronization > 60) insights.push("⚡ Strong responsiveness - quick replies to each other");

  return {
    mutualEngagementScore,
    communicationBalanceScore,
    interactionConsistency,
    emotionalIntensityIndex,
    activitySynchronization,
    insights,
  };
}

/**
 * Extract phrases
 */
export function extractPhrases(messages: Message[]): PhraseData[] {
  const phraseMap = new Map<string, { count: number; examples: string[] }>();

  messages.forEach((msg) => {
    const words = msg.text.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    for (let i = 0; i < words.length - 1; i++) {
      const phrase2 = words.slice(i, i + 2).join(" ");
      if (phrase2.split(" ").every((w) => !STOPWORDS.has(w))) {
        const entry = phraseMap.get(phrase2) || { count: 0, examples: [] };
        entry.count++;
        if (entry.examples.length < 2) entry.examples.push(msg.text.substring(0, 100));
        phraseMap.set(phrase2, entry);
      }
    }
  });

  return Array.from(phraseMap.entries())
    .filter(([_, data]) => data.count > 2)
    .map(([phrase, data]) => ({
      phrase,
      count: data.count,
      frequency: data.count / messages.length,
      examples: data.examples,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

/**
 * Generate AI analysis
 */
export function generateAIAnalysis(messages: Message[], sentiment: SentimentAnalysis, users: Map<string, User> | Record<string, User>): AIAnalysis {
  // Relationship Summary
  const userArray = getUsersArray(users);
  const userCount = userArray.length;
  const avgMsgLen = messages.reduce((sum, m) => sum + m.messageLength, 0) / messages.length;
  const relationshipSummary =
    userCount > 2
      ? `Group chat with ${userCount} participants. Average message length is ${Math.round(avgMsgLen)} characters.`
      : `1-on-1 conversation with ${Math.round(avgMsgLen)} character average messages. Overall tone is ${sentiment.overall}.`;

  // Communication Style
  const quickReplies = Array.from({ length: messages.length - 1 }, (_, i) => {
    if (messages[i].senderId !== messages[i + 1].senderId) {
      return (messages[i + 1].timestamp.getTime() - messages[i].timestamp.getTime()) / (1000 * 60);
    }
    return Infinity;
  }).filter((t) => t < 5 && t !== Infinity).length;

  const communicationStyle =
    quickReplies > messages.length / 3
      ? "Fast-paced and responsive, with quick back-and-forth exchanges"
      : "Relaxed pace with thoughtful, longer intervals between messages";

  // Main Topics (top word-based topics)
  const wordFreq = new Map<string, number>();
  messages.forEach((msg) => {
    const words = msg.text.toLowerCase().split(/\s+/).filter((w) => w.length > 4 && !STOPWORDS.has(w));
    words.forEach((w) => {
      const cleaned = w.replace(/[^\w]/g, "");
      if (cleaned) wordFreq.set(cleaned, (wordFreq.get(cleaned) || 0) + 1);
    });
  });

  const mainTopics = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic, count], idx) => ({
      topic,
      frequency: count,
      score: 100 - idx * 20,
    }));

  // Key Events (days with high activity)
  const dailyActivity: Record<string, number> = {};
  messages.forEach((msg) => {
    const date = msg.timestamp.toISOString().split("T")[0];
    dailyActivity[date] = (dailyActivity[date] || 0) + 1;
  });

  const keyEvents = Object.entries(dailyActivity)
    .filter(([_, count]) => count > messages.length / 10)
    .map(([date, count]) => ({
      date,
      event: `High activity day with ${count} messages`,
    }))
    .slice(0, 5);

  return {
    relationshipSummary,
    communicationStyle,
    mainTopics,
    keyEvents,
  };
}
