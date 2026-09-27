import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Activity,
  Heart,
  CheckCircle,
  AlertCircle,
  Clock,
  ClipboardList,
  PlusCircle,
  UserCheck
} from 'lucide-react';

export const NursePortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'VITALS_ENTRY' | 'INSTRUCTIONS'>('DASHBOARD');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [selectedPatientForVitals, setSelectedPatientForVitals] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vitals Form State
  const [bp, setBp] = useState('120/80 mmHg');
  const [pulse, setPulse] = useState('76');
  const [temp, setTemp] = useState('98.6 F');
  const [spO2, setSpO2] = useState('99');
  const [respRate, setRespRate] = useState('16');
  const [weight, setWeight] = useState('72');
  const [nursingNotes, setNursingNotes] = useState('Patient comfortable, alert, oriented x 3.');
  const [vitalsSuccess, setVitalsSuccess] = useState('');
  const [vitalsError, setVitalsError] = useState('');

  const loadNurseData = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient('/nurse/dashboard');
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load nurse data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNurseData();
  }, []);

  const handleRecordVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForVitals) return;
    setVitalsError('');
    setVitalsSuccess('');

    try {
      await apiClient('/nurse/vitals', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatientForVitals.patient.id,
          appointmentId: selectedPatientForVitals.id,
          bloodPressure: bp,
          pulse: parseInt(pulse, 10),
          temperature: temp,
          spO2: parseInt(spO2, 10),
          respiratoryRate: parseInt(respRate, 10),
          weight: parseFloat(weight),
          nursingNotes,
        }),
      });

      setVitalsSuccess(`Vitals recorded for patient ${selectedPatientForVitals.patient.firstName} ${selectedPatientForVitals.patient.lastName} (${selectedPatientForVitals.patient.patientId}) and saved to permanent timeline.`);
      setSelectedPatientForVitals(null);
      loadNurseData();
    } catch (err: any) {
      setVitalsError(err.message || 'Failed to record vitals.');
    }
  };

  const handleUpdateInstruction = async (id: string, status: 'ACKNOWLEDGED' | 'COMPLETED') => {
    try {
      await apiClient(`/nurse/instructions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status,
          completionNotes: status === 'COMPLETED' ? 'Task completed by duty nursing officer.' : undefined,
        }),
      });
      loadNurseData();
    } catch (err) {
      console.error('Failed to update instruction:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Nurse Station Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Hospital Nurse Station & Inpatient Triage</h2>
            <Badge variant="brand">Nursing Station</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Vital Signs Telemetry &bull; Doctor Clinical Instructions &bull; Patient Care Monitoring
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-lg text-right">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Pending Doctor Tasks</span>
            <span className="text-sm font-bold text-amber-700">
              {dashboardData?.metrics?.pendingInstructionsCount || 0} active
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'DASHBOARD', label: 'Triage Queue & Patient Vitals', count: dashboardData?.metrics?.activePatientsCount },
          { id: 'INSTRUCTIONS', label: 'Doctor Instructions Queue', count: dashboardData?.metrics?.pendingInstructionsCount },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? 'border-[#1d1160] text-[#1d1160]'
                  : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  isActive ? 'bg-[#1d1160] text-white' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: TRIAGE QUEUE & RECENT VITALS */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          <Card
            title="OPD Patients Needing Triage / Vitals Measurement"
            subtitle="Record baseline vital signs before the patient enters the Doctor's consultation room"
          >
            {dashboardData?.activeAppointments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Token #</th>
                      <th className="py-2.5 px-3">Patient ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Consulting Doctor</th>
                      <th className="py-2.5 px-3">Last Recorded Vitals</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.activeAppointments.map((appt: any) => {
                      const latestVitals = appt.nurseRecords?.[0];

                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-base text-[#1d1160]">
                            #{appt.queueNumber || '1'}
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-900">
                            {appt.patient.patientId}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-900">
                              {appt.patient.firstName} {appt.patient.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              {appt.patient.gender} &bull; Blood: {appt.patient.bloodGroup || 'O+'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700">
                            {appt.doctor?.user?.name || 'OPD Doctor'}
                          </td>
                          <td className="py-3 px-3">
                            {latestVitals ? (
                              <span className="text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded font-medium text-[11px] border border-emerald-200">
                                BP {latestVitals.bloodPressure} &bull; Pulse {latestVitals.pulse} bpm &bull; SpO2 {latestVitals.spO2}%
                              </span>
                            ) : (
                              <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-medium border border-amber-200">
                                Vitals Not Taken Today
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPatientForVitals(appt);
                                setVitalsSuccess('');
                                setVitalsError('');
                              }}
                            >
                              <Activity className="w-3.5 h-3.5 mr-1" />
                              Record Vitals
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                No active patients waiting for vitals measurement right now.
              </p>
            )}
          </Card>

          {/* Recent Vitals Recorded in Hospital */}
          <Card title="Recently Recorded Patient Vitals" subtitle="Audit log of vital observations">
            {dashboardData?.recentVitals?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Timestamp</th>
                      <th className="py-2.5 px-3">Patient ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Blood Pressure</th>
                      <th className="py-2.5 px-3">Pulse</th>
                      <th className="py-2.5 px-3">SpO2</th>
                      <th className="py-2.5 px-3">Temperature</th>
                      <th className="py-2.5 px-3">Nurse</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.recentVitals.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 text-slate-500">
                          {new Date(v.recordedAt).toLocaleTimeString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{v.patient?.patientId}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {v.patient?.firstName} {v.patient?.lastName}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{v.bloodPressure || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.pulse ? `${v.pulse} bpm` : '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.spO2 ? `${v.spO2}%` : '—'}</td>
                        <td className="py-2.5 px-3 text-slate-700">{v.temperature || '—'}</td>
                        <td className="py-2.5 px-3 text-slate-500">{v.nurse?.user?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3 text-center">No vitals logged yet today.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: DOCTOR INSTRUCTIONS QUEUE */}
      {activeTab === 'INSTRUCTIONS' && (
        <Card
          title="Clinical Doctor Instructions for Nursing Care"
          subtitle="Specific patient tasks issued by physicians during consultations"
        >
          {dashboardData?.pendingInstructions?.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.pendingInstructions.map((inst: any) => (
                <div
                  key={inst.id}
                  className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1d1160]">{inst.patient.patientId}</span>
                      <span className="font-bold text-slate-900">
                        {inst.patient.firstName} {inst.patient.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={inst.priority === 'STAT' ? 'danger' : inst.priority === 'URGENT' ? 'warning' : 'neutral'}>
                        {inst.priority}
                      </Badge>
                      <Badge variant={inst.status === 'COMPLETED' ? 'success' : 'brand'}>
                        {inst.status}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-slate-800">
                    "{inst.instruction}"
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-slate-500">
                    <span>Issued by: Dr. {inst.doctor?.user?.name}</span>
                    <div className="space-x-2">
                      {inst.status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateInstruction(inst.id, 'ACKNOWLEDGED')}
                        >
                          Acknowledge Task
                        </Button>
                      )}
                      {inst.status !== 'COMPLETED' && (
                        <Button
                          size="sm"
                          onClick={() => handleUpdateInstruction(inst.id, 'COMPLETED')}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Mark Completed
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">No pending doctor instructions.</p>
          )}
        </Card>
      )}

      {/* Modal: Record Vitals */}
      <Modal
        isOpen={Boolean(selectedPatientForVitals)}
        onClose={() => setSelectedPatientForVitals(null)}
        title="Record Clinical Vital Signs"
        subtitle={`Patient ${selectedPatientForVitals?.patient?.firstName} ${selectedPatientForVitals?.patient?.lastName} (${selectedPatientForVitals?.patient?.patientId})`}
      >
        {vitalsSuccess && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
            {vitalsSuccess}
          </div>
        )}
        {vitalsError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
            {vitalsError}
          </div>
        )}

        <form onSubmit={handleRecordVitals} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Pressure (mmHg) *</label>
              <input
                type="text"
                required
                value={bp}
                onChange={(e) => setBp(e.target.value)}
                placeholder="120/80 mmHg"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse (bpm) *</label>
              <input
                type="number"
                required
                value={pulse}
                onChange={(e) => setPulse(e.target.value)}
                placeholder="76"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature</label>
              <input
                type="text"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="98.6 F"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SpO2 (%)</label>
              <input
                type="number"
                value={spO2}
                onChange={(e) => setSpO2(e.target.value)}
                placeholder="99"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="70.5"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nursing Observation Notes</label>
            <textarea
              rows={2}
              value={nursingNotes}
              onChange={(e) => setNursingNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setSelectedPatientForVitals(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save Vitals to Longitudinal Patient Record
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
