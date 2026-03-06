import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { execSync } from 'child_process';
import routes from './routes/index';
import { handleWebhook } from './controllers/payment.controller';
import { connectRedis } from './utils/redis';
import { auditLog } from './middleware/auditLog';
import reminderService from './services/reminder.service';

import dotenv from 'dotenv';
dotenv.config({ override: false });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));

// Stripe webhook needs raw body - must be before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handleWebhook);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', auditLog(), routes);

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get(/.*/, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

const startServer = async () => {
  try {
    console.log('=== ENV DIAGNOSTIC ===');
    console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 30) || 'NOT SET');
    const railwayVars = Object.keys(process.env).filter(k => k.startsWith('RAILWAY') || k.startsWith('PG') || k === 'DATABASE_URL');
    console.log('Railway/DB related vars:', railwayVars);
    console.log('======================');
    if (process.env.NODE_ENV === 'production' && process.env.DATABASE_URL) {
      try {
        console.log('Running database migrations...');
        execSync('node_modules/.bin/prisma migrate deploy', { stdio: 'inherit', env: process.env });
        console.log('Migrations complete');
      } catch (e) {
        console.error('Migration failed (non-fatal):', e);
      }
    } else if (!process.env.DATABASE_URL) {
      console.error('WARNING: DATABASE_URL is not set. Database operations will fail.');
    }

    await connectRedis();
    console.log('Redis connected');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      reminderService.start(60); // Check for reminders every hour
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;
