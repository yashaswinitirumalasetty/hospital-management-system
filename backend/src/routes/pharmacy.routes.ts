import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import { authenticate, requireRoles } from '../middleware/auth.middleware';
import { logAuditEvent } from '../middleware/audit.middleware';

const router = Router();

router.use(authenticate);
router.use(requireRoles(['PHARMACY', 'ADMIN']));

// Pharmacy Dashboard
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;

    // Prescriptions waiting in queue
    const pendingPrescriptions = await prisma.prescription.findMany({
      where: {
        status: { in: ['PENDING', 'READY'] },
      },
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Dispensed prescriptions
    const dispensedCount = await prisma.prescription.count({
      where: { status: 'DISPENSED' },
    });

    // Medicines with stock & batch details
    const medicines = await prisma.medicine.findMany({
      where: { hospitalId },
      include: { batches: true },
    });

    // Low stock and expiring soon calculations
    const today = new Date();
    const threeMonthsAhead = new Date();
    threeMonthsAhead.setMonth(today.getMonth() + 3);
    const threeMonthsStr = threeMonthsAhead.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];

    const lowStockItems = [];
    const expiringSoonItems = [];

    for (const med of medicines) {
      const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
      if (totalStock <= med.minStockLevel) {
        lowStockItems.push({
          id: med.id,
          name: med.name,
          totalStock,
          minStockLevel: med.minStockLevel,
          category: med.category,
        });
      }

      for (const batch of med.batches) {
        if (batch.expiryDate <= threeMonthsStr && batch.quantity > 0) {
          expiringSoonItems.push({
            id: batch.id,
            medicineName: med.name,
            batchNumber: batch.batchNumber,
            quantity: batch.quantity,
            expiryDate: batch.expiryDate,
            isExpired: batch.expiryDate < todayStr,
          });
        }
      }
    }

    res.json({
      metrics: {
        pendingQueueCount: pendingPrescriptions.length,
        dispensedCount,
        lowStockCount: lowStockItems.length,
        expiringSoonCount: expiringSoonItems.length,
      },
      pendingPrescriptions,
      lowStockItems,
      expiringSoonItems,
    });
  } catch (error) {
    console.error('Pharmacy dashboard error:', error);
    res.status(500).json({ error: 'Failed to load pharmacy dashboard.' });
  }
});

