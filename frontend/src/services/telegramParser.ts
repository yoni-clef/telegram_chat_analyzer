/**
 * Telegram HTML Export Parser
 * Extracts messages, users, and metadata from Telegram HTML exports
 */

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  timestamp: Date;
  text: string;
  reactions: Map<string, string[]>; // emoji -> usernames who reacted
  hasMedia: boolean;
  mediaType?: string;
  mediaUrl?: string; // file path to media (e.g., "photos/image.jpg")
  messageLength: number;
}

export interface User {
  id: string;
  name: string;
  messageCount: number;
  firstMessage: Date;
  lastMessage: Date;
  totalCharacters: number;
  averageMessageLength: number;
  reactions: Map<string, number>; // emoji -> count of reactions used
}

export interface ChatData {
  title: string;
  totalMessages: number;
  dateRange: { start: Date; end: Date };
  users: Map<string, User>;
  messages: Message[];
  uniqueEmojis: Set<string>;
}

/**
 * Parse a single HTML file and extract messages
 */
export function parseHtmlFile(htmlContent: string): Message[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, "text/html");
  const messages: Message[] = [];

  // Find all message containers
  const messageElements = doc.querySelectorAll(".message.default");

  messageElements.forEach((el) => {
    try {
      const msg = parseMessageElement(el as HTMLElement);
      if (msg) {
        messages.push(msg);
      }
    } catch (e) {
      console.warn("Failed to parse message element", e);
    }
  });

  return messages;
}

/**
 * Parse individual message element
 */
function parseMessageElement(element: HTMLElement): Message | null {
  const idAttr = element.id;
  if (!idAttr) return null;

  // Extract message ID
  const id = idAttr.replace("message", "");

  // Extract sender name
  const fromNameEl = element.querySelector(".from_name");
  const senderName = fromNameEl?.textContent?.trim() || "Unknown";

  // Extract timestamp
  const dateEl = element.querySelector(".date[title]");
  const dateStr = dateEl?.getAttribute("title");
  const timestamp = dateStr ? parseTimestamp(dateStr) : new Date();

  // Extract text content
  const textEl = element.querySelector(".text");
  const text = textEl?.textContent?.trim() || "";

  // Check for media
  const mediaEl = element.querySelector(".media");
  const hasMedia = !!mediaEl;
  const mediaType = mediaEl?.className.match(/media_(\w+)/)?.[1];  const mediaUrl = mediaEl?.getAttribute("href") || undefined;
  // Extract reactions
  const reactions = new Map<string, string[]>();
  const reactionElements = element.querySelectorAll(".reaction");
  reactionElements.forEach((reaction) => {
    const emoji = reaction.querySelector(".emoji")?.textContent?.trim();
    const userpics = reaction.querySelectorAll(".userpic");

    if (emoji) {
      const users: string[] = [];
      userpics.forEach((pic) => {
        const initials = pic.querySelector(".initials");
        const title = initials?.getAttribute("title");
        if (title) {
          users.push(title);
        }
      });
      if (users.length > 0) {
        reactions.set(emoji, users);
      }
    }
  });

  return {
    id,
    senderId: createSenderId(senderName),
    senderName,
    timestamp,
    text,
    reactions,
    hasMedia,
    mediaType,
    mediaUrl,
    messageLength: text.length,
  };
}

/**
 * Parse Telegram timestamp format: "04.04.2026 16:36:43 UTC+03:00"
 */
function parseTimestamp(dateStr: string): Date {
  try {
    const match = dateStr.match(
      /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2}) UTC([+-]\d{2}):?(\d{2})$/
    );

    if (match) {
      const [, day, month, year, hour, minute, second, offsetHour, offsetMinute] = match;
      const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}${offsetHour}:${offsetMinute}`;
      return new Date(dateString);
    }

    // Fallback parsing
    return new Date(dateStr);
  } catch (e) {
    return new Date();
  }
}

/**
 * Create unique sender ID from name
 */
function createSenderId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "_");
}

/**
 * Aggregate multiple HTML files into consolidated chat data
 */
export function aggregateMessages(allMessages: Message[]): ChatData {
  const users = new Map<string, User>();
  const uniqueEmojis = new Set<string>();

  // Sort messages by timestamp
  allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Process each message
  allMessages.forEach((msg) => {
    // Track emojis
    msg.reactions.forEach((_, emoji) => {
      uniqueEmojis.add(emoji);
    });

    // Build user data
    if (!users.has(msg.senderId)) {
      users.set(msg.senderId, {
        id: msg.senderId,
        name: msg.senderName,
        messageCount: 0,
        firstMessage: msg.timestamp,
        lastMessage: msg.timestamp,
        totalCharacters: 0,
        averageMessageLength: 0,
        reactions: new Map(),
      });
    }

    const user = users.get(msg.senderId)!;
    user.messageCount++;
    user.totalCharacters += msg.messageLength;
    user.lastMessage = msg.timestamp;
    user.averageMessageLength = user.totalCharacters / user.messageCount;
  });

  // Track reactions given by each user
  allMessages.forEach((msg) => {
    msg.reactions.forEach((reactors, emoji) => {
      reactors.forEach((reactorName) => {
        const reactorId = createSenderId(reactorName);
        if (users.has(reactorId)) {
          const user = users.get(reactorId)!;
          const current = user.reactions.get(emoji) || 0;
          user.reactions.set(emoji, current + 1);
        }
      });
    });
  });

  const dateRange =
    allMessages.length > 0
      ? {
          start: allMessages[0].timestamp,
          end: allMessages[allMessages.length - 1].timestamp,
        }
      : { start: new Date(), end: new Date() };

  return {
    title: "Telegram Chat",
    totalMessages: allMessages.length,
    dateRange,
    users,
    messages: allMessages,
    uniqueEmojis,
  };
}
