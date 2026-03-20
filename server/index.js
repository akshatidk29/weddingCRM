import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './src/routes/auth.js';
import leadRoutes from './src/routes/leads.js';
import weddingRoutes from './src/routes/weddings.js';
import taskRoutes from './src/routes/tasks.js';
import vendorRoutes from './src/routes/vendors.js';
import dashboardRoutes from './src/routes/dashboard.js';
import budgetRoutes from './src/routes/budget.js';
import eventRoutes from './src/routes/events.js';
import { errorHandler, notFound } from './src/middleware/errorHandler.js';
import { startNotificationScheduler } from './src/utils/notificationScheduler.js';

dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map(url => url.trim())
  : ['http://localhost:5173'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/weddings', weddingRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/events', eventRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startNotificationScheduler();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
