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
import workflowsRouter from './routes/workflows.js';
import eventsRouter from './routes/events.js';
import leadsRouter from './routes/leads.js';
import productsRouter from './routes/products.js';
import quotesRouter from './routes/quotes.js';
import contractsRouter from './routes/contracts.js';
import insightsRouter from './routes/insights.js';
import notificationsRouter from './routes/notifications.js';
import workflowRulesRouter from './routes/workflowRules.js';
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
app.use('/api/workflows', workflowsRouter);
app.use('/api/events', eventsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/products', productsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/workflow-rules', workflowRulesRouter);
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
