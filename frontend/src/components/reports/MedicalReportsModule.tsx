import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FileText,
  Upload,
  ShieldAlert,
  Eye,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Activity,
  FileCheck,
  ClipboardCheck,
  RefreshCw
} from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';
import { VoiceAssistButton } from '../common/VoiceAssistButton';
import { api } from '../../services/api';
import { MedicalReportAnalysisResponse } from '../../types';

interface StoredReport {
  id: string;
  name: string;
  date: string;
  type: string;
  previewUrl?: string;
  analysis?: MedicalReportAnalysisResponse;
}

export const MedicalReportsModule: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [reports, setReports] = useState<StoredReport[]>(() => {
    try {
      const saved = localStorage.getItem('dermasathi_stored_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filter out any legacy sample/demo reports
        return Array.isArray(parsed) ? parsed.filter((r: StoredReport) => r.id !== 'rep-sample-01') : [];
      }
    } catch {}
    return [];
  });

  const [activeAnalysis, setActiveAnalysis] = useState<MedicalReportAnalysisResponse | null>(null);
  const [activeReportName, setActiveReportName] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Clear legacy client-side key storage and fake sample reports if present
    try {
      localStorage.removeItem('dermasathi_gemini_api_key');
      const saved = localStorage.getItem('dermasathi_stored_reports');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = Array.isArray(parsed) ? parsed.filter((r: StoredReport) => r.id !== 'rep-sample-01') : [];
        localStorage.setItem('dermasathi_stored_reports', JSON.stringify(filtered));
      }
    } catch {}
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    // Check size limit: 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(t('errors.file_too_large', 'The uploaded file exceeds the 10MB limit.'));
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const response = await api.analyzeMedicalReport(file, i18n.language);
      setActiveAnalysis(response);
      setActiveReportName(file.name);

      const newReport: StoredReport = {
        id: `rep-${Date.now()}`,
        name: file.name,
        date: response.test_date || new Date().toISOString().split('T')[0],
        type: response.report_type || 'Diagnostic Report',
        analysis: response,
        previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };

      const updated = [newReport, ...reports];
      setReports(updated);
      try {
        localStorage.setItem('dermasathi_stored_reports', JSON.stringify(updated.slice(0, 10)));
      } catch {}
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to analyze report with Gemini AI.');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const removeReport = (id: string) => {
    const updated = reports.filter((r) => r.id !== id);
    setReports(updated);
    try {
      localStorage.setItem('dermasathi_stored_reports', JSON.stringify(updated));
    } catch {}
    if (activeAnalysis && activeReportName === reports.find((r) => r.id === id)?.name) {
      setActiveAnalysis(null);
    }
  };

  const viewReportAnalysis = (report: StoredReport) => {
    if (report.analysis) {
      setActiveAnalysis(report.analysis);
      setActiveReportName(report.name);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert(`Document: ${report.name}\nPlease upload a new copy to run live Gemini AI analysis.`);
    }
  };

  const getUrgencyBadge = (level: string) => {
    switch (level) {
      case 'emergency':
        return <span className="badge badge-emergency">EMERGENCY ATTENTION</span>;
      case 'consult_doctor':
        return <span className="badge badge-pending">PROMPT DOCTOR CONSULT</span>;
      case 'routine':
        return <span className="badge badge-success">ROUTINE / STABLE</span>;
      default:
        return <span className="badge badge-pending">MONITOR WITH PHYSICIAN</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'critical':
      case 'high':
        return <span className="badge badge-emergency">{status.toUpperCase()}</span>;
      case 'low':
        return <span className="badge badge-pending">{status.toUpperCase()}</span>;
      default:
        return <span className="badge badge-pending">{status ? status.toUpperCase() : 'ABNORMAL'}</span>;
    }
  };

  return (
    <div style={{ maxWidth: '880px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('reports.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('reports.subtitle')}</p>
      </div>

      {/* ACTIVE GEMINI ANALYSIS RESULT VIEW */}
      {activeAnalysis && (
        <div
          className="glass-card"
          style={{
            marginBottom: '28px',
            border: '2px solid var(--primary-600)',
            boxShadow: 'var(--shadow-lg)',
            animation: 'fadeIn 0.3s ease'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '18px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <span className="badge badge-pending">
                  <Sparkles size={12} />
                  Gemini AI Output
                </span>
                {getUrgencyBadge(activeAnalysis.urgency_level)}
              </div>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-main)', margin: '4px 0' }}>
                {activeAnalysis.report_title}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {activeAnalysis.report_type} {activeAnalysis.test_date ? `• Investigation Date: ${activeAnalysis.test_date}` : ''}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <VoiceAssistButton
                textToSpeak={`${activeAnalysis.patient_summary}. Urgency: ${activeAnalysis.urgency_level}. Key findings: ${activeAnalysis.key_findings.join('. ')}`}
              />
              <button
                className="btn btn-outline"
                onClick={() => setActiveAnalysis(null)}
                style={{ fontSize: '0.82rem', padding: '6px 12px' }}
              >
                {t('reports.close_analysis')}
              </button>
            </div>
          </div>

          {/* Patient Executive Summary */}
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--primary-50)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(14, 165, 233, 0.2)',
              marginBottom: '20px'
            }}
          >
            <h4 style={{ fontSize: '0.95rem', color: 'var(--primary-700)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={18} />
              {t('reports.summary_heading')}
            </h4>
            <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: 'var(--text-main)' }}>
              {activeAnalysis.patient_summary}
            </p>
          </div>

          {/* Abnormal / Attention Values Table */}
          {activeAnalysis.abnormal_values && activeAnalysis.abnormal_values.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--rose-600)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} />
                {t('reports.abnormal_heading')} ({activeAnalysis.abnormal_values.length})
              </h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '2px solid var(--border-subtle)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px' }}>{t('reports.param_col')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('reports.value_col')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('reports.ref_col')}</th>
                      <th style={{ padding: '10px 12px' }}>{t('reports.significance_col')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeAnalysis.abnormal_values.map((val, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 600 }}>{val.parameter}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--rose-600)' }}>{val.value}</span>{' '}
                          {getStatusBadge(val.status)}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{val.reference_range || 'N/A'}</td>
                        <td style={{ padding: '10px 12px', color: 'var(--text-main)' }}>{val.clinical_significance || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Key Clinical Findings */}
          {activeAnalysis.key_findings && activeAnalysis.key_findings.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.98rem', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileCheck size={18} style={{ color: 'var(--primary-600)' }} />
                {t('reports.key_findings_heading')}
              </h4>
              <ul style={{ paddingLeft: '22px', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '6px', color: 'var(--text-main)' }}>
                {activeAnalysis.key_findings.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Normal Values */}
          {activeAnalysis.normal_values && activeAnalysis.normal_values.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '0.95rem', color: 'var(--emerald-500)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={16} />
                {t('reports.normal_heading')}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {activeAnalysis.normal_values.join(' • ')}
              </p>
            </div>
          )}

          {/* Questions for Doctor */}
          {activeAnalysis.doctor_questions && activeAnalysis.doctor_questions.length > 0 && (
            <div
              style={{
                padding: '16px',
                backgroundColor: 'hsl(38, 90%, 96%)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(38, 90%, 85%)',
                marginBottom: '20px'
              }}
            >
              <h4 style={{ fontSize: '0.95rem', color: 'hsl(30, 80%, 25%)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <HelpCircle size={18} />
                {t('reports.doctor_questions_heading')}
              </h4>
              <ul style={{ paddingLeft: '20px', fontSize: '0.86rem', color: 'hsl(30, 80%, 20%)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {activeAnalysis.doctor_questions.map((q, idx) => (
                  <li key={idx}>"{q}"</li>
                ))}
              </ul>
            </div>
          )}

          {/* Clinical Conclusion & Assessment */}
          {activeAnalysis.conclusion && (
            <div
              style={{
                padding: '16px 18px',
                backgroundColor: 'hsl(210, 85%, 97%)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid hsl(210, 85%, 85%)',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.96rem', color: 'hsl(215, 80%, 25%)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ClipboardCheck size={18} style={{ color: 'hsl(215, 80%, 45%)' }} />
                  {t('reports.conclusion_heading')}
                </h4>
                <VoiceAssistButton textToSpeak={activeAnalysis.conclusion} />
              </div>
              <p style={{ fontSize: '0.9rem', color: 'hsl(215, 80%, 20%)', lineHeight: 1.6, margin: 0 }}>
                {activeAnalysis.conclusion}
              </p>
            </div>
          )}

          {/* Clinical Notes */}
          {activeAnalysis.clinical_notes && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', fontStyle: 'italic' }}>
              <strong>Note:</strong> {activeAnalysis.clinical_notes}
            </p>
          )}

          {/* Mandatory Safety Disclaimer */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--bg-main)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              borderTop: '1px solid var(--border-subtle)'
            }}
          >
            <ShieldAlert size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
            {activeAnalysis.clinical_disclaimer}
          </div>
        </div>
      )}

      {/* Upload Action Card */}
      <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>{t('reports.upload_title')}</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '20px' }}>
          {t('reports.upload_desc')}
        </p>

        {errorMessage && (
          <div
            style={{
              marginBottom: '16px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'hsl(350, 100%, 96%)',
              color: 'var(--rose-600)',
              fontSize: '0.88rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <AlertTriangle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <label
          htmlFor="report-file-input"
          className="btn btn-primary"
          style={{ minHeight: '52px', padding: '14px 28px', cursor: 'pointer', display: 'inline-flex', fontSize: '1rem', fontWeight: 600 }}
        >
          <Upload size={20} />
          <span>{t('reports.upload_button')}</span>
        </label>
        <input
          id="report-file-input"
          type="file"
          accept=".pdf,image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Supported: PDF documents, JPEG, PNG, WebP up to 10MB
        </div>
      </div>

      {isUploading && (
        <LoadingState
          title={t('reports.analyzing_title')}
          description={t('reports.analyzing_desc')}
        />
      )}

      {/* Reports List or Empty State */}
      {!isUploading && reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title={t('reports.empty_title')}
          description={t('reports.empty_desc')}
          actionText={t('reports.upload_button')}
          onAction={() => document.getElementById('report-file-input')?.click()}
        />
      ) : !isUploading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h4 style={{ fontSize: '1rem', color: 'var(--text-main)' }}>{t('reports.sample_title')}</h4>
          {reports.map((report) => (
            <div
              key={report.id}
              className="glass-card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 20px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary-50)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: '0.96rem' }}>{report.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {report.type} • {report.date}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => viewReportAnalysis(report)}
                  style={{ minHeight: '44px', padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <Eye size={16} />
                  <span>{t('reports.view_analysis')}</span>
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => removeReport(report.id)}
                  style={{ minHeight: '44px', padding: '8px 12px', color: 'var(--rose-600)' }}
                  aria-label={t('common.delete_doc', 'Delete document')}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
