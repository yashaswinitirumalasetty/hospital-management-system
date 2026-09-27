import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Timeline } from '../../components/ui/Timeline';
import { PatientJourney } from '../../components/ui/PatientJourney';
import {
  Calendar,
  Clock,
  User,
  FileText,
  Pill,
  Activity,
  PlusCircle,
  AlertTriangle,
  Heart,
  CheckCircle,
  Stethoscope
} from 'lucide-react';

export const PatientPortal: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'BOOK' | 'TIMELINE' | 'PRESCRIPTIONS' | 'PROFILE'>('OVERVIEW');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timelineData, setTimelineData] = useState<any>(null);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Booking Form State
  const [bookingDept, setBookingDept] = useState('');
  const [bookingDoctor, setBookingDoctor] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingTime, setBookingTime] = useState('10:30 AM');
  const [bookingReason, setBookingReason] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');
  const [bookingError, setBookingError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dash, time, rx, appts, depts, docs] = await Promise.all([
        apiClient('/patient/dashboard'),
        apiClient('/patient/timeline'),
        apiClient('/patient/prescriptions'),
        apiClient('/patient/appointments'),
        apiClient('/public/departments'),
        apiClient('/public/doctors'),
      ]);
      setDashboardData(dash);
      setTimelineData(time);
      setPrescriptions(rx.prescriptions || []);
      setAppointments(appts.appointments || []);
      setDepartments(depts.departments || []);
      setDoctors(docs.doctors || []);
    } catch (err) {
      console.error('Failed to load patient data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');
    setBookingSuccess('');

    try {
      await apiClient('/patient/appointments', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: bookingDept,
          doctorId: bookingDoctor || undefined,
          appointmentDate: bookingDate,
          timeSlot: bookingTime,
          reason: bookingReason,
        }),
      });

      setBookingSuccess('Appointment request sent to Reception. The front desk will verify your slot and update your journey status.');
      setBookingReason('');
      loadData();
    } catch (err: any) {
      setBookingError(err.message || 'Failed to submit appointment request.');
    }
  };

  const filteredBookingDoctors = doctors.filter(
    (d) => !bookingDept || d.departmentId === bookingDept
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Patient Identity Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-50 border border-[#1d1160]/20 flex items-center justify-center text-[#1d1160] font-bold text-lg">
            {dashboardData?.patient?.firstName?.[0] || 'P'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                {dashboardData?.patient?.firstName} {dashboardData?.patient?.lastName}
              </h2>
              <span className="bg-indigo-50 text-[#1d1160] font-mono font-bold text-xs px-2.5 py-0.5 rounded border border-indigo-200">
                ID: {dashboardData?.patient?.patientId || 'P-100245'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-1">
              <span>Blood Group: <strong className="text-slate-800">{dashboardData?.patient?.bloodGroup || 'O+'}</strong></span>
              {dashboardData?.patient?.allergies && (
                <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                  Allergies: {dashboardData.patient.allergies}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setActiveTab('BOOK')}>
            <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
            Request Appointment
          </Button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'My Hospital Journey', icon: Activity },
          { id: 'BOOK', label: 'Book Appointment', icon: Calendar },
          { id: 'TIMELINE', label: 'Longitudinal Medical Records', icon: FileText },
          { id: 'PRESCRIPTIONS', label: 'Prescriptions (Rx)', icon: Pill },
          { id: 'PROFILE', label: 'Patient Profile', icon: User },
        ].map((tab) => {
          const Icon = tab.icon;
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
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & LIVE JOURNEY */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          {/* Visual Patient Journey Progress */}
          {dashboardData?.activeAppointment ? (
            <PatientJourney
              currentStatus={dashboardData.activeAppointment.status}
              queueNumber={dashboardData.activeAppointment.queueNumber}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-5 text-center text-xs text-slate-500">
              <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
              <p className="font-semibold text-slate-800">No active hospital journey in progress.</p>
              <p className="mt-0.5">Need a consultation? Click 'Book Appointment' to schedule a visit.</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active / Next Appointment Card */}
            <div className="lg:col-span-2 space-y-6">
              <Card
                title="Current or Next Scheduled Visit"
                subtitle="Live status managed by hospital Reception and Doctor OPD"
              >
                {dashboardData?.activeAppointment ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">Department</span>
                        <strong className="text-slate-900 text-sm">
                          {dashboardData.activeAppointment.department?.name}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Consultant Physician</span>
                        <strong className="text-slate-900 text-sm">
                          {dashboardData.activeAppointment.doctor?.user?.name || 'Assigned on arrival'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Scheduled Date & Slot</span>
                        <strong className="text-slate-900 text-sm">
                          {dashboardData.activeAppointment.appointmentDate} at {dashboardData.activeAppointment.timeSlot}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px]">Workflow State</span>
                        <Badge variant="brand">{dashboardData.activeAppointment.status}</Badge>
                      </div>
                    </div>

                    {dashboardData.activeAppointment.reason && (
                      <div className="text-xs text-slate-600">
                        <span className="font-semibold text-slate-700">Reason for visit: </span>
                        {dashboardData.activeAppointment.reason}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-3">No upcoming visits scheduled.</p>
                )}
              </Card>

              {/* Recent Vitals Recorded by Nurse */}
              <Card title="Latest Clinical Vitals" subtitle="Recorded during hospital visits by Nursing staff">
                {dashboardData?.recentVitals && dashboardData.recentVitals.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Blood Pressure</span>
                      <span className="text-sm font-bold text-slate-800">
                        {dashboardData.recentVitals[0].bloodPressure || 'N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Pulse</span>
                      <span className="text-sm font-bold text-slate-800">
                        {dashboardData.recentVitals[0].pulse || 'N/A'} bpm
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">SpO2 Oxygen</span>
                      <span className="text-sm font-bold text-slate-800">
                        {dashboardData.recentVitals[0].spO2 || 'N/A'}%
                      </span>
                    </div>
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Temperature</span>
                      <span className="text-sm font-bold text-slate-800">
                        {dashboardData.recentVitals[0].temperature || 'N/A'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No vitals logged yet.</p>
                )}
              </Card>
            </div>

            {/* Sidebar Column: Recent Prescriptions & Notifications */}
            <div className="space-y-6">
              <Card title="Active Prescriptions" subtitle="Issued by hospital physicians">
                {prescriptions.length > 0 ? (
                  <div className="space-y-3">
                    {prescriptions.slice(0, 2).map((rx) => (
                      <div key={rx.id} className="p-3 border border-slate-200 rounded-lg text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#1d1160]">{rx.prescriptionCode}</span>
                          <Badge variant={rx.status === 'DISPENSED' ? 'success' : 'warning'} size="sm">
                            {rx.status}
                          </Badge>
                        </div>
                        <p className="text-slate-500 text-[11px]">
                          Issued by {rx.doctor?.user?.name}
                        </p>
                        <div className="pt-1 border-t border-slate-100">
                          {rx.items?.map((item: any) => (
                            <div key={item.id} className="font-semibold text-slate-800">
                              {item.medicineName} ({item.dosage})
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" className="w-full" onClick={() => setActiveTab('PRESCRIPTIONS')}>
                      View All Prescriptions
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No prescriptions available.</p>
                )}
              </Card>

              <Card title="Hospital Notifications" subtitle="Real-time operational alerts">
                {dashboardData?.notifications && dashboardData.notifications.length > 0 ? (
                  <div className="space-y-2.5">
                    {dashboardData.notifications.map((n: any) => (
                      <div key={n.id} className="p-2.5 bg-slate-50 rounded border border-slate-100 text-xs">
                        <h5 className="font-semibold text-slate-900">{n.title}</h5>
                        <p className="text-slate-500 text-[11px] mt-0.5">{n.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 py-2">No new notifications.</p>
                )}
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BOOK APPOINTMENT (Request sent to Reception) */}
      {activeTab === 'BOOK' && (
        <div className="max-w-2xl mx-auto">
          <Card
            title="Submit Appointment Request"
            subtitle="Your request will be sent directly to hospital Reception for verification and scheduling"
          >
            {bookingSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingSuccess}</span>
              </div>
            )}

            {bookingError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{bookingError}</span>
              </div>
            )}

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department *</label>
                <select
                  required
                  value={bookingDept}
                  onChange={(e) => setBookingDept(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                >
                  <option value="">-- Choose Clinical Department --</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code}) - {d.locationFloor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Doctor (Optional)</label>
                <select
                  value={bookingDoctor}
                  onChange={(e) => setBookingDoctor(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                >
                  <option value="">-- Any Available Specialist --</option>
                  {filteredBookingDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      {doc.name} &bull; {doc.specialty} ({doc.scheduleHours})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Preferred Date *</label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setBookingDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
                  <select
                    required
                    value={bookingTime}
                    onChange={(e) => setBookingTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                  >
                    <option>09:00 AM</option>
                    <option>09:30 AM</option>
                    <option>10:00 AM</option>
                    <option>10:30 AM</option>
                    <option>11:00 AM</option>
                    <option>11:30 AM</option>
                    <option>02:00 PM</option>
                    <option>02:30 PM</option>
                    <option>03:00 PM</option>
                    <option>03:30 PM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit / Symptoms</label>
                <textarea
                  rows={3}
                  value={bookingReason}
                  onChange={(e) => setBookingReason(e.target.value)}
                  placeholder="Describe your symptoms, reason for consultation, or follow-up needs..."
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" className="w-full">
                  Submit Request to Reception Queue
                </Button>
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Hospital workflow: Patient Request &rarr; Reception Verification &rarr; Doctor OPD Queue.
                </p>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 3: LONGITUDINAL MEDICAL RECORDS */}
      {activeTab === 'TIMELINE' && (
        <div className="space-y-6">
          <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 text-xs text-indigo-950 flex items-center justify-between">
            <div>
              <span className="font-bold text-[#1d1160]">Permanent Longitudinal Patient Identity: </span>
              <span className="font-mono font-bold">{dashboardData?.patient?.patientId || 'P-100245'}</span>
              <p className="text-slate-600 mt-0.5">
                All consultations, nurse vitals, and diagnostic records across 2025 and 2026 are unified under this lifelong ID.
              </p>
            </div>
            <Badge variant="brand">Unified Record</Badge>
          </div>

          <Timeline entries={timelineData?.timeline || []} patientId={dashboardData?.patient?.patientId} />
        </div>
      )}

      {/* TAB 4: PRESCRIPTIONS */}
      {activeTab === 'PRESCRIPTIONS' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {prescriptions.map((rx) => (
              <Card
                key={rx.id}
                title={`Prescription ${rx.prescriptionCode}`}
                subtitle={`Prescribed by ${rx.doctor?.user?.name} (${rx.doctor?.department?.name || 'OPD'})`}
                action={
                  <Badge variant={rx.status === 'DISPENSED' ? 'success' : 'warning'}>
                    {rx.status}
                  </Badge>
                }
              >
                <div className="space-y-3">
                  <div className="text-[11px] text-slate-500 flex justify-between">
                    <span>Date: {new Date(rx.createdAt).toLocaleDateString()}</span>
                    <span>Status: {rx.status}</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {rx.items?.map((item: any) => (
                      <div key={item.id} className="p-2.5 bg-slate-50 rounded border border-slate-100 text-xs">
                        <div className="flex items-center justify-between font-bold text-slate-800">
                          <span>{item.medicineName}</span>
                          <span className="text-[11px] text-[#1d1160]">Qty: {item.quantityPrescribed}</span>
                        </div>
                        <div className="text-slate-500 text-[11px] mt-0.5">
                          Dosage: {item.dosage} &bull; Frequency: {item.frequency} &bull; Duration: {item.duration}
                        </div>
                        {item.instructions && (
                          <div className="text-indigo-900 bg-white p-1 rounded mt-1 text-[11px] border border-slate-200">
                            Instructions: {item.instructions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {rx.dispensedBy && (
                    <div className="text-[11px] text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                      Dispensed by: {rx.dispensedBy} at {new Date(rx.dispensedAt).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: PATIENT PROFILE */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-2xl mx-auto">
          <Card title="Permanent Patient Demographic & Clinical Profile">
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">Unique Patient ID</span>
                  <span className="font-mono text-sm font-bold text-[#1d1160]">
                    {dashboardData?.patient?.patientId || 'P-100245'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <span className="font-semibold text-slate-800">
                    {dashboardData?.patient?.firstName} {dashboardData?.patient?.lastName}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                  <span className="font-semibold text-slate-800">{dashboardData?.patient?.dateOfBirth}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Gender</span>
                  <span className="font-semibold text-slate-800">{dashboardData?.patient?.gender}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contact Phone</span>
                  <span className="font-semibold text-slate-800">{dashboardData?.patient?.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="font-semibold text-slate-800">{dashboardData?.patient?.email}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <div>
                  <span className="text-slate-400 block text-[11px]">Blood Group</span>
                  <span className="font-bold text-slate-800">{dashboardData?.patient?.bloodGroup || 'O+'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Documented Drug Allergies</span>
                  <span className="font-medium text-rose-700 bg-rose-50 px-2 py-1 rounded inline-block border border-rose-200">
                    {dashboardData?.patient?.allergies || 'No known drug allergies (NKDA)'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Chronic Medical Conditions</span>
                  <span className="font-medium text-slate-700">
                    {dashboardData?.patient?.chronicConditions || 'None documented'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Emergency Contact</span>
                  <span className="font-medium text-slate-700">
                    {dashboardData?.patient?.emergencyContact || 'Not recorded'}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
