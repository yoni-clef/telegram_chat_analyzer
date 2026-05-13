export function AuthorInfo() {
  return (
    <div className="flex items-center gap-6">
      <div className="text-right">
        <p className="text-xs text-ink/60">Built by</p>
        <p className="text-sm font-medium text-ink">Yonatan Ashenafi</p>
      </div>
      <div className="flex gap-3">
        <a
          href="https://www.linkedin.com/in/yonatan-ashenafi-80a798264/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl hover:scale-110 transition hover:opacity-80"
          title="LinkedIn"
        >
          �
        </a>
        <a
          href="https://github.com/yoni-clef"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl hover:scale-110 transition hover:opacity-80"
          title="GitHub"
        >
          🐙
        </a>
        <a
          href="https://t.me/yoni_clef"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xl hover:scale-110 transition hover:opacity-80"
          title="Telegram"
        >
          ✈️
        </a>
      </div>
    </div>
  );
}
