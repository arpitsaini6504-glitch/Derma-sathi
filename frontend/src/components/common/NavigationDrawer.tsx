import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Home,
  Activity,
  Camera,
  FileText,
  FileCheck2,
  Pill,
  Sparkles,
  Leaf,
  ShieldAlert,
  User,
  Settings,
  Building2,
  ChevronRight
} from 'lucide-react';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  onSelectTab
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const allDestinations = [
    { key: 'home', labelKey: 'nav.home', desc: 'Overview and rapid health check', icon: <Home size={22} color="var(--primary-600)" /> },
    { key: 'symptoms', labelKey: 'nav.symptoms', desc: 'Identify symptoms & red flags', icon: <Activity size={22} color="var(--primary-600)" /> },
    { key: 'skin', labelKey: 'nav.skin', desc: '8-stage clinical photo evaluation', icon: <Camera size={22} color="var(--primary-600)" /> },
    { key: 'reports', labelKey: 'nav.reports', desc: 'Biopsy and pathology test reports', icon: <FileText size={22} color="var(--primary-600)" /> },
    { key: 'prescription', labelKey: 'nav.prescription', desc: 'Prescription scan & dosage check', icon: <FileCheck2 size={22} color="var(--primary-600)" /> },
    { key: 'medicines', labelKey: 'nav.medicines', desc: 'Drug interactions & allergy safety', icon: <Pill size={22} color="var(--primary-600)" /> },
    { key: 'lifestyle', labelKey: 'nav.lifestyle', desc: 'Barrier hydration & daily habits', icon: <Sparkles size={22} color="var(--emerald-500)" /> },
    { key: 'ayurveda', labelKey: 'nav.ayurveda', desc: 'Prakriti dosha balance & Ritucharya', icon: <Leaf size={22} color="var(--emerald-500)" /> },
    { key: 'emergency', labelKey: 'nav.emergency', desc: 'Immediate red-flag danger triage', icon: <ShieldAlert size={22} color="var(--rose-600)" />, isEmergency: true },
    { key: 'profile', labelKey: 'nav.profile', desc: 'Language, account & history', icon: <User size={22} color="var(--primary-600)" /> },
    { key: 'settings', labelKey: 'nav.settings', desc: 'Text size, contrast & low bandwidth', icon: <Settings size={22} color="var(--text-muted)" /> }
  ];

  const handleItemClick = (key: string) => {
    onSelectTab(key);
    onClose();
  };

  return (
    <div
      className="drawer-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Application Navigation Menu"
    >
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--primary-600)' }}>DERMASATHIAI</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {t('app.tagline')}
            </p>
          </div>
          <button
            className="btn btn-outline"
            onClick={onClose}
            aria-label="Close Navigation Menu"
            style={{ minWidth: '48px', minHeight: '48px', padding: '10px' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-items-list">
          {allDestinations.map((dest) => {
            const isActive = currentTab === dest.key;
            return (
              <button
                key={dest.key}
                className={`drawer-nav-item ${isActive ? 'active' : ''} ${dest.isEmergency ? 'emergency-drawer-item' : ''}`}
                onClick={() => handleItemClick(dest.key)}
                style={{ minHeight: '56px' }}
              >
                <div className="drawer-item-icon">{dest.icon}</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.96rem' }}>{t(dest.labelKey)}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{dest.desc}</div>
                </div>
                <ChevronRight size={18} style={{ opacity: 0.5 }} />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
