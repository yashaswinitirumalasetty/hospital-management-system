import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { ShieldCheck, UserCheck, Stethoscope, HeartHandshake, Pill, Settings, Building, Globe } from 'lucide-react';

interface DemoRoleSwitcherProps {
  currentView: string;
  onSelectView: (view: string) => void;
}

export const DemoRoleSwitcher: React.FC<DemoRoleSwitcherProps> = ({ currentView, onSelectView }) => {
  const { user, switchRole, logout } = useAuth();

  const portals: { id: string; role?: UserRole; label: string; icon: React.ReactNode; userLabel: string }[] = [
    { id: 'PUBLIC', label: 'Public Portal', icon: <Globe className="w-3.5 h-3.5" />, userLabel: 'Landing Page' },
    { id: 'PATIENT', role: 'PATIENT', label: 'Patient Portal', icon: <UserCheck className="w-3.5 h-3.5" />, userLabel: 'Ravi Kumar (P-100245)' },
    { id: 'RECEPTION', role: 'RECEPTION', label: 'Reception', icon: <HeartHandshake className="w-3.5 h-3.5" />, userLabel: 'Meera Patel' },
    { id: 'DOCTOR', role: 'DOCTOR', label: 'Doctor OPD', icon: <Stethoscope className="w-3.5 h-3.5" />, userLabel: 'Dr. Ramesh Kumar' },
    { id: 'NURSE', role: 'NURSE', label: 'Nurse Station', icon: <ActivityIcon className="w-3.5 h-3.5" />, userLabel: 'Sunita Das, RN' },
    { id: 'PHARMACY', role: 'PHARMACY', label: 'Medical Store', icon: <Pill className="w-3.5 h-3.5" />, userLabel: 'Vikram Joshi' },
    { id: 'ADMIN', role: 'ADMIN', label: 'Admin Ops', icon: <Settings className="w-3.5 h-3.5" />, userLabel: 'Dr. Alok Verma' },
    { id: 'OWNER', role: 'OWNER', label: 'Owner View', icon: <Building className="w-3.5 h-3.5" />, userLabel: 'Sunita Reddy' },
  ];

  const handlePortalSwitch = async (portal: typeof portals[0]) => {
    if (portal.id === 'PUBLIC') {
      onSelectView('PUBLIC');
      return;
    }

    if (portal.role) {
      if (user?.role !== portal.role) {
        await switchRole(portal.role);
      }
      onSelectView(portal.id);
    }
  };

  return (
    <div className="bg-[#140c43] text-white border-b border-indigo-950 text-xs px-3 py-1.5 flex flex-wrap items-center justify-between gap-2 shadow-sm select-none z-50">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 font-bold tracking-tight text-white pr-2 border-r border-indigo-800/80">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-100 font-semibold text-[11px]">Apex Hospital Core [H001]</span>
        </div>
        <span className="text-indigo-200/60 hidden md:inline text-[11px]">Switch Role Portal:</span>
      </div>

      {/* Switcher Pills */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        {portals.map((p) => {
          const isActive = currentView === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePortalSwitch(p)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white text-[#1d1160] font-bold shadow-sm ring-1 ring-white/20'
                  : 'text-indigo-100 hover:text-white hover:bg-white/10 font-medium'
              }`}
            >
              {p.icon}
              <span>{p.label}</span>
            </button>
          );
        })}
      </div>

      {/* Current Active Account indicator */}
      <div className="flex items-center gap-2 pl-2 border-l border-indigo-800/80 text-[11px]">
        {user ? (
          <div className="flex items-center gap-2">
            <span className="text-slate-300 hidden lg:inline">
              Logged in as: <strong className="text-white">{user.name}</strong> ({user.role})
            </span>
            <button
              onClick={() => {
                logout();
                onSelectView('PUBLIC');
              }}
              className="text-indigo-200 hover:text-rose-300 underline text-xs"
            >
              Sign out
            </button>
          </div>
        ) : (
          <span className="text-slate-300">Public Guest</span>
        )}
      </div>
    </div>
  );
};

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
