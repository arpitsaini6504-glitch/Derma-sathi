import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Activity,
  Pill,
  Leaf,
  ShieldAlert,
  Building2,
  FileText,
  FileCheck2,
  Sparkles,
  PhoneCall,
  ArrowRight
} from 'lucide-react';

interface HeroProps {
  onSelectTab: (tab: string) => void;
}

export const HeroOverview: React.FC<HeroProps> = ({ onSelectTab }) => {
  const { t } = useTranslation();

  const featureCards = [
    {
      key: 'skin',
      icon: <Camera size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.skin',
      descKey: 'home.card_skin_desc',
      actionKey: 'home.action_skin_btn'
    },
    {
      key: 'symptoms',
      icon: <Activity size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.symptoms',
      descKey: 'home.card_symptoms_desc',
      actionKey: 'home.action_symptoms_btn'
    },
    {
      key: 'emergency',
      icon: <ShieldAlert size={26} style={{ color: 'var(--rose-600)' }} />,
      titleKey: 'nav.emergency',
      descKey: 'home.card_emergency_desc',
      actionKey: 'home.action_emergency_btn',
      isEmergency: true
    },
    {
      key: 'medicines',
      icon: <Pill size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.medicines',
      descKey: 'home.card_medicines_desc',
      actionKey: 'home.action_medicines_btn'
    },
    {
      key: 'reports',
      icon: <FileText size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.reports',
      descKey: 'home.card_reports_desc',
      actionKey: 'home.action_reports_btn'
    },
    {
      key: 'prescription',
      icon: <FileCheck2 size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.prescription',
      descKey: 'home.card_prescription_desc',
      actionKey: 'home.action_prescription_btn'
    },
    {
      key: 'lifestyle',
      icon: <Sparkles size={26} style={{ color: 'var(--emerald-500)' }} />,
      titleKey: 'nav.lifestyle',
      descKey: 'home.card_lifestyle_desc',
      actionKey: 'home.action_lifestyle_btn'
    },
    {
      key: 'ayurveda',
      icon: <Leaf size={26} style={{ color: 'var(--emerald-500)' }} />,
      titleKey: 'nav.ayurveda',
      descKey: 'home.card_ayurveda_desc',
      actionKey: 'home.action_ayurveda_btn'
    },
    {
      key: 'facilities',
      icon: <Building2 size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.facilities',
      descKey: 'home.card_facilities_desc',
      actionKey: 'home.action_facilities_btn'
    }
  ];

  return (
    <div>
      {/* Low-Digital Literacy Friendly Audio & Hero Banner */}
      <div style={{ textAlign: 'center', padding: '36px 0 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badge-pending">{t('home.badge_healthcare', 'PAN-INDIA MULTILINGUAL HEALTHCARE')}</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.18, marginBottom: '14px' }}>
          {t('home.hero_title_part1', 'Multilingual Dermatology &')}<br />
          <span style={{ color: 'var(--primary-600)' }}>{t('home.hero_title_part2', 'Comprehensive Health Companion')}</span>
        </h1>

        <p style={{ maxWidth: '640px', margin: '0 auto 20px', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>
          {t('app.tagline')}
        </p>

        {/* Primary Action Buttons with Min 48px Touch Targets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => onSelectTab('skin')}
            style={{ minHeight: '52px', padding: '14px 28px', fontSize: '1.05rem', fontWeight: 600 }}
          >
            <Camera size={20} />
            <span>{t('home.btn_start_skin', 'Start Skin Analysis')}</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={() => onSelectTab('symptoms')}
            style={{ minHeight: '52px', padding: '14px 28px', fontSize: '1.05rem', fontWeight: 600 }}
          >
            <Activity size={20} />
            <span>{t('home.btn_symptom_triage', 'Symptom Triage')}</span>
          </button>
        </div>
      </div>

      {/* Grid of Healthcare Navigation Cards (Accessible min 48px touch targets) */}
      <div className="grid-3" style={{ marginBottom: '36px' }}>
        {featureCards.map((card) => (
          <div
            key={card.key}
            className={`glass-card ${card.isEmergency ? 'emergency-card-highlight' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              minHeight: '190px'
            }}
            onClick={() => onSelectTab(card.key)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onSelectTab(card.key)}
            aria-label={`${t(card.titleKey)}: ${t(card.descKey)}`}
          >
            <div>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  backgroundColor: card.isEmergency ? 'hsl(350, 100%, 94%)' : 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px'
                }}
              >
                {card.icon}
              </div>

              <h3 style={{ fontSize: '1.15rem', marginBottom: '6px', color: card.isEmergency ? 'var(--rose-600)' : 'var(--text-main)' }}>
                {t(card.titleKey)}
              </h3>

              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                {t(card.descKey)}
              </p>
            </div>

            <div
              style={{
                marginTop: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: card.isEmergency ? 'var(--rose-600)' : 'var(--primary-600)',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: '44px'
              }}
            >
              <span>{t(card.actionKey)}</span>
              <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
