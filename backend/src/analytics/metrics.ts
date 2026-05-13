import { pool } from "../db";

export async function getSummary(chatId: number) {
  const summary = await pool.query(
    `SELECT
      COUNT(*)::int AS total_messages,
      COUNT(DISTINCT sender_name) AS participants,
      MIN(timestamp) AS first_message,
      MAX(timestamp) AS last_message,
      COUNT(DISTINCT DATE(timestamp)) AS active_days,
      CASE
        WHEN COUNT(DISTINCT DATE(timestamp)) > 0
        THEN ROUND(COUNT(*)::numeric / COUNT(DISTINCT DATE(timestamp)), 2)
        ELSE 0
      END AS avg_per_day,
      EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 86400 AS duration_days
     FROM messages
     WHERE chat_id = $1`,
    [chatId]
  );

  return summary.rows[0];
}

export async function getMessages(chatId: number, limit: number, offset: number) {
  const result = await pool.query(
    `SELECT message_id, sender_name, sender_id, timestamp, text, media_type, emojis
     FROM messages
     WHERE chat_id = $1
     ORDER BY timestamp ASC
     LIMIT $2 OFFSET $3`,
    [chatId, limit, offset]
  );

  return result.rows;
}

export async function getEmojiStats(chatId: number) {
  const result = await pool.query(
    `SELECT emoji, COUNT(*)::int AS count
     FROM messages, UNNEST(emojis) AS emoji
     WHERE chat_id = $1
     GROUP BY emoji
     ORDER BY count DESC
     LIMIT 50`,
    [chatId]
  );

  return result.rows;
}

export async function getActivity(chatId: number) {
  const daily = await pool.query(
    `SELECT DATE(timestamp) AS day, COUNT(*)::int AS count
     FROM messages
     WHERE chat_id = $1
     GROUP BY day
     ORDER BY day ASC`,
    [chatId]
  );

  const hourly = await pool.query(
    `SELECT EXTRACT(HOUR FROM timestamp)::int AS hour, COUNT(*)::int AS count
     FROM messages
     WHERE chat_id = $1
     GROUP BY hour
     ORDER BY hour ASC`,
    [chatId]
  );

  return { daily: daily.rows, hourly: hourly.rows };
}

export async function getMediaStats(chatId: number) {
  const result = await pool.query(
    `SELECT COALESCE(media_type, 'text') AS media_type, COUNT(*)::int AS count
     FROM messages
     WHERE chat_id = $1
     GROUP BY media_type
     ORDER BY count DESC`,
    [chatId]
  );

  return result.rows;
}

export async function listChats(userId: number) {
  const result = await pool.query(
    `SELECT id, title, type, uploaded_at
     FROM chats
     WHERE user_id = $1
     ORDER BY uploaded_at DESC`,
    [userId]
  );

  return result.rows;
}
