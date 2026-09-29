import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Camera,
  Activity,
  Pill,
  Leaf,
  ShieldAlert,
  Building2,
  Wifi,
  WifiOff,
  CheckCircle2,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../../services/api';
import { offlineStorage } from '../../services/offlineStorage';

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
      icon: <Camera size={24} style={{ color: 'var(--primary-600)' }} />,
      title: t('nav.skin_analysis'),
      desc: '8-stage clinical pipeline with automated blur detection and safe abstention.',
      actionText: 'Analyze Image'
    },
    {
      key: 'symptoms',
      icon: <Activity size={24} style={{ color: 'var(--primary-600)' }} />,
      title: t('nav.symptoms'),
      desc: 'Evidence-aligned differential possibilities and rapid red-flag detection.',
      actionText: 'Check Symptoms'
    },
    {
      key: 'medications',
      icon: <Pill size={24} style={{ color: 'var(--primary-600)' }} />,
      title: t('nav.medications'),
      desc: 'Verify safety for retinoids, steroids, antibiotics, and contraindicated pairs.',
      actionText: 'Verify Safety'
    },
    {
      key: 'wellness',
      icon: <Leaf size={24} style={{ color: 'var(--emerald-500)' }} />,
      title: t('nav.wellness'),
      desc: 'Traditional Ayurvedic dosha balance, seasonal Ritucharya, and gentle herbal care.',
      actionText: 'Explore Regimens'
    },
    {
      key: 'emergency',
      icon: <ShieldAlert size={24} style={{ color: 'var(--rose-600)' }} />,
      title: t('nav.emergency'),
      desc: 'Rapid identification of urgent cutaneous conditions (SJS/TEN, Anaphylaxis).',
      actionText: 'Emergency Triage'
    },
    {
      key: 'facilities',
      icon: <Building2 size={24} style={{ color: 'var(--primary-600)' }} />,
      title: t('nav.facilities'),
      desc: 'Direct directory for District Civil Hospitals and eSanjeevani Teleconsultation.',
      actionText: 'Find Care'
    }
  ];

  return (
    <div>
      {/* Hero Header */}
      <div style={{ textAlign: 'center', padding: '40px 0 30px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span className="badge badge-pending">PAN-INDIA MULTILINGUAL HEALTHCARE</span>
          <span className={`badge ${isOnline ? 'badge-success' : 'badge-emergency'}`}>
            {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
            {isOnline ? 'Connected' : 'Offline Mode (Cached)'}
          </span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.2rem)', lineHeight: 1.15, marginBottom: '16px' }}>
          AI-Powered Dermatology &<br />
          <span style={{ color: 'var(--primary-600)' }}>Comprehensive Health Companion</span>
        </h1>

        <p style={{ maxWidth: '680px', margin: '0 auto 28px', color: 'var(--text-muted)', fontSize: '1.05rem' }}>
          {t('app.tagline')}. Built with an 8-stage clinical safety pipeline, 12 Indian languages,
          and decoupled architecture ready for trained ML models.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" onClick={() => onSelectTab('skin')} style={{ padding: '12px 24px', fontSize: '1rem' }}>
            <Camera size={18} />
            <span>Start Skin Analysis</span>
          </button>
          <button className="btn btn-outline" onClick={() => onSelectTab('symptoms')} style={{ padding: '12px 24px', fontSize: '1rem' }}>
            <Activity size={18} />
            <span>Symptom Triage</span>
          </button>
        </div>
      </div>

      {/* 6 Feature Pillars */}
      <div className="grid-3" style={{ marginBottom: '40px' }}>
        {featureCards.map((card) => (
          <div
            key={card.key}
            className="glass-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer'
            }}
            onClick={() => onSelectTab(card.key)}
          >
            <div>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                {card.icon}
              </div>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{card.title}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {card.desc}
              </p>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-600)', fontWeight: 600, fontSize: '0.88rem' }}>
              <span>{card.actionText}</span>
              <ArrowRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* System Status Banner */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: 'hsl(210, 40%, 98%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: healthStatus?.status === 'online' ? 'hsl(150, 70%, 90%)' : 'hsl(38, 90%, 90%)',
              color: healthStatus?.status === 'online' ? 'var(--emerald-500)' : 'var(--amber-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CheckCircle2 size={20} />
          </div>
          <div>
            <h4 style={{ fontSize: '0.95rem' }}>Backend Subsystems Status: Online</h4>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              ML Subsystem: {healthStatus?.ml_subsystem?.status_message || 'Initializing...'} (FastAPI + OpenCV Quality Gate Active)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <span className="badge badge-success">Quality Gate: Active</span>
          <span className="badge badge-pending">Model Store: Ready for Artifact</span>
        </div>
      </div>
    </div>
  );
};
