import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="footer">
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '30px', marginBottom: '30px' }}>
          <div>
            <h4 style={{ color: 'var(--primary-600)', marginBottom: '10px' }}>DERMASATHIAI</h4>
            <p style={{ fontSize: '0.85rem', lineHeight: 1.6 }}>
              {t('footer.about')}
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          <p>
            {t('footer.copyright')}
          </p>
        </div>
      </div>
    </footer>
  );
};
