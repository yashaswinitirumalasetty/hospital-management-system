import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Phone,
  Clock,
  MapPin,
  Calendar,
  Search,
  CheckCircle,
  Stethoscope,
  Shield,
  Activity,
  ArrowRight,
  LogIn,
  UserPlus
} from 'lucide-react';

interface LandingPageProps {
  onNavigateToPortal: (portalId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToPortal }) => {
  const { user, login } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Auth Modal State
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Register state
  const [regFirst, setRegFirst] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDob, setRegDob] = useState('1990-01-01');
  const [regGender, setRegGender] = useState('Male');
  const [regBlood, setRegBlood] = useState('O+');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptData, docData] = await Promise.all([
          apiClient<{ departments: any[] }>('/public/departments'),
          apiClient<{ doctors: any[] }>('/public/doctors'),
        ]);
        setDepartments(deptData.departments || []);
        setDoctors(docData.doctors || []);
      } catch (err) {
        console.error('Failed to load public data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = doctors.filter((doc) => {
    const matchesDept = !selectedDept || doc.departmentId === selectedDept;
    const matchesSearch =
      !searchQuery ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.departmentName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      await login(authEmail, authPassword);
      setIsAuthModalOpen(false);
      onNavigateToPortal('PATIENT');
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const data = await apiClient('/auth/register-patient', {
        method: 'POST',
        body: JSON.stringify({
          firstName: regFirst,
          lastName: regLast,
          email: authEmail,
          password: authPassword,
          phone: regPhone,
          dateOfBirth: regDob,
          gender: regGender,
          bloodGroup: regBlood,
        }),
      });
      localStorage.setItem('hospital_token', data.token);
      setIsAuthModalOpen(false);
      onNavigateToPortal('PATIENT');
    } catch (err: any) {
      setAuthError(err.message || 'Registration failed.');
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Top Clinical Utility Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#1d1160] flex items-center justify-center text-white font-bold text-xl shadow-sm">
              +
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
                Apex Multi-Specialty Hospital
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Excellence in Clinical Care & Research &bull; Facility ID: H001
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#1d1160]" />
              <div>
                <span className="block font-semibold text-slate-900">24/7 Emergency Line</span>
                <span>+1 (555) 019-2834</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1d1160]" />
              <div>
                <span className="block font-semibold text-slate-900">Outpatient Hours</span>
                <span>Mon - Sat: 08:00 - 20:00</span>
              </div>
            </div>
            <div>
              {user ? (
                <Button
                  size="sm"
                  onClick={() => onNavigateToPortal(user.role === 'PATIENT' ? 'PATIENT' : user.role)}
                >
                  Enter Portal ({user.role})
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAuthMode('LOGIN');
                      setIsAuthModalOpen(true);
                    }}
                  >
                    <LogIn className="w-3.5 h-3.5 mr-1" />
                    Sign In
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAuthMode('REGISTER');
                      setIsAuthModalOpen(true);
                    }}
                  >
                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                    Patient Registration
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-slate-50 border-b border-slate-200/80 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/60 text-xs font-semibold text-[#1d1160]">
              <Shield className="w-3.5 h-3.5" />
              Unified Longitudinal Healthcare Platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              One Patient. One Permanent Identity. Continuous Care.
            </h2>
            <p className="text-base text-slate-600 leading-relaxed">
              Apex Multi-Specialty Hospital connects your entire healthcare journey—from your initial appointment request, front-desk arrival, specialist doctor consultation, nursing care, to prescription dispensing at our medical store—all anchored under your unique, lifelong Patient ID.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={() => {
                  if (user) onNavigateToPortal('PATIENT');
                  else {
                    setAuthMode('REGISTER');
                    setIsAuthModalOpen(true);
                  }
                }}
              >
                Book an Appointment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById('doctor-directory');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Browse Specialist Doctors
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>The Patient Care Workflow</span>
                <Badge variant="brand">Standard of Care</Badge>
              </h3>
              <div className="space-y-3 text-xs">
                {[
                  { step: '1', title: 'Request Appointment', desc: 'Select department, specialist, and preferred time' },
                  { step: '2', title: 'Reception Verification', desc: 'Front desk reviews slot and sends live confirmation' },
                  { step: '3', title: 'Physical Check-In', desc: 'Arrive at hospital, receive OPD queue token' },
                  { step: '4', title: 'Doctor Consultation', desc: 'Physician reviews longitudinal records & issues e-Rx' },
                  { step: '5', title: 'Pharmacy Dispensing', desc: 'Prescription routed directly to medical dispensary' },
                ].map((item) => (
                  <div key={item.step} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-indigo-50 border border-indigo-200 text-[#1d1160] font-bold flex items-center justify-center flex-shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <h4 className="font-semibold text-slate-900">{item.title}</h4>
                      <p className="text-slate-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Departments Overview */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-slate-200">
        <div className="mb-8">
          <h2 className="text-xs font-bold text-[#1d1160] uppercase tracking-wider">Centers of Clinical Excellence</h2>
          <h3 className="text-xl font-bold text-slate-900 mt-1">Specialized Medical Departments</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              onClick={() => setSelectedDept(dept.id === selectedDept ? '' : dept.id)}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedDept === dept.id
                  ? 'border-[#1d1160] bg-indigo-50/30 ring-1 ring-[#1d1160]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                  {dept.code}
                </span>
                <span className="text-[11px] text-slate-400">{dept.locationFloor}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900">{dept.name}</h4>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{dept.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Doctor Directory Section */}
      <section id="doctor-directory" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-xs font-bold text-[#1d1160] uppercase tracking-wider">Consultants & Specialists</h2>
            <h3 className="text-xl font-bold text-slate-900 mt-1">Find a Hospital Physician</h3>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search physician or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-[#1d1160] w-64"
              />
            </div>
            {selectedDept && (
              <Button variant="ghost" size="sm" onClick={() => setSelectedDept('')}>
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {/* Doctor Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredDoctors.map((doc) => (
            <Card key={doc.id} className="hover:border-slate-300 transition-all">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm">
                    {doc.name.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <Badge variant="brand" size="sm">{doc.departmentName || 'OPD'}</Badge>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900">{doc.name}</h4>
                  <p className="text-xs font-medium text-[#1d1160] mt-0.5">{doc.specialty}</p>
                  <p className="text-[11px] text-slate-500 mt-1">{doc.qualification}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 text-[11px] space-y-1 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Experience:</span>
                    <span className="font-semibold">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">OPD Room:</span>
                    <span>{doc.roomNumber || 'Room 204'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Available:</span>
                    <span className="text-emerald-700 font-medium">{doc.scheduleHours}</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    if (user) {
                      onNavigateToPortal('PATIENT');
                    } else {
                      setAuthMode('LOGIN');
                      setIsAuthModalOpen(true);
                    }
                  }}
                >
                  <Calendar className="w-3.5 h-3.5 mr-1.5" />
                  Request Appointment
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Hospital Footer */}
      <footer className="bg-slate-900 text-white text-xs py-10 px-4 sm:px-6 lg:px-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <h4 className="text-sm font-bold text-white tracking-tight">Apex Multi-Specialty Hospital</h4>
            <p className="text-slate-400 text-xs">
              742 Healthcare Boulevard, Medical District, Metro City. Licensed Clinical Health Service Provider.
            </p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2">Emergency & Triage</h5>
            <p className="text-slate-400">Trauma Level-1: Active 24/7</p>
            <p className="text-slate-400">Ambulance Dispatch: +1 (555) 019-9999</p>
            <p className="text-slate-400">ICU Telemetry Station: Ext 402</p>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2">Role Interfaces</h5>
            <ul className="space-y-1 text-slate-400">
              <li><button onClick={() => onNavigateToPortal('PATIENT')} className="hover:text-white">Patient Portal</button></li>
              <li><button onClick={() => onNavigateToPortal('RECEPTION')} className="hover:text-white">Reception Desk</button></li>
              <li><button onClick={() => onNavigateToPortal('DOCTOR')} className="hover:text-white">Physician OPD</button></li>
              <li><button onClick={() => onNavigateToPortal('PHARMACY')} className="hover:text-white">Medical Store Dispensary</button></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-slate-200 mb-2">Security & Governance</h5>
            <p className="text-slate-400">
              All access is authenticated via role-based access control and logged in the immutable hospital audit trail.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8 pt-4 border-t border-slate-800 text-slate-500 text-[11px] flex justify-between">
          <span>&copy; {new Date().getFullYear()} Apex Hospital Platform. All medical records preserved under permanent Patient ID.</span>
          <span>HIPAA & Healthcare Data Protected</span>
        </div>
      </footer>

      {/* Auth Modal (Login / Register) */}
      <Modal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title={authMode === 'LOGIN' ? 'Patient Portal Sign In' : 'New Patient Registration'}
        subtitle={
          authMode === 'LOGIN'
            ? 'Access your longitudinal medical records, appointments, and e-prescriptions.'
            : 'Register your permanent Patient ID in the hospital central database.'
        }
      >
        {authError && (
          <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded">
            {authError}
          </div>
        )}

        {authMode === 'LOGIN' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                placeholder="ravi.kumar@gmail.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-[#1d1160]"
              />
            </div>
            <div className="pt-2 flex items-center justify-between">
              <Button type="submit" className="w-full">Sign In to Patient Portal</Button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              New patient?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('REGISTER')}
                className="text-[#1d1160] font-semibold underline"
              >
                Register for permanent Patient ID
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  value={regFirst}
                  onChange={(e) => setRegFirst(e.target.value)}
                  placeholder="Ravi"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  value={regLast}
                  onChange={(e) => setRegLast(e.target.value)}
                  placeholder="Kumar"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="ravi.kumar@gmail.com"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="+1 (555) 782-9901"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">DOB</label>
                <input
                  type="date"
                  value={regDob}
                  onChange={(e) => setRegDob(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={regGender}
                  onChange={(e) => setRegGender(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={regBlood}
                  onChange={(e) => setRegBlood(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 border border-slate-300 rounded"
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Password *</label>
              <input
                type="password"
                required
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                placeholder="Create secure password"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" className="w-full">Register & Generate Patient ID</Button>
            </div>
            <p className="text-center text-xs text-slate-500 mt-2">
              Already registered?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('LOGIN')}
                className="text-[#1d1160] font-semibold underline"
              >
                Sign In
              </button>
            </p>
          </form>
        )}
      </Modal>
    </div>
  );
};
