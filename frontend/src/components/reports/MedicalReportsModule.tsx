import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, Plus, FileCheck, ShieldAlert, Eye, Trash2 } from 'lucide-react';
import { EmptyState } from '../common/EmptyState';
import { LoadingState } from '../common/LoadingState';

interface MedicalReportItem {
  id: string;
  name: string;
  date: string;
  type: string;
  previewUrl?: string;
}

export const MedicalReportsModule: React.FC = () => {
  const { t } = useTranslation();
  const [reports, setReports] = useState<MedicalReportItem[]>([
    {
      id: 'rep-01',
      name: 'Skin KOH Smear Test (Fungal Examination)',
      date: '2026-09-15',
      type: 'Laboratory Pathology Report'
    }
  ]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      setTimeout(() => {
        setReports([
          {
            id: `rep-${Date.now()}`,
            name: file.name,
            date: new Date().toISOString().split('T')[0],
            type: 'Uploaded Diagnostic Document',
            previewUrl: URL.createObjectURL(file)
          },
          ...reports
        ]);
        setIsUploading(false);
      }, 700);
    }
  };

  const removeReport = (id: string) => {
    setReports(reports.filter(r => r.id !== id));
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <h2>{t('reports.title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>{t('reports.subtitle')}</p>
      </div>

      {/* Upload Action Card */}
      <div className="glass-card" style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h3 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>{t('reports.upload_title')}</h3>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Biopsy notes, blood tests, fungal cultures, or allergy test summaries.
        </p>

        <label
          htmlFor="report-file-input"
          className="btn btn-primary"
          style={{ minHeight: '48px', padding: '12px 24px', cursor: 'pointer', display: 'inline-flex' }}
        >
          <Upload size={18} />
          <span>{t('reports.upload_button')}</span>
        </label>
        <input
          id="report-file-input"
          type="file"
          accept=".pdf,image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={handleFileUpload}
        />

        {/* Informative Staging Note */}
        <div
          style={{
            marginTop: '16px',
            padding: '10px 14px',
            backgroundColor: 'var(--primary-50)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--primary-700)',
            fontSize: '0.82rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <ShieldAlert size={16} />
          <span>{t('reports.ocr_status_pending')}</span>
        </div>
      </div>

      {isUploading && <LoadingState title="Uploading & Securing Document..." />}

      {/* Reports List or Empty State */}
      {!isUploading && reports.length === 0 ? (
        <EmptyState
          icon={<FileText size={32} />}
          title={t('reports.empty_title')}
          description={t('reports.empty_desc')}
          actionText={t('reports.upload_button')}
          onAction={() => document.getElementById('report-file-input')?.click()}
        />
      ) : (
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
                    {report.type} • Uploaded on {report.date}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-outline"
                  onClick={() => alert(`Viewing document: ${report.name}`)}
                  style={{ minHeight: '44px', padding: '8px 14px', fontSize: '0.85rem' }}
                >
                  <Eye size={16} />
                  <span>View</span>
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => removeReport(report.id)}
                  style={{ minHeight: '44px', padding: '8px 12px', color: 'var(--rose-600)' }}
                  aria-label="Delete document"
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
