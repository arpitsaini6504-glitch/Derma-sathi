import React from 'react';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingStateProps {
  title?: string;
  description?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ title, description }) => {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        textAlign: 'center',
        minHeight: '220px'
      }}
    >
      <Loader2
        size={44}
        style={{
          color: 'var(--primary-600)',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px'
        }}
      />
      <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
        {title || t('states.loading_title')}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '420px' }}>
        {description || t('states.loading_desc')}
      </p>
    </div>
  );
};
