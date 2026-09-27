import React from 'react';
import { CheckCircle2, Clock, CircleDot, AlertCircle } from 'lucide-react';

export interface JourneyStage {
  key: string;
  label: string;
  desc?: string;
}

interface PatientJourneyProps {
  currentStatus: string;
  queueNumber?: number;
}

const STAGES: JourneyStage[] = [
  { key: 'APPOINTMENT_REQUESTED', label: 'Requested', desc: 'Request sent to hospital' },
  { key: 'CONFIRMED', label: 'Verified', desc: 'Reception confirmed slot' },
  { key: 'CHECKED_IN', label: 'Arrived', desc: 'Physical check-in at desk' },
  { key: 'WAITING_FOR_DOCTOR', label: 'In Queue', desc: 'Waiting in OPD lounge' },
  { key: 'IN_CONSULTATION', label: 'Consultation', desc: 'Meeting with doctor' },
  { key: 'WAITING_FOR_PHARMACY', label: 'Pharmacy', desc: 'Prescription dispensing' },
  { key: 'COMPLETED', label: 'Completed', desc: 'Care visit concluded' },
];

export const PatientJourney: React.FC<PatientJourneyProps> = ({ currentStatus, queueNumber }) => {
  const getStageIndex = (status: string) => {
    switch (status) {
      case 'APPOINTMENT_REQUESTED':
      case 'RECEPTION_REVIEW':
        return 0;
      case 'CONFIRMED':
        return 1;
      case 'CHECKED_IN':
        return 2;
      case 'WAITING_FOR_DOCTOR':
        return 3;
      case 'IN_CONSULTATION':
        return 4;
      case 'WAITING_FOR_PHARMACY':
      case 'WAITING_FOR_LAB':
        return 5;
      case 'COMPLETED':
      case 'FOLLOW_UP':
        return 6;
      case 'CANCELLED':
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);

  if (currentStatus === 'CANCELLED') {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 flex items-center gap-3 text-rose-800">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">This appointment has been cancelled.</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-100">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Hospital Care Journey</h4>
          <p className="text-sm font-medium text-slate-800 mt-0.5">
            Current Status: <span className="text-[#1d1160] font-semibold">{STAGES[currentIndex]?.label || currentStatus}</span>
          </p>
        </div>
        {queueNumber && currentIndex >= 2 && currentIndex <= 3 && (
          <div className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-md text-center">
            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">OPD Token</span>
            <span className="text-base font-bold text-[#1d1160]">#{queueNumber}</span>
          </div>
        )}
      </div>

      <div className="relative">
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[620px] flex items-center justify-between relative">
            {/* Connecting Bar */}
            <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
            <div
              className="absolute top-4 left-6 h-0.5 bg-[#1d1160] -z-0 transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentIndex) / (STAGES.length - 1)) * 90}%`,
              }}
            />

            {STAGES.map((stage, idx) => {
              const isPassed = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              const isPending = idx > currentIndex;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center relative z-10 w-24">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                      isPassed
                        ? 'bg-[#1d1160] border-[#1d1160] text-white shadow-sm'
                        : isCurrent
                        ? 'bg-white border-[#1d1160] text-[#1d1160] ring-4 ring-indigo-50'
                        : 'bg-white border-slate-300 text-slate-400'
                    }`}
                  >
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : isCurrent ? (
                      <CircleDot className="w-4 h-4 animate-pulse text-[#1d1160]" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-slate-300" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold mt-2.5 leading-tight ${
                      isCurrent ? 'text-[#1d1160]' : isPassed ? 'text-slate-800' : 'text-slate-400'
                    }`}
                  >
                    {stage.label}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5 leading-tight hidden sm:block">
                    {stage.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
