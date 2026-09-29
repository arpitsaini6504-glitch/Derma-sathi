import React from 'react';
import { AlertCircle, RefreshCw, PhoneCall } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  showEmergencyFallback?: boolean;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  onRetry,
  showEmergencyFallback = true
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '36px 20px',
        textAlign: 'center',
        backgroundColor: 'hsl(350, 100%, 98%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid hsl(350, 100%, 90%)',
        color: 'hsl(350, 80%, 25%)'
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'hsl(350, 100%, 92%)',
          color: 'var(--rose-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        <AlertCircle size={28} />
      </div>

      <h3 style={{ fontSize: '1.15rem', color: 'var(--rose-600)', marginBottom: '8px' }}>
        {title || t('states.error_title')}
      </h3>

      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '460px', marginBottom: '20px' }}>
        {description || t('states.error_desc')}
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {onRetry && (
          <button
            className="btn btn-outline"
            onClick={onRetry}
            style={{
              minHeight: '48px',
              padding: '12px 24px',
              borderColor: 'var(--rose-500)',
              color: 'var(--rose-600)'
            }}
          >
            <RefreshCw size={18} />
            <span>{t('states.retry')}</span>
          </button>
        )}

        {showEmergencyFallback && (
          <a
            href="tel:112"
            className="btn btn-danger"
            style={{ minHeight: '48px', padding: '12px 24px' }}
          >
            <PhoneCall size={18} />
            <span>Call 112 / 108 Emergency</span>
          </a>
        )}
      </div>
    </div>
  );
};
