import { Router } from 'express';
import multer from 'multer';
import * as XLSX from 'xlsx';
import { asyncHandler } from './helpers.js';
import prisma from '../prismaClient.js';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Excel, and CSV files are allowed.'));
    }
  }
});

// Parse Excel file to JSON
function parseExcelFile(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

// Parse CSV file to JSON
function parseCSVFile(buffer: Buffer): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet);
}

// Convert JSON array to CSV string (easier for LLM to read)
function jsonToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape values that contain commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ];

  return csvRows.join('\n');
}

// Parse PDF file (basic text extraction)
async function parsePDFFile(buffer: Buffer): Promise<string> {
  // For now, return a message that PDF parsing is not fully implemented
  // You can integrate pdf-parse or other PDF libraries here
  return 'PDF parsing not yet implemented. Please use Excel or CSV files for data import.';
}

// Analyze file contents using AI
router.post(
  '/analyze-file',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { prompt } = req.body as { prompt?: string };
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ message: 'OpenAI API key not configured' });
    }

    try {
      let fileData: any;
      let fileType: string;

      // Parse file based on type
      if (req.file.mimetype === 'application/pdf') {
        fileData = await parsePDFFile(req.file.buffer);
        fileType = 'PDF';
      } else if (
        req.file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        req.file.mimetype === 'application/vnd.ms-excel'
      ) {
        fileData = parseExcelFile(req.file.buffer);
        fileType = 'Excel';
      } else if (req.file.mimetype === 'text/csv') {
        fileData = parseCSVFile(req.file.buffer);
        fileType = 'CSV';
      } else {
        return res.status(400).json({ message: 'Unsupported file type' });
      }

      // Get current CRM context
      const [accounts, contacts] = await Promise.all([
        prisma.account.findMany({ select: { id: true, name: true, industry: true } }),
        prisma.contact.findMany({ select: { id: true, name: true, email: true, accountId: true } })
      ]);

      // Use AI to analyze file and suggest actions
      // Convert to CSV for better LLM readability and token efficiency
      const csvData = Array.isArray(fileData) ? jsonToCSV(fileData.slice(0, 50)) : String(fileData);

      const systemPrompt = `You are Quartermaster AI, analyzing a ${fileType} file uploaded by the user.

File data (first 50 rows in CSV format):
${csvData}

Current CRM context:
- Existing accounts: ${accounts.length}
- Existing contacts: ${contacts.length}

Your task is to:
1. Analyze the file structure and identify what type of data it contains (accounts, contacts, invoices, etc.)
2. Map the file columns/fields to CRM fields
3. Suggest specific actions to import this data
4. Return a structured JSON response with actions

BULK IMPORT: This system supports efficient bulk imports for large datasets. When you detect multiple records of the same type (accounts, contacts, leads, invoices, opportunities), create one action per record. The system will automatically group and bulk-insert them using the /execute-plan-bulk endpoint.

IMPORTANT: You MUST respond in valid JSON format with this structure:
{
  "message": "I found [X] rows in this ${fileType} file. It appears to contain [description]. Ready to bulk import these records.",
  "insights": [
    "Detected [number] unique accounts",
    "Found [number] contacts with email addresses",
    "Identified [number] items that already exist in the system"
  ],
  "recommendations": [
    "Bulk import ${Array.isArray(fileData) ? fileData.length : 0} records efficiently",
    "System will skip duplicates automatically",
    "Create accounts first, then contacts/invoices that depend on them"
  ],
  "actions": [
    {
      "type": "CREATE_ACCOUNT",
      "description": "Create account: [Name]",
      "params": {
        "name": "Company Name",
        "industry": "Industry Type",
        "type": "Enterprise" | "MidMarket" | "SMB",
        "website": "https://example.com"
      }
    },
    {
      "type": "CREATE_CONTACT",
      "description": "Create contact: [Name]",
      "params": {
        "name": "Full Name",
        "email": "email@example.com",
        "phone": "123-456-7890",
        "title": "Job Title",
        "accountName": "Company Name"
      }
    },
    {
      "type": "CREATE_LEAD",
      "description": "Create lead: [Name]",
      "params": {
        "name": "Lead Name",
        "email": "lead@example.com",
        "phone": "123-456-7890",
        "company": "Company Name",
        "source": "Import"
      }
    }
  ],
  "data": {
    "totalRows": ${Array.isArray(fileData) ? fileData.length : 0},
    "columns": ["col1", "col2"],
    "sampleData": {},
    "bulkImportReady": true
  }
}

CRITICAL - Only use these exact fields (extra fields will cause errors):

**Accounts:**
- name (required) - "Company Name", "Account Name", "Company"
- industry (optional) - "Industry", "Sector"
- type (optional) - "Enterprise", "MidMarket", or "SMB"
- website (optional) - "Website", "URL"
DO NOT USE: owner, revenue, description, or any other fields

**Contacts:**
- name (required) - "Contact Name", "Full Name", "Name"
- email (required) - "Email", "Email Address"
- phone (optional) - "Phone", "Phone Number", "Tel"
- title (optional) - "Title", "Job Title", "Position"
- accountName (MUST USE THIS, not "account") - "Company", "Account Name"
DO NOT USE: firstName, lastName separately - combine into "name"

**Leads:**
- name (required) - "Lead Name", "Full Name"
- email (optional) - "Email"
- phone (optional) - "Phone"
- company (optional) - "Company"
- source (optional) - defaults to "Import"

**Invoices:**
- accountName (required) - "Company", "Account Name"
- amount (required) - "Amount", "Value", "Total"
- dueDate (optional) - "Due Date"
- status (optional) - "Draft", "Sent", "Paid", "Overdue"

Be smart about detecting duplicates - check existing accounts/contacts before suggesting CREATE actions.`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt || 'Please analyze this file and suggest what actions I should take to import this data into my CRM.' }
          ],
          response_format: { type: 'json_object' },
          max_completion_tokens: 2000
        })
      });

      if (!response.ok) {
        throw new Error('OpenAI API request failed');
      }

      const data = await response.json() as any;
      const content = data.choices?.[0]?.message?.content || '{"message":"Sorry, I could not analyze that file."}';

      // Parse the JSON response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(content);
      } catch {
        parsedResponse = { message: content };
      }

      res.json(parsedResponse);
    } catch (error) {
      console.error('File analysis error:', error);
      res.status(500).json({ message: 'Failed to analyze file' });
    }
  })
);

