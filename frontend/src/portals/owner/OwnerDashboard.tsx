import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  TrendingUp,
  Users,
  Clock,
  AlertTriangle,
  Building,
  CheckCircle,
  Activity,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export const OwnerDashboard: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadOwnerMetrics = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient('/owner/dashboard');
      setData(res);
    } catch (err) {
      console.error('Failed to load owner metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOwnerMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Executive Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Hospital Executive Operations & Owner Dashboard</h2>
            <Badge variant="brand">Executive Directorship</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational Health Visibility &bull; Patient Bottleneck Telemetry &bull; Department Capacity & Triage
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadOwnerMetrics}>
            Refresh Real-time KPIs
          </Button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <Card noPadding className="p-4">
          <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Today's Total Patients</span>
          <span className="text-2xl font-bold text-slate-900 mt-1 block">
            {data?.summary?.todayPatients || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Admitted & Outpatient</span>
        </Card>

        <Card noPadding className="p-4">
          <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Consultations Done</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {data?.summary?.consultationsCompleted || 0}
          </span>
          <span className="text-[10px] text-emerald-600 mt-0.5 block">Completed visits</span>
        </Card>

        <Card noPadding className="p-4">
          <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Waiting in Hospital</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            {data?.summary?.waitingPatients || 0}
          </span>
          <span className="text-[10px] text-amber-600 mt-0.5 block">In queues across depts</span>
        </Card>

        <Card noPadding className="p-4">
          <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Physicians On Duty</span>
          <span className="text-2xl font-bold text-[#1d1160] mt-1 block">
            {data?.summary?.availableDoctors || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Active OPD consultants</span>
        </Card>

        <Card noPadding className="p-4">
          <span className="text-slate-400 block text-[11px] font-bold uppercase tracking-wider">Duty Nursing Staff</span>
          <span className="text-2xl font-bold text-slate-800 mt-1 block">
            {data?.summary?.activeNurses || 0}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Triage & Telemetry</span>
        </Card>
      </div>

      {/* BOTTLENECK MONITORING SECTION (Mandatory Feature per Section 16) */}
      <Card
        title="Live Patient Flow & Operational Bottleneck Monitoring"
        subtitle="Identifies where patient queues are forming across hospital workflow stages in real time"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data?.bottlenecks?.map((b: any, idx: number) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border text-xs transition-all ${
                b.alert
                  ? 'border-rose-300 bg-rose-50/40 text-rose-950 ring-1 ring-rose-200'
                  : 'border-slate-200 bg-white text-slate-900 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Stage {idx + 1}
                </span>
                {b.alert && (
                  <Badge variant="danger" size="sm">Congested</Badge>
                )}
              </div>
              <h4 className="font-semibold text-slate-800 text-sm mb-3">{b.stage}</h4>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-[#1d1160]">
                  {b.count}
                </span>
                <span className="text-slate-400 text-[11px]">Threshold: {b.threshold} max</span>
              </div>

              {/* Progress bar indication */}
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
                <div
                  className={`h-full rounded-full ${b.alert ? 'bg-rose-500' : 'bg-[#1d1160]'}`}
                  style={{ width: `${Math.min(100, (b.count / (b.threshold || 5)) * 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Department Status & Pharmacy Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Status Table */}
        <div className="lg:col-span-2">
          <Card
            title="Department Operational Capacity & Congestion"
            subtitle="Configurable operational threshold telemetry per clinical center"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Clinical Department</th>
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Today's Visits</th>
                    <th className="py-2.5 px-3">Waiting Patients</th>
                    <th className="py-2.5 px-3">Operational Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data?.departmentStatus?.map((dept: any) => (
                    <tr key={dept.id} className="hover:bg-slate-50/80">
                      <td className="py-3 px-3 font-semibold text-slate-900">{dept.name}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{dept.code}</td>
                      <td className="py-3 px-3 font-bold text-slate-800">{dept.todayPatients}</td>
                      <td className="py-3 px-3">
                        <span className={`font-semibold ${dept.waitingCount > 0 ? 'text-amber-700' : 'text-slate-400'}`}>
                          {dept.waitingCount} waiting
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <Badge
                          variant={
                            dept.loadLevel === 'critical'
                              ? 'danger'
                              : dept.loadLevel === 'busy'
                              ? 'warning'
                              : dept.loadLevel === 'moderate'
                              ? 'info'
                              : 'success'
                          }
                          size="sm"
                        >
                          {dept.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Pharmacy & Incident Summary */}
        <div className="space-y-6">
          <Card title="Central Dispensary Health" subtitle="Prescription dispensing and inventory stock">
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Pending Prescriptions:</span>
                <strong className="text-slate-900 font-bold text-sm">
                  {data?.pharmacyStatus?.pendingPrescriptions || 0}
                </strong>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Low Stock Formulations:</span>
                <span className="font-semibold text-rose-700">
                  {data?.pharmacyStatus?.lowStockItems || 0} items
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-500">Overall Pharmacy Status:</span>
                <Badge variant={data?.pharmacyStatus?.lowStockItems > 0 ? 'warning' : 'success'}>
                  {data?.pharmacyStatus?.status}
                </Badge>
              </div>
            </div>
          </Card>

          <Card title="Active Operational Incidents" subtitle="High priority issues requiring executive awareness">
            {data?.operationalIncidents?.length > 0 ? (
              <div className="space-y-2.5">
                {data.operationalIncidents.map((inc: any) => (
                  <div key={inc.id} className="p-3 bg-slate-50 rounded border border-slate-200 text-xs space-y-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900">{inc.title}</span>
                      <Badge variant="warning" size="sm">{inc.priority}</Badge>
                    </div>
                    <p className="text-[11px] text-slate-500">Dept: {inc.department?.name} &bull; Status: {inc.status}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No active operational incidents.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
