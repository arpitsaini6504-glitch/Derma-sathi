import React from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, changeAppLanguage } from '../../i18n';
import { Globe } from 'lucide-react';
import { SupportedLanguage } from '../../types';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation();

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = e.target.value as SupportedLanguage;
    changeAppLanguage(lang);
  };

  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === i18n.language) || SUPPORTED_LANGUAGES[0];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        position: 'relative'
      }}
      role="region"
      aria-label="Language selection"
    >
      <Globe size={18} style={{ color: 'var(--primary-600)', flexShrink: 0 }} aria-hidden="true" />
      <select
        id="language-picker-select"
        value={i18n.language}
        onChange={handleLanguageChange}
        aria-label={t('accessibility.language_heading', 'Language & Localization')}
        title={t('accessibility.language_heading', 'Select interface language')}
        style={{
          padding: '6px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-card)',
          color: 'var(--text-main)',
          fontSize: '0.88rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: 'var(--shadow-sm)',
          transition: 'border-color 0.2s ease',
          maxWidth: '180px'
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} — {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

