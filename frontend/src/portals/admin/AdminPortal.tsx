import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Users,
  Settings,
  Shield,
  Building,
  AlertTriangle,
  Wrench,
  FileText,
  PlusCircle,
  CheckCircle,
  Activity
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'STAFF' | 'DEPARTMENTS' | 'EQUIPMENT' | 'INCIDENTS' | 'AUDIT' | 'SETTINGS'>('OVERVIEW');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Create Staff Modal State
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('welcome123');
  const [staffRole, setStaffRole] = useState('DOCTOR');
  const [staffDept, setStaffDept] = useState('');
  const [staffSpecialty, setStaffSpecialty] = useState('');
  const [staffQualification, setStaffQualification] = useState('');

  // Equipment Status Update Modal
  const [selectedEquipment, setSelectedEquipment] = useState<any>(null);
  const [eqStatus, setEqStatus] = useState<'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE'>('AVAILABLE');
  const [eqNotes, setEqNotes] = useState('');

  // Incident Status Update Modal
  const [selectedIncident, setSelectedIncident] = useState<any>(null);
  const [incStatus, setIncStatus] = useState('IN_PROGRESS');
  const [incNotes, setIncNotes] = useState('');

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [dash, staffData, deptData, eqData, incData, logsData, settsData] = await Promise.all([
        apiClient('/admin/dashboard'),
        apiClient('/admin/staff'),
        apiClient('/admin/departments'),
        apiClient('/admin/equipment'),
        apiClient('/admin/incidents'),
        apiClient('/admin/audit-logs'),
        apiClient('/admin/settings'),
      ]);
      setDashboardData(dash);
      setStaff(staffData.staff || []);
      setDepartments(deptData.departments || []);
      setEquipment(eqData.equipment || []);
      setIncidents(incData.incidents || []);
      setAuditLogs(logsData.logs || []);
      setSettings(settsData.hospital || null);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/admin/staff', {
        method: 'POST',
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
          departmentId: staffDept || undefined,
          specialty: staffSpecialty || undefined,
          qualification: staffQualification || undefined,
        }),
      });
      setIsStaffModalOpen(false);
      setStaffName('');
      setStaffEmail('');
      loadAdminData();
    } catch (err) {
      console.error('Failed to create staff member:', err);
    }
  };

  const handleUpdateEquipment = async () => {
    if (!selectedEquipment) return;
    try {
      await apiClient(`/admin/equipment/${selectedEquipment.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: eqStatus, notes: eqNotes }),
      });
      setSelectedEquipment(null);
      loadAdminData();
    } catch (err) {
      console.error('Failed to update equipment:', err);
    }
  };

  const handleUpdateIncident = async () => {
    if (!selectedIncident) return;
    try {
      await apiClient(`/admin/incidents/${selectedIncident.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: incStatus, resolutionNotes: incNotes }),
      });
      setSelectedIncident(null);
      loadAdminData();
    } catch (err) {
      console.error('Failed to update incident:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Admin Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Hospital Administration & Governance</h2>
            <Badge variant="brand">Central Admin</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role Provisioning &bull; Equipment Maintenance &bull; Incident Governance &bull; Immutable Audit Trail
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsStaffModalOpen(true)}>
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'OVERVIEW', label: 'Operational Metrics' },
          { id: 'STAFF', label: 'Hospital Staff Directory' },
          { id: 'DEPARTMENTS', label: 'Departments & Hierarchy' },
          { id: 'EQUIPMENT', label: 'Biomedical Equipment' },
          { id: 'INCIDENTS', label: 'Incident Management', count: dashboardData?.metrics?.openIncidents },
          { id: 'AUDIT', label: 'Security Audit Trail' },
          { id: 'SETTINGS', label: 'Hospital Settings' },
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

      {/* TAB 1: OPERATIONAL METRICS */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Registered Patients</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {dashboardData?.metrics?.totalPatients || 0}
              </span>
            </Card>
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Active Physicians</span>
              <span className="text-2xl font-bold text-[#1d1160] mt-1 block">
                {dashboardData?.metrics?.activeDoctors || 0}
              </span>
            </Card>
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Active Nurses</span>
              <span className="text-2xl font-bold text-slate-900 mt-1 block">
                {dashboardData?.metrics?.activeNurses || 0}
              </span>
            </Card>
            <Card noPadding className="p-4">
              <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Open Incidents</span>
              <span className="text-2xl font-bold text-rose-700 mt-1 block">
                {dashboardData?.metrics?.openIncidents || 0}
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Department Staff & Resource Distribution" subtitle="Active personnel by clinical specialty">
              <div className="space-y-2">
                {dashboardData?.departments?.map((dept: any) => (
                  <div key={dept.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded border border-slate-100 text-xs">
                    <div>
                      <strong className="text-slate-900">{dept.name}</strong>
                      <span className="text-slate-400 ml-2">({dept.code}) &bull; {dept.locationFloor}</span>
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-slate-600">{dept._count?.staffProfiles || 0} Staff</span>
                      <span className="text-[#1d1160] font-semibold">{dept._count?.equipment || 0} Equipment</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Recent Security & Clinical Audit Events" subtitle="Protected hospital activity stream">
              <div className="space-y-2">
                {dashboardData?.recentAuditLogs?.map((log: any) => (
                  <div key={log.id} className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-[#1d1160]">{log.action} on {log.entity}</span>
                      <span className="text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{log.details}</p>
                    <div className="text-[10px] text-slate-400 flex justify-between">
                      <span>User: {log.user?.name || 'System'} ({log.userRole})</span>
                      <span>IP: {log.ipAddress}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: STAFF DIRECTORY */}
      {activeTab === 'STAFF' && (
        <Card title="Authorized Hospital Staff Directory" subtitle="Physicians, Nurses, Receptionists, and Pharmacists">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Email Address</th>
                  <th className="py-2.5 px-3">Hospital Role</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3">Specialty / Qualification</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-semibold text-slate-900">{member.name}</td>
                    <td className="py-3 px-3 text-slate-600">{member.email}</td>
                    <td className="py-3 px-3">
                      <Badge variant="brand" size="sm">{member.role}</Badge>
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-800">
                      {member.staffProfile?.department?.name || 'Central Hospital Operations'}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {member.staffProfile?.specialty || member.staffProfile?.qualification || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant={member.active ? 'success' : 'neutral'} size="sm">
                        {member.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: DEPARTMENTS */}
      {activeTab === 'DEPARTMENTS' && (
        <Card title="Hospital Clinical Departments" subtitle="Organizational hierarchy and floor locations">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((d) => (
              <div key={d.id} className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-xs bg-indigo-50 text-[#1d1160] px-2 py-0.5 rounded">
                    {d.code}
                  </span>
                  <span className="text-slate-400">{d.locationFloor}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-900">{d.name}</h4>
                <p className="text-slate-500 text-[11px]">{d.description || 'Specialized clinical care facility.'}</p>
                <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600 flex justify-between">
                  <span>Assigned Personnel:</span>
                  <span className="font-semibold">{d.staffProfiles?.length || 0} Members</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 4: BIOMEDICAL EQUIPMENT */}
      {activeTab === 'EQUIPMENT' && (
        <Card title="Biomedical Equipment Tracking" subtitle="Service schedules and operational readiness">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Equipment Code</th>
                  <th className="py-2.5 px-3">Equipment Name</th>
                  <th className="py-2.5 px-3">Department & Location</th>
                  <th className="py-2.5 px-3">Last Service</th>
                  <th className="py-2.5 px-3">Next Service</th>
                  <th className="py-2.5 px-3">Operational Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {equipment.map((eq) => (
                  <tr key={eq.id} className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 font-mono font-bold text-[#1d1160]">{eq.equipmentCode}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{eq.name}</td>
                    <td className="py-3 px-3 text-slate-700">
                      {eq.department?.name} &bull; <span className="text-slate-500">{eq.location}</span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{eq.lastServiceDate || '—'}</td>
                    <td className="py-3 px-3 text-slate-600">{eq.nextServiceDate || '—'}</td>
                    <td className="py-3 px-3">
                      <Badge
                        variant={
                          eq.status === 'AVAILABLE'
                            ? 'success'
                            : eq.status === 'IN_USE'
                            ? 'info'
                            : eq.status === 'UNDER_MAINTENANCE'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {eq.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEquipment(eq);
                          setEqStatus(eq.status);
                          setEqNotes(eq.notes || '');
                        }}
                      >
                        Update Status
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 5: INCIDENTS */}
      {activeTab === 'INCIDENTS' && (
        <Card title="Hospital Operational & Equipment Incident Governance" subtitle="Tickets reported across clinical departments">
          <div className="space-y-3">
            {incidents.map((inc) => (
              <div key={inc.id} className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2 shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{inc.title}</h4>
                      <Badge variant={inc.priority === 'HIGH' || inc.priority === 'CRITICAL' ? 'danger' : 'warning'}>
                        {inc.priority}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Department: <strong>{inc.department?.name}</strong> &bull; Type: {inc.type} &bull; Reported by: {inc.reportedBy?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={inc.status === 'RESOLVED' || inc.status === 'CLOSED' ? 'success' : 'brand'}>
                      {inc.status}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedIncident(inc);
                        setIncStatus(inc.status);
                        setIncNotes(inc.resolutionNotes || '');
                      }}
                    >
                      Update
                    </Button>
                  </div>
                </div>

                <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-100">{inc.description}</p>
                {inc.resolutionNotes && (
                  <p className="text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200 text-[11px]">
                    Resolution Notes: {inc.resolutionNotes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* TAB 6: SECURITY AUDIT TRAIL */}
      {activeTab === 'AUDIT' && (
        <Card title="Immutable Hospital Audit Log Trail" subtitle="Security compliance record for all clinical and administrative actions">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Actor / User</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Target Entity</th>
                  <th className="py-2.5 px-3">Event Details</th>
                  <th className="py-2.5 px-3">Client IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{log.user?.name || 'System'}</td>
                    <td className="py-2.5 px-3">
                      <Badge variant="neutral" size="sm">{log.userRole}</Badge>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1d1160]">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{log.entity}</td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-sm truncate">{log.details}</td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{log.ipAddress}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 7: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="max-w-2xl mx-auto">
          <Card title="Hospital Facility Settings & Operational Thresholds">
            <div className="space-y-4 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Hospital Facility Code:</span>
                <strong className="text-slate-900 font-mono">{settings?.code || 'H001'}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Facility Name:</span>
                <strong className="text-slate-900">{settings?.name}</strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Address:</span>
                <span className="text-slate-700">{settings?.address}, {settings?.city}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Operating Hours:</span>
                <span className="text-slate-700">{settings?.workingHours}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Queue Wait Threshold Alert:</span>
                <span className="text-slate-700">{settings?.queueThresholdMins} minutes</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Modal: Create Staff */}
      <Modal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        title="Add Hospital Staff Account"
        subtitle="Provision clinical or administrative staff member with secure credentials"
      >
        <form onSubmit={handleCreateStaff} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Staff Member Name *</label>
            <input
              type="text"
              required
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
              placeholder="e.g. Dr. Rajiv Mehta"
              className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={staffEmail}
                onChange={(e) => setStaffEmail(e.target.value)}
                placeholder="staff@hospital.com"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Initial Password *</label>
              <input
                type="text"
                required
                value={staffPassword}
                onChange={(e) => setStaffPassword(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
              <select
                value={staffRole}
                onChange={(e) => setStaffRole(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              >
                <option value="DOCTOR">Doctor (Physician)</option>
                <option value="NURSE">Nurse</option>
                <option value="RECEPTION">Receptionist</option>
                <option value="PHARMACY">Pharmacist</option>
                <option value="ADMIN">System Administrator</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={staffDept}
                onChange={(e) => setStaffDept(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              >
                <option value="">-- Central / General --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {staffRole === 'DOCTOR' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={staffSpecialty}
                  onChange={(e) => setStaffSpecialty(e.target.value)}
                  placeholder="e.g. Pediatric Cardiology"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Qualifications</label>
                <input
                  type="text"
                  value={staffQualification}
                  onChange={(e) => setStaffQualification(e.target.value)}
                  placeholder="e.g. MBBS, MD"
                  className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
                />
              </div>
            </div>
          )}

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsStaffModalOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Provision Staff Account
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Update Equipment */}
      <Modal
        isOpen={Boolean(selectedEquipment)}
        onClose={() => setSelectedEquipment(null)}
        title="Update Equipment Status"
        subtitle={`${selectedEquipment?.name} (${selectedEquipment?.equipmentCode})`}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Operational Status</label>
            <select
              value={eqStatus}
              onChange={(e: any) => setEqStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            >
              <option value="AVAILABLE">Available / Ready</option>
              <option value="IN_USE">In Use</option>
              <option value="UNDER_MAINTENANCE">Under Maintenance</option>
              <option value="OUT_OF_SERVICE">Out of Service</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Maintenance Notes</label>
            <textarea
              rows={2}
              value={eqNotes}
              onChange={(e) => setEqNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedEquipment(null)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdateEquipment}>Save Status</Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Update Incident */}
      <Modal
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        title="Update Incident Ticket"
        subtitle={selectedIncident?.title}
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
            <select
              value={incStatus}
              onChange={(e) => setIncStatus(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            >
              <option value="OPEN">Open</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resolution & Corrective Actions</label>
            <textarea
              rows={3}
              value={incNotes}
              onChange={(e) => setIncNotes(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedIncident(null)}>Cancel</Button>
            <Button size="sm" onClick={handleUpdateIncident}>Save Resolution</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
