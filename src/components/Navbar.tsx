import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Database, FileText, LogOut, Menu, Search, Sparkles, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Home', icon: Sparkles },
    { path: '/upload', label: 'Upload', icon: Upload },
    { path: '/search', label: 'Search', icon: Search },
    { path: '/library', label: 'Library', icon: Database },
  ];

  const renderNavLink = (item: (typeof navItems)[number], isMobile = false) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Link
        key={item.path}
        to={item.path}
        onClick={() => setIsOpen(false)}
        className={`flex items-center gap-2 rounded-xl font-medium transition-colors ${
          isMobile ? 'h-11 px-3 text-sm' : 'h-10 px-3 text-sm'
        } ${
          isActive
            ? 'bg-zinc-100 text-zinc-950'
            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/85 backdrop-blur-xl border-b border-zinc-800 text-zinc-100 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-16">
        <div className="h-16 grid grid-cols-[1fr_auto] lg:grid-cols-[minmax(230px,1fr)_auto_minmax(230px,1fr)] items-center gap-3">
          <Link to="/" className="min-w-0 flex items-center gap-3 group">
            <span className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-zinc-600 transition-colors shrink-0">
              <FileText className="h-4 w-4 text-zinc-200" />
            </span>
            <span className="min-w-0 truncate font-bold text-base sm:text-lg tracking-tight text-white">
              Hakken <span className="text-zinc-400 font-normal">Intelligence</span>
            </span>
          </Link>

          <nav className="hidden lg:flex items-center justify-center gap-1">
            {navItems.map((item) => renderNavLink(item))}
          </nav>

          <div className="hidden lg:flex items-center justify-end gap-3 min-w-0">
            {user ? (
              <>
                <span className="truncate max-w-48 text-xs text-zinc-400" title={user.email || ''}>
                  {user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="h-9 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 text-xs font-semibold flex items-center gap-2 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="h-9 px-4 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 text-xs font-bold inline-flex items-center justify-center transition-colors"
              >
                Sign in
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="lg:hidden h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-200 flex items-center justify-center"
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {isOpen && (
          <div className="lg:hidden pb-4 space-y-3">
            <nav className="grid grid-cols-2 gap-2">
              {navItems.map((item) => renderNavLink(item, true))}
            </nav>
            <div className="pt-3 border-t border-zinc-800">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs text-zinc-400" title={user.email || ''}>
                    {user.email}
                  </span>
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      signOut();
                    }}
                    className="h-10 px-3 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-100 text-xs font-semibold flex items-center gap-2"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="h-10 w-full rounded-xl bg-zinc-100 text-zinc-950 text-sm font-bold flex items-center justify-center"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
