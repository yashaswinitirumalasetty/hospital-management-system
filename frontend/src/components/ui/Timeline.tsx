import React from 'react';
import { Stethoscope, Activity, FileText, Pill, Calendar } from 'lucide-react';
import { Badge } from './Badge';

export interface TimelineEntry {
  id: string;
  date: string;
  type: 'CONSULTATION' | 'VITALS' | 'PRESCRIPTION' | 'REPORT';
  title: string;
  department?: string;
  doctorName?: string;
  nurseName?: string;
  diagnosis?: string;
  symptoms?: string;
  notes?: string;
  instructions?: string;
  bloodPressure?: string;
  pulse?: number;
  temperature?: string;
  spO2?: number;
  weight?: number;
  prescriptions?: any[];
}

interface TimelineProps {
  entries: TimelineEntry[];
  patientId?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ entries }) => {
  if (!entries || entries.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg bg-slate-50/50">
        <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-slate-600">No medical timeline entries found.</p>
        <p className="text-xs text-slate-400 mt-1">Records from doctor consultations, nurse vitals, and prescriptions will appear here.</p>
      </div>
    );
  }

  // Format date helper
  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return {
        monthDay: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        year: d.getFullYear(),
        time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      };
    } catch {
      return { monthDay: dateStr, year: '', time: '' };
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {entries.map((item) => {
        const { monthDay, year, time } = formatDate(item.date);

        return (
          <div key={item.id} className="relative mb-6 last:mb-0">
            {/* Timeline Icon Node */}
            <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center bg-white">
              {item.type === 'CONSULTATION' && (
                <div className="w-full h-full rounded-full bg-indigo-50 border border-[#1d1160]/40 flex items-center justify-center text-[#1d1160]">
                  <Stethoscope className="w-3.5 h-3.5" />
                </div>
              )}
              {item.type === 'VITALS' && (
                <div className="w-full h-full rounded-full bg-emerald-50 border border-emerald-400 flex items-center justify-center text-emerald-700">
                  <Activity className="w-3.5 h-3.5" />
                </div>
              )}
              {item.type === 'PRESCRIPTION' && (
                <div className="w-full h-full rounded-full bg-sky-50 border border-sky-400 flex items-center justify-center text-sky-700">
                  <Pill className="w-3.5 h-3.5" />
                </div>
              )}
              {item.type === 'REPORT' && (
                <div className="w-full h-full rounded-full bg-amber-50 border border-amber-400 flex items-center justify-center text-amber-700">
                  <FileText className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            {/* Event Content Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm hover:border-slate-300 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{monthDay}, {year}</span>
                  <span className="text-[11px] text-slate-400">{time}</span>
                  {item.department && <Badge variant="neutral" size="sm">{item.department}</Badge>}
                </div>
                <Badge
                  variant={
                    item.type === 'CONSULTATION'
                      ? 'brand'
                      : item.type === 'VITALS'
                      ? 'success'
                      : item.type === 'PRESCRIPTION'
                      ? 'info'
                      : 'warning'
                  }
                  size="sm"
                >
                  {item.type}
                </Badge>
              </div>

              <h4 className="text-sm font-semibold text-slate-900 mb-1">{item.title}</h4>

              {/* Consultation Specifics */}
              {item.diagnosis && (
                <div className="mt-2 text-xs space-y-1.5">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold text-slate-600 min-w-16">Diagnosis:</span>
                    <span className="text-slate-900 font-medium">{item.diagnosis}</span>
                  </div>
                  {item.symptoms && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500 min-w-16">Symptoms:</span>
                      <span className="text-slate-700">{item.symptoms}</span>
                    </div>
                  )}
                  {item.notes && (
                    <div className="flex items-start gap-2">
                      <span className="font-semibold text-slate-500 min-w-16">Notes:</span>
                      <span className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 w-full">{item.notes}</span>
                    </div>
                  )}
                  {item.instructions && (
                    <div className="flex items-start gap-2 text-indigo-900 bg-indigo-50/60 p-2 rounded border border-indigo-100">
                      <span className="font-semibold min-w-16">Advice:</span>
                      <span>{item.instructions}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Nurse Vitals Specifics */}
              {item.type === 'VITALS' && (
                <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {item.bloodPressure && (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Pressure</span>
                      <span className="font-semibold text-slate-800">{item.bloodPressure}</span>
                    </div>
                  )}
                  {item.pulse && (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Pulse</span>
                      <span className="font-semibold text-slate-800">{item.pulse} bpm</span>
                    </div>
                  )}
                  {item.spO2 && (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">SpO2 Oxygen</span>
                      <span className="font-semibold text-slate-800">{item.spO2}%</span>
                    </div>
                  )}
                  {item.temperature && (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Temperature</span>
                      <span className="font-semibold text-slate-800">{item.temperature}</span>
                    </div>
                  )}
                  {item.weight && (
                    <div className="bg-slate-50 border border-slate-100 p-2 rounded">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Weight</span>
                      <span className="font-semibold text-slate-800">{item.weight} kg</span>
                    </div>
                  )}
                </div>
              )}

              {/* Associated Prescriptions */}
              {item.prescriptions && item.prescriptions.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                    Prescribed Medications ({item.prescriptions[0].prescriptionCode})
                  </span>
                  <div className="space-y-1">
                    {item.prescriptions[0].items?.map((med: any) => (
                      <div key={med.id} className="text-xs flex items-center justify-between bg-slate-50 px-2.5 py-1.5 rounded border border-slate-100">
                        <span className="font-semibold text-slate-800">{med.medicineName}</span>
                        <span className="text-slate-500">{med.dosage} &bull; {med.frequency} &bull; {med.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
