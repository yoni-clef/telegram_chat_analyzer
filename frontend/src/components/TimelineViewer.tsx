import { useMemo, useState } from "react";
import type { Message } from "../services/telegramParser";

interface TimelineViewerProps {
  messages: Message[];
}

export function TimelineViewer({ messages }: TimelineViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<string | null>(null);

  const users = useMemo(() => {
    return Array.from(new Set(messages.map((m) => m.senderName)));
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((msg) => {
      const matchesSearch = searchQuery === "" || msg.text.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesUser = selectedUser === null || msg.senderName === selectedUser;
      const msgDate = msg.timestamp.toISOString().split("T")[0];
      const matchesDate = selectedDate === null || msgDate === selectedDate;
      const matchesMedia = mediaTypeFilter === null || (mediaTypeFilter === "media" ? msg.hasMedia : mediaTypeFilter === msg.mediaType);

      return matchesSearch && matchesUser && matchesDate && matchesMedia;
    });
  }, [messages, searchQuery, selectedUser, selectedDate, mediaTypeFilter]);

  const uniqueDates = useMemo(() => {
    return Array.from(new Set(messages.map((m) => m.timestamp.toISOString().split("T")[0]))).sort().reverse();
  }, [messages]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4">Message Timeline</h2>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Search */}
        <input
          type="text"
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />

        {/* User Filter */}
        <select
          value={selectedUser || ""}
          onChange={(e) => setSelectedUser(e.target.value || null)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All users</option>
          {users.map((user) => (
            <option key={user} value={user}>
              {user}
            </option>
          ))}
        </select>

        {/* Date Filter */}
        <select
          value={selectedDate || ""}
          onChange={(e) => setSelectedDate(e.target.value || null)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All dates</option>
          {uniqueDates.map((date) => (
            <option key={date} value={date}>
              {new Date(date).toLocaleDateString()}
            </option>
          ))}
        </select>

        {/* Media Filter */}
        <select
          value={mediaTypeFilter || ""}
          onChange={(e) => setMediaTypeFilter(e.target.value || null)}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">All types</option>
          <option value="media">With media</option>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
          <option value="audio_file">Voice notes</option>
          <option value="animation">GIFs</option>
          <option value="sticker">Stickers</option>
        </select>
      </div>

      {/* Results */}
      <div className="text-sm text-ink/60 mb-4">
        Showing {filteredMessages.length} of {messages.length} messages
      </div>

      {/* Messages */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg, idx) => (
            <div key={idx} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-semibold text-sm text-ink">{msg.senderName}</span>
                    <span className="text-xs text-ink/50">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-ink/80 line-clamp-3">{msg.text}</p>
                  {msg.hasMedia && (
                    <div className="mt-2 text-xs bg-accent/10 text-accent px-2 py-1 rounded w-fit">
                      📎 {msg.mediaType || "Media"}
                    </div>
                  )}
                  {msg.reactions.size > 0 && (
                    <div className="mt-2 flex gap-1 flex-wrap">
                      {Array.from(msg.reactions.entries()).map(([emoji, users]) => (
                        <span key={emoji} className="text-xs bg-accent/10 rounded px-2 py-1" title={users.join(", ")}>
                          {emoji} {users.length}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-ink/50">No messages found matching your filters</div>
        )}
      </div>

      {/* Clear filters button */}
      {(searchQuery || selectedUser || selectedDate || mediaTypeFilter) && (
        <button
          onClick={() => {
            setSearchQuery("");
            setSelectedUser(null);
            setSelectedDate(null);
            setMediaTypeFilter(null);
          }}
          className="mt-4 text-sm text-accent hover:text-accent/80 underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
