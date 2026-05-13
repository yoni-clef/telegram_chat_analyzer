# 📊 Telegram Chat Analytics

> **Privacy-First | 100% Frontend | Zero Backend**

A modern, beautiful web app for analyzing Telegram chat exports and generating comprehensive analytics dashboards. All processing happens locally in your browser—no servers, no accounts, no data collection.

---

## ✨ Highlights

- 🔒 **Complete Privacy** - Everything runs locally, nothing sent to servers
- ⚡ **Instant Analysis** - No server delays, real-time processing
- 📈 **40+ Metrics** - Deep insights across 7 analytics categories
- 🎨 **Beautiful UI** - Modern dashboard with rich visualizations
- 📱 **Responsive Design** - Works on desktop, tablet, mobile
- 🎬 **Media Viewer** - Browse photos, videos, voice notes with context
- 📥 **Easy Export** - Download as CSV, PDF, or print

---

## 🎯 Dashboard Overview

### 📊 Overview Tab

View at a glance what's happening in your chat:

- 4 Key Summary Cards (messages, participants, avg length, media %)
- Top 5 Contributors with message counts
- Hourly Activity Pattern (24-hour breakdown)
- Word Cloud (top 20 most-used words, sized by frequency)
- Top Reactions (emoji with reactor names)
- Day-of-Week Activity Bar Chart

### 🔍 Detailed Analytics Tab

Deep dive into conversation patterns with 40+ metrics:

**Core Statistics**

- Total messages, unique participants, date range
- Messages per person per day, active days count

**Response Patterns**

- Average reply time, fastest/slowest responses
- Ignored messages count

**Conversation Flow**

- Longest conversation streak
- Longest inactive period
- Peak activity day/hour/month

**Media Breakdown**

- Photos, videos, voice notes, GIFs, stickers, documents, links
- Click any media type to browse and view actual files

**Sentiment Analysis**

- Positive/neutral/negative percentages
- Per-user sentiment breakdown

**Relationship Insights** (5 scores: 0-100)

- Mutual Engagement Score
- Communication Balance
- Interaction Consistency
- Emotional Intensity
- Activity Synchronization

**Top Phrases**

- 15 most recurring 2+ word combinations
- Example usage for context

### 🤖 AI Analysis Tab

Auto-generated insights:

- Relationship Summary
- Communication Style Profile
- Main Topics Discussed (with frequency)
- Key Events & Milestones

### 📥 Export Tab

Download your insights:

- **Analytics CSV** - All metrics in spreadsheet format
- **Messages CSV** - Full message log with metadata
- **PDF Report** - Multi-page professional report
- **Print** - Direct browser print (→ Save as PDF)

---

## 📈 Visualizations

- **Activity Heatmap** - GitHub-style calendar grid (daily messages)
- **Hourly Heatmap** - 24-hour pattern at a glance
- **Word Frequency** - Sized by usage (word cloud)
- **Emoji Breakdown** - Top reactions with user attribution
- **Progress Bars** - Relationship scores and metrics

---

## 🚀 Getting Started

### Prerequisites

- Modern browser (Chrome, Firefox, Safari, Edge)
- Node.js 16+ and npm

### Installation

```bash
# 1. Clone the repo
git clone https://github.com/yoni-clef/telegram_chat_analyzer.git
cd telegram_chat_analyzer

# 2. Install dependencies
npm install
cd frontend && npm install

# 3. Start dev server
npm run dev

# Opens at http://localhost:5173
```

### First Analysis

1. **Export Your Telegram Chat**
   - Open Telegram Desktop
   - Settings → Data and Privacy → Export Telegram data
   - Select "HTML" format
   - Choose the chat(s) to export
   - Save to your computer

2. **Upload to Analyzer**
   - Go to Upload page
   - Click "Choose folder" and select your export
   - Click "Analyze"
   - Wait for processing (a few seconds)

3. **View Your Dashboard**
   - Automatically redirects to analytics
   - Explore all tabs and metrics
   - Click media items to view photos/videos

---

## 📁 Project Structure

```
telegram_chat_analyzer/
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Upload.tsx           # File upload interface
│   │   │   └── Dashboard.tsx        # Main analytics dashboard
│   │   ├── components/
│   │   │   ├── Heatmap.tsx          # Activity visualizations
│   │   │   ├── TimelineViewer.tsx   # Message browser
│   │   │   └── ChartCard.tsx        # Chart components
│   │   ├── services/
│   │   │   ├── telegramParser.ts    # HTML → Messages
│   │   │   ├── analytics.ts         # Basic metrics
│   │   │   ├── advancedAnalytics.ts # 40+ metrics
│   │   │   ├── exportUtils.ts       # CSV/PDF export
│   │   │   └── fileUtils.ts         # File handling
│   │   └── styles.css
│   ├── package.json
│   └── vite.config.ts
└── ChatExport_*/                     # Sample data (for testing)
```

---

## 🧮 Analytics Explained

