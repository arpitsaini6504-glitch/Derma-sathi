import React from 'react';
import { FolderOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  onAction
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px',
        textAlign: 'center',
        backgroundColor: 'var(--bg-main)',
        borderRadius: 'var(--radius-lg)',
        border: '1px dashed var(--border-subtle)',
        minHeight: '220px'
      }}
    >
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          backgroundColor: 'var(--primary-50)',
          color: 'var(--primary-600)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}
      >
        {icon || <FolderOpen size={28} />}
      </div>
      <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>
        {title || t('states.empty_title')}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '440px', marginBottom: actionText ? '20px' : '0' }}>
        {description || t('states.empty_desc')}
      </p>
      {actionText && onAction && (
        <button
          className="btn btn-primary"
          onClick={onAction}
          style={{ minHeight: '48px', padding: '12px 24px', fontSize: '0.95rem' }}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};
