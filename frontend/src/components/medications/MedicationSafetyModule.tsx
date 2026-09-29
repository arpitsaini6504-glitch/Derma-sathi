import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, AlertTriangle, Pill, Plus, X, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { DrugSafetyResponse } from '../../types';
import { VoiceAssistButton } from '../common/VoiceAssistButton';

export const MedicationSafetyModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [medsList, setMedsList] = useState<string[]>(['isotretinoin', 'doxycycline']);
  const [currentMed, setCurrentMed] = useState<string>('');
  const [allergies, setAllergies] = useState<string>('');
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DrugSafetyResponse | null>(null);

  const addMed = () => {
    if (currentMed.trim() && !medsList.includes(currentMed.trim().toLowerCase())) {
      setMedsList([...medsList, currentMed.trim().toLowerCase()]);
      setCurrentMed('');
    }
  };

  const removeMed = (med: string) => {
    setMedsList(medsList.filter((m) => m !== med));
  };

  const handleCheck = async () => {
    if (medsList.length === 0) return;
    setIsLoading(true);

    try {
      const allergyArr = allergies.split(',').map((a) => a.trim()).filter(Boolean);
      const conditions: string[] = [];
      if (isPregnant) conditions.push('pregnancy');

      const data = await api.checkMedications({
        medications: medsList,
        allergies: allergyArr,
        patient_conditions: conditions,
        language: i18n.language
      });
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2>{t('meds.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('meds.subtitle')}</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        <div className="form-group">
          <label className="form-label">{t('meds.enter_meds')}</label>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. isotretinoin, clobetasol, hydrocortisone"
              value={currentMed}
              onChange={(e) => setCurrentMed(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addMed())}
            />
            <button type="button" className="btn btn-outline" onClick={addMed}>
              <Plus size={16} />
              <span>Add</span>
            </button>
          </div>

          {/* Med chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {medsList.map((m) => (
              <span
                key={m}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  backgroundColor: 'var(--primary-50)',
                  color: 'var(--primary-700)',
                  fontWeight: 500,
                  fontSize: '0.85rem'
                }}
              >
                <Pill size={14} />
                {m}
                <X
                  size={14}
                  style={{ cursor: 'pointer', opacity: 0.7 }}
                  onClick={() => removeMed(m)}
                />
              </span>
            ))}
          </div>
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('meds.enter_allergies')}</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. penicillin, sulfa"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isPregnant}
                onChange={(e) => setIsPregnant(e.target.checked)}
              />
              <span>{t('meds.pregnancy_status')}</span>
            </label>
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleCheck}
          disabled={isLoading || medsList.length === 0}
          style={{ width: '100%', padding: '12px' }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Checking interactions...</span>
            </>
          ) : (
            <>
              <ShieldCheck size={18} />
              <span>{t('meds.check_button')}</span>
            </>
          )}
        </button>
      </div>

      {/* Safety Results */}
      {result && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <span className={`badge ${result.safe_to_combine ? 'badge-success' : 'badge-emergency'}`}>
                {result.safe_to_combine ? 'SAFE REGIMEN' : 'INTERACTION ALERT'}
              </span>
              <h3 style={{ marginTop: '8px' }}>
                {result.safe_to_combine ? t('meds.safe_result') : t('meds.danger_result')}
              </h3>
            </div>
            <VoiceAssistButton
              textToSpeak={`${result.safe_to_combine ? 'Medications checked. No known severe adverse interactions detected.' : 'Warning: Drug interactions or contraindications detected.'} ${result.interaction_alerts.map(a => a.clinical_effect).join('. ')}`}
            />
          </div>

          {result.interaction_alerts.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              {result.interaction_alerts.map((alert, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'hsl(350, 100%, 96%)',
                    border: '1px solid hsl(350, 100%, 88%)',
                    color: 'hsl(350, 90%, 25%)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ color: 'var(--rose-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <AlertTriangle size={18} />
                      Combination Warning: {alert.drugs_involved.join(' + ')}
                    </h4>
                    <span className="badge badge-emergency">Severity: {alert.severity.toUpperCase()}</span>
                  </div>
                  <p style={{ fontSize: '0.88rem', marginTop: '6px' }}>{alert.clinical_effect}</p>
                  <p style={{ fontSize: '0.86rem', fontWeight: 600, marginTop: '8px', color: 'var(--rose-600)' }}>
                    Action: {alert.recommendation}
                  </p>
                </div>
              ))}
            </div>
          )}

          {result.condition_precautions.length > 0 && (
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(38, 90%, 94%)',
                border: '1px solid var(--amber-500)',
                color: 'hsl(30, 80%, 20%)',
                marginBottom: '18px'
              }}
            >
              <h4 style={{ fontSize: '0.9rem', marginBottom: '6px' }}>Contraindication Alert</h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.85rem' }}>
                {result.condition_precautions.map((cp, i) => (
                  <li key={i}>{cp}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Identified Drug Profiles */}
          {result.identified_drugs.length > 0 && (
            <div>
              <h4>{t('meds.identified_drugs')}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px', marginTop: '12px' }}>
                {result.identified_drugs.map((drug, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-main)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{drug.name}</strong>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{drug.category}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      <strong>Uses:</strong> {drug.common_skin_uses}
                    </p>
                    <div style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                      <strong>{t('meds.precautions')}:</strong>
                      <ul style={{ paddingLeft: '16px', color: 'var(--text-muted)' }}>
                        {drug.general_safety_precautions.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
