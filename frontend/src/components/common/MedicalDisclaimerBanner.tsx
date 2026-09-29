import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Check } from 'lucide-react';

export const MedicalDisclaimerBanner: React.FC = () => {
  const { t } = useTranslation();
  const [acknowledged, setAcknowledged] = useState(
    localStorage.getItem('dermasathi_disclaimer_ack') === 'true'
  );

  const handleAcknowledge = () => {
    localStorage.setItem('dermasathi_disclaimer_ack', 'true');
    setAcknowledged(true);
  };

  return (
    <div className="safety-banner" role="alert">
      <AlertTriangle size={24} style={{ flexShrink: 0, color: 'var(--amber-500)' }} />
      <div style={{ flex: 1 }}>
        <h4>{t('disclaimer.title')}</h4>
        <p>{t('disclaimer.body')}</p>
      </div>
      {!acknowledged && (
        <button
          className="btn btn-outline"
          onClick={handleAcknowledge}
          style={{
            fontSize: '0.82rem',
            padding: '6px 12px',
            borderColor: 'var(--amber-500)',
            color: 'hsl(30, 80%, 20%)',
            flexShrink: 0
          }}
        >
          <Check size={14} />
          {t('disclaimer.acknowledged')}
        </button>
      )}
    </div>
  );
};
