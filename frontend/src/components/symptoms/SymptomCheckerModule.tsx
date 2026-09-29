import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertCircle, AlertTriangle, CheckCircle, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { SymptomCheckResponse } from '../../types';
import { VoiceAssistButton } from '../common/VoiceAssistButton';

const PRESET_SYMPTOMS = [
  'itching (pruritus)',
  'red patches or rash',
  'dry, flaky skin',
  'burning sensation',
  'raised bumps or wheals',
  'silvery scales',
  'swollen bumps',
  'scaling on scalp or elbows',
  'annular ring-like marks'
];

export const SymptomCheckerModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState<string>('');
  const [duration, setDuration] = useState<number>(3);
  const [severity, setSeverity] = useState<string>('moderate');
  const [hasFever, setHasFever] = useState<boolean>(false);
  const [hasRapidSpread, setHasRapidSpread] = useState<boolean>(false);
  const [hasPainOrBleeding, setHasPainOrBleeding] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SymptomCheckResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const togglePresetSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const addCustomSymptom = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    if (customSymptom.trim() && !selectedSymptoms.includes(customSymptom.trim())) {
      setSelectedSymptoms([...selectedSymptoms, customSymptom.trim()]);
      setCustomSymptom('');
    }
  };

  const handleEvaluate = async () => {
    if (selectedSymptoms.length === 0) {
      setError('Please select or enter at least one symptom.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.checkSymptoms({
        symptoms: selectedSymptoms,
        duration_days: duration,
        severity,
        has_fever: hasFever,
        has_rapid_spread: hasRapidSpread,
        has_pain_or_bleeding: hasPainOrBleeding,
        language: i18n.language
      });
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Error communicating with symptom triage service.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <h2>{t('symptoms.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('symptoms.subtitle')}</p>
      </div>

      <div className="glass-card" style={{ marginBottom: '24px' }}>
        {/* Symptom selection */}
        <div className="form-group">
          <label className="form-label">{t('symptoms.label_symptoms')}</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
            {PRESET_SYMPTOMS.map((sym) => {
              const active = selectedSymptoms.includes(sym);
              return (
                <button
                  key={sym}
                  type="button"
                  onClick={() => togglePresetSymptom(sym)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: active ? '1px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                    backgroundColor: active ? 'var(--primary-50)' : 'var(--bg-main)',
                    color: active ? 'var(--primary-700)' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s'
                  }}
                >
                  {sym}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Type custom symptom and press Enter..."
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              onKeyDown={addCustomSymptom}
            />
            <button type="button" className="btn btn-outline" onClick={addCustomSymptom}>
              Add
            </button>
          </div>
        </div>

        {/* Duration & Severity */}
        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">{t('symptoms.duration')}</label>
            <input
              type="number"
              min={1}
              max={365}
              className="form-control"
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">{t('symptoms.severity')}</label>
            <select
              className="form-control"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="mild">{t('symptoms.mild')}</option>
              <option value="moderate">{t('symptoms.moderate')}</option>
              <option value="severe">{t('symptoms.severe')}</option>
            </select>
          </div>
        </div>

        {/* Red Flag Checklist */}
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <h4 style={{ fontSize: '0.9rem', marginBottom: '10px', color: 'var(--rose-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldAlert size={16} />
            Important Clinical Red Flags Check
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasFever}
                onChange={(e) => setHasFever(e.target.checked)}
              />
              <span>{t('symptoms.red_flag_fever')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasRapidSpread}
                onChange={(e) => setHasRapidSpread(e.target.checked)}
              />
              <span>{t('symptoms.red_flag_spread')}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={hasPainOrBleeding}
                onChange={(e) => setHasPainOrBleeding(e.target.checked)}
              />
              <span>{t('symptoms.red_flag_pain')}</span>
            </label>
          </div>
        </div>

        {error && (
          <div style={{ color: 'var(--rose-600)', marginBottom: '16px', fontSize: '0.88rem' }}>
            {error}
          </div>
        )}

        <button
          className="btn btn-primary"
          onClick={handleEvaluate}
          disabled={isLoading}
          style={{ width: '100%', padding: '12px' }}
        >
          {isLoading ? (
            <>
              <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles size={18} />
              <span>{t('symptoms.submit')}</span>
            </>
          )}
        </button>
      </div>

      {/* Results View */}
      {result && (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <span className={`badge ${result.triage_level === 'emergency' ? 'badge-emergency' : 'badge-pending'}`}>
                Triage Urgency: {result.triage_level.toUpperCase()}
              </span>
              <h3 style={{ marginTop: '8px' }}>{t('symptoms.results_title')}</h3>
            </div>
            <VoiceAssistButton
              textToSpeak={`${result.referral_guidance}. Precautions: ${result.self_care_precautions.join('. ')}`}
            />
          </div>

          {result.red_flags.length > 0 && (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'hsl(350, 100%, 96%)',
                border: '1px solid hsl(350, 100%, 88%)',
                color: 'var(--rose-600)',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <AlertCircle size={18} />
                {t('symptoms.red_flags_detected')}
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.88rem' }}>
                {result.red_flags.map((rf, i) => (
                  <li key={i}>{rf}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Differentials */}
          <div style={{ marginBottom: '20px' }}>
            <h4>{t('symptoms.differentials')}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {result.differentials.map((diff, i) => (
                <div
                  key={i}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'var(--bg-card)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600 }}>{diff.condition_name}</span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Relevance: {diff.relevance_level}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    {diff.educational_summary}
                  </p>
                  <div style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <strong>Common Triggers:</strong> {diff.common_triggers.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Referral & Self-Care */}
          <div style={{ padding: '16px', backgroundColor: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
            <h4 style={{ marginBottom: '8px', color: 'var(--primary-700)' }}>{t('symptoms.referral')}</h4>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '12px' }}>
              {result.referral_guidance}
            </p>
            <h5 style={{ fontSize: '0.88rem', marginBottom: '6px' }}>{t('symptoms.self_care')}</h5>
            <ul style={{ fontSize: '0.85rem', color: 'var(--text-muted)', paddingLeft: '20px' }}>
              {result.self_care_precautions.map((p, i) => (
                <li key={i} style={{ marginBottom: '4px' }}>{p}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
