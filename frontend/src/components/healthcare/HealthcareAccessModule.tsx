import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, ExternalLink, Video, ShieldCheck, Stethoscope } from 'lucide-react';
import { api } from '../../services/api';
import { HealthcareFacility } from '../../types';

export const HealthcareAccessModule: React.FC = () => {
  const { t } = useTranslation();
  const [facilities, setFacilities] = useState<HealthcareFacility[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadFacilities() {
      try {
        const data = await api.getHealthcareFacilities();
        setFacilities(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFacilities();
  }, []);

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2>{t('facilities.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('facilities.subtitle')}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {facilities.map((fac, idx) => (
          <div
            key={idx}
            className="glass-card"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} style={{ color: 'var(--primary-600)' }} />
                  {fac.facility_name}
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {fac.type} • {fac.city}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {fac.teleconsult_available && (
                  <span className="badge badge-success">
                    <Video size={12} />
                    {t('facilities.teleconsult_badge')}
                  </span>
                )}
                {fac.ayushman_bharat_empanelled && (
                  <span className="badge badge-pending">
                    <ShieldCheck size={12} />
                    {t('facilities.ayushman_badge')}
                  </span>
                )}
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-main)' }}>
              <strong>Location:</strong> {fac.address}
            </p>

            <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
              {fac.address.startsWith('http') ? (
                <a
                  href={fac.address}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  <ExternalLink size={14} />
                  <span>{t('facilities.open_portal')}</span>
                </a>
              ) : (
                <button
                  className="btn btn-outline"
                  onClick={() => alert(`Directions for ${fac.facility_name} will query the National Health Portal API.`)}
                  style={{ fontSize: '0.85rem', padding: '6px 14px' }}
                >
                  {t('facilities.view_opd_btn')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
