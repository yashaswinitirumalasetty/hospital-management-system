import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Pill,
  CheckCircle,
  AlertTriangle,
  Clock,
  Package,
  PlusCircle,
  AlertCircle,
  Send,
  Boxes
} from 'lucide-react';

export const PharmacyPortal: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'QUEUE' | 'INVENTORY' | 'ALERTS'>('QUEUE');

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [inventory, setInventory] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dispense Modal State
  const [selectedRxForDispense, setSelectedRxForDispense] = useState<any>(null);
  const [dispenseSuccess, setDispenseSuccess] = useState('');
  const [dispenseError, setDispenseError] = useState('');

  // Shortage Communication Modal
  const [selectedRxForShortage, setSelectedRxForShortage] = useState<any>(null);
  const [shortageMedName, setShortageMedName] = useState('');
  const [shortageNote, setShortageNote] = useState('');
  const [shortageSuccess, setShortageSuccess] = useState('');

  // Add Inventory State
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [medName, setMedName] = useState('');
  const [medGeneric, setMedGeneric] = useState('');
  const [medCategory, setMedCategory] = useState('Analgesics');
  const [batchNum, setBatchNum] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [rack, setRack] = useState('Shelf A-01');

  const loadPharmacyData = async () => {
    setIsLoading(true);
    try {
      const [dash, inv, rxs] = await Promise.all([
        apiClient('/pharmacy/dashboard'),
        apiClient('/pharmacy/inventory'),
        apiClient('/pharmacy/prescriptions'),
      ]);
      setDashboardData(dash);
      setInventory(inv.inventory || []);
      setPrescriptions(rxs.prescriptions || []);
    } catch (err) {
      console.error('Failed to load pharmacy data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPharmacyData();
  }, []);

  const handleDispenseRx = async () => {
    if (!selectedRxForDispense) return;
    setDispenseError('');
    setDispenseSuccess('');

    try {
      await apiClient('/pharmacy/dispense', {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId: selectedRxForDispense.id,
        }),
      });

      setDispenseSuccess(`Prescription ${selectedRxForDispense.prescriptionCode} marked as DISPENSED. Patient notified.`);
      setSelectedRxForDispense(null);
      loadPharmacyData();
    } catch (err: any) {
      setDispenseError(err.message || 'Failed to dispense prescription.');
    }
  };

  const handleCommunicateShortage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRxForShortage) return;

    try {
      await apiClient('/pharmacy/flag-unavailable', {
        method: 'POST',
        body: JSON.stringify({
          prescriptionId: selectedRxForShortage.id,
          medicineName: shortageMedName,
          notes: shortageNote,
        }),
      });

      setShortageSuccess('Controlled notification sent directly to prescribing physician.');
      setSelectedRxForShortage(null);
      loadPharmacyData();
    } catch (err) {
      console.error('Failed to flag shortage:', err);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient('/pharmacy/inventory', {
        method: 'POST',
        body: JSON.stringify({
          name: medName,
          genericName: medGeneric,
          category: medCategory,
          batchNumber: batchNum,
          quantity: parseInt(quantity, 10),
          expiryDate,
          locationRack: rack,
        }),
      });

      setIsAddStockOpen(false);
      setMedName('');
      setBatchNum('');
      loadPharmacyData();
    } catch (err) {
      console.error('Failed to add inventory:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Pharmacy Header Banner */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 mb-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">Hospital Medical Store & Central Dispensary</h2>
            <Badge variant="brand">Pharmacy Hub</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Auto-Queued Doctor E-Prescriptions &bull; Batch Inventory Control &bull; Controlled Dispensing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setIsAddStockOpen(true)}>
            <PlusCircle className="w-3.5 h-3.5 mr-1" />
            Receive Medicine Stock
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 bg-white rounded-t-lg px-2 shadow-sm overflow-x-auto">
        {[
          { id: 'QUEUE', label: 'E-Prescription Queue', count: dashboardData?.metrics?.pendingQueueCount },
          { id: 'INVENTORY', label: 'Medicine Catalog & Batches' },
          { id: 'ALERTS', label: 'Stock & Expiry Alerts', count: (dashboardData?.metrics?.lowStockCount || 0) + (dashboardData?.metrics?.expiringSoonCount || 0) },
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

      {/* TAB 1: E-PRESCRIPTION QUEUE */}
      {activeTab === 'QUEUE' && (
        <div className="space-y-6">
          {dispenseSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-md flex items-center gap-2">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <span>{dispenseSuccess}</span>
            </div>
          )}

          <Card
            title="Active E-Prescriptions Awaiting Dispensing"
            subtitle="Prescriptions submitted by OPD and Emergency physicians automatically appear here"
          >
            {prescriptions.filter((p) => p.status !== 'DISPENSED').length > 0 ? (
              <div className="space-y-4">
                {prescriptions
                  .filter((p) => p.status !== 'DISPENSED')
                  .map((rx) => (
                    <div
                      key={rx.id}
                      className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-3 shadow-sm hover:border-slate-300 transition-colors"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-[#1d1160]">
                            {rx.prescriptionCode}
                          </span>
                          <span className="text-slate-400">|</span>
                          <span className="font-semibold text-slate-800">
                            Patient: {rx.patient?.firstName} {rx.patient?.lastName} ({rx.patient?.patientId})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={rx.status === 'UNAVAILABLE_FLAGGED' ? 'danger' : 'warning'}>
                            {rx.status}
                          </Badge>
                          <span className="text-[11px] text-slate-400">
                            {new Date(rx.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-4">
                        <span>Prescribing Physician: <strong>Dr. {rx.doctor?.user?.name}</strong> ({rx.doctor?.department?.name || 'OPD'})</span>
                        {rx.pharmacyNotes && (
                          <span className="text-indigo-900 bg-indigo-50 px-2 py-0.5 rounded">
                            Advice: {rx.pharmacyNotes}
                          </span>
                        )}
                      </div>

                      {/* Medication Items */}
                      <div className="space-y-1.5 pt-1">
                        {rx.items?.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100"
                          >
                            <div>
                              <strong className="text-slate-900">{item.medicineName}</strong>
                              <span className="text-slate-500 ml-2">
                                {item.dosage} &bull; {item.frequency} &bull; {item.duration}
                              </span>
                            </div>
                            <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                              Qty: {item.quantityPrescribed}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRxForShortage(rx);
                            setShortageMedName(rx.items?.[0]?.medicineName || '');
                            setShortageNote('Stock currently unavailable in central dispensary.');
                          }}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-600" />
                          Flag Shortage to Doctor
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedRxForDispense(rx);
                            setDispenseSuccess('');
                            setDispenseError('');
                          }}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Verify & Dispense Medicine
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-6 text-center">
                Prescription queue is clear. No medications pending dispensing.
              </p>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: MEDICINE CATALOG & BATCHES */}
      {activeTab === 'INVENTORY' && (
        <Card title="Central Pharmacy Inventory Catalog" subtitle="Batch-level tracking with stock levels and expiry dates">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Medicine Name</th>
                  <th className="py-2.5 px-3">Generic Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Batch Number</th>
                  <th className="py-2.5 px-3">Stock on Hand</th>
                  <th className="py-2.5 px-3">Expiry Date</th>
                  <th className="py-2.5 px-3">Rack Location</th>
                  <th className="py-2.5 px-3">Stock Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.map((med) => {
                  const firstBatch = med.batches?.[0];
                  return (
                    <tr key={med.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900">{med.name}</td>
                      <td className="py-3 px-3 text-slate-500 italic">{med.genericName}</td>
                      <td className="py-3 px-3 text-slate-700">{med.category}</td>
                      <td className="py-3 px-3 font-mono text-slate-700">{firstBatch?.batchNumber || '—'}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">
                        {med.totalStock} {med.unit}
                      </td>
                      <td className="py-3 px-3 text-slate-700">{firstBatch?.expiryDate || '—'}</td>
                      <td className="py-3 px-3 text-slate-500">{firstBatch?.locationRack || 'Shelf A'}</td>
                      <td className="py-3 px-3">
                        {med.isLowStock ? (
                          <Badge variant="danger" size="sm">Low Stock</Badge>
                        ) : (
                          <Badge variant="success" size="sm">Adequate</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 3: STOCK & EXPIRY ALERTS */}
      {activeTab === 'ALERTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Low Stock Alerts" subtitle="Medicines below minimum hospital reorder threshold">
            {dashboardData?.lowStockItems?.length > 0 ? (
              <div className="space-y-2.5">
                {dashboardData.lowStockItems.map((item: any) => (
                  <div key={item.id} className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-rose-900">{item.name}</h4>
                      <p className="text-[11px] text-rose-700">Category: {item.category}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-rose-900 text-sm">{item.totalStock} remaining</span>
                      <span className="block text-[10px] text-rose-600">Min threshold: {item.minStockLevel}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">All medicine stocks are above minimum threshold.</p>
            )}
          </Card>

          <Card title="Expiring Soon Batches" subtitle="Batches expiring within the next 90 days">
            {dashboardData?.expiringSoonItems?.length > 0 ? (
              <div className="space-y-2.5">
                {dashboardData.expiringSoonItems.map((batch: any) => (
                  <div key={batch.id} className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-amber-900">{batch.medicineName}</h4>
                      <p className="text-[11px] text-amber-700 font-mono">Batch: {batch.batchNumber}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-900 text-sm">Expires {batch.expiryDate}</span>
                      <span className="block text-[10px] text-amber-700">Qty: {batch.quantity} units</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 py-3">No medicines expiring soon.</p>
            )}
          </Card>
        </div>
      )}

      {/* Modal: Confirm Dispense */}
      <Modal
        isOpen={Boolean(selectedRxForDispense)}
        onClose={() => setSelectedRxForDispense(null)}
        title="Dispense Prescription"
        subtitle={`Prescription ${selectedRxForDispense?.prescriptionCode} for ${selectedRxForDispense?.patient?.firstName} ${selectedRxForDispense?.patient?.lastName}`}
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600">
            Confirm dispensing of prescribed medications. Stock will be decremented from active batches, and the patient visit will transition to Completed.
          </p>

          <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-2">
            {selectedRxForDispense?.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between font-medium">
                <span className="text-slate-800">{item.medicineName} ({item.dosage})</span>
                <span className="text-[#1d1160]">Qty Prescribed: {item.quantityPrescribed}</span>
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedRxForDispense(null)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleDispenseRx}>
              Confirm Dispensing & Update Inventory
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Controlled Shortage Notification to Prescribing Doctor */}
      <Modal
        isOpen={Boolean(selectedRxForShortage)}
        onClose={() => setSelectedRxForShortage(null)}
        title="Communicate Medicine Shortage"
        subtitle="Controlled workflow: Notifies the prescribing doctor directly without altering clinical prescription"
      >
        <form onSubmit={handleCommunicateShortage} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unavailable Medicine</label>
            <input
              type="text"
              required
              value={shortageMedName}
              onChange={(e) => setShortageMedName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message to Prescribing Doctor</label>
            <textarea
              rows={3}
              required
              value={shortageNote}
              onChange={(e) => setShortageNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setSelectedRxForShortage(null)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Send Alert to Dr. {selectedRxForShortage?.doctor?.user?.name}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Add Stock */}
      <Modal
        isOpen={isAddStockOpen}
        onClose={() => setIsAddStockOpen(false)}
        title="Register Inward Medicine Consignment"
        subtitle="Add batch and stock quantities into central pharmacy inventory"
      >
        <form onSubmit={handleAddStock} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand / Product Name *</label>
              <input
                type="text"
                required
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="e.g. Paracetamol 500mg"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Generic Name</label>
              <input
                type="text"
                value={medGeneric}
                onChange={(e) => setMedGeneric(e.target.value)}
                placeholder="e.g. Acetaminophen"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Number *</label>
              <input
                type="text"
                required
                value={batchNum}
                onChange={(e) => setBatchNum(e.target.value)}
                placeholder="BAT-2026-X"
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Expiry Date *</label>
              <input
                type="date"
                required
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsAddStockOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" type="submit">
              Save to Pharmacy Stock
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
