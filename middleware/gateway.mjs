import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Config
import connectDB from './config/db.js';
import SYSTEMS from './config/systems.js';
import { initializeHealthModels } from './config/healthDb.js';

// Routes
import gatewayRoutes from './routes/gateway.js';
import authRoutes from './routes/auth.js';
import hospitalRoutes from './routes/hospital.js';
import hrRoutes from './routes/hr.js';
import hotelRoutes from './routes/hotel.js';
import syncRoutes from './routes/sync.js';
import healthCheckRoutes from './routes/healthCheck.js';
import reportRoutes from './routes/reports.js';
import scheduleRoutes from './routes/schedule.js';
import databaseRoutes from './routes/database.js';

// Jobs
import startCronJobs from './jobs/cron.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.GATEWAY_PORT || 6060;

// Middleware
app.use(express.json());

// Connect Database
connectDB();

// ============================================
// Routes Registration
// ============================================

// Gateway & Systems Status (Includes /logs)
app.use('/api/gateway', gatewayRoutes);

// Auth
app.use('/api/gateway/auth', authRoutes);

// Hospital Integration
app.use('/api/gateway/hospital', hospitalRoutes);

// HR Integration
app.use('/api/gateway/hr', hrRoutes);

// Schedule Management (Tự động tạo lịch khám)
app.use('/api/gateway/schedule', scheduleRoutes);

// Hotel Integration
app.use('/api/gateway/hotel', hotelRoutes);

// Sync (Legacy)
app.use('/api/gateway/sync', syncRoutes);

// Health Check & New Sync
app.use('/api/gateway/health-check', healthCheckRoutes);

// Reports
app.use('/api/gateway/reports', reportRoutes);

// Database status & data
app.use('/api/gateway/database', databaseRoutes);

// ============================================
// Dashboard & Static Files
// ============================================

const publicPath = path.join(__dirname, 'public');

// Serve static files from root path
app.use(express.static(publicPath));

// Also serve from /dashboard for backward compatibility
app.use('/dashboard', express.static(publicPath));

// Redirect root to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Redirect /dashboard to /dashboard/index.html
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// ============================================
// Error Handling & Start
// ============================================

app.use((req, res) => {
  res.status(404).json({
    code: 2,
    message: 'Endpoint not found',
    success: false,
    path: req.path
  });
});

app.listen(PORT, async () => {
  // Initialize health models
  try {
    await initializeHealthModels();
    console.log('✅ Health models initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize health models:', error.message);
  }
  
  console.log(`\n🌐 API GATEWAY RUNNING`);
  console.log(`📌 Port: ${PORT}`);
  console.log(`🔗 Health: http://localhost:${PORT}/api/gateway/health\n`);
  console.log(`📊 Connected Systems:`);
  Object.entries(SYSTEMS).forEach(([key, system]) => {
    console.log(`   ${system.name}: ${system.baseUrl} (${system.type})`);
  });
  console.log(`✅ Health Check Integration: /api/gateway/health-check/*`);
  console.log(`✅ Dashboard: http://localhost:${PORT}/dashboard`);
  console.log(`\n`);

  // Start Cron Jobs after server starts
  startCronJobs(PORT);
});

export default app;