// Prescriptions List
router.get('/prescriptions', async (req: Request, res: Response) => {
  try {
    const status = req.query.status as string;

    const prescriptions = await prisma.prescription.findMany({
      where: status ? { status } : undefined,
      include: {
        patient: true,
        doctor: { include: { user: true, department: true } },
        items: true,
        dispensingRecords: { include: { batch: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ prescriptions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch prescriptions.' });
  }
});

// Medicine Inventory Catalog
router.get('/inventory', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const medicines = await prisma.medicine.findMany({
      where: { hospitalId },
      include: {
        batches: {
          orderBy: { expiryDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const inventory = medicines.map((m) => {
      const totalStock = m.batches.reduce((sum, b) => sum + b.quantity, 0);
      return {
        ...m,
        totalStock,
        isLowStock: totalStock <= m.minStockLevel,
      };
    });

    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load inventory.' });
  }
});

// Add New Medicine or Batch
router.post('/inventory', async (req: Request, res: Response) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const {
      name,
      genericName,
      category,
      unit,
      minStockLevel,
      batchNumber,
      quantity,
      expiryDate,
      unitPrice,
      locationRack,
    } = req.body;

    if (!name || !batchNumber || !quantity || !expiryDate) {
      return res.status(400).json({ error: 'Medicine name, batch number, quantity, and expiry date are required.' });
    }

    // Find existing medicine or create new
    let medicine = await prisma.medicine.findFirst({
      where: { hospitalId, name: { equals: name } },
    });

    if (!medicine) {
      medicine = await prisma.medicine.create({
        data: {
          hospitalId,
          name,
          genericName: genericName || name,
          category: category || 'General Pharmaceuticals',
          unit: unit || 'Tablets',
          minStockLevel: Number(minStockLevel) || 50,
        },
      });
    }

    const batch = await prisma.medicineBatch.create({
      data: {
        medicineId: medicine.id,
        batchNumber,
        quantity: Number(quantity),
        expiryDate,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
        locationRack: locationRack || null,
      },
    });

    await logAuditEvent({
      hospitalId,
      userId: req.user!.id,
      userRole: 'PHARMACY',
      action: 'ADD_INVENTORY',
      entity: 'MEDICINE_BATCH',
      entityId: batch.id,
      details: `Added ${quantity} units of ${name} (Batch: ${batchNumber}, Exp: ${expiryDate})`,
    });

    res.status(201).json({ message: 'Medicine batch registered.', medicine, batch });
  } catch (error) {
    console.error('Error adding inventory:', error);
    res.status(500).json({ error: 'Failed to add medicine stock.' });
  }
});

// Dispense Prescription Workflow
router.post('/dispense', async (req: Request, res: Response) => {
  try {
    const { prescriptionId, batchDispenses } = req.body;
    // batchDispenses: Array of { itemId, batchId, quantity }

    if (!prescriptionId) {
      return res.status(400).json({ error: 'Prescription ID is required.' });
    }

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
        consultation: true,
        items: true,
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    // Process batch deductions if provided
    if (batchDispenses && Array.isArray(batchDispenses)) {
      for (const item of batchDispenses) {
        if (item.batchId && item.quantity) {
          const batch = await prisma.medicineBatch.findUnique({
            where: { id: item.batchId },
          });

          if (batch && batch.quantity >= item.quantity) {
            await prisma.medicineBatch.update({
              where: { id: item.batchId },
              data: { quantity: batch.quantity - item.quantity },
            });

            await prisma.dispensingRecord.create({
              data: {
                prescriptionId: prescription.id,
                batchId: item.batchId,
                quantityDispensed: item.quantity,
                dispensedById: req.user!.id,
              },
            });
          }
        }
      }
    }

    // Mark all prescription items as dispensed
    await prisma.prescriptionItem.updateMany({
      where: { prescriptionId: prescription.id },
      data: { isDispensed: true },
    });

    // Update prescription status
    const updatedPrescription = await prisma.prescription.update({
      where: { id: prescription.id },
      data: {
        status: 'DISPENSED',
        dispensedAt: new Date(),
        dispensedBy: req.user!.name,
      },
    });

    // If associated with an active appointment, mark appointment completed
    if (prescription.consultation?.appointmentId) {
      await prisma.appointment.update({
        where: { id: prescription.consultation.appointmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Notify patient
    if (prescription.patient.userId) {
      await prisma.notification.create({
        data: {
          hospitalId: prescription.patient.hospitalId,
          recipientUserId: prescription.patient.userId,
          recipientRole: 'PATIENT',
          title: 'Prescription Dispensed',
          message: `Your medication for prescription ${prescription.prescriptionCode} has been prepared and dispensed.`,
          type: 'SUCCESS',
        },
      });
    }

    await logAuditEvent({
      hospitalId: prescription.patient.hospitalId,
      userId: req.user!.id,
      userRole: 'PHARMACY',
      action: 'DISPENSE_PRESCRIPTION',
      entity: 'PRESCRIPTION',
      entityId: prescription.id,
      details: `Pharmacist ${req.user!.name} dispensed prescription ${prescription.prescriptionCode} for patient ${prescription.patient.patientId}`,
    });

    res.json({
      message: 'Prescription dispensed and inventory updated successfully.',
      prescription: updatedPrescription,
    });
  } catch (error) {
    console.error('Dispensing error:', error);
    res.status(500).json({ error: 'Failed to process dispensing.' });
  }
});

// Controlled Workflow: Flag Medicine Unavailable (Notifies Doctor without altering prescription)
router.post('/flag-unavailable', async (req: Request, res: Response) => {
  try {
    const { prescriptionId, medicineName, notes } = req.body;

    const prescription = await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: {
        patient: true,
        doctor: { include: { user: true } },
      },
    });

    if (!prescription) {
      return res.status(404).json({ error: 'Prescription not found.' });
    }

    const updated = await prisma.prescription.update({
      where: { id: prescriptionId },
      data: {
        status: 'UNAVAILABLE_FLAGGED',
        pharmacyNotes: notes ? `Stock Issue: ${notes}` : 'Stock unavailable in pharmacy',
      },
    });

    // Notify prescribing doctor
    if (prescription.doctor?.user?.id) {
      await prisma.notification.create({
        data: {
          hospitalId: prescription.patient.hospitalId,
          recipientUserId: prescription.doctor.user.id,
          recipientRole: 'DOCTOR',
          title: 'Prescription Medicine Unavailable',
          message: `Pharmacy flagged that ${medicineName || 'a prescribed medicine'} in prescription ${prescription.prescriptionCode} for patient ${prescription.patient.firstName} ${prescription.patient.lastName} is unavailable. Note: ${notes}`,
          type: 'WARNING',
        },
      });
    }

    await logAuditEvent({
      hospitalId: prescription.patient.hospitalId,
      userId: req.user!.id,
      userRole: 'PHARMACY',
      action: 'FLAG_UNAVAILABLE',
      entity: 'PRESCRIPTION',
      entityId: prescription.id,
      details: `Prescription ${prescription.prescriptionCode} flagged unavailable. Note: ${notes}`,
    });

    res.json({ message: 'Medicine shortage communicated to prescribing doctor.', prescription: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to flag prescription.' });
  }
});

export default router;
