import React from 'react'
import { Routes, Route, Link, NavLink } from 'react-router-dom'
import Home from './pages/Home'
import CreateMystery from './pages/CreateMystery'
import InvestigationRoom from './pages/InvestigationRoom'
import Accusation from './pages/Accusation'
import Results from './pages/Results'
import NotFound from './pages/NotFound'
import { ToastProvider } from './components/Toast'
import { Search, Plus } from 'lucide-react'

export const App = () => (
  <ToastProvider>
    <div className="min-h-screen bg-surface-bg text-ghost font-sans flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-40 border-b border-white/6 bg-surface-bg/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="AI Mystery Room home">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber to-amber-dark flex items-center justify-center shadow-amber-glow-sm">
              <Search className="w-4 h-4 text-surface-bg" />
            </div>
            <span className="font-serif font-bold text-lg text-ghost group-hover:text-amber transition-colors">
              AI Mystery <span className="text-amber-gradient">Room</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3">
            <NavLink
              to="/create"
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold min-h-[44px] transition-all duration-200 ${
                  isActive
                    ? 'btn-primary shadow-amber-glow-sm'
                    : 'btn-ghost'
                }`
              }
            >
              <Plus className="w-4 h-4" /> New Mystery
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateMystery />} />
          <Route path="/case/:id" element={<InvestigationRoom />} />
          <Route path="/case/:id/accuse" element={<Accusation />} />
          <Route path="/case/:id/result" element={<Results />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="relative z-10 border-t border-white/6 py-6 text-center">
        <p className="text-xs text-muted font-mono">AI Mystery Room &bull; Powered by Google Gemini &bull; Built with ♥</p>
      </footer>
    </div>
  </ToastProvider>
)
export default App
