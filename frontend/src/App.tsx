import { Routes, Route, NavLink } from "react-router-dom";
import { DashboardPage } from "./pages/Dashboard";
import { UploadPage } from "./pages/Upload";
import { AuthorInfo } from "./components/AuthorInfo";

export function App() {
  return (
    <div className="min-h-screen bg-haze text-ink">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 bg-white shadow-sm gap-3 sm:gap-0">
        <div className="text-lg sm:text-xl font-semibold text-ocean">Telegram Chat Analytics</div>
        <nav className="flex gap-4 text-xs sm:text-sm order-3 sm:order-2">
          <NavLink to="/dashboard" className="hover:text-accent">
            Dashboard
          </NavLink>
          <NavLink to="/upload" className="hover:text-accent">
            Upload
          </NavLink>
        </nav>
        <div className="order-2 sm:order-3">
          <AuthorInfo />
        </div>
      </header>

      <main className="px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/upload" element={<UploadPage />} />
        </Routes>
      </main>
    </div>
  );
}
