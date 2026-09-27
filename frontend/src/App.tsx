import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DemoRoleSwitcher } from './components/layout/DemoRoleSwitcher';
import { LandingPage } from './portals/public/LandingPage';
import { PatientPortal } from './portals/patient/PatientPortal';
import { ReceptionPortal } from './portals/reception/ReceptionPortal';
import { DoctorPortal } from './portals/doctor/DoctorPortal';
import { NursePortal } from './portals/nurse/NursePortal';
import { PharmacyPortal } from './portals/pharmacy/PharmacyPortal';
import { AdminPortal } from './portals/admin/AdminPortal';
import { OwnerDashboard } from './portals/owner/OwnerDashboard';

function MainRouter() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<string>('PUBLIC');

  // Auto sync view with logged-in user role if user logs in
  useEffect(() => {
    if (user && currentView === 'PUBLIC') {
      setCurrentView(user.role);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans text-slate-900">
      {/* Global Role Switcher & Live Connection Bar */}
      <DemoRoleSwitcher currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'PUBLIC' && <LandingPage onNavigateToPortal={setCurrentView} />}
        {currentView === 'PATIENT' && <PatientPortal />}
        {currentView === 'RECEPTION' && <ReceptionPortal />}
        {currentView === 'DOCTOR' && <DoctorPortal />}
        {currentView === 'NURSE' && <NursePortal />}
        {currentView === 'PHARMACY' && <PharmacyPortal />}
        {currentView === 'ADMIN' && <AdminPortal />}
        {currentView === 'OWNER' && <OwnerDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}
