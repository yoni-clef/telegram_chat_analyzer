/**
 * File handling utilities for loading Telegram HTML exports
 */

import { parseHtmlFile, aggregateMessages, type Message } from "./telegramParser";

// Global map to store uploaded files for media access (persists during session)
let globalMediaFiles: Map<string, File> = new Map();

/**
 * Store files globally for media access
 */
export function storeMediaFiles(files: Map<string, File>) {
  globalMediaFiles = files;
  // Debug: log all stored paths
  console.log("Media files stored:", Array.from(files.keys()));
  // Also store in sessionStorage as backup
  const fileEntries = Array.from(files.entries());
  sessionStorage.setItem("mediaFileMap", JSON.stringify(fileEntries.map(([path, _]) => path)));
}

/**
 * Get blob URL for a media file
 */
export function getMediaBlobUrl(relativePath: string): string | null {
  // Try exact match first
  let file = globalMediaFiles.get(relativePath);
  if (file) {
    return URL.createObjectURL(file);
  }

  // If no exact match, try to find by matching the end of the path
  // This handles cases where webkitRelativePath includes parent folder
  for (const [fullPath, mediaFile] of globalMediaFiles.entries()) {
    // Match if fullPath ends with relativePath or contains it as the last part
    if (fullPath.endsWith(relativePath) || fullPath.includes("/" + relativePath)) {
      return URL.createObjectURL(mediaFile);
    }
  }

  console.warn(`Media file not found: ${relativePath}`);
  return null;
}

/**
 * Get all stored media files
 */
export function getMediaFiles(): Map<string, File> {
  return globalMediaFiles;
}

/**
 * Load and parse HTML files from file list
 * @param files List of File objects from input
 * @returns Aggregated chat data
 */
export async function loadHtmlFiles(files: File[]): Promise<Message[]> {
  const htmlFiles = files.filter(
    (file) => /^messages\d*\.html$/i.test(file.name)
  );

  if (htmlFiles.length === 0) {
    throw new Error(
      "No messages*.html files found. Please select a folder containing Telegram HTML export files."
    );
  }

  // Sort by filename to preserve message order
  htmlFiles.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || "0");
    const numB = parseInt(b.name.match(/\d+/)?.[0] || "0");
    return numA - numB;
  });

  // Create a map of relative file paths to File objects for media lookup
  const mediaFileMap = new Map<string, File>();
  files.forEach((file) => {
    if (file.webkitRelativePath) {
      // Store with full path
      mediaFileMap.set(file.webkitRelativePath, file);
      
      // Also store with normalized path (removing parent folder if present)
      // e.g., "ChatExport_2026-05-12/photos/image.jpg" -> also store as "photos/image.jpg"
      const parts = file.webkitRelativePath.split("/");
      if (parts.length > 1) {
        // Remove first part (folder name) and rejoin
        const normalizedPath = parts.slice(1).join("/");
        if (normalizedPath && !mediaFileMap.has(normalizedPath)) {
          mediaFileMap.set(normalizedPath, file);
        }
      }
    }
  });

  // Store files globally
  storeMediaFiles(mediaFileMap);

  const allMessages: Message[] = [];

  for (const file of htmlFiles) {
    try {
      const text = await file.text();
      const messages = parseHtmlFile(text);
      
      // Keep relative paths in messages (don't convert to blob URLs yet)
      // We'll convert them to blob URLs when displaying
      allMessages.push(...messages);
    } catch (error) {
      console.error(`Failed to parse ${file.name}:`, error);
      throw new Error(`Failed to parse ${file.name}: ${error}`);
    }
  }

  if (allMessages.length === 0) {
    throw new Error("No messages found in HTML files.");
  }

  return allMessages;
}

/**
 * Get readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

/**
 * Format date range
 */
export function formatDateRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
  };

  const startStr = start.toLocaleDateString("en-US", options);
  const endStr = end.toLocaleDateString("en-US", options);

  if (startStr === endStr) {
    return startStr;
  }

  return `${startStr} - ${endStr}`;
}

/**
 * Get day name from date
 */
export function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

/**
 * Format large numbers
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}