### What Gets Measured?

**Participation**

- Who talks the most?
- How consistent are people?
- What's the peak activity time?

**Content**

- Most used words
- Emoji reactions and who uses them
- Types of media shared

**Dynamics**

- How fast do people respond?
- Are conversations continuous or sporadic?
- When is everyone most active?

**Sentiment**

- Positive vs. negative tone
- Relationship intensity
- Communication balance between members

---

## 🔐 Privacy & Security

**This app is built for privacy:**

✅ All analysis happens in your browser  
✅ No accounts or login  
✅ No data stored on servers  
✅ Files never leave your computer  
✅ Exports saved locally only  
✅ Works 100% offline after first load

**The only external requests:**

- Loading the web app itself (once)
- Optional: Emoji font from CDN

No telemetry. No tracking. No analytics on your use.

---

## 🛠 Technology Stack

| Layer        | Tech                            |
| ------------ | ------------------------------- |
| **Frontend** | React 18 + TypeScript           |
| **Build**    | Vite                            |
| **Styling**  | Tailwind CSS                    |
| **Routing**  | React Router v6                 |
| **Parsing**  | DOMParser (Browser API)         |
| **Export**   | CSV text generation + Print API |

### Browser APIs Used

- File API (webkitRelativePath for folder access)
- localStorage (temporary data storage)
- DOMParser (HTML parsing)
- URL.createObjectURL (media blob URLs)

---

## 📋 Browser Support

**Works on:**

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

**Requires:**

- ES6+ JavaScript
- File API with folder access
- Modern CSS (Grid, Flexbox)

---

## 🐛 Troubleshooting

### "No messages\*.html files found"

**Issue:** Upload folder doesn't contain HTML files  
**Solution:**

1. Make sure you exported as HTML (not JSON)
2. Check that folder contains `messages.html` or `messages1.html`, etc.
3. Upload the entire folder structure, not just individual files

### Media Not Showing

**Issue:** Photos/videos don't display  
**Solution:**

1. Ensure you uploaded the complete folder
2. Media files should be in `photos/`, `videos/`, etc.
3. Check browser console (F12) for errors
4. Try a fresh upload

### Analysis Takes Too Long

**Issue:** Processing is slow with large chats  
**Solution:**

1. This is normal for chats with 100k+ messages
2. Let it complete (can be 30+ seconds for huge exports)
3. Close other browser tabs to free up memory

### Storage Quota Exceeded

**Issue:** Browser localStorage is full  
**Solution:**

1. Clear browser cache/cookies
2. Use incognito mode for next analysis
3. Try a smaller chat export

---

## 🚀 Production Build

```bash
cd frontend
npm run build
npm run preview
```

Output: Static files in `dist/` folder ready to deploy

**Deploy to:**

- Vercel (zero config)
- Netlify (zero config)
- GitHub Pages
- Any static file host (Cloudflare, S3, etc.)

---

## 💡 Tips & Tricks

**For Best Results:**

- 📌 Use recent chat exports (more consistent format)
- 🎯 Single-chat exports analyze faster than multi-chat
- 💾 Don't refresh during analysis (data will be lost)
- 📊 Use date filters in Detailed tab to zoom in on time periods
- 🎨 Click media to preview, then use browser back button

---

## 📝 Features in Depth

### Media Viewer

- Browse all photos/videos in a chat
- View message context (sender, time, caption)
- See who reacted with what emoji
- Click to open full-size or play video

### Export Options

- **CSV** - Open in Excel/Google Sheets
- **PDF** - Share with others or print
- **Print** - Customizable via browser print settings
- All exports respect active date filters

### Date Filtering

- In Detailed tab, set "From Date" and "To Date"
- All metrics recalculate automatically
- Perfect for analyzing specific periods
- "Clear Filters" button resets everything

---

## 🎨 Design Philosophy

- **Beautiful by default** - No clutter, focused on key metrics
- **Dark-aware** - Respects system dark mode
- **Mobile-first** - Works great on phones
- **Accessible** - Keyboard navigation, ARIA labels
- **Fast** - Local processing = instant feedback

---

## 📞 Support & Feedback

Found a bug? Want a feature?

- 📌 GitHub Issues: [Report here]
- 💭 GitHub Discussions: [Share ideas]
- ⭐ Star this repo if you find it useful!

---

## 📄 License

MIT License - Feel free to use, modify, and share

---

## 🙏 Credits

Built with ❤️ by [Yonatan Ashenafi](https://github.com/yoni-clef)

**Connect:**

- 🔗 [LinkedIn](https://www.linkedin.com/in/yonatan-ashenafi-80a798264/)
- 🐙 [GitHub](https://github.com/yoni-clef)
- 💬 [Telegram](https://t.me/yoni_clef)

Inspired by Telegram's official stats but with a focus on privacy and depth of analysis.

---

<div align="center">

**[⬆ back to top](#)**

Made with React, Tailwind, and a love for data 📊

</div>
