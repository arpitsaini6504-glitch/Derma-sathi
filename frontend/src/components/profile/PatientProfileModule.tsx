import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, History, Database, Trash2, ShieldCheck, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { LanguageSelector } from '../common/LanguageSelector';
import { offlineStorage } from '../../services/offlineStorage';
import { EmptyState } from '../common/EmptyState';

export const PatientProfileModule: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const [cachedHistory, setCachedHistory] = useState<any[]>([]);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  useEffect(() => {
    setCachedHistory(offlineStorage.getCachedConsultations());
  }, []);

  const handleClearCache = () => {
    localStorage.removeItem('dermasathi_offline_history');
    setCachedHistory([]);
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('profile.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('profile.subtitle')}</p>
      </div>

      {/* Account Card */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <User size={28} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>{isAuthenticated ? user?.full_name : t('profile.guest_user')}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {isAuthenticated ? user?.email : t('profile.guest_sub')}
              </p>
            </div>
          </div>

          <div>
            {isAuthenticated ? (
              <button
                className="btn btn-outline"
                onClick={logout}
                style={{ minHeight: '44px', padding: '8px 16px' }}
              >
                {t('navigation.logout')}
              </button>
            ) : (
              <button
                className="btn btn-primary"
                onClick={onOpenAuth}
                style={{ minHeight: '48px', padding: '10px 20px' }}
              >
                {t('navigation.login')} / {t('navigation.register')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Language Preference Card */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Globe size={18} style={{ color: 'var(--primary-600)' }} />
          {t('profile.preferred_language')}
        </h4>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Select from 12 Indian regional languages to tailor UI text and voice readouts.
        </p>
        <LanguageSelector />
      </div>

      {/* Offline Storage & Security Card */}
      <div className="glass-card" style={{ marginBottom: '20px' }}>
        <h4 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Database size={18} style={{ color: 'var(--emerald-500)' }} />
          {t('profile.offline_storage')}
        </h4>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {t('profile.cache_status')}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button
            className="btn btn-outline"
            onClick={handleClearCache}
            style={{ minHeight: '44px', padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Trash2 size={16} />
            <span>{t('profile.clear_cache')}</span>
          </button>
          {cacheCleared && (
            <span style={{ fontSize: '0.85rem', color: 'var(--emerald-500)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} />
              {t('profile.cache_cleared_msg')}
            </span>
          )}
        </div>
      </div>

      {/* Consultation History */}
      <div className="glass-card">
        <h4 style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <History size={18} style={{ color: 'var(--primary-600)' }} />
          {t('profile.consultation_history')}
        </h4>

        {cachedHistory.length === 0 ? (
          <EmptyState
            icon={<History size={28} />}
            title={t('profile.history_empty')}
            description="Your completed skin evaluations and symptom checks will be recorded here for clinical review."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cachedHistory.map((item, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-main)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.9rem' }}>{item.type || 'Consultation Session'}</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Saved at {item.savedAt}</p>
                </div>
                <span className="badge badge-pending">Archived</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
