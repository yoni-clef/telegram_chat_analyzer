import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heatmap, HourlyHeatmap } from "../components/Heatmap";
import { TimelineViewer } from "../components/TimelineViewer";
import type { AnalyticsResult } from "../services/analytics";
import type { Message, ChatData } from "../services/telegramParser";
import {
  calculateCoreStats,
  calculateResponseAnalytics,
  calculateConversationMetrics,
  analyzeMedia,
  analyzeSentiment,
  calculateRelationshipInsights,
  extractPhrases,
  generateAIAnalysis,
} from "../services/advancedAnalytics";
import {
  exportAnalyticsAsCSV,
  exportMessagesAsCSV,
  exportAnalyticsAsPDF,
} from "../services/exportUtils";
import { formatDateRange, formatNumber, getMediaBlobUrl } from "../services/fileUtils";

// Helper function to convert deserialized messages back to proper types
function deserializeAnalyticsData(data: any) {
  // Convert message timestamps from strings to Date objects
  const messages = (data.chatData.messages || []).map((msg: any) => ({
    ...msg,
    timestamp: typeof msg.timestamp === "string" ? new Date(msg.timestamp) : msg.timestamp,
  }));

  // Convert chatData dateRange to Date objects
  const chatData = {
    ...data.chatData,
    dateRange: {
      start: typeof data.chatData.dateRange.start === "string" ? new Date(data.chatData.dateRange.start) : data.chatData.dateRange.start,
      end: typeof data.chatData.dateRange.end === "string" ? new Date(data.chatData.dateRange.end) : data.chatData.dateRange.end,
    },
    messages,
  };

  // Convert analytics timeline dates
  const analytics = {
    ...data.analytics,
    timeline: (data.analytics.timeline || []).map((t: any) => ({
      ...t,
      date: typeof t.date === "string" ? t.date : t.date.toISOString().split("T")[0],
    })),
    summary: {
      ...data.analytics.summary,
      dateRange: {
        start: typeof data.analytics.summary.dateRange.start === "string" ? new Date(data.analytics.summary.dateRange.start) : data.analytics.summary.dateRange.start,
        end: typeof data.analytics.summary.dateRange.end === "string" ? new Date(data.analytics.summary.dateRange.end) : data.analytics.summary.dateRange.end,
      },
    },
  };

  return { chatData, messages, analytics };
}

