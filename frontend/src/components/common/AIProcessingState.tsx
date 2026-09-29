import React, { useEffect, useState } from 'react';
import { Sparkles, CheckCircle2, Circle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const AIProcessingState: React.FC = () => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState<number>(1);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(2), 600);
    const timer2 = setTimeout(() => setCurrentStep(3), 1300);
    const timer3 = setTimeout(() => setCurrentStep(4), 2100);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const steps = [
    { num: 1, textKey: 'states.ai_step_1' },
    { num: 2, textKey: 'states.ai_step_2' },
    { num: 3, textKey: 'states.ai_step_3' },
    { num: 4, textKey: 'states.ai_step_4' }
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        padding: '32px 24px',
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        textAlign: 'center',
        margin: '20px 0'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-50)',
          color: 'var(--primary-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          animation: 'pulse 1.5s infinite'
        }}
      >
        <Sparkles size={28} />
      </div>

      <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
        {t('states.ai_processing_title')}
      </h3>
      <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Executing 8-Stage Clinical Safety Pipeline. Please keep this screen open.
      </p>

      <div style={{ maxWidth: '440px', margin: '0 auto', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {steps.map((st) => {
          const isDone = currentStep > st.num;
          const isActive = currentStep === st.num;

          return (
            <div
              key={st.num}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--bg-card)' : 'transparent',
                border: isActive ? '1px solid var(--primary-500)' : '1px solid transparent',
                transition: 'all 0.3s'
              }}
            >
              {isDone ? (
                <CheckCircle2 size={20} style={{ color: 'var(--emerald-500)', flexShrink: 0 }} />
              ) : isActive ? (
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid var(--primary-600)',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                    flexShrink: 0
                  }}
                />
              ) : (
                <Circle size={20} style={{ color: 'var(--border-subtle)', flexShrink: 0 }} />
              )}

              <span
                style={{
                  fontSize: '0.88rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--primary-700)' : isDone ? 'var(--text-main)' : 'var(--text-muted)'
                }}
              >
                {t(st.textKey)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
