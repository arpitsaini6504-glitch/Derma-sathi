import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Activity, Moon, Sun, User as UserIcon } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab, onOpenAuth }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const navItems = [
    { key: 'skin', labelKey: 'nav.skin_analysis' },
    { key: 'symptoms', labelKey: 'nav.symptoms' },
    { key: 'medications', labelKey: 'nav.medications' },
    { key: 'wellness', labelKey: 'nav.wellness' },
    { key: 'emergency', labelKey: 'nav.emergency' },
    { key: 'facilities', labelKey: 'nav.facilities' }
  ];

  return (
    <header className="navbar">
      <div className="container nav-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <a
            href="#home"
            className="brand"
            onClick={(e) => {
              e.preventDefault();
              onSelectTab('home');
            }}
          >
            <div className="brand-icon">
              <Activity size={22} />
            </div>
            <div>
              <span style={{ fontWeight: 700, fontSize: '1.2rem', letterSpacing: '-0.02em', color: 'var(--primary-600)' }}>
                DERMA<span style={{ color: 'var(--text-main)' }}>SATHI</span>
              </span>
              <span style={{ fontSize: '0.68rem', display: 'block', color: 'var(--text-muted)', lineHeight: 1 }}>
                AI HEALTH COMPANION
              </span>
            </div>
          </a>

          <nav className="desktop-nav">
            <ul className="nav-links">
              {navItems.map((item) => (
                <li key={item.key}>
                  <button
                    className={`nav-link ${currentTab === item.key ? 'active' : ''}`}
                    onClick={() => onSelectTab(item.key)}
                  >
                    {t(item.labelKey)}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <LanguageSelector />

          <button
            className="btn btn-outline"
            onClick={toggleTheme}
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{user?.full_name}</span>
              <button
                className="btn btn-outline"
                onClick={logout}
                style={{ fontSize: '0.8rem', padding: '4px 10px' }}
              >
                {t('nav.logout')}
              </button>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onOpenAuth}
              style={{ fontSize: '0.88rem', padding: '6px 14px' }}
            >
              <UserIcon size={16} />
              <span>{t('nav.login')}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
