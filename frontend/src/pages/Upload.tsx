import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { loadHtmlFiles, formatFileSize, formatDateRange } from "../services/fileUtils";
import { parseHtmlFile, aggregateMessages } from "../services/telegramParser";
import { analyzeChat } from "../services/analytics";

export function UploadPage() {
  const [files, setFiles] = useState<File[] | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  function handleSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const fileList = event.target.files;
    if (fileList) {
      const selectedFiles = Array.from(fileList);
      // Keep ALL files (not just HTML) so we can map media files
      setFiles(selectedFiles);
      setStatus(null);
    }
  }

  function resetInputs() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (folderInputRef.current) {
      folderInputRef.current.value = "";
    }
  }

  async function handleAnalyze(event: React.FormEvent) {
    event.preventDefault();
    if (!files || files.length === 0) {
      setStatus("Please select a file or folder.");
      return;
    }

    setIsAnalyzing(true);
    setStatus("Analyzing chat data...");

    try {
      // Load and parse HTML files
      const allMessages = await loadHtmlFiles(files);
      
      // Aggregate data
      const chatData = aggregateMessages(allMessages);
      
      // Run analytics
      const analytics = analyzeChat(chatData);
      
      // Store in localStorage for dashboard
      localStorage.setItem("chatAnalytics", JSON.stringify({
        chatData,
        analytics,
        timestamp: new Date().toISOString(),
      }));
      
      setStatus("Analysis complete! Redirecting to dashboard...");
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);
      
      setFiles(null);
      resetInputs();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Analysis failed";
      setStatus(`Analysis failed: ${message}`);
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-2xl shadow-sm">
      <h1 className="text-xl font-semibold">Analyze Telegram Chat</h1>
      <p className="text-sm text-ink/60 mt-1">Upload a Telegram HTML export folder for instant local analysis.</p>
      <form className="mt-4 space-y-3" onSubmit={handleAnalyze}>
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          accept=".json,.zip,.html"
          multiple
          onChange={handleSelect}
        />
        <input
          ref={folderInputRef}
          className="hidden"
          type="file"
          webkitdirectory="true"
          directory="true"
          multiple
          onChange={handleSelect}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            className="rounded-lg border px-4 py-2 text-ink disabled:opacity-50"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            Choose file
          </button>
          <button
            className="rounded-lg border px-4 py-2 text-ink disabled:opacity-50"
            type="button"
            onClick={() => folderInputRef.current?.click()}
            disabled={isAnalyzing}
          >
            Choose folder
          </button>
        </div>
        <button 
          className="w-full rounded-lg bg-accent px-4 py-2 text-white disabled:opacity-50" 
          type="submit"
          disabled={isAnalyzing || !files}
        >
          {isAnalyzing ? "Analyzing..." : "Analyze"}
        </button>
        {files && (
          <div className="text-xs text-ink/60">
            {files.length} file(s) selected
            {files.length > 0 && (
              <div className="mt-2 space-y-1">
                {files.slice(0, 3).map((f) => (
                  <div key={f.name}>{f.name} ({formatFileSize(f.size)})</div>
                ))}
                {files.length > 3 && <div className="text-ink/40">... and {files.length - 3} more</div>}
              </div>
            )}
          </div>
        )}
        {status && (
          <div className={`text-sm p-2 rounded ${status.includes("failed") ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"}`}>
            {status}
          </div>
        )}
      </form>
    </div>
  );
}