// Execute plan actions
router.post(
  '/execute-plan',
  asyncHandler(async (req, res) => {
    const { actions } = req.body as { actions: any[] };

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Invalid actions array' });
    }

    const results = {
      success: true,
      created: 0,
      failed: 0,
      errors: [] as any[],
      createdRecords: [] as any[]
    };

    // Execute each action
    for (const action of actions) {
      try {
        let record;

        switch (action.type) {
          case 'CREATE_ACCOUNT':
            record = await prisma.account.create({
              data: {
                name: action.params.name,
                industry: action.params.industry || null,
                type: action.params.type || 'SMB',
                website: action.params.website || null
              }
            });
            results.createdRecords.push({ type: 'account', record });
            results.created++;
            break;

          case 'CREATE_CONTACT':
            // Try to find account if accountName is provided
            let accountId: number | undefined = undefined;
            if (action.params.accountName) {
              const account = await prisma.account.findFirst({
                where: { name: { contains: action.params.accountName, mode: 'insensitive' } }
              });
              accountId = account?.id;
            }

            // Skip if no account found
            if (!accountId) {
              throw new Error(`Account not found for contact: ${action.params.accountName || 'No account specified'}`);
            }

            record = await prisma.contact.create({
              data: {
                name: action.params.name || `${action.params.firstName || ''} ${action.params.lastName || ''}`.trim() || 'Unknown Contact',
                email: action.params.email || 'unknown@example.com',
                phone: action.params.phone || null,
                title: action.params.title || null,
                accountId
              }
            });
            results.createdRecords.push({ type: 'contact', record });
            results.created++;
            break;

          case 'CREATE_LEAD':
            record = await prisma.lead.create({
              data: {
                name: action.params.name || action.params.firstName || 'Unknown Lead',
                email: action.params.email || null,
                phone: action.params.phone || null,
                company: action.params.company || null,
                source: action.params.source || 'Import'
              }
            });
            results.createdRecords.push({ type: 'lead', record });
            results.created++;
            break;

          case 'CREATE_INVOICE':
            // Find account for invoice
            const invoiceAccount = await prisma.account.findFirst({
              where: { name: { contains: action.params.accountName, mode: 'insensitive' } }
            });

            if (!invoiceAccount) {
              throw new Error(`Account not found: ${action.params.accountName}`);
            }

            record = await prisma.invoice.create({
              data: {
                id: `INV-${Date.now()}`,
                accountId: invoiceAccount.id,
                amount: parseFloat(action.params.amount),
                issueDate: new Date(),
                dueDate: action.params.dueDate ? new Date(action.params.dueDate) : new Date(),
                status: action.params.status || 'Draft'
              }
            });
            results.createdRecords.push({ type: 'invoice', record });
            results.created++;
            break;

          case 'UPDATE_ACCOUNT':
            record = await prisma.account.update({
              where: { id: action.params.accountId },
              data: action.params.updates
            });
            results.createdRecords.push({ type: 'account', record });
            results.created++;
            break;

          case 'UPDATE_OPPORTUNITY_STAGE':
            record = await prisma.opportunity.update({
              where: { id: action.params.opportunityId },
              data: { stage: action.params.stage }
            });
            results.createdRecords.push({ type: 'opportunity', record });
            results.created++;
            break;

          case 'CREATE_TASK':
            // Try to find account/opportunity if names are provided
            let taskAccountId = null;
            let taskOpportunityId = null;

            if (action.params.accountName) {
              const taskAccount = await prisma.account.findFirst({
                where: { name: { contains: action.params.accountName, mode: 'insensitive' } }
              });
              taskAccountId = taskAccount?.id || null;
            }

            if (action.params.opportunityName) {
              const taskOpportunity = await prisma.opportunity.findFirst({
                where: { name: { contains: action.params.opportunityName, mode: 'insensitive' } }
              });
              taskOpportunityId = taskOpportunity?.id || null;
            }

            record = await prisma.task.create({
              data: {
                title: action.params.title,
                dueDate: action.params.dueDate ? new Date(action.params.dueDate) : new Date(Date.now() + 86400000),
                priority: action.params.priority || 'MEDIUM',
                status: 'OPEN',
                assignedTo: action.params.assignedTo || 'Me',
                accountId: taskAccountId,
                opportunityId: taskOpportunityId
              }
            });
            results.createdRecords.push({ type: 'task', record });
            results.created++;
            break;

          case 'CREATE_OPPORTUNITY':
            // Find account for opportunity
            const oppAccount = await prisma.account.findFirst({
              where: { name: { contains: action.params.accountName, mode: 'insensitive' } }
            });

            if (!oppAccount) {
              throw new Error(`Account not found: ${action.params.accountName}`);
            }

            record = await prisma.opportunity.create({
              data: {
                name: action.params.name,
                amount: parseInt(action.params.amount) || 0,
                closeDate: action.params.closeDate ? new Date(action.params.closeDate) : new Date(Date.now() + 30 * 86400000),
                probability: action.params.probability || 50,
                owner: action.params.owner || 'Me',
                stage: action.params.stage || 'Prospecting',
                accountId: oppAccount.id,
                email: action.params.email || null,
                phone: action.params.phone || null
              }
            });
            results.createdRecords.push({ type: 'opportunity', record });
            results.created++;
            break;

          case 'SCHEDULE_MEETING':
          case 'CREATE_EVENT':
            // Try to find opportunity if name is provided
            let meetingOpportunityId = null;

            if (action.params.opportunityName) {
              const meetingOpportunity = await prisma.opportunity.findFirst({
                where: { name: { contains: action.params.opportunityName, mode: 'insensitive' } }
              });
              meetingOpportunityId = meetingOpportunity?.id || null;
            }

            record = await prisma.activity.create({
              data: {
                type: 'MEETING',
                subject: action.params.subject || 'Meeting',
                description: action.params.description || null,
                performedBy: action.params.performedBy || 'Me',
                performedAt: action.params.meetingTime ? new Date(action.params.meetingTime) : new Date(),
                opportunityId: meetingOpportunityId
              }
            });
            results.createdRecords.push({ type: 'meeting', record });
            results.created++;
            break;

          default:
            results.errors.push({
              action,
              error: `Unknown action type: ${action.type}`
            });
            results.failed++;
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          action,
          error: error.message
        });
      }
    }

    res.json(results);
  })
);

