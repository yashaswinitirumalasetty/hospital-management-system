export type UserRole = 'PATIENT' | 'RECEPTION' | 'DOCTOR' | 'NURSE' | 'PHARMACY' | 'ADMIN' | 'OWNER';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  hospitalId: string;
  hospitalName?: string;
  patientId?: string;
  patientDbId?: string;
  staffProfile?: StaffProfile;
}

export interface StaffProfile {
  id: string;
  userId: string;
  departmentId?: string;
  department?: Department;
  specialty?: string;
  qualification?: string;
  experienceYears?: number;
  roomNumber?: string;
  availableDays?: string;
  scheduleHours?: string;
  consultationFee?: string;
}

export interface Department {
  id: string;
  hospitalId: string;
  name: string;
  code: string;
  description?: string;
  locationFloor?: string;
}

export interface Patient {
  id: string;
  patientId: string; // e.g. "P-100245"
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email?: string;
  bloodGroup?: string;
  address?: string;
  emergencyContact?: string;
  allergies?: string;
  chronicConditions?: string;
  createdAt: string;
  appointments?: Appointment[];
}

export interface Appointment {
  id: string;
  hospitalId: string;
  patientId: string;
  patient: Patient;
  departmentId: string;
  department: Department;
  doctorId?: string;
  doctor?: { id: string; user: { name: string; email: string } };
  appointmentDate: string;
  timeSlot: string;
  queueNumber?: number;
  status: 'APPOINTMENT_REQUESTED' | 'RECEPTION_REVIEW' | 'CONFIRMED' | 'CHECKED_IN' | 'WAITING_FOR_DOCTOR' | 'IN_CONSULTATION' | 'WAITING_FOR_PHARMACY' | 'WAITING_FOR_LAB' | 'COMPLETED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'RECEIVED' | 'NOT_APPLICABLE';
  reason?: string;
  notes?: string;
  checkedInAt?: string;
  completedAt?: string;
  createdAt: string;
  consultations?: Consultation[];
  nurseRecords?: NurseRecord[];
  doctorInstructions?: DoctorInstruction[];
}

export interface Consultation {
  id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  doctor: { id: string; user: { name: string }; department?: { name: string } };
  chiefComplaint: string;
  symptoms: string;
  physicalExam?: string;
  diagnosis: string;
  clinicalNotes?: string;
  instructions?: string;
  followUpDate?: string;
  createdAt: string;
  prescriptions?: Prescription[];
}

export interface Prescription {
  id: string;
  prescriptionCode: string; // e.g. "RX-10231"
  consultationId?: string;
  patientId: string;
  patient: Patient;
  doctorId: string;
  doctor: { id: string; user: { name: string }; department?: { name: string } };
  status: 'PENDING' | 'READY' | 'DISPENSED' | 'UNAVAILABLE_FLAGGED';
  pharmacyNotes?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface PrescriptionItem {
  id: string;
  prescriptionId: string;
  medicineName: string;
  genericName?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  quantityPrescribed: number;
  isDispensed: boolean;
}

export interface NurseRecord {
  id: string;
  patientId: string;
  patient?: Patient;
  appointmentId?: string;
  nurseId: string;
  nurse: { id: string; user: { name: string } };
  bloodPressure?: string;
  temperature?: string;
  pulse?: number;
  spO2?: number;
  respiratoryRate?: number;
  weight?: number;
  nursingNotes?: string;
  recordedAt: string;
}

export interface DoctorInstruction {
  id: string;
  patientId: string;
  patient: Patient;
  appointmentId?: string;
  doctorId: string;
  doctor: { id: string; user: { name: string } };
  assignedNurseId?: string;
  instruction: string;
  priority: 'ROUTINE' | 'URGENT' | 'STAT';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'COMPLETED';
  acknowledgedAt?: string;
  completedAt?: string;
  completionNotes?: string;
  createdAt: string;
}

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: string;
  unit: string;
  minStockLevel: number;
  totalStock?: number;
  isLowStock?: boolean;
  batches: MedicineBatch[];
}

export interface MedicineBatch {
  id: string;
  medicineId: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  unitPrice?: number;
  locationRack?: string;
}

export interface Equipment {
  id: string;
  equipmentCode: string;
  name: string;
  departmentId: string;
  department: Department;
  location: string;
  status: 'AVAILABLE' | 'IN_USE' | 'UNDER_MAINTENANCE' | 'OUT_OF_SERVICE';
  lastServiceDate?: string;
  nextServiceDate?: string;
  notes?: string;
}

export interface Incident {
  id: string;
  reportedById: string;
  reportedBy: { name: string };
  departmentId: string;
  department: Department;
  title: string;
  type: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedTo?: string;
  resolutionNotes?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userRole: string;
  user?: { name: string; email: string };
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
}
