import React from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Sun, Droplets, Moon, CheckCircle2 } from 'lucide-react';
import { VoiceAssistButton } from '../common/VoiceAssistButton';

export const LifestyleModule: React.FC = () => {
  const { t } = useTranslation();

  const lifestylePillars = [
    {
      key: 'barrier',
      icon: <Shield size={24} style={{ color: 'var(--primary-600)' }} />,
      titleKey: 'lifestyle.barrier_title',
      descKey: 'lifestyle.barrier_desc',
      tips: [
        'Use soap-free synthetic detergent (syndet) bars with neutral pH (5.5).',
        'Avoid physical scrubs or loofahs that strip natural stratum corneum lipids.',
        'Apply ceramide- or squalane-based emollients immediately after bathing.'
      ]
    },
    {
      key: 'sun',
      icon: <Sun size={24} style={{ color: 'var(--amber-500)' }} />,
      titleKey: 'lifestyle.sun_title',
      descKey: 'lifestyle.sun_desc',
      tips: [
        'Apply broad-spectrum sunscreen (PA+++ or higher) 15 minutes before stepping out.',
        'Reapply every 2-3 hours if sweating or during prolonged sun exposure.',
        'Use wide-brim umbrellas or hats during peak UV index hours (11:00 AM - 3:00 PM).'
      ]
    },
    {
      key: 'hydration',
      icon: <Droplets size={24} style={{ color: 'var(--primary-500)' }} />,
      titleKey: 'lifestyle.hydration_title',
      descKey: 'lifestyle.hydration_desc',
      tips: [
        'Consume 2.5 - 3 liters of water across the day.',
        'Include hydrating foods: cucumber, tender coconut water, and watermelons.',
        'Limit excessive caffeine and sugary sodas that accelerate cutaneous water loss.'
      ]
    },
    {
      key: 'sleep',
      icon: <Moon size={24} style={{ color: 'var(--emerald-500)' }} />,
      titleKey: 'lifestyle.sleep_title',
      descKey: 'lifestyle.sleep_desc',
      tips: [
        'Aim for 7 to 8 hours of uninterrupted nocturnal sleep.',
        'Nighttime is when peak epidermal barrier cell regeneration and repair occurs.',
        'Wash pillowcases twice weekly with mild hypoallergenic detergent.'
      ]
    }
  ];

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
          <h2>{t('lifestyle.title')}</h2>
          <VoiceAssistButton
            textToSpeak="Lifestyle and skin barrier protection guidelines. Follow gentle skincare, daily photoprotection with SPF, proper hydration, and restful sleep."
          />
        </div>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('lifestyle.subtitle')}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {lifestylePillars.map((p) => (
          <div key={p.key} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
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
                  marginBottom: '14px'
                }}
              >
                {p.icon}
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t(p.titleKey)}</h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: 1.5 }}>
                {t(p.descKey)}
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
              <h4 style={{ fontSize: '0.84rem', color: 'var(--primary-700)', marginBottom: '6px' }}>Actionable Habits:</h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {p.tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
