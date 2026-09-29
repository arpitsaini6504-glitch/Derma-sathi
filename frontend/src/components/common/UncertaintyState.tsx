import React from 'react';
import { ShieldAlert, RefreshCw, UserCheck, HelpCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { VoiceAssistButton } from './VoiceAssistButton';

interface UncertaintyStateProps {
  reason?: string | null;
  onRetake: () => void;
  onConsultDoctor: () => void;
}

export const UncertaintyState: React.FC<UncertaintyStateProps> = ({
  reason,
  onRetake,
  onConsultDoctor
}) => {
  const { t } = useTranslation();

  const explanation = reason || t('states.uncertainty_desc');

  return (
    <div
      role="region"
      aria-label="Clinical Abstention Notice"
      style={{
        padding: '28px 24px',
        backgroundColor: 'hsl(38, 90%, 97%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--amber-500)',
        color: 'hsl(30, 80%, 20%)',
        margin: '20px 0'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: 'hsl(38, 100%, 88%)',
              color: 'hsl(35, 95%, 35%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            <ShieldAlert size={26} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', color: 'hsl(30, 90%, 22%)' }}>
              {t('states.uncertainty_title')}
            </h3>
            <span className="badge" style={{ backgroundColor: 'hsl(38, 100%, 90%)', color: 'hsl(30, 90%, 22%)', marginTop: '4px' }}>
              NON-DIAGNOSTIC SAFETY GATE
            </span>
          </div>
        </div>

        <VoiceAssistButton
          textToSpeak={`${t('states.uncertainty_title')}. ${explanation}. Please retake a clear photo or consult a doctor.`}
        />
      </div>

      <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '18px' }}>
        {explanation}
      </p>

      {/* Why did this happen? */}
      <div
        style={{
          padding: '16px',
          backgroundColor: 'rgba(255, 255, 255, 0.7)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}
      >
        <h4 style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <HelpCircle size={16} />
          {t('states.uncertainty_reasons')}
        </h4>
        <ul style={{ paddingLeft: '20px', fontSize: '0.86rem', color: 'hsl(30, 70%, 25%)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <li>{t('states.uncertainty_reason_blur')}</li>
          <li>{t('states.uncertainty_reason_model')}</li>
          <li>{t('states.uncertainty_reason_ood')}</li>
        </ul>
      </div>

      {/* Action Buttons with min 48px touch targets */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={onRetake}
          style={{ minHeight: '48px', padding: '12px 24px', fontSize: '0.95rem' }}
        >
          <RefreshCw size={18} />
          <span>{t('states.retake_photo')}</span>
        </button>

        <button
          className="btn btn-outline"
          onClick={onConsultDoctor}
          style={{
            minHeight: '48px',
            padding: '12px 24px',
            fontSize: '0.95rem',
            borderColor: 'hsl(30, 80%, 40%)',
            color: 'hsl(30, 80%, 20%)'
          }}
        >
          <UserCheck size={18} />
          <span>{t('states.consult_doctor')}</span>
        </button>
      </div>
    </div>
  );
};
