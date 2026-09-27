import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Timeline } from '../../components/ui/Timeline';
import {
  Stethoscope,
  Users,
  Clock,
  CheckCircle,
  FileText,
  Pill,
  Calendar,
  AlertCircle,
  Plus,
  Trash2,
  Activity,
  History
} from 'lucide-react';

export const DoctorPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'CONSULT' | 'PATIENTS' | 'SCHEDULE'>('QUEUE');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [authorizedPatients, setAuthorizedPatients] = useState<any[]>([]);
  const [selectedPatientHistory, setSelectedPatientHistory] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Active Consultation State
  const [activeAppointment, setActiveAppointment] = useState<any>(null);
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [physicalExam, setPhysicalExam] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [nurseInstruction, setNurseInstruction] = useState('');
  const [instructionPriority, setInstructionPriority] = useState('ROUTINE');

  // Prescription Items State
  const [rxItems, setRxItems] = useState<any[]>([
    {
      medicineName: 'Amlodipine 5mg',
      genericName: 'Amlodipine Besylate',
      dosage: '1 tablet (5mg)',
      frequency: 'Once daily morning',
      duration: '30 days',
      instructions: 'After breakfast with water',
      quantityPrescribed: 30,
    },
  ]);

  const [consultSuccess, setConsultSuccess] = useState('');
  const [consultError, setConsultError] = useState('');

  const loadDoctorData = async () => {
    setIsLoading(true);
    try {
      const [dash, patients] = await Promise.all([
        apiClient('/doctor/dashboard'),
        apiClient('/doctor/patients'),
      ]);
      setDashboardData(dash);
      setAuthorizedPatients(patients.patients || []);

      // If there's an ongoing consultation or someone ready, select them
      if (dash.inConsultation) {
        selectAppointmentForConsult(dash.inConsultation);
      } else if (dash.waitingPatients?.length > 0 && !activeAppointment) {
        selectAppointmentForConsult(dash.waitingPatients[0]);
      }
    } catch (err) {
      console.error('Failed to load doctor data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, [user]);

  const selectAppointmentForConsult = (appt: any) => {
    setActiveAppointment(appt);
    setChiefComplaint(appt.reason || 'Follow-up consultation');
    setSymptoms(appt.reason || '');
    setPhysicalExam('Patient alert, conscious, oriented. Heart sounds S1/S2 heard normal. Chest clear.');
    setDiagnosis('Stage 1 Hypertension review');
    setInstructions('Continue prescribed medications. Follow low-sodium diet and repeat BP in 4 weeks.');
    setFollowUpDate(new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]);
  };

  const handleViewPatientHistory = async (patientId: string) => {
    try {
      const history = await apiClient(`/doctor/patient-history/${patientId}`);
      setSelectedPatientHistory(history);
      setIsHistoryModalOpen(true);
    } catch (err) {
      console.error('Failed to load patient history:', err);
    }
  };

  const handleAddRxItem = () => {
    setRxItems([
      ...rxItems,
      {
        medicineName: '',
        genericName: '',
        dosage: '1 tablet',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'After food',
        quantityPrescribed: 10,
      },
    ]);
  };

  const handleRemoveRxItem = (index: number) => {
    setRxItems(rxItems.filter((_, i) => i !== index));
  };

  const handleUpdateRxItem = (index: number, field: string, value: any) => {
    const updated = [...rxItems];
    updated[index][field] = value;
    setRxItems(updated);
  };

  const handleStartConsultation = async (appt: any) => {
    try {
      await apiClient(`/doctor/appointments/${appt.id}/start-consultation`, { method: 'POST' });
      selectAppointmentForConsult(appt);
      setActiveTab('CONSULT');
      loadDoctorData();
    } catch (err) {
      console.error('Failed to start consultation:', err);
    }
  };

  const handleSubmitConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointment) return;
    setConsultError('');
    setConsultSuccess('');

    try {
      const res = await apiClient('/doctor/consultations', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: activeAppointment.id,
          patientId: activeAppointment.patient.id,
          chiefComplaint,
          symptoms,
          physicalExam,
          diagnosis,
          clinicalNotes,
          instructions,
          followUpDate,
          prescriptionItems: rxItems.filter((item) => item.medicineName.trim().length > 0),
          nurseInstructions: nurseInstruction,
          instructionPriority,
        }),
      });

      setConsultSuccess(
        `Consultation saved. E-Prescription ${res.prescription?.prescriptionCode || 'RX'} automatically routed to Medical Store / Pharmacy.`
      );
      loadDoctorData();
    } catch (err: any) {
      setConsultError(err.message || 'Failed to complete consultation.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Doctor Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-[#1d1160]/20 flex items-center justify-center text-[#1d1160]">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {dashboardData?.doctor?.name || user?.name}
              </h2>
              <Badge variant="brand">{dashboardData?.doctor?.department || 'Consultant'}</Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Specialty: <strong className="text-slate-700">{dashboardData?.doctor?.specialty}</strong> &bull; Room: {dashboardData?.doctor?.roomNumber || 'Room 204'} &bull; OPD Hours: {dashboardData?.doctor?.scheduleHours}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px] uppercase font-bold">OPD Patients Waiting</span>
            <span className="text-base font-bold text-amber-700">
              {dashboardData?.metrics?.waitingCount || 0} in queue
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'QUEUE', label: 'Active OPD Queue', count: dashboardData?.metrics?.waitingCount },
          { id: 'CONSULT', label: 'Clinical Consultation & E-Prescription' },
          { id: 'PATIENTS', label: 'Authorized Patients' },
          { id: 'SCHEDULE', label: 'My Working Schedule' },
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

      {/* TAB 1: ACTIVE OPD QUEUE */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-6">
          <Card
            title="Today's OPD Queue - Waiting Patients"
            subtitle="Patients checked in by Reception and waiting in the lounge"
          >
            {dashboardData?.waitingPatients?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Token #</th>
                      <th className="py-2.5 px-3">Patient ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Gender / Age</th>
                      <th className="py-2.5 px-3">Chief Complaint</th>
                      <th className="py-2.5 px-3">Latest Vitals (Nurse)</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.waitingPatients.map((appt: any) => {
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
                            {appt.patient.allergies && (
                              <span className="text-[10px] text-rose-700 block font-medium">
                                Allergy: {appt.patient.allergies}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-slate-600">
                            {appt.patient.gender} &bull; {appt.patient.dateOfBirth}
                          </td>
                          <td className="py-3 px-3 text-slate-700 max-w-xs">{appt.reason || 'Checkup'}</td>
                          <td className="py-3 px-3">
                            {latestVitals ? (
                              <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                BP {latestVitals.bloodPressure || 'N/A'} &bull; Pulse {latestVitals.pulse || 'N/A'}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Triage pending</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPatientHistory(appt.patient.id)}
                            >
                              <History className="w-3.5 h-3.5 mr-1" />
                              History
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleStartConsultation(appt)}
                            >
                              Start Consult
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
                No patients currently waiting in your OPD queue.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: CLINICAL CONSULTATION SUITE & E-PRESCRIPTION */}
      {activeTab === 'CONSULT' && (
        <div className="space-y-6">
          {activeAppointment ? (
            <Card
              title={
                <div className="flex items-center gap-3">
                  <span>Consultation Room:</span>
                  <span className="text-[#1d1160] font-bold">
                    {activeAppointment.patient.firstName} {activeAppointment.patient.lastName}
                  </span>
                  <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {activeAppointment.patient.patientId}
                  </span>
                </div>
              }
              subtitle="Record clinical examination, establish diagnosis, write e-prescription, and issue nursing tasks"
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewPatientHistory(activeAppointment.patient.id)}
                >
                  <History className="w-3.5 h-3.5 mr-1" />
                  View Longitudinal Timeline
                </Button>
              }
            >
              {consultSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{consultSuccess}</span>
                </div>
              )}

              {consultError && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{consultError}</span>
                </div>
              )}

              <form onSubmit={handleSubmitConsultation} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint *</label>
                    <input
                      type="text"
                      required
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      placeholder="e.g. Occipital headache, palpitations during exertion"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Diagnosis *</label>
                    <input
                      type="text"
                      required
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Primary Essential Hypertension (ICD-10 I10)"
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Symptoms & History of Present Illness</label>
                    <textarea
                      rows={2}
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Physical Examination & Findings</label>
                    <textarea
                      rows={2}
                      value={physicalExam}
                      onChange={(e) => setPhysicalExam(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Doctor Advice & Patient Instructions</label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Dietary recommendations, physical activity, warning signs..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                  />
                </div>

                {/* E-PRESCRIPTION BUILDER */}
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Digital E-Prescription (Auto-routed to Medical Store / Pharmacy)
                      </h4>
                      <p className="text-[11px] text-slate-400">Prescription automatically queues for pharmacist dispensing upon submission</p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={handleAddRxItem}>
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Add Medication
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {rxItems.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                        <div className="sm:col-span-3">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Medicine Name *</label>
                          <input
                            type="text"
                            required
                            value={item.medicineName}
                            onChange={(e) => handleUpdateRxItem(idx, 'medicineName', e.target.value)}
                            placeholder="e.g. Paracetamol 500mg"
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Dosage</label>
                          <input
                            type="text"
                            value={item.dosage}
                            onChange={(e) => handleUpdateRxItem(idx, 'dosage', e.target.value)}
                            placeholder="1 tablet"
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Frequency</label>
                          <input
                            type="text"
                            value={item.frequency}
                            onChange={(e) => handleUpdateRxItem(idx, 'frequency', e.target.value)}
                            placeholder="3 times daily"
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Duration</label>
                          <input
                            type="text"
                            value={item.duration}
                            onChange={(e) => handleUpdateRxItem(idx, 'duration', e.target.value)}
                            placeholder="5 days"
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instructions</label>
                          <input
                            type="text"
                            value={item.instructions}
                            onChange={(e) => handleUpdateRxItem(idx, 'instructions', e.target.value)}
                            placeholder="After food"
                            className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded bg-white"
                          />
                        </div>
                        <div className="sm:col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveRxItem(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* DOCTOR INSTRUCTION FOR NURSE */}
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                    Doctor Instructions for Nursing Staff (Optional)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        value={nurseInstruction}
                        onChange={(e) => setNurseInstruction(e.target.value)}
                        placeholder="e.g. Monitor blood pressure every 4 hours, perform 12-lead ECG..."
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                      />
                    </div>
                    <div>
                      <select
                        value={instructionPriority}
                        onChange={(e) => setInstructionPriority(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                      >
                        <option value="ROUTINE">Routine</option>
                        <option value="URGENT">Urgent</option>
                        <option value="STAT">STAT / Immediate</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-between items-center border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Next Follow-up Date:
                    <input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="ml-2 text-xs px-2 py-1 border border-slate-300 rounded"
                    />
                  </div>

                  <Button type="submit">
                    Complete Consultation & Issue E-Prescription
                  </Button>
                </div>
              </form>
            </Card>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              Please select a waiting patient from the queue to start a consultation.
            </p>
          )}
        </div>
      )}

      {/* TAB 3: AUTHORIZED PATIENTS */}
      {activeTab === 'PATIENTS' && (
        <Card title="Authorized Patient Directory" subtitle="Patients with consultation records in your OPD">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Patient ID</th>
                  <th className="py-2.5 px-3">Patient Name</th>
                  <th className="py-2.5 px-3">Gender / DOB</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Blood Group</th>
                  <th className="py-2.5 px-3">Known Allergies</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {authorizedPatients.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-[#1d1160]">{p.patientId}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{p.firstName} {p.lastName}</td>
                    <td className="py-3 px-3 text-slate-600">{p.gender} &bull; {p.dateOfBirth}</td>
                    <td className="py-3 px-3 text-slate-600">{p.phone}</td>
                    <td className="py-3 px-3 font-medium text-slate-800">{p.bloodGroup || '—'}</td>
                    <td className="py-3 px-3">
                      {p.allergies ? (
                        <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-100">
                          {p.allergies}
                        </span>
                      ) : (
                        <span className="text-slate-400">NKDA</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewPatientHistory(p.id)}
                      >
                        <History className="w-3.5 h-3.5 mr-1" />
                        Longitudinal Timeline
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 4: SCHEDULE */}
      {activeTab === 'SCHEDULE' && (
        <div className="max-w-2xl mx-auto">
          <Card title="Physician Outpatient Clinic Schedule" subtitle="Your configured OPD hours and consulting room">
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Available Clinic Days:</span>
                <strong className="text-slate-900">{dashboardData?.doctor?.availableDays || 'Mon,Tue,Wed,Thu,Fri'}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">OPD Consultation Hours:</span>
                <strong className="text-slate-900">{dashboardData?.doctor?.scheduleHours || '09:00 - 15:00'}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Designated Room:</span>
                <strong className="text-slate-900">{dashboardData?.doctor?.roomNumber || 'Room 204, OPD Wing A'}</strong>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Patient Longitudinal Timeline */}
      <Modal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Longitudinal Medical History"
        subtitle={`Patient ${selectedPatientHistory?.patient?.firstName} ${selectedPatientHistory?.patient?.lastName} (${selectedPatientHistory?.patient?.patientId})`}
        maxWidth="2xl"
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {selectedPatientHistory?.patient?.allergies && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded font-medium">
              Documented Allergies: {selectedPatientHistory.patient.allergies}
            </div>
          )}

          <Timeline
            entries={[
              ...(selectedPatientHistory?.consultations || []).map((c: any) => ({
                id: c.id,
                date: c.createdAt,
                type: 'CONSULTATION',
                title: `Consultation: ${c.diagnosis}`,
                doctorName: c.doctor?.user?.name,
                diagnosis: c.diagnosis,
                symptoms: c.symptoms,
                notes: c.clinicalNotes,
                instructions: c.instructions,
                prescriptions: c.prescriptions,
              })),
              ...(selectedPatientHistory?.nurseRecords || []).map((nr: any) => ({
                id: nr.id,
                date: nr.recordedAt,
                type: 'VITALS',
                title: `Triage Vitals by ${nr.nurse?.user?.name}`,
                bloodPressure: nr.bloodPressure,
                pulse: nr.pulse,
                temperature: nr.temperature,
                spO2: nr.spO2,
                weight: nr.weight,
                notes: nr.nursingNotes,
              })),
            ]}
          />
        </div>
      </Modal>
    </div>
  );
};
