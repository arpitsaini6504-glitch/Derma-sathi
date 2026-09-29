import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck2, Camera, Upload, ShieldCheck, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

export const PrescriptionModule: React.FC = () => {
  const { t } = useTranslation();
  const [hasScanned, setHasScanned] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const samplePrescriptionMedicines = [
    {
      drug: 'Hydrocortisone 1% Cream',
      dosage: 'Apply thin film twice daily',
      duration: '7 days strictly',
      warning: 'Do not use near eyes or for more than 7 days without follow-up.'
    },
    {
      drug: 'Cetirizine 10mg Tablets',
      dosage: '1 tablet at bedtime',
      duration: '5 days',
      warning: 'May cause mild drowsiness; avoid driving after taking.'
    }
  ];

  const handleScanSimulate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setHasScanned(true);
    }, 800);
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('prescription.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('prescription.subtitle')}</p>
      </div>

      {/* Upload/Camera Card */}
      <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{t('prescription.upload_title')}</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '18px' }}>
          {t('prescription.upload_desc')}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleScanSimulate}
            style={{ minHeight: '48px', padding: '12px 24px' }}
          >
            <Camera size={18} />
            <span>{t('prescription.upload_button')}</span>
          </button>
        </div>

        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            backgroundColor: 'hsl(38, 90%, 96%)',
            borderRadius: 'var(--radius-md)',
            color: 'hsl(30, 80%, 20%)',
            fontSize: '0.82rem'
          }}
        >
          <strong>{t('prescription.medical_mandate')}:</strong> {t('prescription.doctor_note')}
        </div>
      </div>

      {isProcessing && <LoadingState title={t('prescription.scanning_title')} description={t('prescription.scanning_desc')} />}

      {!isProcessing && !hasScanned ? (
        <EmptyState
          icon={<FileCheck2 size={32} />}
          title={t('prescription.empty_title')}
          description={t('prescription.empty_desc')}
          actionText={t('prescription.upload_button')}
          onAction={handleScanSimulate}
        />
      ) : !isProcessing && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.25s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h4 style={{ fontSize: '1.05rem', color: 'var(--primary-700)' }}>{t('prescription.extracted_medicines')}</h4>
            <span className="badge badge-success">
              <CheckCircle2 size={13} />
              {t('prescription.verified_prescriber')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {samplePrescriptionMedicines.map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-main)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <strong style={{ fontSize: '0.96rem' }}>{item.drug}</strong>
                  <span className="badge badge-pending">
                    <Clock size={12} />
                    {item.duration}
                  </span>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-main)', marginTop: '6px' }}>
                  <strong>{t('prescription.instructions_label')}:</strong> {item.dosage}
                </p>

                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.82rem',
                    color: 'hsl(30, 80%, 25%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <AlertTriangle size={14} style={{ color: 'var(--amber-500)', flexShrink: 0 }} />
                  <span>{item.warning}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
