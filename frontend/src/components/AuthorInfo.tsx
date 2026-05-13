import { FaLinkedin, FaGithub, FaTelegram } from "react-icons/fa";

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
          className="p-2 hover:bg-blue-50 rounded-lg transition text-blue-600 hover:text-blue-700"
          title="LinkedIn"
        >
          <FaLinkedin size={18} />
        </a>
        <a
          href="https://github.com/yoni-clef"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-slate-100 rounded-lg transition text-ink/60 hover:text-ink"
          title="GitHub"
        >
          <FaGithub size={18} />
        </a>
        <a
          href="https://t.me/yoni_clef"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 hover:bg-sky-50 rounded-lg transition text-sky-600 hover:text-sky-700"
          title="Telegram"
        >
          <FaTelegram size={18} />
        </a>
      </div>
    </div>
  );
}
