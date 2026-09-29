import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Type, Eye, Wifi, Volume2, Globe, Check } from 'lucide-react';
import { LanguageSelector } from '../common/LanguageSelector';

export const SettingsModule: React.FC = () => {
  const { t } = useTranslation();
  const [fontSize, setFontSize] = useState<string>(() => {
    return localStorage.getItem('dermasathi_font_size') || 'normal';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('dermasathi_high_contrast') === 'true';
  });
  const [lowBandwidth, setLowBandwidth] = useState<boolean>(() => {
    return localStorage.getItem('dermasathi_low_bandwidth') === 'true';
  });

  const applyFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem('dermasathi_font_size', size);
    if (size === 'large') {
      document.documentElement.style.fontSize = '18px';
    } else if (size === 'xlarge') {
      document.documentElement.style.fontSize = '20px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  };

  const toggleHighContrast = (val: boolean) => {
    setHighContrast(val);
    localStorage.setItem('dermasathi_high_contrast', val ? 'true' : 'false');
    if (val) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
  };

  const toggleLowBandwidth = (val: boolean) => {
    setLowBandwidth(val);
    localStorage.setItem('dermasathi_low_bandwidth', val ? 'true' : 'false');
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('settings.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('settings.subtitle')}</p>
      </div>

      {/* Visual Accessibility */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Type size={20} style={{ color: 'var(--primary-600)' }} />
          {t('settings.accessibility_heading')}
        </h3>

        <div className="form-group">
          <label className="form-label">{t('settings.font_size')}</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
            <button
              type="button"
              className={`btn ${fontSize === 'normal' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => applyFontSize('normal')}
              style={{ minHeight: '48px', fontSize: '0.9rem' }}
            >
              {t('settings.font_normal')}
            </button>
            <button
              type="button"
              className={`btn ${fontSize === 'large' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => applyFontSize('large')}
              style={{ minHeight: '48px', fontSize: '1rem' }}
            >
              {t('settings.font_large')}
            </button>
            <button
              type="button"
              className={`btn ${fontSize === 'xlarge' ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => applyFontSize('xlarge')}
              style={{ minHeight: '48px', fontSize: '1.1rem', fontWeight: 700 }}
            >
              {t('settings.font_xlarge')}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <div>
            <strong style={{ fontSize: '0.95rem' }}>{t('settings.contrast_mode')}</strong>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Enhance borders and text legibility</p>
          </div>
          <input
            type="checkbox"
            checked={highContrast}
            onChange={(e) => toggleHighContrast(e.target.checked)}
            style={{ width: '22px', height: '22px', cursor: 'pointer' }}
          />
        </div>
      </div>

      {/* Language */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Globe size={20} style={{ color: 'var(--primary-600)' }} />
          {t('settings.language_heading')}
        </h3>
        <LanguageSelector />
      </div>

      {/* Low-Bandwidth Mode */}
      <div className="glass-card">
        <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Wifi size={20} style={{ color: 'var(--primary-600)' }} />
          {t('settings.bandwidth_heading')}
        </h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          {t('settings.bandwidth_desc')}
        </p>
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', cursor: 'pointer', minHeight: '48px' }}>
          <input
            type="checkbox"
            checked={lowBandwidth}
            onChange={(e) => toggleLowBandwidth(e.target.checked)}
            style={{ width: '20px', height: '20px' }}
          />
          <span>Enable aggressive image compression on slow 2G/3G networks</span>
        </label>
      </div>
    </div>
  );
};
