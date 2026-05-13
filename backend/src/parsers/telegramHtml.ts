import fs from "fs";
import * as cheerio from "cheerio";
import type { Cheerio, CheerioAPI } from "cheerio";
import { ParsedChat, ParsedMessage } from "./telegramJson";

export type TelegramHtmlFile = string | { path: string; name: string };

interface SenderContext {
  senderName?: string;
  senderId?: string;
}

function normalizeText(value: string): string {
  return value
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function uploadBasename(filePath: string): string {
  return filePath.split(/[\\/]/).pop() ?? filePath;
}

function htmlFilePath(file: TelegramHtmlFile): string {
  return typeof file === "string" ? file : file.path;
}

function htmlFileName(file: TelegramHtmlFile): string {
  return typeof file === "string" ? file : file.name;
}

function parseTelegramDate(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2}) UTC([+-]\d{2}):?(\d{2})$/
  );
  if (!match) {
    const fallback = Date.parse(value);
    return Number.isNaN(fallback) ? null : new Date(fallback);
  }

  const [, day, month, year, hour, minute, second, offsetHour, offsetMinute] = match;
  return new Date(`${year}-${month}-${day}T${hour}:${minute}:${second}${offsetHour}:${offsetMinute}`);
}

function messageIdFromElement($message: Cheerio<any>): string | null {
  const id = $message.attr("id");
  if (!id) {
    return null;
  }
  return id.replace(/^message-?/, "");
}

function mediaTypeFromClass(className?: string): string | undefined {
  if (!className) {
    return undefined;
  }

  const mediaTypes: Array<[string, string]> = [
    ["media_voice_message", "voice"],
    ["media_audio_file", "audio"],
    ["media_video", "video"],
    ["media_photo", "photo"],
    ["media_file", "file"],
    ["media_contact", "contact"],
    ["media_location", "location"],
    ["media_call", "call"]
  ];

  return mediaTypes.find(([classToken]) => className.includes(classToken))?.[1];
}

function extractReplyTo($body: Cheerio<any>): string | undefined {
  const href = $body.children(".reply_to").find("a").first().attr("href");
  const match = href?.match(/message(\d+)/);
  return match?.[1];
}

function extractReactions($body: Cheerio<any>): string[] {
  return $body
    .children(".reactions")
    .find(".emoji")
    .toArray()
    .map((element) => normalizeText($body.find(element).text()))
    .filter(Boolean);
}

function extractMessageText($body: Cheerio<any>): string {
  const directText = normalizeText($body.children(".text").first().text());
  if (directText) {
    return directText;
  }

  const directMediaTitle = normalizeText($body.children(".media_wrap").find(".title").first().text());
  if (directMediaTitle) {
    return directMediaTitle;
  }

  const forwardedBody = $body.children(".forwarded.body").first();
  const forwardedText = normalizeText(forwardedBody.children(".text").first().text());
  if (forwardedText) {
    return forwardedText;
  }

  return normalizeText(forwardedBody.find(".title").first().text());
}

function extractMessage(
  $: CheerioAPI,
  element: any,
  lastSender: SenderContext
): { message: ParsedMessage | null; sender: SenderContext } {
  const $message = $(element);
  if ($message.hasClass("service")) {
    return { message: null, sender: lastSender };
  }

  const $body = $message.children(".body").first();
  const timestamp = parseTelegramDate($body.children(".pull_right.date.details").first().attr("title"));
  const messageId = messageIdFromElement($message);
  if (!timestamp || !messageId) {
    return { message: null, sender: lastSender };
  }

  const senderName = normalizeText($body.children(".from_name").first().clone().children().remove().end().text());
  const sender = senderName
    ? { senderName, senderId: senderName }
    : lastSender;

  const reactionEmojis = extractReactions($body);
  const mediaType = mediaTypeFromClass($body.find(".media").first().attr("class"));

  return {
    sender,
    message: {
      messageId,
      senderName: sender.senderName,
      senderId: sender.senderId,
      timestamp,
      text: extractMessageText($body),
      mediaType,
      reactions: reactionEmojis.length ? reactionEmojis : undefined,
      emojis: [],
      replyTo: extractReplyTo($body)
    }
  };
}

function htmlSortKey(file: TelegramHtmlFile): number {
  const basename = uploadBasename(htmlFileName(file)).toLowerCase();
  const match = basename.match(/^messages(\d*)\.html$/);
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }
  return match[1] ? Number(match[1]) : 1;
}

export function isTelegramMessagesHtml(filePath: string): boolean {
  return /^messages\d*\.html$/i.test(uploadBasename(filePath));
}

export async function parseTelegramHtmlExport(files: TelegramHtmlFile[]): Promise<ParsedChat> {
  const htmlFiles = files
    .filter((file) => isTelegramMessagesHtml(htmlFileName(file)))
    .sort((a, b) => htmlSortKey(a) - htmlSortKey(b));
  if (htmlFiles.length === 0) {
    throw new Error("Invalid Telegram HTML export: messages*.html missing");
  }

  const participants = new Map<string, { id: string; name?: string }>();
  const messages: ParsedMessage[] = [];
  let title = "Telegram Chat";
  let lastSender: SenderContext = {};

  for (const file of htmlFiles) {
    const raw = await fs.promises.readFile(htmlFilePath(file), "utf8");
    const $ = cheerio.load(raw);

    const pageTitle = normalizeText($(".page_header .content .text.bold").first().text());
    if (pageTitle) {
      title = pageTitle;
    }

    $(".history > .message").each((_, element) => {
      const parsed = extractMessage($, element, lastSender);
      lastSender = parsed.sender;
      if (!parsed.message) {
        return;
      }

      if (parsed.message.senderId || parsed.message.senderName) {
        const id = parsed.message.senderId ?? parsed.message.senderName ?? "unknown";
        if (!participants.has(id)) {
          participants.set(id, { id, name: parsed.message.senderName ?? id });
        }
      }

      messages.push(parsed.message);
    });
  }

  return {
    title,
    type: "telegram_html",
    participants: Array.from(participants.values()),
    messages
  };
}
