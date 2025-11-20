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
      const systemPrompt = `You are Quartermaster AI, analyzing a ${fileType} file uploaded by the user.

File data (first 50 rows):
${JSON.stringify(Array.isArray(fileData) ? fileData.slice(0, 50) : fileData, null, 2)}

Current CRM context:
- Existing accounts: ${accounts.length}
- Existing contacts: ${contacts.length}

Your task is to:
1. Analyze the file structure and identify what type of data it contains (accounts, contacts, invoices, etc.)
2. Map the file columns/fields to CRM fields
3. Suggest specific actions to import this data
4. Return a structured JSON response with actions

IMPORTANT: You MUST respond in valid JSON format with this structure:
{
  "message": "I found [X] rows in this ${fileType} file. It appears to contain [description]. Here's what I can do:",
  "insights": [
    "Detected [number] unique accounts",
    "Found [number] contacts with email addresses",
    "Identified [number] items that already exist in the system"
  ],
  "recommendations": [
    "Import new accounts first",
    "Then create associated contacts",
    "Skip duplicates based on name/email matching"
  ],
  "actions": [
    {
      "type": "CREATE_ACCOUNT" | "CREATE_CONTACT" | "CREATE_INVOICE" | etc,
      "description": "Create account: [Name]",
      "params": {
        // Mapped parameters from file data
      }
    }
  ],
  "data": {
    "totalRows": ${Array.isArray(fileData) ? fileData.length : 0},
    "columns": ["col1", "col2"],
    "sampleData": {}
  }
}

Column mapping guidelines:
- "Company Name", "Account Name", "Company" → name (for accounts)
- "Contact Name", "Full Name", "Name" → name (for contacts)
- "Email", "Email Address" → email
- "Phone", "Phone Number", "Tel" → phone
- "Industry", "Sector" → industry
- "Amount", "Value", "Total" → amount (for invoices/opportunities)
- "Due Date", "Close Date" → closeDate/dueDate

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

export default router;
