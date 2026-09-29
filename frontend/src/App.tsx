import React, { useState, useEffect } from 'react';
import { TopAppBar } from './components/common/TopAppBar';
import { BottomNav } from './components/common/BottomNav';
import { NavigationDrawer } from './components/common/NavigationDrawer';
import { MedicalDisclaimerBanner } from './components/common/MedicalDisclaimerBanner';
import { OfflineState } from './components/common/OfflineState';
import { HeroOverview } from './components/common/HeroOverview';
import { SkinAnalysisModule } from './components/skin-analysis/SkinAnalysisModule';
import { SymptomCheckerModule } from './components/symptoms/SymptomCheckerModule';
import { MedicalReportsModule } from './components/reports/MedicalReportsModule';
import { PrescriptionModule } from './components/prescription/PrescriptionModule';
import { MedicationSafetyModule } from './components/medications/MedicationSafetyModule';
import { LifestyleModule } from './components/lifestyle/LifestyleModule';
import { AyurvedicWellnessModule } from './components/wellness/AyurvedicWellnessModule';
import { EmergencyTriageModule } from './components/emergency/EmergencyTriageModule';
import { PatientProfileModule } from './components/profile/PatientProfileModule';
import { SettingsModule } from './components/settings/SettingsModule';
import { HealthcareAccessModule } from './components/healthcare/HealthcareAccessModule';
import { Footer } from './components/common/Footer';
import { AuthModal } from './components/auth/AuthModal';
import { AuthProvider } from './context/AuthContext';

export const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Apply saved accessibility font size on load
    const savedFontSize = localStorage.getItem('dermasathi_font_size');
    if (savedFontSize === 'large') {
      document.documentElement.style.fontSize = '18px';
    } else if (savedFontSize === 'xlarge') {
      document.documentElement.style.fontSize = '20px';
    }

    if (localStorage.getItem('dermasathi_high_contrast') === 'true') {
      document.body.classList.add('high-contrast');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top Application Bar */}
      <TopAppBar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onToggleDrawer={() => setIsDrawerOpen(!isDrawerOpen)}
      />

      {/* Main View Area */}
      <main className="main-content-wrapper" style={{ flex: 1, padding: '20px 0' }}>
        <div className="container">
          {/* Persistent Clinical Disclaimer */}
          <MedicalDisclaimerBanner />

          {/* Low-Connectivity / Offline Banner if network is down */}
          {!isOnline && <OfflineState />}

          {/* 11 Application Destinations */}
          {currentTab === 'home' && <HeroOverview onSelectTab={setCurrentTab} />}
          {currentTab === 'symptoms' && <SymptomCheckerModule />}
          {currentTab === 'skin' && <SkinAnalysisModule onNavigateToClinics={() => setCurrentTab('facilities')} />}
          {currentTab === 'reports' && <MedicalReportsModule />}
          {currentTab === 'prescription' && <PrescriptionModule />}
          {currentTab === 'medicines' && <MedicationSafetyModule />}
          {currentTab === 'lifestyle' && <LifestyleModule />}
          {currentTab === 'ayurveda' && <AyurvedicWellnessModule />}
          {currentTab === 'emergency' && <EmergencyTriageModule />}
          {currentTab === 'profile' && <PatientProfileModule onOpenAuth={() => setIsAuthOpen(true)} />}
          {currentTab === 'settings' && <SettingsModule />}
          {currentTab === 'facilities' && <HealthcareAccessModule />}
        </div>
      </main>

      {/* Navigation Drawer (Modal for low digital-literacy navigation across all 11 destinations) */}
      <NavigationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
      />

      {/* Mobile-First Bottom Navigation Bar (Primary destinations) */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        onToggleDrawer={() => setIsDrawerOpen(true)}
      />

      {/* Footer */}
      <Footer />

      {/* Patient Auth Modal */}
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
