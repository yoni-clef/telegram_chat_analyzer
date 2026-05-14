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
    if (isMobileBrowser()) {
      downloadPDFBlob(createAnalyticsPDFBlob(analytics, chatData), filename);
      return;
    }

    // Create a comprehensive HTML page for PDF export
    const pdfDataUrl = createAnalyticsPDFDataUrl(analytics, chatData);
    const htmlContent = createComprehensivePDFContent(analytics, chatData, filename, pdfDataUrl);
    
    // Open in new window for printing
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow popups to export PDF");
      return;
    }
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  } catch (error) {
    console.error("PDF export error:", error);
    alert("PDF export failed. Please try again.");
  }
}

function isMobileBrowser(): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function createAnalyticsPDFBlob(analytics: AnalyticsResult, chatData: ChatData): Blob {
  return new Blob([createAnalyticsPDFDocument(analytics, chatData)], {
    type: "application/pdf",
  });
}

function downloadPDFBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.type = "application/pdf";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function createAnalyticsPDFDataUrl(analytics: AnalyticsResult, chatData: ChatData): string {
  const pdfContent = createAnalyticsPDFDocument(analytics, chatData);
  return `data:application/pdf;base64,${btoa(pdfContent)}`;
}

function createAnalyticsPDFDocument(analytics: AnalyticsResult, chatData: ChatData): string {
  const pageWidth = 612;
  const pageHeight = 792;
  const margin = 48;
  const bottomMargin = 48;
  const lineHeight = 15;
  const contentWidth = pageWidth - margin * 2;
  const pages: string[][] = [[]];
  let y = pageHeight - margin;

  const addTextCommand = (text: string, size = 10, bold = false) => {
    if (y < bottomMargin) {
      pages.push([]);
      y = pageHeight - margin;
    }

    const font = bold ? "F2" : "F1";
    pages[pages.length - 1].push(
      `BT /${font} ${size} Tf ${margin} ${y} Td (${escapePDFText(text)}) Tj ET`
    );
    y -= size + 5;
  };

  const addLine = (text = "", size = 10, bold = false) => {
    if (!text) {
      y -= lineHeight;
      return;
    }

    const maxChars = Math.max(24, Math.floor(contentWidth / (size * 0.52)));
    wrapText(sanitizePDFText(text), maxChars).forEach((line) => addTextCommand(line, size, bold));
  };

  const addSection = (title: string) => {
    y -= 8;
    addLine(title.toUpperCase(), 13, true);
    addLine("-".repeat(74), 8);
  };

  const dateRange = `${chatData.dateRange.start.toLocaleDateString()} - ${chatData.dateRange.end.toLocaleDateString()}`;
  const maxDayMessages = Math.max(...Object.values(analytics.contentAnalysis.messagesDayOfWeek), 1);
  const maxHourlyMessages = Math.max(...analytics.hourlyActivity.map((h) => h.messageCount), 1);

  addLine("Telegram Chat Analytics Report", 20, true);
  addLine(`Generated: ${new Date().toLocaleString()}`);
  addLine(`Period: ${dateRange}`);
  addLine("");

  addSection("Overview Summary");
  addLine(`Total messages: ${chatData.messages.length.toLocaleString()}`);
  addLine(`Unique users: ${chatData.users.size}`);
  addLine(`Average message length: ${Math.round(analytics.summary.averageMessageLength)} chars`);
  addLine(`Messages with media: ${analytics.summary.messagesWithMedia.toLocaleString()}`);
  addLine(`Media percentage: ${Math.round(analytics.summary.mediaPercentage)}%`);

  addSection("Top Contributors");
  analytics.userStats.slice(0, 10).forEach((user, index) => {
    addLine(
      `${index + 1}. ${user.name} - ${user.messageCount.toLocaleString()} messages (${user.percentage.toFixed(1)}%)`
    );
  });

  addSection("Most Used Words");
  addLine(
    analytics.topWords
      .slice(0, 25)
      .map((word) => `${word.word} (${word.count})`)
      .join(", ")
  );

  addSection("Activity by Day of Week");
  Object.entries(analytics.contentAnalysis.messagesDayOfWeek).forEach(([day, count]) => {
    const bar = "#".repeat(Math.max(1, Math.round((count / maxDayMessages) * 24)));
    addLine(`${day.padEnd(10)} ${String(count).padStart(6)}  ${bar}`);
  });

  addSection("Top Reactions");
  analytics.topEmojis.slice(0, 15).forEach((emoji, index) => {
    const topReactors = emoji.topReactors
      .slice(0, 3)
      .map((reactor) => `${reactor.name} (${reactor.count})`)
      .join(", ");
    addLine(`${index + 1}. ${emoji.emoji} - ${emoji.count} reactions - ${topReactors}`);
  });

  addSection("Detailed Analysis");
  addLine(`Messages per day average: ${(chatData.messages.length / analytics.timeline.length).toFixed(1)}`);
  addLine(`Days active: ${analytics.timeline.length}`);
  addLine(`Total reactions: ${analytics.engagement.totalReactions}`);
  addLine(`Average reactions per message: ${analytics.engagement.averageReactionsPerMessage.toFixed(2)}`);

  addSection("Hourly Activity Distribution");
  analytics.hourlyActivity.forEach((hour) => {
    const paddedHour = String(hour.hour).padStart(2, "0");
    const bar = "#".repeat(Math.max(1, Math.round((hour.messageCount / maxHourlyMessages) * 24)));
    addLine(`${paddedHour}:00 ${String(hour.messageCount).padStart(6)}  ${bar}`);
  });

  addLine("");
  addLine("All data is processed locally in your browser. No data is sent to servers.", 9);

  return buildPDF(pages);
}