// Type for actions
type BulkAction = {
  type: string;
  description: string;
  params: Record<string, any>;
};

// Bulk execute plan actions (optimized for large datasets)
router.post(
  '/execute-plan-bulk',
  asyncHandler(async (req, res) => {
    const { actions } = req.body as { actions: BulkAction[] };

    if (!actions || !Array.isArray(actions)) {
      return res.status(400).json({ error: 'Invalid actions array' });
    }

    const results = {
      success: true,
      created: 0,
      failed: 0,
      errors: [] as any[],
      createdRecords: [] as any[]
    };

    try {
      // Group actions by type for bulk processing
      const groupedActions = actions.reduce((acc, action: BulkAction) => {
        if (!acc[action.type]) {
          acc[action.type] = [];
        }
        acc[action.type].push(action);
        return acc;
      }, {} as Record<string, BulkAction[]>);

      // 1. Bulk create accounts (no dependencies)
      if (groupedActions['CREATE_ACCOUNT']) {
        try {
          const accountData = groupedActions['CREATE_ACCOUNT'].map((action: BulkAction) => ({
            name: action.params.name,
            industry: action.params.industry || null,
            type: action.params.type || 'SMB',
            website: action.params.website || null
          }));

          const created = await prisma.account.createMany({
            data: accountData,
            skipDuplicates: true // Skip if name already exists
          });

          results.created += created.count;
          results.createdRecords.push({ type: 'accounts', count: created.count });
        } catch (error: any) {
          results.failed += groupedActions['CREATE_ACCOUNT'].length;
          results.errors.push({ type: 'CREATE_ACCOUNT', error: error.message });
        }
      }

      // 2. Bulk create leads (no dependencies)
      if (groupedActions['CREATE_LEAD']) {
        try {
          const leadData = groupedActions['CREATE_LEAD'].map((action: BulkAction) => ({
            name: action.params.name || action.params.firstName || 'Unknown Lead',
            email: action.params.email || null,
            phone: action.params.phone || null,
            company: action.params.company || null,
            source: action.params.source || 'Import'
          }));

          const created = await prisma.lead.createMany({
            data: leadData,
            skipDuplicates: true
          });

          results.created += created.count;
          results.createdRecords.push({ type: 'leads', count: created.count });
        } catch (error: any) {
          results.failed += groupedActions['CREATE_LEAD'].length;
          results.errors.push({ type: 'CREATE_LEAD', error: error.message });
        }
      }

      // 3. Bulk create contacts (requires account lookup)
      if (groupedActions['CREATE_CONTACT']) {
        const contactsToCreate = [];
        const contactErrors = [];

        // Get all unique account names
        const accountNames = [...new Set(
          groupedActions['CREATE_CONTACT']
            .map((action: BulkAction) => action.params.accountName)
            .filter(Boolean)
        )];

        // Fetch all accounts in one query
        const accounts = await prisma.account.findMany({
          where: {
            name: { in: accountNames as string[] }
          },
          select: { id: true, name: true }
        });

        // Create a map for quick lookup
        const accountMap = new Map(accounts.map(acc => [acc.name.toLowerCase(), acc.id]));

        // Prepare contact data
        for (const action of groupedActions['CREATE_CONTACT'] as BulkAction[]) {
          const accountName = action.params.accountName;
          const accountId = accountName ? accountMap.get(accountName.toLowerCase()) : undefined;

          if (!accountId) {
            contactErrors.push({
              contact: action.params.name,
              error: `Account not found: ${accountName || 'No account specified'}`
            });
            results.failed++;
            continue;
          }

          contactsToCreate.push({
            name: action.params.name || `${action.params.firstName || ''} ${action.params.lastName || ''}`.trim() || 'Unknown Contact',
            email: action.params.email || 'unknown@example.com',
            phone: action.params.phone || null,
            title: action.params.title || null,
            accountId
          });
        }

        // Bulk create contacts
        if (contactsToCreate.length > 0) {
          try {
            const created = await prisma.contact.createMany({
              data: contactsToCreate,
              skipDuplicates: true
            });

            results.created += created.count;
            results.createdRecords.push({ type: 'contacts', count: created.count });
          } catch (error: any) {
            results.failed += contactsToCreate.length;
            results.errors.push({ type: 'CREATE_CONTACT', error: error.message });
          }
        }

        if (contactErrors.length > 0) {
          results.errors.push({ type: 'CREATE_CONTACT', errors: contactErrors });
        }
      }

      // 4. Bulk create invoices (requires account lookup)
      if (groupedActions['CREATE_INVOICE']) {
        const invoicesToCreate = [];
        const invoiceErrors = [];

        // Get all unique account names
        const accountNames = [...new Set(
          groupedActions['CREATE_INVOICE']
            .map((action: BulkAction) => action.params.accountName)
            .filter(Boolean)
        )];

        // Fetch all accounts in one query
        const accounts = await prisma.account.findMany({
          where: {
            name: { in: accountNames as string[] }
          },
          select: { id: true, name: true }
        });

        const accountMap = new Map(accounts.map(acc => [acc.name.toLowerCase(), acc.id]));

        // Prepare invoice data
        for (const action of groupedActions['CREATE_INVOICE'] as BulkAction[]) {
          const accountName = action.params.accountName;
          const accountId = accountName ? accountMap.get(accountName.toLowerCase()) : undefined;

          if (!accountId) {
            invoiceErrors.push({
              invoice: action.params,
              error: `Account not found: ${accountName}`
            });
            results.failed++;
            continue;
          }

          invoicesToCreate.push({
            id: `INV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            accountId,
            amount: parseFloat(action.params.amount),
            issueDate: new Date(),
            dueDate: action.params.dueDate ? new Date(action.params.dueDate) : new Date(),
            status: action.params.status || 'Draft'
          });
        }

        // Bulk create invoices
        if (invoicesToCreate.length > 0) {
          try {
            const created = await prisma.invoice.createMany({
              data: invoicesToCreate
            });

            results.created += created.count;
            results.createdRecords.push({ type: 'invoices', count: created.count });
          } catch (error: any) {
            results.failed += invoicesToCreate.length;
            results.errors.push({ type: 'CREATE_INVOICE', error: error.message });
          }
        }

        if (invoiceErrors.length > 0) {
          results.errors.push({ type: 'CREATE_INVOICE', errors: invoiceErrors });
        }
      }

      // 5. Bulk create opportunities (requires account lookup)
      if (groupedActions['CREATE_OPPORTUNITY']) {
        const opportunitiesToCreate = [];
        const opportunityErrors = [];

        // Get all unique account names
        const accountNames = [...new Set(
          groupedActions['CREATE_OPPORTUNITY']
            .map((action: BulkAction) => action.params.accountName)
            .filter(Boolean)
        )];

        // Fetch all accounts in one query
        const accounts = await prisma.account.findMany({
          where: {
            name: { in: accountNames as string[] }
          },
          select: { id: true, name: true }
        });

        const accountMap = new Map(accounts.map(acc => [acc.name.toLowerCase(), acc.id]));

        // Prepare opportunity data
        for (const action of groupedActions['CREATE_OPPORTUNITY'] as BulkAction[]) {
          const accountName = action.params.accountName;
          const accountId = accountName ? accountMap.get(accountName.toLowerCase()) : undefined;

          if (!accountId) {
            opportunityErrors.push({
              opportunity: action.params.name,
              error: `Account not found: ${accountName}`
            });
            results.failed++;
            continue;
          }

          opportunitiesToCreate.push({
            name: action.params.name,
            amount: parseInt(action.params.amount) || 0,
            closeDate: action.params.closeDate ? new Date(action.params.closeDate) : new Date(Date.now() + 30 * 86400000),
            probability: action.params.probability || 50,
            owner: action.params.owner || 'Me',
            stage: action.params.stage || 'Prospecting',
            accountId,
            email: action.params.email || null,
            phone: action.params.phone || null
          });
        }

        // Bulk create opportunities
        if (opportunitiesToCreate.length > 0) {
          try {
            const created = await prisma.opportunity.createMany({
              data: opportunitiesToCreate,
              skipDuplicates: true
            });

            results.created += created.count;
            results.createdRecords.push({ type: 'opportunities', count: created.count });
          } catch (error: any) {
            results.failed += opportunitiesToCreate.length;
            results.errors.push({ type: 'CREATE_OPPORTUNITY', error: error.message });
          }
        }

        if (opportunityErrors.length > 0) {
          results.errors.push({ type: 'CREATE_OPPORTUNITY', errors: opportunityErrors });
        }
      }

      // Note: For actions that require complex lookups (CREATE_TASK, SCHEDULE_MEETING, UPDATE_* actions),
      // fall back to individual processing
      const complexActions = [
        ...(groupedActions['CREATE_TASK'] || []),
        ...(groupedActions['SCHEDULE_MEETING'] || []),
        ...(groupedActions['CREATE_EVENT'] || []),
        ...(groupedActions['UPDATE_ACCOUNT'] || []),
        ...(groupedActions['UPDATE_OPPORTUNITY_STAGE'] || [])
      ];

      if (complexActions.length > 0) {
        results.errors.push({
          type: 'COMPLEX_ACTIONS',
          message: `${complexActions.length} complex actions were skipped. Use /execute-plan for individual processing.`,
          count: complexActions.length
        });
      }

    } catch (error: any) {
      console.error('Bulk execution error:', error);
      results.success = false;
      results.errors.push({ error: error.message });
    }

    res.json(results);
  })
);

export default router;
