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
import assistantRouter from './routes/assistant.js';
import assistantActionsRouter from './routes/assistantActions.js';
import assistantMemoryRouter from './routes/assistantMemory.js';
import assistantFileAnalysisRouter from './routes/assistantFileAnalysis.js';
import assistantAgenticRouter from './routes/assistantAgentic.js';

import searchRouter from './routes/search.js';
import ingestRouter from './routes/ingest.js';
import aiRouter from './routes/ai.js';
import webhookRouter from './routes/webhook.js';
import driveRouter from './routes/drive.js';
import oneDriveRouter from './routes/onedrive.js';
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
app.use('/api/estimates', quotesRouter);
app.use('/api/contracts', contractsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/workflow-rules', workflowRulesRouter);
app.use('/api/assistant', assistantRouter);
app.use('/api/assistant/actions', assistantActionsRouter);
app.use('/api/assistant/memory', assistantMemoryRouter);
app.use('/api/assistant', assistantFileAnalysisRouter);
app.use('/api/assistant/agentic', assistantAgenticRouter);

app.use('/api/search', searchRouter);
app.use('/api/ingest', ingestRouter);
app.use('/api/ai', aiRouter);
app.use('/api/drive', driveRouter);
app.use('/api/onedrive', oneDriveRouter);
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









