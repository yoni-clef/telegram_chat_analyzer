/**
 * Export utilities for analytics data
 */

import type { AnalyticsResult } from "./analytics";
import type { Message, ChatData } from "./telegramParser";

/**
 * Export analytics as CSV
 */
export function exportAnalyticsAsCSV(
  analytics: AnalyticsResult,
  chatData: ChatData,
  filename: string = "telegram-analytics.csv"
) {
  let csv = "Telegram Chat Analytics Report\n";
  csv += `Generated: ${new Date().toLocaleString()}\n\n`;

  // Summary
  csv += "SUMMARY STATISTICS\n";
  csv += `Total Messages,${chatData.messages.length}\n`;
  csv += `Unique Users,${chatData.users.size}\n`;
  csv += `Date Range,"${chatData.dateRange.start.toLocaleDateString()} - ${chatData.dateRange.end.toLocaleDateString()}"\n`;
  csv += `Average Message Length,${Math.round(analytics.summary.averageMessageLength)}\n`;
  csv += `Messages with Media,${analytics.summary.messagesWithMedia}\n\n`;

  // User Stats
  csv += "USER STATISTICS\n";
  csv += "Rank,User,Messages,Percentage,Avg Length,Days Active,Reactions Given\n";
  analytics.userStats.forEach((user, idx) => {
    csv += `${idx + 1},"${user.name}",${user.messageCount},${user.percentage.toFixed(1)}%,${Math.round(user.averageMessageLength)},${user.daysActive},${user.reactionsGiven}\n`;
  });
  csv += "\n";

  // Daily Activity
  csv += "DAILY ACTIVITY\n";
  csv += "Date,Messages,Unique Users,Avg Length\n";
  analytics.timeline.forEach((day) => {
    csv += `${day.date},${day.messageCount},${day.uniqueUsers},${Math.round(day.averageMessageLength)}\n`;
  });
  csv += "\n";

  // Hourly Activity
  csv += "HOURLY ACTIVITY\n";
  csv += "Hour,Messages,Avg Length\n";
  analytics.hourlyActivity.forEach((hour) => {
    csv += `${String(hour.hour).padStart(2, "0")}:00,${hour.messageCount},${Math.round(hour.averageMessageLength)}\n`;
  });
  csv += "\n";

  // Top Words
  csv += "TOP WORDS\n";
  csv += "Rank,Word,Count,Frequency\n";
  analytics.topWords.slice(0, 20).forEach((word, idx) => {
    csv += `${idx + 1},${word.word},${word.count},${(word.frequency * 100).toFixed(2)}%\n`;
  });
  csv += "\n";

  // Top Emojis
  csv += "TOP EMOJIS\n";
  csv += "Rank,Emoji,Count,Top Reactors\n";
  analytics.topEmojis.slice(0, 10).forEach((emoji, idx) => {
    const reactors = emoji.topReactors.map((r) => `${r.name}(${r.count})`).join("; ");
    csv += `${idx + 1},${emoji.emoji},${emoji.count},"${reactors}"\n`;
  });

  downloadFile(csv, filename, "text/csv");
}

/**
 * Export messages as CSV
 */
export function exportMessagesAsCSV(
  messages: Message[],
  filename: string = "telegram-messages.csv"
) {
  let csv = "Timestamp,Sender,Message,Reactions,Has Media,Media Type\n";

  messages.forEach((msg) => {
    const reactions = Array.from(msg.reactions.entries())
      .map(([emoji, users]) => `${emoji}(${users.join(",")})`)
      .join("; ");

    const escapedText = `"${msg.text.replace(/"/g, '""')}"`;
    csv += `${msg.timestamp.toISOString()},"${msg.senderName}",${escapedText},"${reactions}",${msg.hasMedia ? "Yes" : "No"},"${msg.mediaType || ""}"\n`;
  });

  downloadFile(csv, filename, "text/csv");
}

/**
 * Export as PDF (opens print dialog with full content)
 */
export function exportAnalyticsAsPDF(
  analytics: AnalyticsResult,
  chatData: ChatData,
  filename: string = "telegram-analytics.pdf"
) {
  try {
    // Create a comprehensive HTML page for PDF export
    const htmlContent = createComprehensivePDFContent(analytics, chatData);
    
    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export PDF");
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Trigger print dialog
    setTimeout(() => {
      printWindow.print();
      // Optional: close after printing
      // printWindow.close();
    }, 250);
  } catch (error) {
    console.error("PDF export error:", error);
    alert("PDF export failed. Please try again.");
  }
}

/**
 * Create comprehensive printable PDF content with all sections
 */
