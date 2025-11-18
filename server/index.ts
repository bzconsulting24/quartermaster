import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import opportunitiesRouter from './routes/opportunities.js';
import accountsRouter from './routes/accounts.js';
import contactsRouter from './routes/contacts.js';
import tasksRouter from './routes/tasks.js';
import invoicesRouter from './routes/invoices.js';
import activitiesRouter from './routes/activities.js';
import overviewRouter from './routes/overview.js';
import reportsRouter from './routes/reports.js';
import webhookRouter from './routes/webhook.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../dist');
const hasClientBundle = fs.existsSync(clientDistPath);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/accounts', accountsRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/invoices', invoicesRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/overview', overviewRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/webhook', webhookRouter);

if (hasClientBundle) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use(errorHandler);

const port = Number(process.env.PORT ?? 4000);

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`API server listening on port ${port}`);
  });
}

export default app;
