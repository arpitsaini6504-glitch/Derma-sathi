import React from 'react';
import { Home, Activity, Camera, Pill, ShieldAlert, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onToggleDrawer: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onSelectTab, onToggleDrawer }) => {
  const { t } = useTranslation();

  const navItems = [
    { key: 'home', labelKey: 'nav.home', icon: <Home size={22} /> },
    { key: 'symptoms', labelKey: 'nav.symptoms', icon: <Activity size={22} /> },
    { key: 'skin', labelKey: 'nav.skin', icon: <Camera size={22} /> },
    { key: 'medicines', labelKey: 'nav.medicines', icon: <Pill size={22} /> },
    { key: 'emergency', labelKey: 'nav.emergency', icon: <ShieldAlert size={22} />, isEmergency: true }
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile Bottom Navigation">
      <div className="bottom-nav-container">
        {navItems.map((item) => {
          const isActive = currentTab === item.key;
          return (
            <button
              key={item.key}
              className={`bottom-nav-item ${isActive ? 'active' : ''} ${item.isEmergency ? 'emergency-item' : ''}`}
              onClick={() => onSelectTab(item.key)}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="bottom-nav-icon">{item.icon}</div>
              <span className="bottom-nav-label">{t(item.labelKey)}</span>
            </button>
          );
        })}

        {/* More Options Button */}
        <button
          className="bottom-nav-item"
          onClick={onToggleDrawer}
          aria-label={t('nav.more')}
        >
          <div className="bottom-nav-icon"><MoreHorizontal size={22} /></div>
          <span className="bottom-nav-label">{t('nav.more')}</span>
        </button>
      </div>
    </nav>
  );
};
