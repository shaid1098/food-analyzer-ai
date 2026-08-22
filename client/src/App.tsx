import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Shield, Sparkles, LayoutDashboard, History as HistoryIcon, HelpCircle, Activity } from 'lucide-react';
import Home from './pages/Home.jsx';
import Result from './pages/Result.jsx';
import History from './pages/History.jsx';
import Evaluation from './pages/Evaluation.jsx';
import About from './pages/About.jsx';

function Navigation() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Scanner', icon: Activity },
    { path: '/history', label: 'History', icon: HistoryIcon },
    { path: '/evaluation', label: 'Evaluation', icon: LayoutDashboard },
    { path: '/about', label: 'Architecture', icon: HelpCircle },
  ];

  return (
    <nav className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 flex justify-between items-center h-16">
        <Link to="/" className="flex items-center gap-2 text-white font-extrabold text-lg tracking-wider hover:opacity-90">
          <Shield className="text-purple-500 w-6 h-6 fill-purple-500/10" />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-purple-400">
            FoodVerify AI
          </span>
        </Link>

        <div className="flex items-center gap-1 md:gap-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-650/15 border border-purple-500/30 text-purple-400'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 border border-transparent'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navigation />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/result" element={<Result />} />
            <Route path="/history" element={<History />} />
            <Route path="/evaluation" element={<Evaluation />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>

        <footer className="border-t border-slate-900 py-6 bg-slate-950/40 text-center text-xs text-slate-500 font-semibold tracking-wide">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              &copy; {new Date().getFullYear()} FoodVerify AI. All rights reserved.
            </div>
            <div className="flex items-center gap-1.5 text-purple-400">
              <Sparkles className="w-3.5 h-3.5" /> Hackathon Prototype • Powered by Gemini Vision API
            </div>
          </div>
        </footer>
      </div>
    </Router>
  );
}
