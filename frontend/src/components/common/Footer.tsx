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
              A serious multilingual AI healthcare companion providing non-diagnostic dermatological triage,
              safety verification, and traditional wellness for Indian populations.
            </p>
          </div>

          {/* <div>
            <h4 style={{ marginBottom: '10px' }}>Architecture & Core Pillars</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>8-Stage Clinical Safety Pipeline</li>
              <li>12 Indian Languages Localization</li>
              <li>Decoupled ML Model Store</li>
              <li>Emergency Red-Flag Escalation</li>
            </ul>
          </div> */}

          {/* <div>
            <h4 style={{ marginBottom: '10px' }}>Engineering Team</h4>
            <ul style={{ listStyle: 'none', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li><strong>Arpit:</strong> ML Systems, Model Integration & APIs</li>
              <li><strong>Anushka Krishnatry:</strong> Backend APIs, Auth & User Services</li>
              <li><strong>Archana:</strong> QA, API Testing & Multilingual Verification</li>
              <li><strong>Arpit Saini:</strong> Frontend Implementation & Integration</li>
            </ul>
          </div> */}
        </div>

        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px', textAlign: 'center', fontSize: '0.8rem' }}>
          <p>
            © 2026 DERMASATHIAI. Built for clinical assistive research. Not a substitute for licensed medical practitioners.
          </p>
        </div>
      </div>
    </footer>
  );
};
