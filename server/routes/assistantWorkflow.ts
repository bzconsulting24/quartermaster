import { Router } from 'express';
import multer from 'multer';
import OpenAI from 'openai';
import XLSX from 'xlsx';
import { asyncHandler } from './helpers.js';
import prisma from '../prismaClient.js';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Parse Excel/CSV files
function parseFile(buffer: Buffer, filename: string): any[] {
  const extension = filename.split('.').pop()?.toLowerCase();

  if (extension === 'xlsx' || extension === 'xls' || extension === 'csv') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json(sheet);
  }

  return [];
}

// Agent 1: File Analysis Agent
async function fileAnalysisAgent(fileData: any[], userMessage: string, conversationHistory: any[]) {
  const systemPrompt = `You are a File Analysis Agent. Your job is to analyze uploaded data and extract structured information.

Analyze the data and determine:
1. What type of CRM data this is (accounts, contacts, leads, invoices, etc.)
2. What fields are present in the data
3. How many records there are

Return a JSON object with this structure:
{
  "dataType": "accounts" | "contacts" | "leads" | "invoices",
  "recordCount": number,
  "fields": string[],
  "sampleRecords": array (first 3 records)
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      {
        role: 'user',
        content: `${userMessage}\n\nFile data (${fileData.length} records):\n${JSON.stringify(fileData.slice(0, 5), null, 2)}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// Agent 2: Data Validation Agent
async function dataValidationAgent(fileData: any[], analysisResult: any, conversationHistory: any[]) {
  const systemPrompt = `You are a Data Validation Agent. Your job is to validate and map uploaded data to the CRM schema.

For ${analysisResult.dataType}, validate each record and create a mapping to these CRM fields:

**Accounts:** name (required), industry, type (Enterprise/MidMarket/SMB), website, description
**Contacts:** firstName (required), lastName (required), email, phone, accountName, title
**Leads:** firstName (required), lastName (required), email, phone, company, source
**Invoices:** accountName (required), amount (required), dueDate, status

Return a JSON object:
{
  "validated": array of mapped records ready for CRM,
  "duplicates": array of potential duplicates (by name/email),
  "errors": array of records with validation errors,
  "fieldMappings": object showing source field -> CRM field mappings
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      {
        role: 'assistant',
        content: `Analysis complete: ${JSON.stringify(analysisResult)}`
      },
      {
        role: 'user',
        content: `Validate and map this data:\n${JSON.stringify(fileData, null, 2)}`
      }
    ],
    response_format: { type: 'json_object' }
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

// Agent 3: CRM Execution Agent
async function crmExecutionAgent(validationResult: any, dataType: string) {
  const results = {
    created: 0,
    failed: 0,
    errors: [] as any[],
    createdRecords: [] as any[]
  };

  // Execute database operations based on data type
  for (const record of validationResult.validated) {
    try {
      let created;

      if (dataType === 'accounts') {
        created = await prisma.account.create({
          data: {
            name: record.name,
            industry: record.industry || null,
            type: record.type || 'SMB',
            website: record.website || null
          }
        });
      } else if (dataType === 'contacts') {
        // Try to find account by name if provided
        let accountId: number | undefined = undefined;
        if (record.accountName) {
          const account = await prisma.account.findFirst({
            where: { name: { contains: record.accountName, mode: 'insensitive' } }
          });
          accountId = account?.id;
        }

        // Skip if no account found
        if (!accountId) {
          throw new Error(`Account not found for contact: ${record.accountName || 'No account specified'}`);
        }

        created = await prisma.contact.create({
          data: {
            name: record.name || `${record.firstName || ''} ${record.lastName || ''}`.trim() || 'Unknown Contact',
            email: record.email || 'unknown@example.com',
            phone: record.phone || null,
            title: record.title || null,
            accountId
          }
        });
      } else if (dataType === 'leads') {
        created = await prisma.lead.create({
          data: {
            name: record.name || record.firstName || 'Unknown Lead',
            email: record.email || null,
            phone: record.phone || null,
            company: record.company || null,
            source: record.source || 'Import'
          }
        });
      } else if (dataType === 'invoices') {
        // Find account for invoice
        const account = await prisma.account.findFirst({
          where: { name: { contains: record.accountName, mode: 'insensitive' } }
        });

        if (!account) {
          throw new Error(`Account not found: ${record.accountName}`);
        }

        created = await prisma.invoice.create({
          data: {
            id: `INV-${Date.now()}`,
            accountId: account.id,
            amount: record.amount,
            issueDate: new Date(),
            dueDate: record.dueDate ? new Date(record.dueDate) : new Date(),
            status: record.status || 'Draft'
          }
        });
      }

      results.created++;
      results.createdRecords.push(created);
    } catch (error: any) {
      results.failed++;
      results.errors.push({
        record,
        error: error.message
      });
    }
  }

  return results;
}

// Agent 4: Summary Agent
async function summaryAgent(conversationHistory: any[], executionResult: any, userLanguage: string = 'en') {
  const systemPrompt = `You are a Summary Agent. Create a friendly, concise summary of the CRM operation results.

Respond in the user's language (${userLanguage}). Be conversational and helpful.

Include:
- What was accomplished
- How many records were created
- Any issues or duplicates found
- Next suggested actions`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      {
        role: 'assistant',
        content: `Execution complete: ${JSON.stringify(executionResult)}`
      },
      {
        role: 'user',
        content: 'Summarize what we just accomplished.'
      }
    ]
  });

  return response.choices[0].message.content || 'Task completed.';
}

// Main workflow endpoint
router.post(
  '/run',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const { message } = req.body as { message: string };

    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const conversationHistory: any[] = [];

    try {
      // Step 1: Parse file if present
      res.write(`data: ${JSON.stringify({ type: 'progress', step: 1, message: 'Analyzing file...' })}\n\n`);

      let fileData: any[] = [];
      if (req.file) {
        fileData = parseFile(req.file.buffer, req.file.originalname);
        res.write(`data: ${JSON.stringify({ type: 'progress', step: 1, message: `Found ${fileData.length} records in file` })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'No file uploaded' })}\n\n`);
        res.end();
        return;
      }

      // Step 2: File Analysis Agent
      res.write(`data: ${JSON.stringify({ type: 'progress', step: 2, message: 'Agent 1: Analyzing data structure...' })}\n\n`);
      const analysisResult = await fileAnalysisAgent(fileData, message, conversationHistory);
      conversationHistory.push({ role: 'assistant', content: JSON.stringify(analysisResult) });
      res.write(`data: ${JSON.stringify({
        type: 'agent_complete',
        agent: 'FileAnalysis',
        result: analysisResult
      })}\n\n`);

      // Step 3: Data Validation Agent
      res.write(`data: ${JSON.stringify({ type: 'progress', step: 3, message: 'Agent 2: Validating and mapping data...' })}\n\n`);
      const validationResult = await dataValidationAgent(fileData, analysisResult, conversationHistory);
      conversationHistory.push({ role: 'assistant', content: JSON.stringify(validationResult) });
      res.write(`data: ${JSON.stringify({
        type: 'agent_complete',
        agent: 'DataValidation',
        result: {
          validCount: validationResult.validated?.length || 0,
          duplicatesCount: validationResult.duplicates?.length || 0,
          errorsCount: validationResult.errors?.length || 0
        }
      })}\n\n`);

      // Step 4: CRM Execution Agent
      res.write(`data: ${JSON.stringify({ type: 'progress', step: 4, message: 'Agent 3: Creating records in CRM...' })}\n\n`);
      const executionResult = await crmExecutionAgent(validationResult, analysisResult.dataType);
      conversationHistory.push({ role: 'assistant', content: JSON.stringify(executionResult) });
      res.write(`data: ${JSON.stringify({
        type: 'agent_complete',
        agent: 'CRMExecution',
        result: executionResult
      })}\n\n`);

      // Step 5: Summary Agent
      res.write(`data: ${JSON.stringify({ type: 'progress', step: 5, message: 'Agent 4: Creating summary...' })}\n\n`);
      const summary = await summaryAgent(conversationHistory, executionResult);
      res.write(`data: ${JSON.stringify({
        type: 'text',
        content: summary
      })}\n\n`);

      res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
      res.end();

    } catch (error: any) {
      console.error('Workflow error:', error);
      res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
      res.end();
    }
  })
);

export default router;
