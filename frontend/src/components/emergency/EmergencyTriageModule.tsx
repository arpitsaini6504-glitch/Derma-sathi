import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PhoneCall, AlertTriangle, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../../services/api';
import { EmergencyAssessmentResponse } from '../../types';
import { VoiceAssistButton } from '../common/VoiceAssistButton';

export const EmergencyTriageModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [description, setDescription] = useState<string>('');
  const [flagFace, setFlagFace] = useState<boolean>(false);
  const [flagBreath, setFlagBreath] = useState<boolean>(false);
  const [flagPeel, setFlagPeel] = useState<boolean>(false);
  const [flagFever, setFlagFever] = useState<boolean>(false);
  const [flagBlister, setFlagBlister] = useState<boolean>(false);
  const [flagPain, setFlagPain] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [assessment, setAssessment] = useState<EmergencyAssessmentResponse | null>(null);

  const handleAssess = async () => {
    setIsLoading(true);
    try {
      const data = await api.assessEmergency({
        symptoms_description: description,
        has_facial_swelling: flagFace,
        has_breathing_difficulty: flagBreath,
        has_peeling_or_mucosal_involvement: flagPeel,
        has_high_fever: flagFever,
        has_rapid_blistering: flagBlister,
        has_severe_uncontrollable_pain: flagPain,
        language: i18n.language
      });
      setAssessment(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2 style={{ color: 'var(--rose-600)' }}>{t('emergency.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('emergency.subtitle')}</p>
      </div>

      <div
        className="glass-card"
        style={{
          borderLeft: '5px solid var(--rose-600)',
          marginBottom: '24px'
        }}
      >
        <div className="form-group">
          <label className="form-label">{t('emergency.symptom_summary')}</label>
          <textarea
            className="form-control"
            rows={2}
            placeholder={t('emergency.placeholder_desc')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <h4 style={{ fontSize: '0.92rem', marginBottom: '12px' }}>{t('emergency.flags_prompt')}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '10px', marginBottom: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={flagFace} onChange={(e) => setFlagFace(e.target.checked)} />
            <span>{t('emergency.flag_face')}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={flagBreath} onChange={(e) => setFlagBreath(e.target.checked)} />
            <span>{t('emergency.flag_breath')}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={flagPeel} onChange={(e) => setFlagPeel(e.target.checked)} />
            <span>{t('emergency.flag_peel')}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={flagFever} onChange={(e) => setFlagFever(e.target.checked)} />
            <span>{t('emergency.flag_fever')}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={flagBlister} onChange={(e) => setFlagBlister(e.target.checked)} />
            <span>{t('emergency.flag_blister')}</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={flagPain} onChange={(e) => setFlagPain(e.target.checked)} />
            <span>{t('emergency.flag_pain')}</span>
          </label>
        </div>

        <button
          className="btn btn-danger"
          onClick={handleAssess}
          disabled={isLoading}
          style={{ width: '100%', padding: '12px', fontSize: '1rem' }}
        >
          <ShieldAlert size={18} />
          <span>{t('emergency.assess_button')}</span>
        </button>
      </div>

      {assessment && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <span className={`badge ${assessment.is_emergency ? 'badge-emergency' : 'badge-success'}`}>
                {assessment.triage_priority}
              </span>
              <h3 style={{ marginTop: '8px' }}>
                {assessment.is_emergency ? t('emergency.emergency_alert') : t('emergency.standard_eval')}
              </h3>
            </div>
            <VoiceAssistButton
              textToSpeak={`${assessment.clinical_rationale}. Actions to take: ${assessment.immediate_actions.join('. ')}`}
            />
          </div>

          <p style={{ fontSize: '0.92rem', marginBottom: '18px' }}>
            {assessment.clinical_rationale}
          </p>

          {/* Emergency Helpline Cards */}
          <div style={{ marginBottom: '22px' }}>
            <h4>{t('emergency.contacts')}</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginTop: '10px' }}>
              {assessment.emergency_contacts.map((contact, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--bg-main)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <strong>{contact.name}</strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {contact.description}
                    </p>
                  </div>
                  <a
                    href={`tel:${contact.contact_number.split('/')[0].trim()}`}
                    className="btn btn-danger"
                    style={{ marginTop: '12px', padding: '6px 12px', fontSize: '0.85rem' }}
                  >
                    <PhoneCall size={14} />
                    <span>{t('emergency.call_btn')} {contact.contact_number}</span>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Action List */}
          <div className="grid-2">
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(150, 70%, 96%)',
                border: '1px solid hsl(150, 70%, 88%)'
              }}
            >
              <h4 style={{ color: 'var(--emerald-500)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <CheckCircle size={18} />
                {t('emergency.actions')}
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.85rem' }}>
                {assessment.immediate_actions.map((act, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{act}</li>
                ))}
              </ul>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(350, 100%, 96%)',
                border: '1px solid hsl(350, 100%, 88%)'
              }}
            >
              <h4 style={{ color: 'var(--rose-600)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <XCircle size={18} />
                {t('emergency.do_not')}
              </h4>
              <ul style={{ paddingLeft: '18px', fontSize: '0.85rem', color: 'hsl(350, 90%, 25%)' }}>
                {assessment.do_not_do_list.map((act, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{act}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
