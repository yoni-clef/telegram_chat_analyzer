export function InstructionsCard() {
  return (
    <div className="bg-gradient-to-br from-accent/5 to-accent/10 border border-accent/20 rounded-xl p-6 mt-6">
      <h2 className="text-lg font-semibold text-ink mb-4">📋 How to Use</h2>
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent">
            1
          </div>
          <div>
            <p className="font-medium text-sm text-ink">Export Your Telegram Chat</p>
            <p className="text-xs text-ink/60 mt-1">
              Open Telegram Desktop → Settings → Data and Privacy → Export Telegram data → Select HTML format
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent">
            2
          </div>
          <div>
            <p className="font-medium text-sm text-ink">Upload the Folder</p>
            <p className="text-xs text-ink/60 mt-1">
              Click "Choose folder" and select your exported chat folder (it should contain messages.html files)
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent">
            3
          </div>
          <div>
            <p className="font-medium text-sm text-ink">Click Analyze</p>
            <p className="text-xs text-ink/60 mt-1">
              Wait for processing (a few seconds). All analysis happens locally in your browser - no data is uploaded to servers.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-sm font-semibold text-accent">
            4
          </div>
          <div>
            <p className="font-medium text-sm text-ink">Explore Your Dashboard</p>
            <p className="text-xs text-ink/60 mt-1">
              View 40+ metrics, visualizations, AI insights, and export your report as CSV or PDF
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-white rounded-lg border border-accent/10">
        <p className="text-xs text-ink/70">
          <span className="font-semibold">💡 Tip:</span> Your data stays completely private - everything is processed locally in your browser with zero server uploads.
        </p>
      </div>
    </div>
  );
}