function buildPDF(pageStreams: string[][]): string {
  const objects: string[] = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>",
  ];
  const pageObjectNumbers: number[] = [];

  pageStreams.forEach((commands) => {
    const stream = commands.join("\n");
    const contentObjectNumber = objects.length + 1;
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);

    const pageObjectNumber = objects.length + 1;
    pageObjectNumbers.push(pageObjectNumber);
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentObjectNumber} 0 R >>`
    );
  });

  objects[1] = `<< /Type /Pages /Kids [${pageObjectNumbers.map((num) => `${num} 0 R`).join(" ")}] /Count ${pageObjectNumbers.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return pdf;
}

function sanitizePDFText(text: string): string {
  return text.replace(/[^\x20-\x7E]/g, "?");
}

function escapePDFText(text: string): string {
  return sanitizePDFText(text).replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    if (!current) {
      current = word;
      return;
    }

    if (`${current} ${word}`.length <= maxChars) {
      current += ` ${word}`;
    } else {
      lines.push(current);
      current = word;
    }
  });

  if (current) lines.push(current);
  return lines;
}

function escapeHTML(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Create comprehensive printable PDF content with all sections
 */
function createComprehensivePDFContent(
  analytics: AnalyticsResult,
  chatData: ChatData,
  filename: string,
  pdfDataUrl: string
): string {
  const styles = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; }
      .export-actions {
        position: sticky;
        top: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        gap: 10px;
        padding: 12px 16px;
        background: rgba(255, 255, 255, 0.96);
        border-bottom: 1px solid #e2e8f0;
        box-shadow: 0 2px 12px rgba(15, 23, 42, 0.08);
      }
      .export-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border: 0;
        border-radius: 6px;
        padding: 10px 16px;
        font-size: 14px;
        font-weight: 700;
        cursor: pointer;
        text-decoration: none;
      }
      .download-button { background: #7c3aed; color: white; }
      .print-button { background: #e2e8f0; color: #1e293b; }
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
        .export-actions { display: none; }
        .page { padding: 20px; max-width: 100%; }
        .page-break { page-break-after: always; }
      }
    </style>
  `;

  const dateRange = `${chatData.dateRange.start.toLocaleDateString()} - ${chatData.dateRange.end.toLocaleDateString()}`;
  const reportTitle = filename.replace(/\.pdf$/i, "");
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${escapeHTML(reportTitle)}</title>
      ${styles}
    </head>
    <body>
      <div class="export-actions">
        <a class="export-button download-button" href="${pdfDataUrl}" download="${escapeHTML(filename)}" target="_blank" rel="noopener">Download PDF</a>
        <button class="export-button print-button" onclick="window.print()">Print</button>
      </div>
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
