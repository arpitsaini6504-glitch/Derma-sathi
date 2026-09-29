import React, { useState, useEffect } from 'react';
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
  Wifi,
  WifiOff,
  CheckCircle2,
  PhoneCall,
  ArrowRight,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api';
import { VoiceAssistButton } from './VoiceAssistButton';

interface HeroProps {
  onSelectTab: (tab: string) => void;
}

export const HeroOverview: React.FC<HeroProps> = ({ onSelectTab }) => {
  const { t } = useTranslation();
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    async function checkHealth() {
      const data = await api.getHealthStatus();
      setHealthStatus(data);
    }
    checkHealth();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const featureCards = [
    {
      key: 'skin',
      icon: <Camera size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.skin',
      desc: '3-step photo check with automated focus & illumination gate.',
      actionText: 'Take / Upload Photo'
    },
    {
      key: 'symptoms',
      icon: <Activity size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.symptoms',
      desc: 'Interactive symptom selector with instant clinical red-flag detection.',
      actionText: 'Check Symptoms'
    },
    {
      key: 'emergency',
      icon: <ShieldAlert size={26} style={{ color: 'var(--rose-600)' }} />,
      titleKey: 'nav.emergency',
      desc: 'Urgent check for fever, facial swelling, blistering, or mucosal peeling.',
      actionText: 'Assess Emergency Risk',
      isEmergency: true
    },
    {
      key: 'medicines',
      icon: <Pill size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.medicines',
      desc: 'Verify safe combinations for skin creams, antibiotics, and retinoids.',
      actionText: 'Check Drug Safety'
    },
    {
      key: 'reports',
      icon: <FileText size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.reports',
      desc: 'Organize and preview biopsy reports and diagnostic lab tests.',
      actionText: 'Upload Reports'
    },
    {
      key: 'prescription',
      icon: <FileCheck2 size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.prescription',
      desc: 'Scan written prescriptions to verify dosage and application guidelines.',
      actionText: 'Scan Prescription'
    },
    {
      key: 'lifestyle',
      icon: <Sparkles size={26} style={{ color: 'var(--emerald-500)' }} />,
      titleKey: 'nav.lifestyle',
      desc: 'Skin barrier hydration, sun defense (SPF 30+), and healthy habits.',
      actionText: 'View Barrier Tips'
    },
    {
      key: 'ayurveda',
      icon: <Leaf size={26} style={{ color: 'var(--emerald-500)' }} />,
      titleKey: 'nav.ayurveda',
      desc: 'Prakriti dosha balance, seasonal Ritucharya, and gentle herbal care.',
      actionText: 'Explore Ayurvedic Regimen'
    },
    {
      key: 'facilities',
      icon: <Building2 size={26} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'nav.facilities',
      desc: 'Find District Hospitals, Ayushman Arogya Mandirs, and eSanjeevani Teleconsultation.',
      actionText: 'Find Nearby Care'
    }
  ];

  return (
    <div>
      {/* Low-Digital Literacy Friendly Audio & Hero Banner */}
      <div style={{ textAlign: 'center', padding: '36px 0 24px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span className="badge badge-pending">PAN-INDIA MULTILINGUAL HEALTHCARE</span>
          <span className={`badge ${isOnline ? 'badge-success' : 'badge-emergency'}`}>
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            {isOnline ? t('states.online_badge') : t('states.offline_badge')}
          </span>
          <VoiceAssistButton
            textToSpeak={`${t('app.name')}. ${t('app.tagline')}. You can tap any card below to start a skin analysis, check symptoms, or assess emergency risks.`}
          />
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 4.5vw, 3rem)', lineHeight: 1.18, marginBottom: '14px' }}>
          Multilingual Dermatology &<br />
          <span style={{ color: 'var(--primary-600)' }}>Comprehensive Health Companion</span>
        </h1>

        <p style={{ maxWidth: '640px', margin: '0 auto 20px', color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.5 }}>
          {t('app.tagline')}
        </p>

        {/* Low literacy help pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--primary-50)',
            color: 'var(--primary-700)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.86rem',
            marginBottom: '26px'
          }}
        >
          <HelpCircle size={16} />
          <span>{t('app.low_literacy_tip')}</span>
        </div>

        {/* Primary Action Buttons with Min 48px Touch Targets */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={() => onSelectTab('skin')}
            style={{ minHeight: '52px', padding: '14px 28px', fontSize: '1.05rem', fontWeight: 600 }}
          >
            <Camera size={20} />
            <span>Start Skin Analysis</span>
          </button>

          <button
            className="btn btn-outline"
            onClick={() => onSelectTab('symptoms')}
            style={{ minHeight: '52px', padding: '14px 28px', fontSize: '1.05rem', fontWeight: 600 }}
          >
            <Activity size={20} />
            <span>Symptom Triage</span>
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
            aria-label={`${t(card.titleKey)}: ${card.desc}`}
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
                {card.desc}
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
              <span>{card.actionText}</span>
              <ArrowRight size={16} />
            </div>
          </div>
        ))}
      </div>

      {/* Backend & Clinical Systems Status */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          backgroundColor: 'hsl(210, 40%, 98%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              backgroundColor: healthStatus?.status === 'online' ? 'hsl(150, 70%, 90%)' : 'hsl(38, 90%, 90%)',
              color: healthStatus?.status === 'online' ? 'var(--emerald-500)' : 'var(--amber-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem' }}>DERMASATHIAI Clinical System: Active</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              FastAPI v1 • OpenCV Quality Gate • Safe Abstention Enforced
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span className="badge badge-success">8-Stage Pipeline: Operational</span>
          <span className="badge badge-pending">Model Store: Awaiting Weights</span>
        </div>
      </div>
    </div>
  );
};
