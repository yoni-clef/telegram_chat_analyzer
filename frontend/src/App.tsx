import { Routes, Route, NavLink } from "react-router-dom";
import { DashboardPage } from "./pages/Dashboard";
import { UploadPage } from "./pages/Upload";
import { AuthorInfo } from "./components/AuthorInfo";

export function App() {
  return (
    <div className="min-h-screen bg-haze text-ink">
      <header className="flex items-center justify-between px-6 py-4 bg-white shadow-sm">
        <div className="text-xl font-semibold text-ocean">Telegram Analytics</div>
        <nav className="flex gap-4 text-sm">
          <NavLink to="/dashboard" className="hover:text-accent">
            Dashboard
          </NavLink>
          <NavLink to="/upload" className="hover:text-accent">
            Upload
          </NavLink>
        </nav>
        <AuthorInfo />
      </header>

      <main className="px-6 py-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  );
}
