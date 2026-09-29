import React, { useState } from 'react';
import { Navbar } from './components/common/Navbar';
import { MedicalDisclaimerBanner } from './components/common/MedicalDisclaimerBanner';
import { HeroOverview } from './components/common/HeroOverview';
import { SkinAnalysisModule } from './components/skin-analysis/SkinAnalysisModule';
import { SymptomCheckerModule } from './components/symptoms/SymptomCheckerModule';
import { MedicationSafetyModule } from './components/medications/MedicationSafetyModule';
import { AyurvedicWellnessModule } from './components/wellness/AyurvedicWellnessModule';
import { EmergencyTriageModule } from './components/emergency/EmergencyTriageModule';
import { HealthcareAccessModule } from './components/healthcare/HealthcareAccessModule';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { AuthProvider } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      <main style={{ flex: 1, padding: '24px 0' }}>
        <div className="container">
          <MedicalDisclaimerBanner />

          {currentTab === 'home' && <HeroOverview onSelectTab={setCurrentTab} />}
          {currentTab === 'skin' && <SkinAnalysisModule />}
          {currentTab === 'symptoms' && <SymptomCheckerModule />}
          {currentTab === 'medications' && <MedicationSafetyModule />}
          {currentTab === 'wellness' && <AyurvedicWellnessModule />}
          {currentTab === 'emergency' && <EmergencyTriageModule />}
          {currentTab === 'facilities' && <HealthcareAccessModule />}
        </div>
      </main>

      <Footer />

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
