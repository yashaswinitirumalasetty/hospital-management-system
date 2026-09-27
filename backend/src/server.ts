import express from 'express';
import cors from 'cors';
import { config } from './config';
import authRoutes from './routes/auth.routes';
import patientRoutes from './routes/patient.routes';
import receptionRoutes from './routes/reception.routes';
import doctorRoutes from './routes/doctor.routes';
import nurseRoutes from './routes/nurse.routes';
import pharmacyRoutes from './routes/pharmacy.routes';
import adminRoutes from './routes/admin.routes';
import ownerRoutes from './routes/owner.routes';
import publicRoutes from './routes/public.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

// Middlewares
app.use(cors({
  origin: '*', // Allow frontend development requests
  credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Hospital Management & Operations Platform',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patient', patientRoutes);
app.use('/api/reception', receptionRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/nurse', nurseRoutes);
app.use('/api/pharmacy', pharmacyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/owner', ownerRoutes);

// Error handling middleware
app.use(errorHandler);

// Start Server
app.listen(config.port, () => {
  console.log(`=======================================================`);
  console.log(` Hospital Operations API Server running on port ${config.port}`);
  console.log(` Health check: http://localhost:${config.port}/api/health`);
  console.log(` Central Database connected via Prisma ORM`);
  console.log(`=======================================================`);
});

export default app;
