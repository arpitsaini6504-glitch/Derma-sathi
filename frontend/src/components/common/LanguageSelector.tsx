import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import { Globe } from 'lucide-react';
import { SupportedLanguage } from '../../types';

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as SupportedLanguage;
    i18n.changeLanguage(lang);
    localStorage.setItem('dermasathi_preferred_language', lang);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative' }}>
      <Globe size={18} style={{ color: 'var(--primary-600)' }} />
      <select
        id="language-picker-select"
        value={i18n.language}
        onChange={handleLanguageChange}
        style={{
          padding: '6px 10px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.88rem',
          fontWeight: 500,
          cursor: 'pointer',
          outline: 'none'
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
};