function createComprehensivePDFContent(analytics: AnalyticsResult, chatData: ChatData): string {
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
      .page { max-width: 900px; margin: 0 auto; padding: 40px 20px; }
      .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #7c3aed; padding-bottom: 20px; }
      .header h1 { font-size: 32px; margin-bottom: 10px; color: #1e293b; }
      .header p { color: #666; font-size: 14px; }
      .date-generated { text-align: right; color: #999; font-size: 12px; margin-bottom: 10px; }
      .section { margin-bottom: 40px; }
      .section-title { font-size: 20px; font-weight: 600; margin-bottom: 15px; color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
      .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 20px; }
      .stat-card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 6px; background: #f8fafc; }
      .stat-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
      .stat-value { font-size: 24px; font-weight: 700; color: #7c3aed; margin-top: 5px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #1e293b; color: white; padding: 10px; text-align: left; font-weight: 600; }
      td { padding: 10px; border-bottom: 1px solid #e2e8f0; }
      tr:nth-child(even) { background: #f8fafc; }
      .top-words { display: flex; flex-wrap: wrap; gap: 8px; margin: 15px 0; }
      .word-tag { background: #e9d5ff; color: #6b21a8; padding: 4px 8px; border-radius: 20px; font-size: 12px; }
      .page-break { page-break-after: always; margin: 40px 0; }
      .footer { text-align: center; color: #999; font-size: 10px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
      .bar { background: linear-gradient(to right, #d8b4fe, #7c3aed); height: 20px; border-radius: 3px; margin: 5px 0; }
      @media print {
        body { margin: 0; padding: 0; }
        .page { padding: 20px; max-width: 100%; }
        .page-break { page-break-after: always; }
      }
    </style>
  `;

  const dateRange = `${chatData.dateRange.start.toLocaleDateString()} - ${chatData.dateRange.end.toLocaleDateString()}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Telegram Chat Analytics Report</title>
      ${styles}
    </head>
    <body>
      <div class="page">
        <div class="date-generated">Generated: ${new Date().toLocaleString()}</div>
        
        <div class="header">
          <h1>📊 Telegram Chat Analytics Report</h1>
          <p>Period: ${dateRange}</p>
        </div>

        <!-- OVERVIEW SECTION -->
        <div class="section">
          <h2 class="section-title">📈 Overview Summary</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Total Messages</div>
              <div class="stat-value">${chatData.messages.length.toLocaleString()}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Unique Users</div>
              <div class="stat-value">${chatData.users.size}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Average Message Length</div>
              <div class="stat-value">${Math.round(analytics.summary.averageMessageLength)} chars</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Media Percentage</div>
              <div class="stat-value">${Math.round(analytics.summary.mediaPercentage)}%</div>
            </div>
          </div>
        </div>

        <!-- TOP CONTRIBUTORS -->
        <div class="section">
          <h2 class="section-title">👥 Top Contributors</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>User</th>
                <th>Messages</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.userStats
                .slice(0, 10)
                .map(
                  (user, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td>${user.name}</td>
                  <td>${user.messageCount}</td>
                  <td>
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <div class="bar" style="flex: 1; width: ${user.percentage}px;"></div>
                      ${user.percentage.toFixed(1)}%
                    </div>
                  </td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- TOP WORDS -->
        <div class="section">
          <h2 class="section-title">💬 Most Used Words</h2>
          <div class="top-words">
            ${analytics.topWords
              .slice(0, 25)
              .map((word) => `<span class="word-tag">${word.word} (${word.count})</span>`)
              .join("")}
          </div>
        </div>

        <!-- DAY OF WEEK -->
        <div class="section">
          <h2 class="section-title">📅 Activity by Day of Week</h2>
          <table>
            <thead>
              <tr>
                <th>Day</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              ${Object.entries(analytics.contentAnalysis.messagesDayOfWeek)
                .map(
                  ([day, count]) => `
                <tr>
                  <td>${day}</td>
                  <td>${count}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- TOP REACTIONS -->
        <div class="section">
          <h2 class="section-title">😊 Top Reactions</h2>
          <table>
            <thead>
              <tr>
                <th>Emoji</th>
                <th>Count</th>
                <th>Top Reactors</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.topEmojis
                .slice(0, 15)
                .map(
                  (emoji) => `
                <tr>
                  <td>${emoji.emoji}</td>
                  <td>${emoji.count}</td>
                  <td>${emoji.topReactors
                    .slice(0, 3)
                    .map((r) => r.name + ' (' + r.count + ')')
                    .join(", ")}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- PAGE BREAK -->
        <div class="page-break"></div>

        <!-- DETAILED ANALYTICS -->
        <div class="section">
          <h2 class="section-title">🔍 Detailed Analysis</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">Messages Per Day (Avg)</div>
              <div class="stat-value">${(chatData.messages.length / analytics.timeline.length).toFixed(1)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Days Active</div>
              <div class="stat-value">${analytics.timeline.length}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Total Reactions</div>
              <div class="stat-value">${analytics.engagement.totalReactions}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">Avg Reactions/Message</div>
              <div class="stat-value">${analytics.engagement.averageReactionsPerMessage.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <!-- HOURLY DISTRIBUTION -->
        <div class="section">
          <h2 class="section-title">⏰ Hourly Activity Distribution</h2>
          <table>
            <thead>
              <tr>
                <th>Hour</th>
                <th>Messages</th>
              </tr>
            </thead>
            <tbody>
              ${analytics.hourlyActivity
                .map((hour) => {
                  const maxMsg = Math.max(...analytics.hourlyActivity.map((h) => h.messageCount));
                  const width = (hour.messageCount / maxMsg) * 100;
                  const paddedHour = String(hour.hour).padStart(2, "0");
                  return '<tr><td>' + paddedHour + ':00</td><td><div style="display: flex; align-items: center; gap: 8px;"><div class="bar" style="flex: 1; width: ' + width + 'px;"></div>' + hour.messageCount + '</div></td></tr>';
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <!-- FOOTER -->
        <div class="footer">
          <p>This report was generated automatically from your Telegram chat export.</p>
          <p>All data is processed locally in your browser • No data sent to servers</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return html;
}

/**
 * Export charts as images
 */
export function exportChartAsImage(chartElement: HTMLElement, filename: string = "chart.png") {
  const canvas = chartElement.querySelector("canvas");
  if (!canvas) {
    alert("Chart not found");
    return;
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generic file download helper
 */
function downloadFile(content: string, filename: string, type: string) {
  const element = document.createElement("a");
  element.setAttribute("href", `data:${type};charset=utf-8,${encodeURIComponent(content)}`);
  element.setAttribute("download", filename);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

/**
 * Share options
 */
export function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text);
}
