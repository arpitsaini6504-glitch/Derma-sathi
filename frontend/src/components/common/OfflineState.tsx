import React from 'react';
import { WifiOff, PhoneCall, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { offlineStorage } from '../../services/offlineStorage';

export const OfflineState: React.FC = () => {
  const { t } = useTranslation();
  const cachedData = offlineStorage.getOfflineGuidelines();

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'hsl(215, 30%, 96%)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-subtle)',
        marginBottom: '24px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            backgroundColor: 'hsl(215, 25%, 88%)',
            color: 'var(--text-main)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <WifiOff size={22} />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem' }}>{t('states.offline_title')}</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{t('states.offline_desc')}</p>
        </div>
      </div>

      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
        {cachedData.numbers.map((num, i) => (
          <div
            key={i}
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <strong style={{ fontSize: '0.9rem' }}>{num.name}</strong>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{num.desc}</p>
            </div>
            <a
              href={`tel:${num.number.split('/')[0].trim()}`}
              className="btn btn-danger"
              style={{ minHeight: '40px', padding: '6px 12px', fontSize: '0.82rem' }}
            >
              <PhoneCall size={14} />
              <span>{num.number}</span>
            </a>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius-md)' }}>
        <h4 style={{ fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <ShieldCheck size={16} style={{ color: 'var(--emerald-500)' }} />
          Cached Emergency First-Aid Guidelines:
        </h4>
        <ul style={{ paddingLeft: '20px', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          {cachedData.firstAidGuidelines.map((g, idx) => (
            <li key={idx} style={{ marginBottom: '4px' }}>{g}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