export function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResult | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "detailed" | "ai" | "export">("overview");
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("chatAnalytics");
    if (!data) {
      setError("No analysis data found. Please upload a chat first.");
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(data);
      const { chatData, messages, analytics } = deserializeAnalyticsData(parsed);
      setChatData(chatData);
      setMessages(messages);
      setAnalytics(analytics);
    } catch (e) {
      setError("Failed to load analysis data");
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
          <p className="mt-4 text-ink/60">Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !analytics || !chatData) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          <p className="font-semibold">Error</p>
          <p className="text-sm mt-1">{error}</p>
          <button
            onClick={() => {
              localStorage.removeItem("chatAnalytics");
              navigate("/upload");
            }}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-full mx-auto p-3 sm:p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-6 sm:mb-8 gap-4 sm:gap-0">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-ink mb-1 sm:mb-2">Chat Analytics</h1>
            <p className="text-sm sm:text-base text-ink/60">
              {formatDateRange(
                new Date(analytics.summary.dateRange.start),
                new Date(analytics.summary.dateRange.end)
              )}
            </p>
          </div>
          <button
            onClick={() => {
              localStorage.removeItem("chatAnalytics");
              navigate("/upload");
            }}
            className="rounded-lg border border-ink/20 px-3 sm:px-4 py-2 text-sm sm:text-base text-ink hover:bg-white/50 whitespace-nowrap"
          >
            New Analysis
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-6 sm:mb-8 bg-white rounded-lg shadow-sm p-2">
          {(["overview", "detailed", "ai", "export"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2 sm:px-4 py-2 text-xs sm:text-sm rounded font-medium transition whitespace-nowrap ${
                activeTab === tab
                  ? "bg-accent text-white"
                  : "text-ink/70 hover:bg-slate-100"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && <OverviewTab analytics={analytics} />}

        {/* Detailed Tab */}
        {activeTab === "detailed" && (
          <DetailedTab analytics={analytics} chatData={chatData} messages={messages} />
        )}

        {/* AI Tab */}
        {activeTab === "ai" && <AITab chatData={chatData} messages={messages} />}

        {/* Export Tab */}
        {activeTab === "export" && (
          <ExportTab analytics={analytics} chatData={chatData} messages={messages} />
        )}
      </div>
    </div>
  );
}

function OverviewTab({ analytics }: { analytics: AnalyticsResult }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <SummaryCard
          title="Total Messages"
          value={formatNumber(analytics.summary.totalMessages)}
          icon="💬"
        />
        <SummaryCard
          title="Unique Users"
          value={analytics.summary.uniqueUsers}
          icon="👥"
        />
        <SummaryCard
          title="Avg Length"
          value={Math.round(analytics.summary.averageMessageLength)}
          icon="📝"
        />
        <SummaryCard
          title="Media %"
          value={`${Math.round(analytics.summary.mediaPercentage)}%`}
          icon="🖼️"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Users */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Top Users</h2>
          <div className="space-y-3">
            {analytics.topUsers.slice(0, 5).map((user) => (
              <UserCard key={user.name} user={user} total={analytics.summary.totalMessages} />
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Hourly Activity</h2>
          <div className="flex items-end gap-1 h-40">
            {analytics.hourlyActivity.map((hour) => {
              const maxCount = Math.max(...analytics.hourlyActivity.map((h) => h.messageCount));
              const heightPercent = (hour.messageCount / maxCount) * 100;
              const isBusy = analytics.contentAnalysis.busyHours.includes(hour.hour);
              return (
                <div
                  key={hour.hour}
                  className="flex-1 bg-gradient-to-t from-accent/60 to-accent rounded-sm hover:from-accent hover:to-accent/80 cursor-pointer relative group"
                  style={{ height: `${Math.max(heightPercent, 5)}%` }}
                  title={`${hour.hour}:00 - ${hour.messageCount} messages`}
                >
                  {isBusy && <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full"></div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Word Cloud & Emojis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Most Used Words</h2>
          <div className="flex flex-wrap gap-2">
            {analytics.topWords.slice(0, 20).map((word, idx) => (
              <div
                key={idx}
                className="px-3 py-1 bg-accent/10 rounded-full text-sm text-ink hover:bg-accent/20 cursor-default"
                style={{ fontSize: `${0.85 + word.frequency * 10}rem` }}
                title={`${word.count} occurrences`}
              >
                {word.word}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Top Reactions</h2>
          <div className="space-y-3">
            {analytics.topEmojis.slice(0, 8).map((emoji, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{emoji.emoji}</span>
                  <span className="text-sm text-ink/60">
                    {emoji.topReactors.slice(0, 2).map((r) => r.name).join(", ")}
                  </span>
                </div>
                <span className="text-sm font-semibold">{emoji.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day of Week */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Activity by Day</h2>
        <div className="space-y-2">
          {Object.entries(analytics.contentAnalysis.messagesDayOfWeek).map(([day, count]) => {
            const maxCount = Math.max(...Object.values(analytics.contentAnalysis.messagesDayOfWeek));
            const width = (count / maxCount) * 100;
            return (
              <div key={day} className="flex items-center gap-3">
                <span className="text-sm w-16">{day}</span>
                <div className="flex-1 bg-slate-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-accent/60 to-accent h-full flex items-center justify-end pr-2 text-xs font-semibold text-white"
                    style={{ width: `${width}%` }}
                  >
                    {count > 0 && width > 30 && count}
                  </div>
                </div>
                <span className="text-sm font-semibold w-12 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DetailedTab({
  analytics,
  chatData,
  messages,
}: {
  analytics: AnalyticsResult;
  chatData: ChatData;
  messages: Message[];
}) {
  const [advancedAnalytics, setAdvancedAnalytics] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [selectedMediaType, setSelectedMediaType] = useState<string | null>(null);
  const [selectedMediaItem, setSelectedMediaItem] = useState<Message | null>(null);

  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    try {
      const advanced = {
        coreStats: calculateCoreStats(messages, chatData.users, chatData.dateRange),
        responseAnalytics: calculateResponseAnalytics(messages),
        conversationMetrics: calculateConversationMetrics(messages),
        mediaAnalytics: analyzeMedia(messages),
        sentimentAnalysis: analyzeSentiment(messages),
        relationshipInsights: calculateRelationshipInsights(messages, chatData.users),
        topPhrases: extractPhrases(messages),
      };
      setAdvancedAnalytics(advanced);
    } catch (e) {
      console.error("Error calculating advanced analytics:", e);
    }
  }, [messages, chatData]);

  if (!advancedAnalytics) return <div className="text-center py-8 text-ink/60">Loading advanced analytics...</div>;

  // Filter messages by date if date range is set
  const filteredMessages = messages.filter((msg) => {
    if (!dateFrom && !dateTo) return true;
    const msgDate = msg.timestamp.toISOString().split("T")[0];
    if (dateFrom && msgDate < dateFrom) return false;
    if (dateTo && msgDate > dateTo) return false;
    return true;
  });

  // Recalculate analytics with filtered messages
  const displayedAnalytics = filteredMessages.length === messages.length 
    ? advancedAnalytics 
    : {
        coreStats: calculateCoreStats(filteredMessages, chatData.users, chatData.dateRange),
        responseAnalytics: calculateResponseAnalytics(filteredMessages),
        conversationMetrics: calculateConversationMetrics(filteredMessages),
        mediaAnalytics: analyzeMedia(filteredMessages),
        sentimentAnalysis: analyzeSentiment(filteredMessages),
        relationshipInsights: calculateRelationshipInsights(filteredMessages, chatData.users),
        topPhrases: extractPhrases(filteredMessages),
      };

  return (
    <div className="space-y-6">
      {/* Date Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Filter by Date</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="text-sm font-medium text-ink/70 block mb-2">From Date</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink/70 block mb-2">To Date</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setDateFrom("");
                setDateTo("");
              }}
              className="w-full rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
        <p className="text-xs text-ink/50 mt-2 sm:mt-3">
          Showing {filteredMessages.length} of {messages.length} messages
        </p>
      </div>
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Response Analytics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-ink/60">Avg Reply Time</p>
            <p className="text-lg sm:text-2xl font-bold">{displayedAnalytics.responseAnalytics.averageReplyTime.toFixed(1)}m</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Fastest Reply</p>
            <p className="text-2xl font-bold">{displayedAnalytics.responseAnalytics.fastestReply.toFixed(1)}m</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Slowest Reply</p>
            <p className="text-2xl font-bold">{displayedAnalytics.responseAnalytics.slowestReply}h</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Ignored Messages</p>
            <p className="text-2xl font-bold">{displayedAnalytics.responseAnalytics.ignoredMessagesCount}</p>
          </div>
        </div>
      </div>

      {/* Conversation Metrics */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Conversation Metrics</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          <div>
            <p className="text-xs sm:text-sm text-ink/60">Longest Streak</p>
            <p className="text-lg sm:text-2xl font-bold">{displayedAnalytics.conversationMetrics.longestConversationStreak}</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Max Inactive</p>
            <p className="text-2xl font-bold">{displayedAnalytics.conversationMetrics.longestInactivePeriod}h</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Most Active Day</p>
            <p className="text-lg font-bold">{displayedAnalytics.conversationMetrics.mostActiveDay}</p>
          </div>
          <div>
            <p className="text-sm text-ink/60">Most Active Hour</p>
            <p className="text-2xl font-bold">{String(displayedAnalytics.conversationMetrics.mostActiveHour).padStart(2, "0")}:00</p>
          </div>
        </div>
      </div>

      {/* Media Analytics */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Media Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
          {[
            { label: "Photos", count: displayedAnalytics.mediaAnalytics.photos, icon: "📷", type: "photo" },
            { label: "Videos", count: displayedAnalytics.mediaAnalytics.videos, icon: "🎬", type: "video" },
            { label: "Voice Notes", count: displayedAnalytics.mediaAnalytics.voiceNotes, icon: "🎙️", type: "voice_note" },
            { label: "GIFs", count: displayedAnalytics.mediaAnalytics.gifs, icon: "🎞️", type: "gif" },
            { label: "Stickers", count: displayedAnalytics.mediaAnalytics.stickers, icon: "🎨", type: "sticker" },
            { label: "Documents", count: displayedAnalytics.mediaAnalytics.documents, icon: "📄", type: "document" },
            { label: "Links", count: displayedAnalytics.mediaAnalytics.links, icon: "🔗", type: "link" },
          ].map((item) => (
            <div
              key={item.label}
              onClick={() => setSelectedMediaType(item.type)}
              className="text-center p-2 sm:p-4 rounded-lg border-2 border-transparent hover:border-accent hover:bg-accent/5 cursor-pointer transition-all"
            >
              <p className="text-xl sm:text-3xl mb-1 sm:mb-2">{item.icon}</p>
              <p className="text-xs sm:text-sm text-ink/60">{item.label}</p>
              <p className="text-base sm:text-lg font-bold">{item.count}</p>
              {item.count > 0 && <p className="text-xs text-accent mt-1 sm:mt-2">Click to view</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Media Viewer Modal */}
      {selectedMediaType && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 border-2 border-accent/20">
          <div className="flex justify-between items-center mb-3 sm:mb-4 gap-2">
            <h2 className="text-base sm:text-lg font-semibold truncate">
              {selectedMediaType.charAt(0).toUpperCase() + selectedMediaType.slice(1)} Messages
            </h2>
            <button
              onClick={() => {
                setSelectedMediaType(null);
                setSelectedMediaItem(null);
              }}
              className="text-2xl font-bold text-ink/40 hover:text-ink/70"
            >
              ✕
            </button>
          </div>

          {selectedMediaItem ? (
            // Media Detail View
            <div className="space-y-4">
              <button
                onClick={() => setSelectedMediaItem(null)}
                className="text-sm text-accent hover:text-accent/80 font-medium"
              >
                ← Back to list
              </button>

              <div className="bg-slate-50 rounded-lg p-6">
                {/* Media Preview */}
                {selectedMediaItem.mediaUrl && (() => {
                  const blobUrl = getMediaBlobUrl(selectedMediaItem.mediaUrl) || selectedMediaItem.mediaUrl;
                  console.log("Displaying media:", {
                    mediaType: selectedMediaItem.mediaType,
                    requestedPath: selectedMediaItem.mediaUrl,
                    blobUrl: blobUrl ? "Generated" : "Failed",
                  });
                  return (
                    <div className="mb-4 sm:mb-6 bg-black rounded-lg overflow-hidden flex items-center justify-center max-h-64 sm:max-h-96">
                      {selectedMediaItem.mediaType === "photo" && (
                        <img
                          src={blobUrl}
                          alt="Media"
                          className="max-w-full max-h-64 sm:max-h-96 object-contain"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      )}
                      {selectedMediaItem.mediaType === "video" && (
                        <video
                          src={blobUrl}
                          controls
                          className="max-w-full max-h-64 sm:max-h-96"
                          onError={() => console.warn("Video failed to load")}
                        />
                      )}
                      {selectedMediaItem.mediaType === "voice_note" && (
                        <audio
                          src={blobUrl}
                          controls
                          className="w-full"
                          onError={() => console.warn("Audio failed to load")}
                        />
                      )}
                      {(selectedMediaItem.mediaType === "document" ||
                        selectedMediaItem.mediaType === "gif" ||
                        selectedMediaItem.mediaType === "sticker") && (
                        <div className="flex flex-col items-center gap-3 py-8 px-6">
                          <p className="text-6xl">
                            {selectedMediaItem.mediaType === "document"
                              ? "📄"
                              : selectedMediaItem.mediaType === "gif"
                                ? "🎞️"
                                : "🎨"}
                          </p>
                          <a
                            href={blobUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline text-center"
                          >
                            Open {selectedMediaItem.mediaType}
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Message Info */}
                <div className="space-y-2 sm:space-y-3 border-t pt-3 sm:pt-4">
                  <div>
                    <p className="text-xs text-ink/50 uppercase">From</p>
                    <p className="text-sm sm:text-base font-semibold truncate">{selectedMediaItem.senderName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink/50 uppercase">Time</p>
                    <p className="text-xs sm:text-sm">{selectedMediaItem.timestamp.toLocaleString()}</p>
                  </div>
                  {selectedMediaItem.text && (
                    <div>
                      <p className="text-xs text-ink/50 uppercase">Caption</p>
                      <p className="text-sm text-ink/80">{selectedMediaItem.text}</p>
                    </div>
                  )}
                  {selectedMediaItem.reactions && selectedMediaItem.reactions.size > 0 && (
                    <div>
                      <p className="text-xs text-ink/50 uppercase">Reactions</p>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {Array.from(selectedMediaItem.reactions.entries()).map(([emoji, reactors]) => (
                          <span
                            key={emoji}
                            className="text-sm bg-accent/10 text-accent px-3 py-1 rounded-full"
                            title={reactors.join(", ")}
                          >
                            {emoji} {reactors.length}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Media List View
            <div className="space-y-2 max-h-80 sm:max-h-96 overflow-y-auto">
              {filteredMessages
                .filter((msg) => msg.mediaType === selectedMediaType)
                .map((msg, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedMediaItem(msg)}
                    className="p-3 sm:p-4 bg-slate-50 rounded-lg border-l-4 border-accent hover:bg-slate-100 cursor-pointer transition-all"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{msg.senderName}</p>
                        <p className="text-xs text-ink/50">
                          {msg.timestamp.toLocaleDateString()} {msg.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded whitespace-nowrap flex-shrink-0">
                        {msg.mediaType}
                      </span>
                    </div>
                    {msg.text && <p className="text-sm text-ink/80 mb-2 line-clamp-2">{msg.text}</p>}
                    <p className="text-xs text-accent font-medium">Click to view →</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Sentiment Analysis */}
      {displayedAnalytics.sentimentAnalysis && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Sentiment Analysis</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="text-center">
              <p className="text-2xl sm:text-3xl">😊</p>
              <p className="text-xs sm:text-sm text-ink/60">Positive</p>
              <p className="text-lg sm:text-2xl font-bold text-green-600">
                {displayedAnalytics.sentimentAnalysis.positivePercentage.toFixed(0)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl">😐</p>
              <p className="text-xs sm:text-sm text-ink/60">Neutral</p>
              <p className="text-lg sm:text-2xl font-bold text-slate-600">
                {displayedAnalytics.sentimentAnalysis.neutralPercentage.toFixed(0)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl sm:text-3xl">😞</p>
              <p className="text-xs sm:text-sm text-ink/60">Negative</p>
              <p className="text-lg sm:text-2xl font-bold text-red-600">
                {displayedAnalytics.sentimentAnalysis.negativePercentage.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Relationship Insights */}
      {displayedAnalytics.relationshipInsights && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Relationship Insights</h2>
          <div className="space-y-3 sm:space-y-4">
            {[
              {
                label: "Mutual Engagement",
                score: displayedAnalytics.relationshipInsights.mutualEngagementScore,
              },
              {
                label: "Communication Balance",
                score: displayedAnalytics.relationshipInsights.communicationBalanceScore,
              },
              {
                label: "Interaction Consistency",
                score: displayedAnalytics.relationshipInsights.interactionConsistency,
              },
              {
                label: "Emotional Intensity",
                score: displayedAnalytics.relationshipInsights.emotionalIntensityIndex,
              },
              {
                label: "Activity Synchronization",
                score: displayedAnalytics.relationshipInsights.activitySynchronization,
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-2 gap-2">
                  <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                  <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{Math.round(item.score)}/100</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full transition-all"
                    style={{ width: `${item.score}%` }}
                  ></div>
                </div>
              </div>
            ))}
            <div className="mt-3 sm:mt-4 p-3 bg-slate-50 rounded">
              {displayedAnalytics.relationshipInsights.insights.map((insight: string, idx: number) => (
                <p key={idx} className="text-xs sm:text-sm text-ink/70">
                  {insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Phrases */}
      {displayedAnalytics.topPhrases && displayedAnalytics.topPhrases.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">Top Phrases</h2>
          <div className="space-y-2">
            {displayedAnalytics.topPhrases.map((phrase: any, idx: number) => (
              <div key={idx} className="flex justify-between items-start p-3 bg-slate-50 rounded gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">{phrase.phrase}</p>
                  <p className="text-xs text-ink/60 mt-1 line-clamp-1">{phrase.examples[0]}</p>
                </div>
                <span className="text-sm font-bold text-accent flex-shrink-0">{phrase.count}x</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Heatmaps */}
      <Heatmap data={analytics.timeline} title="Activity Heatmap (Daily)" />
      <HourlyHeatmap hourlyData={analytics.hourlyActivity} timeline={analytics.timeline} />

      {/* Timeline Viewer */}
      <TimelineViewer messages={messages} />
    </div>
  );
}

function AITab({ chatData, messages }: { chatData: ChatData; messages: Message[] }) {
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);

  useEffect(() => {
    const sentiment = analyzeSentiment(messages);
    const analysis = generateAIAnalysis(messages, sentiment, chatData.users);
    setAiAnalysis(analysis);
  }, []);

  if (!aiAnalysis) return <div className="text-center py-8">Loading AI analysis...</div>;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Relationship Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">💬 Relationship Summary</h2>
        <p className="text-sm sm:text-base text-ink/80">{aiAnalysis.relationshipSummary}</p>
      </div>

      {/* Communication Style */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">📊 Communication Style</h2>
        <p className="text-sm sm:text-base text-ink/80">{aiAnalysis.communicationStyle}</p>
      </div>

      {/* Main Topics */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">🏷️ Main Topics</h2>
        <div className="space-y-2 sm:space-y-3">
          {aiAnalysis.mainTopics.map((topic: any, idx: number) => (
            <div key={idx}>
              <div className="flex justify-between mb-2 gap-2">
                <span className="text-sm sm:text-base font-medium capitalize">{topic.topic}</span>
                <span className="text-xs sm:text-sm text-ink/60 whitespace-nowrap">{topic.frequency} mentions</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full"
                  style={{ width: `${topic.score}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Key Events */}
      {aiAnalysis.keyEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">🎯 Key Events</h2>
          <div className="space-y-2">
            {aiAnalysis.keyEvents.map((event: any, idx: number) => (
              <div key={idx} className="flex gap-2 sm:gap-4 p-3 bg-slate-50 rounded">
                <span className="font-semibold text-accent text-xs sm:text-base flex-shrink-0">{event.date}</span>
                <span className="text-xs sm:text-base text-ink/80">{event.event}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ExportTab({
  analytics,
  chatData,
  messages,
}: {
  analytics: AnalyticsResult;
  chatData: ChatData;
  messages: Message[];
}) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-semibold mb-4 sm:mb-6">📥 Export Options</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() =>
              exportAnalyticsAsCSV(
                analytics,
                chatData,
                `telegram-analytics-${new Date().toISOString().split("T")[0]}.csv`
              )
            }
            className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-accent/20 rounded-lg hover:bg-accent/5 hover:border-accent transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">📊</span>
            <p className="font-semibold text-sm sm:text-base">Analytics CSV</p>
            <p className="text-xs text-ink/60 mt-1">Full analytics data</p>
          </button>

          <button
            onClick={() =>
              exportMessagesAsCSV(
                messages,
                `telegram-messages-${new Date().toISOString().split("T")[0]}.csv`
              )
            }
            className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-accent/20 rounded-lg hover:bg-accent/5 hover:border-accent transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">💬</span>
            <p className="font-semibold text-sm sm:text-base">Messages CSV</p>
            <p className="text-xs text-ink/60 mt-1">All messages with metadata</p>
          </button>

          <button
            onClick={() =>
              exportAnalyticsAsPDF(
                analytics,
                chatData,
                `telegram-analytics-${new Date().toISOString().split("T")[0]}.pdf`
              )
            }
            className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-accent/20 rounded-lg hover:bg-accent/5 hover:border-accent transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">📄</span>
            <p className="font-semibold text-sm sm:text-base">PDF Report</p>
            <p className="text-xs text-ink/60 mt-1">Printable report</p>
          </button>

          <button
            onClick={() => window.print()}
            className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-accent/20 rounded-lg hover:bg-accent/5 hover:border-accent transition"
          >
            <span className="text-2xl sm:text-3xl mb-2">🖨️</span>
            <p className="font-semibold text-sm sm:text-base">Print</p>
            <p className="text-xs text-ink/60 mt-1">Print current page</p>
          </button>
        </div>
      </div>

      <div className="text-center text-xs sm:text-sm text-ink/50 py-4 sm:py-6">
        <p>All data is processed locally in your browser • Nothing is sent to servers</p>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon }: { title: string; value: string | number; icon: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
      <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">{icon}</div>
      <p className="text-xs sm:text-sm text-ink/60">{title}</p>
      <p className="text-lg sm:text-2xl font-bold text-ink mt-1 sm:mt-2">{value}</p>
    </div>
  );
}

function UserCard({ user, total }: { user: any; total: number }) {
  return (
    <div className="bg-slate-50 rounded-lg p-2 sm:p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-xs sm:text-sm text-ink truncate">{user.name}</p>
          <p className="text-xs text-ink/60">{user.messageCount} messages</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-accent">{user.percentage.toFixed(1)}%</p>
        </div>
      </div>
      <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
        <div
          className="bg-accent h-1.5 rounded-full"
          style={{ width: `${user.percentage}%` }}
        ></div>
      </div>
    </div>
  );
}
