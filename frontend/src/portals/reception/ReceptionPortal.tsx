import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Search,
  UserPlus,
  CheckCircle,
  Clock,
  UserCheck,
  AlertCircle,
  CreditCard,
  Building,
  RefreshCw,
  Plus
} from 'lucide-react';

export const ReceptionPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'SEARCH' | 'NEW_PATIENT' | 'VERIFY_REQUESTS'>('DASHBOARD');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedPatientForVisit, setSelectedPatientForVisit] = useState<any>(null);

  // Check-In Modal
  const [checkInTarget, setCheckInTarget] = useState<any>(null);
  const [checkInPayment, setCheckInPayment] = useState<'RECEIVED' | 'PENDING' | 'NOT_APPLICABLE'>('RECEIVED');

  // New Patient Form State
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDob, setNewDob] = useState('1990-01-01');
  const [newGender, setNewGender] = useState('Male');
  const [newBlood, setNewBlood] = useState('O+');
  const [newAllergies, setNewAllergies] = useState('');
  const [newDept, setNewDept] = useState('');
  const [newDoctor, setNewDoctor] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTime, setNewTime] = useState('11:00 AM');
  const [newReason, setNewReason] = useState('');
  const [newPatientMsg, setNewPatientMsg] = useState('');
  const [newPatientError, setNewPatientError] = useState('');

  // Book Visit for Existing Patient Form State
  const [visitDept, setVisitDept] = useState('');
  const [visitDoctor, setVisitDoctor] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [visitTime, setVisitTime] = useState('11:30 AM');
  const [visitReason, setVisitReason] = useState('');
  const [visitPayment, setVisitPayment] = useState<'RECEIVED' | 'PENDING' | 'NOT_APPLICABLE'>('RECEIVED');
  const [visitSuccess, setVisitSuccess] = useState('');
  const [visitError, setVisitError] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [dash, depts, docs] = await Promise.all([
        apiClient('/reception/dashboard'),
        apiClient('/public/departments'),
        apiClient('/public/doctors'),
      ]);
      setDashboardData(dash);
      setDepartments(depts.departments || []);
      setDoctors(docs.doctors || []);
    } catch (err) {
      console.error('Failed to load reception data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = async (queryStr: string) => {
    setSearchQuery(queryStr);
    try {
      const data = await apiClient(`/reception/search-patients?q=${encodeURIComponent(queryStr)}`);
      setSearchResults(data.patients || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!checkInTarget) return;
    try {
      await apiClient(`/reception/appointments/${checkInTarget.id}/check-in`, {
        method: 'POST',
        body: JSON.stringify({ paymentStatus: checkInPayment }),
      });
      setCheckInTarget(null);
      loadData();
    } catch (err) {
      console.error('Check in failed:', err);
    }
  };

  const handleVerifyRequest = async (appointmentId: string, status: 'CONFIRMED' | 'CANCELLED') => {
    try {
      await apiClient(`/reception/appointments/${appointmentId}/verify`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      loadData();
    } catch (err) {
      console.error('Verification failed:', err);
    }
  };

  const handleRegisterNewPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewPatientError('');
    setNewPatientMsg('');

    try {
      const data = await apiClient('/reception/register-patient', {
        method: 'POST',
        body: JSON.stringify({
          firstName: newFirst,
          lastName: newLast,
          phone: newPhone,
          email: newEmail,
          dateOfBirth: newDob,
          gender: newGender,
          bloodGroup: newBlood,
          allergies: newAllergies,
          departmentId: newDept || undefined,
          doctorId: newDoctor || undefined,
          appointmentDate: newDept ? newDate : undefined,
          timeSlot: newDept ? newTime : undefined,
          reason: newReason,
        }),
      });

      setNewPatientMsg(`New Patient profile created with Permanent ID: ${data.patient.patientId}`);
      setNewFirst('');
      setNewLast('');
      setNewPhone('');
      setNewEmail('');
      loadData();
    } catch (err: any) {
      setNewPatientError(err.message || 'Failed to register patient.');
    }
  };

  const handleBookVisitForExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientForVisit) return;
    setVisitError('');
    setVisitSuccess('');

    try {
      await apiClient('/reception/book-existing-patient', {
        method: 'POST',
        body: JSON.stringify({
          patientId: selectedPatientForVisit.id,
          departmentId: visitDept,
          doctorId: visitDoctor || undefined,
          appointmentDate: visitDate,
          timeSlot: visitTime,
          reason: visitReason,
          paymentStatus: visitPayment,
        }),
      });

      setVisitSuccess(`New visit successfully booked and linked to existing Patient ID: ${selectedPatientForVisit.patientId}`);
      setSelectedPatientForVisit(null);
      loadData();
    } catch (err: any) {
      setVisitError(err.message || 'Failed to book visit.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Front Desk Operational Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Hospital Front Desk & Reception Portal</h2>
            <Badge variant="brand">Reception Hub</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational triage: Patient Identity Verification &bull; Queue Dispatch &bull; Physical Check-In
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadData}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setActiveTab('NEW_PATIENT')}>
            <UserPlus className="w-3.5 h-3.5 mr-1.5" />
            Register New Patient
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'DASHBOARD', label: "Today's Queue & Dashboard", count: dashboardData?.metrics?.waitingCount },
          { id: 'SEARCH', label: 'Existing Patient Lookup' },
          { id: 'NEW_PATIENT', label: 'New Patient Registration' },
          { id: 'VERIFY_REQUESTS', label: 'Pending Online Requests', count: dashboardData?.metrics?.pendingRequestsCount },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'SEARCH') handleSearch('');
              }}
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

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          {/* Operational Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Today's Appointments</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {dashboardData?.metrics?.todayTotal || 0}
              </span>
            </Card>
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Waiting in Lounge</span>
              <span className="text-2xl font-bold text-amber-700 mt-1 block">
                {dashboardData?.metrics?.waitingCount || 0}
              </span>
            </Card>
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Checked In</span>
              <span className="text-2xl font-bold text-[#1d1160] mt-1 block">
                {dashboardData?.metrics?.checkedInCount || 0}
              </span>
            </Card>
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Consultations Done</span>
              <span className="text-2xl font-bold text-emerald-700 mt-1 block">
                {dashboardData?.metrics?.completedCount || 0}
              </span>
            </Card>
          </div>

          {/* Today's Appointments & Arrival Check-In Table */}
          <Card
            title="Today's OPD Queue & Patient Arrivals"
            subtitle="Manage patient arrivals and click 'Check-In' to move them into the Doctor's active waiting queue"
          >
            {dashboardData?.todayAppointments?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Token #</th>
                      <th className="py-2.5 px-3">Patient ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Department & Doctor</th>
                      <th className="py-2.5 px-3">Slot</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.todayAppointments.map((appt: any) => {
                      const isWaiting = ['CHECKED_IN', 'WAITING_FOR_DOCTOR'].includes(appt.status);
                      const isCompleted = appt.status === 'COMPLETED';

                      return (
                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3 font-bold text-[#1d1160]">
                            {appt.queueNumber ? `#${appt.queueNumber}` : '—'}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                            {appt.patient.patientId}
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800">
                              {appt.patient.firstName} {appt.patient.lastName}
                            </span>
                            <span className="text-[11px] text-slate-400 block">{appt.patient.phone}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="font-medium text-slate-800">{appt.department?.name}</span>
                            <span className="text-[11px] text-slate-500 block">
                              {appt.doctor?.user?.name || 'Unassigned'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 font-medium">{appt.timeSlot}</td>
                          <td className="py-3 px-3">
                            <Badge
                              variant={
                                isCompleted
                                  ? 'success'
                                  : isWaiting
                                  ? 'warning'
                                  : appt.status === 'IN_CONSULTATION'
                                  ? 'brand'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {appt.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                              appt.paymentStatus === 'RECEIVED'
                                ? 'bg-emerald-50 text-emerald-800'
                                : appt.paymentStatus === 'PENDING'
                                ? 'bg-amber-50 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {appt.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {appt.status === 'CONFIRMED' && (
                              <Button
                                size="sm"
                                onClick={() => {
                                  setCheckInTarget(appt);
                                  setCheckInPayment(appt.paymentStatus || 'RECEIVED');
                                }}
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Check-In
                              </Button>
                            )}
                            {isWaiting && (
                              <span className="text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                In Waiting Lounge
                              </span>
                            )}
                            {appt.status === 'IN_CONSULTATION' && (
                              <span className="text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-200">
                                With Doctor
                              </span>
                            )}
                            {isCompleted && (
                              <span className="text-[11px] font-medium text-emerald-700">Completed</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No appointments scheduled for today.</p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: SEARCH EXISTING PATIENT (NO DUPLICATE PROFILE CREATION) */}
      {activeTab === 'SEARCH' && (
        <div className="space-y-6">
          <Card
            title="Search Existing Patients"
            subtitle="Search by permanent Patient ID (e.g. P-100245), Phone number, or Name to book follow-up visits"
          >
            <div className="relative mb-5 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search Patient ID (e.g. P-100245), Phone, or Name..."
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
              />
            </div>

            {searchResults.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Permanent Patient ID</th>
                      <th className="py-2.5 px-3">Full Name</th>
                      <th className="py-2.5 px-3">Phone</th>
                      <th className="py-2.5 px-3">Blood Group</th>
                      <th className="py-2.5 px-3">Allergies</th>
                      <th className="py-2.5 px-3">Total Past Visits</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {searchResults.map((patient) => (
                      <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#1d1160]">
                          {patient.patientId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {patient.firstName} {patient.lastName}
                        </td>
                        <td className="py-3 px-3 text-slate-600">{patient.phone}</td>
                        <td className="py-3 px-3 font-medium text-slate-800">{patient.bloodGroup || '—'}</td>
                        <td className="py-3 px-3">
                          {patient.allergies ? (
                            <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded text-[11px] border border-rose-100">
                              {patient.allergies}
                            </span>
                          ) : (
                            <span className="text-slate-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700">
                          {patient.appointments?.length || 1} visits
                        </td>
                        <td className="py-3 px-3 text-right">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPatientForVisit(patient);
                              setVisitSuccess('');
                              setVisitError('');
                            }}
                          >
                            <Plus className="w-3.5 h-3.5 mr-1" />
                            Book New Visit
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">
                {searchQuery ? 'No matching patient records found.' : 'Type a query or view registered patients.'}
              </p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 3: REGISTER NEW PATIENT */}
      {activeTab === 'NEW_PATIENT' && (
        <div className="max-w-3xl mx-auto">
          <Card
            title="Register New Patient Profile"
            subtitle="Generates a unique, permanent Patient ID (e.g. P-100248) and records demographics"
          >
            {newPatientMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-md text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>{newPatientMsg}</span>
              </div>
            )}

            {newPatientError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-md text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{newPatientError}</span>
              </div>
            )}

            <form onSubmit={handleRegisterNewPatient} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={newFirst}
                    onChange={(e) => setNewFirst(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={newLast}
                    onChange={(e) => setNewLast(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="patient@example.com"
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={newDob}
                    onChange={(e) => setNewDob(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={newBlood}
                    onChange={(e) => setNewBlood(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                  >
                    <option>O+</option>
                    <option>O-</option>
                    <option>A+</option>
                    <option>A-</option>
                    <option>B+</option>
                    <option>B-</option>
                    <option>AB+</option>
                    <option>AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Known Drug Allergies</label>
                <input
                  type="text"
                  value={newAllergies}
                  onChange={(e) => setNewAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Sulfa, Aspirin"
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
                />
              </div>

              {/* Optional Initial Visit Booking */}
              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Assign Initial OPD Visit (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Department</label>
                    <select
                      value={newDept}
                      onChange={(e) => setNewDept(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                    >
                      <option value="">-- No immediate visit --</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  {newDept && (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Doctor</label>
                      <select
                        value={newDoctor}
                        onChange={(e) => setNewDoctor(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                      >
                        <option value="">-- Any available doctor --</option>
                        {doctors.filter((doc) => doc.departmentId === newDept).map((doc) => (
                          <option key={doc.id} value={doc.id}>{doc.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3">
                <Button type="submit" className="w-full">
                  Create Permanent Patient Profile & Generate ID
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 4: VERIFY PENDING ONLINE APPOINTMENT REQUESTS */}
      {activeTab === 'VERIFY_REQUESTS' && (
        <div className="space-y-6">
          <Card
            title="Online Patient Appointment Requests"
            subtitle="Patient requests submitted via the public patient portal awaiting Front Desk review"
          >
            {dashboardData?.pendingRequests?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Patient ID</th>
                      <th className="py-2.5 px-3">Patient Name</th>
                      <th className="py-2.5 px-3">Department Requested</th>
                      <th className="py-2.5 px-3">Preferred Doctor</th>
                      <th className="py-2.5 px-3">Requested Date & Time</th>
                      <th className="py-2.5 px-3">Reason</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dashboardData.pendingRequests.map((req: any) => (
                      <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-3 font-mono font-bold text-[#1d1160]">
                          {req.patient?.patientId}
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {req.patient?.firstName} {req.patient?.lastName}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-800">{req.department?.name}</td>
                        <td className="py-3 px-3 text-slate-600">{req.doctor?.user?.name || 'Any specialist'}</td>
                        <td className="py-3 px-3 text-slate-800 font-medium">
                          {req.appointmentDate} at {req.timeSlot}
                        </td>
                        <td className="py-3 px-3 text-slate-500 max-w-xs truncate">{req.reason || '—'}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleVerifyRequest(req.id, 'CONFIRMED')}
                          >
                            Confirm Slot
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVerifyRequest(req.id, 'CANCELLED')}
                          >
                            Decline
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-4 text-center">No pending appointment requests.</p>
            )}
          </Card>
        </div>
      )}

      {/* Modal: Physical Check-In */}
      <Modal
        isOpen={Boolean(checkInTarget)}
        onClose={() => setCheckInTarget(null)}
        title="Patient Arrival & Physical Check-In"
        subtitle={`Patient ${checkInTarget?.patient?.firstName} ${checkInTarget?.patient?.lastName} (${checkInTarget?.patient?.patientId})`}
      >
        <div className="space-y-4 text-xs">
          <div className="p-3 bg-slate-50 rounded border border-slate-100 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-500">Department:</span>
              <strong className="text-slate-900">{checkInTarget?.department?.name}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Doctor:</span>
              <strong className="text-slate-900">{checkInTarget?.doctor?.user?.name || 'OPD Doctor'}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Time Slot:</span>
              <strong className="text-slate-900">{checkInTarget?.timeSlot}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Consultation Fee / Payment Operational Status
            </label>
            <select
              value={checkInPayment}
              onChange={(e: any) => setCheckInPayment(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
            >
              <option value="RECEIVED">Payment Received</option>
              <option value="PENDING">Payment Pending</option>
              <option value="NOT_APPLICABLE">Not Applicable (Exempt / Insured)</option>
            </select>
            <p className="text-[11px] text-slate-400 mt-1">
              Configurable operational status (price-independent per hospital settings).
            </p>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCheckInTarget(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCheckInSubmit}>
              Confirm Check-In & Issue Token
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Book Visit for Existing Patient */}
      <Modal
        isOpen={Boolean(selectedPatientForVisit)}
        onClose={() => setSelectedPatientForVisit(null)}
        title="Book New Visit for Existing Patient"
        subtitle={`Links visit to permanent record of ${selectedPatientForVisit?.firstName} ${selectedPatientForVisit?.lastName} (${selectedPatientForVisit?.patientId}) without duplicating profiles`}
      >
        {visitSuccess && (
          <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded">
            {visitSuccess}
          </div>
        )}
        {visitError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
            {visitError}
          </div>
        )}

        <form onSubmit={handleBookVisitForExisting} className="space-y-4">
          <div className="p-3 bg-indigo-50/50 rounded border border-indigo-100 text-xs text-indigo-950">
            <strong>Connected Record: </strong> {selectedPatientForVisit?.patientId} &bull; {selectedPatientForVisit?.phone} &bull; Blood: {selectedPatientForVisit?.bloodGroup || 'O+'}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Department *</label>
            <select
              required
              value={visitDept}
              onChange={(e) => setVisitDept(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            >
              <option value="">-- Choose Department --</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Consulting Physician</label>
            <select
              value={visitDoctor}
              onChange={(e) => setVisitDoctor(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            >
              <option value="">-- Any Available Specialist --</option>
              {doctors.filter((doc) => !visitDept || doc.departmentId === visitDept).map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.name} - {doc.specialty}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Date *</label>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Time Slot *</label>
              <select
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
              >
                <option>10:00 AM</option>
                <option>10:30 AM</option>
                <option>11:00 AM</option>
                <option>11:30 AM</option>
                <option>02:00 PM</option>
                <option>02:30 PM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Visit</label>
            <input
              type="text"
              value={visitReason}
              onChange={(e) => setVisitReason(e.target.value)}
              placeholder="e.g. Follow-up consultation, joint pain review..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Status</label>
            <select
              value={visitPayment}
              onChange={(e: any) => setVisitPayment(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            >
              <option value="RECEIVED">Received</option>
              <option value="PENDING">Pending</option>
              <option value="NOT_APPLICABLE">Not Applicable</option>
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setSelectedPatientForVisit(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Confirm & Link Visit to Existing Patient
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
