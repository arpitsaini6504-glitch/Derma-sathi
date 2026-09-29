import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Leaf, Sun, Utensils, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { api } from '../../services/api';
import { LifestyleGuidanceResponse } from '../../types';
import { VoiceAssistButton } from '../common/VoiceAssistButton';

export const AyurvedicWellnessModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [concern, setConcern] = useState<string>('dry');
  const [season, setSeason] = useState<string>('autumn');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [guidance, setGuidance] = useState<LifestyleGuidanceResponse | null>(null);

  const handleFetchGuidance = async () => {
    setIsLoading(true);
    try {
      const data = await api.getWellnessGuidance({
        skin_concern: concern,
        season,
        language: i18n.language
      });
      setGuidance(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2>{t('wellness.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('wellness.subtitle')}</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('wellness.concern_label')}</label>
            <select className="form-control" value={concern} onChange={(e) => setConcern(e.target.value)}>
              <option value="dryness">{t('wellness.concern_dry')}</option>
              <option value="redness">{t('wellness.concern_red')}</option>
              <option value="oiliness">{t('wellness.concern_oily')}</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">{t('wellness.season_label')}</label>
            <select className="form-control" value={season} onChange={(e) => setSeason(e.target.value)}>
              <option value="summer">Summer (Grishma - High Pitta)</option>
              <option value="monsoon">Monsoon (Varsha - Vata/Pitta transition)</option>
              <option value="autumn">Autumn (Sharad - Pitta alleviation)</option>
              <option value="winter">Winter (Shishira - High Vata/dryness)</option>
            </select>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleFetchGuidance}
          disabled={isLoading}
          style={{ width: '100%', padding: '12px' }}
        >
          <Sparkles size={18} />
          <span>{t('wellness.get_guidance')}</span>
        </button>
      </div>

      {guidance && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <span className="badge badge-success">AYURVEDA & LIFESTYLE</span>
              <h3 style={{ marginTop: '8px' }}>{guidance.ayurvedic_perspective}</h3>
            </div>
            <VoiceAssistButton
              textToSpeak={`${guidance.ayurvedic_perspective}. Diet recommendations: ${guidance.dietary_recommendations.join('. ')}. Lifestyle: ${guidance.lifestyle_practices.join('. ')}`}
            />
          </div>

          <div className="grid-2" style={{ marginBottom: '20px' }}>
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--primary-700)' }}>
                <Utensils size={18} />
                {t('wellness.diet')}
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                {guidance.dietary_recommendations.map((d, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{d}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-main)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', color: 'var(--emerald-500)' }}>
                <Sun size={18} />
                {t('wellness.lifestyle')}
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                {guidance.lifestyle_practices.map((l, i) => (
                  <li key={i} style={{ marginBottom: '6px' }}>{l}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Traditional Herbs */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Leaf size={18} style={{ color: 'var(--emerald-500)' }} />
              {t('wellness.herbs')}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {guidance.traditional_topical_care.map((herb, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)'
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{herb.herb_name}</div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {herb.sanskrit_name}
                  </span>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    {herb.skin_benefits}
                  </p>
                  <p style={{ fontSize: '0.82rem', marginTop: '6px' }}>
                    <strong>Usage:</strong> {herb.usage_guidance}
                  </p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--amber-500)', marginTop: '4px' }}>
                    <strong>Note:</strong> {herb.safety_precautions}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              padding: '14px',
              backgroundColor: 'hsl(38, 90%, 95%)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              color: 'hsl(30, 80%, 20%)'
            }}
          >
            <strong>Evidence-Based Boundary:</strong> {guidance.cautionary_note}
          </div>
        </div>
      )}
    </div>
  );
};
