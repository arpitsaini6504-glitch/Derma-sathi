import React, { useState } from 'react';
import { Activity, Menu, Sun, Moon } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';

interface TopAppBarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onToggleDrawer: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({ currentTab, onSelectTab, onToggleDrawer }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <header className="navbar" role="banner">
      <div className="container nav-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            className="btn btn-outline"
            onClick={onToggleDrawer}
            aria-label="Open Navigation Menu"
            style={{
              minWidth: '48px',
              minHeight: '48px',
              padding: '10px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={22} />
          </button>

          <a
            href="#home"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('home');
            }}
            style={{ minHeight: '48px', display: 'flex', alignItems: 'center' }}
          >
            <div className="brand-icon" style={{ minWidth: '40px', minHeight: '40px' }}>
              <Activity size={24} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em', color: 'var(--primary-600)' }}>
                DERMA<span style={{ color: 'var(--text-main)' }}>SATHI</span>
              </span>
              <span style={{ fontSize: '0.72rem', display: 'block', color: 'var(--text-muted)', lineHeight: 1 }}>
                AI HEALTH COMPANION
              </span>
            </div>
          </a>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Prominent Language Selector with accessible touch target */}
          <LanguageSelector />

          {/* Dark / Light toggle */}
          <button
            className="btn btn-outline"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            style={{
              minWidth: '48px',
              minHeight: '48px',
              padding: '10px',
              borderRadius: 'var(--radius-md)'
            }}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};
