import OpenAI from 'openai';
import prisma from '../prismaClient.js';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Assistant configuration
const ASSISTANT_NAME = 'Quartermaster AI';
const ASSISTANT_MODEL = 'gpt-4o-mini';

// Define CRM functions that the assistant can call
const CRM_FUNCTIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_crm_context',
      description: 'Get current CRM data including accounts, contacts, opportunities, tasks, invoices, quotes, and leads',
      parameters: {
        type: 'object',
        properties: {
          include: {
            type: 'array',
            items: { type: 'string', enum: ['accounts', 'contacts', 'opportunities', 'tasks', 'invoices', 'quotes', 'leads', 'all'] },
            description: 'Which data to include. Use "all" for complete context.'
          }
        },
        required: ['include']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_account',
      description: 'Create a new account (company) in the CRM',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Account name' },
          industry: { type: 'string', description: 'Industry sector' },
          type: { type: 'string', enum: ['Enterprise', 'MidMarket', 'SMB'], description: 'Account type' },
          revenue: { type: 'number', description: 'Annual revenue' },
          location: { type: 'string', description: 'Location (city, country)' },
          owner: { type: 'string', description: 'Account owner' },
          phone: { type: 'string', description: 'Phone number' },
          website: { type: 'string', description: 'Website URL' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_contact',
      description: 'Create a new contact person in the CRM',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Contact name' },
          email: { type: 'string', description: 'Email address' },
          accountId: { type: 'number', description: 'ID of the account this contact belongs to' },
          title: { type: 'string', description: 'Job title' },
          phone: { type: 'string', description: 'Phone number' },
          owner: { type: 'string', description: 'Contact owner' }
        },
        required: ['name', 'email', 'accountId']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_opportunity',
      description: 'Create a new sales opportunity in the CRM',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Opportunity name' },
          accountId: { type: 'number', description: 'Account ID' },
          amount: { type: 'number', description: 'Deal amount' },
          closeDate: { type: 'string', description: 'Expected close date (ISO format)' },
          probability: { type: 'number', description: 'Win probability (0-100)' },
          owner: { type: 'string', description: 'Opportunity owner' },
          stage: { type: 'string', enum: ['Prospecting', 'Qualification', 'ProposalPriceQuote', 'NegotiationReview', 'ClosedWon', 'ClosedLost'] }
        },
        required: ['name', 'accountId', 'amount']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_invoice',
      description: 'Create a new invoice in the CRM',
      parameters: {
        type: 'object',
        properties: {
          accountId: { type: 'number', description: 'Account ID' },
          amount: { type: 'number', description: 'Invoice amount' },
          dueDate: { type: 'string', description: 'Due date (ISO format)' },
          notes: { type: 'string', description: 'Invoice notes' }
        },
        required: ['accountId', 'amount']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_task',
      description: 'Create a new task in the CRM',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Task title' },
          dueDate: { type: 'string', description: 'Due date (ISO format)' },
          priority: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
          assignedTo: { type: 'string', description: 'Person assigned to' },
          accountId: { type: 'number', description: 'Related account ID' },
          opportunityId: { type: 'number', description: 'Related opportunity ID' }
        },
        required: ['title', 'assignedTo']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_lead',
      description: 'Create a new lead in the CRM',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Lead name' },
          company: { type: 'string', description: 'Company name' },
          email: { type: 'string', description: 'Email address' },
          phone: { type: 'string', description: 'Phone number' },
          source: { type: 'string', description: 'Lead source' },
          owner: { type: 'string', description: 'Lead owner' },
          notes: { type: 'string', description: 'Notes' }
        },
        required: ['name']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'batch_create_accounts',
      description: 'Create multiple accounts at once. Use this for bulk imports from files.',
      parameters: {
        type: 'object',
        properties: {
          accounts: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                industry: { type: 'string' },
                type: { type: 'string' },
                revenue: { type: 'number' },
                location: { type: 'string' },
                owner: { type: 'string' }
              },
              required: ['name']
            },
            description: 'Array of accounts to create'
          }
        },
        required: ['accounts']
      }
    }
  }
];

const ASSISTANT_INSTRUCTIONS = `You are Quartermaster AI, an autonomous CRM assistant with access to a complete business database.

# Your Capabilities

You can:
1. **Analyze files** - Use code interpreter to parse Excel, CSV, and PDF files
2. **Query CRM data** - Call get_crm_context to access accounts, contacts, opportunities, etc.
3. **Create records** - Use create_* functions to add data to the CRM
4. **Plan multi-step workflows** - Break complex tasks into steps and execute them
5. **Handle errors** - Retry failed operations and adapt your approach

# Operating Principles

1. **Be proactive** - Don't just suggest actions, execute them (with user awareness)
2. **Plan ahead** - For complex tasks, outline your plan before executing
3. **Check for duplicates** - Always query existing data before creating new records
4. **Batch operations** - Use batch functions for importing multiple records
5. **Provide feedback** - Tell the user what you're doing as you work

# File Import Workflow

When a user uploads a file:
1. Use code interpreter to analyze the file structure
2. Map columns to CRM fields intelligently
3. Call get_crm_context to check for existing records
4. Create a plan: "I found X accounts, Y already exist, I'll create Z new ones"
5. Execute batch_create_accounts (or other batch functions)
6. Report results: "✅ Created 50 accounts, ⚠️ Skipped 10 duplicates"

# Response Format

Always structure your responses with:
- **Summary**: What you found or did
- **Insights**: Key observations
- **Recommendations**: What should happen next
- **Actions Taken**: What you executed (if any)

# Example Workflows

**Bulk Import:**
User: "Import this Excel file"
You:
1. Analyze file with code interpreter
2. "Found 100 rows: 85 accounts, 15 contacts"
3. Query existing accounts
4. "Creating 72 new accounts (13 duplicates found)"
5. batch_create_accounts()
6. "✅ Imported 72 accounts successfully"

**Smart Query:**
User: "Which accounts have no activity?"
You:
1. get_crm_context(['accounts', 'opportunities', 'tasks'])
2. Analyze data
3. Return list with recommendations

Be autonomous, efficient, and always helpful!`;

// Get or create assistant
export async function getOrCreateAssistant(): Promise<OpenAI.Beta.Assistants.Assistant> {
  try {
    // Try to get existing assistant from environment variable
    const existingAssistantId = process.env.OPENAI_ASSISTANT_ID;

    if (existingAssistantId) {
      try {
        const assistant = await openai.beta.assistants.retrieve(existingAssistantId);
        console.log('Using existing assistant:', assistant.id);
        return assistant;
      } catch (error) {
        console.log('Existing assistant not found, creating new one...');
      }
    }

    // Create new assistant
    const assistant = await openai.beta.assistants.create({
      name: ASSISTANT_NAME,
      model: ASSISTANT_MODEL,
      instructions: ASSISTANT_INSTRUCTIONS,
      tools: [
        { type: 'code_interpreter' },
        { type: 'file_search' },
        ...CRM_FUNCTIONS
      ]
    });

    console.log('Created new assistant:', assistant.id);
    console.log('⚠️  Add this to your .env file: OPENAI_ASSISTANT_ID=' + assistant.id);

    return assistant;
  } catch (error) {
    console.error('Error creating assistant:', error);
    throw error;
  }
}

// Create a new thread for a user session
export async function createThread(): Promise<string> {
  const thread = await openai.beta.threads.create();
  return thread.id;
}

// Add a message to a thread
export async function addMessage(threadId: string, content: string, fileIds?: string[]): Promise<void> {
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content,
    attachments: fileIds?.map(id => ({ file_id: id, tools: [{ type: 'code_interpreter' }, { type: 'file_search' }] }))
  });
}

// Upload file to OpenAI
export async function uploadFile(buffer: Buffer, filename: string): Promise<string> {
  const file = await openai.files.create({
    file: new File([buffer], filename),
    purpose: 'assistants'
  });
  return file.id;
}

// Execute CRM function based on assistant's function call
export async function executeCRMFunction(name: string, args: any): Promise<any> {
  switch (name) {
    case 'get_crm_context': {
      const include = args.include || ['all'];
      const includeAll = include.includes('all');

      const [accounts, contacts, opportunities, tasks, invoices, quotes, leads] = await Promise.all([
        includeAll || include.includes('accounts') ? prisma.account.findMany({ take: 100 }) : [],
        includeAll || include.includes('contacts') ? prisma.contact.findMany({ take: 100 }) : [],
        includeAll || include.includes('opportunities') ? prisma.opportunity.findMany({ take: 100, include: { account: true } }) : [],
        includeAll || include.includes('tasks') ? prisma.task.findMany({ where: { status: { not: 'COMPLETED' } }, take: 100 }) : [],
        includeAll || include.includes('invoices') ? prisma.invoice.findMany({ take: 50 }) : [],
        includeAll || include.includes('quotes') ? prisma.quote.findMany({ take: 50 }) : [],
        includeAll || include.includes('leads') ? prisma.lead.findMany({ take: 50 }) : []
      ]);

      return {
        accounts: accounts.length,
        contacts: contacts.length,
        opportunities: opportunities.length,
        tasks: tasks.length,
        invoices: invoices.length,
        quotes: quotes.length,
        leads: leads.length,
        accountsList: accounts,
        contactsList: contacts,
        opportunitiesList: opportunities,
        tasksList: tasks
      };
    }

    case 'create_account': {
      const account = await prisma.account.create({
        data: {
          name: args.name,
          industry: args.industry || null,
          type: args.type || 'SMB',
          revenue: args.revenue || null,
          location: args.location || null,
          owner: args.owner || null,
          phone: args.phone || null,
          website: args.website || null
        }
      });
      return { success: true, accountId: account.id, name: account.name };
    }

    case 'create_contact': {
      const contact = await prisma.contact.create({
        data: {
          name: args.name,
          email: args.email,
          accountId: args.accountId,
          title: args.title || null,
          phone: args.phone || null,
          owner: args.owner || null
        }
      });
      return { success: true, contactId: contact.id, name: contact.name };
    }

    case 'create_opportunity': {
      const opportunity = await prisma.opportunity.create({
        data: {
          name: args.name,
          accountId: args.accountId,
          amount: args.amount,
          closeDate: args.closeDate ? new Date(args.closeDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          probability: args.probability || 50,
          owner: args.owner || 'Unassigned',
          stage: args.stage || 'Prospecting'
        }
      });
      return { success: true, opportunityId: opportunity.id, name: opportunity.name };
    }

    case 'create_invoice': {
      const invoice = await prisma.invoice.create({
        data: {
          id: `INV-${Date.now()}`,
          accountId: args.accountId,
          amount: args.amount,
          status: 'DRAFT',
          issueDate: new Date(),
          dueDate: args.dueDate ? new Date(args.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          notes: args.notes || null
        }
      });
      return { success: true, invoiceId: invoice.id };
    }

    case 'create_task': {
      const task = await prisma.task.create({
        data: {
          title: args.title,
          dueDate: args.dueDate ? new Date(args.dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          priority: args.priority || 'MEDIUM',
          status: 'OPEN',
          assignedTo: args.assignedTo,
          accountId: args.accountId || null,
          opportunityId: args.opportunityId || null
        }
      });
      return { success: true, taskId: task.id, title: task.title };
    }

    case 'create_lead': {
      const lead = await prisma.lead.create({
        data: {
          name: args.name,
          company: args.company || null,
          email: args.email || null,
          phone: args.phone || null,
          source: args.source || null,
          status: 'NEW',
          owner: args.owner || null,
          notes: args.notes || null
        }
      });
      return { success: true, leadId: lead.id, name: lead.name };
    }

    case 'batch_create_accounts': {
      const results = [];
      for (const accountData of args.accounts) {
        try {
          const account = await prisma.account.create({
            data: {
              name: accountData.name,
              industry: accountData.industry || null,
              type: accountData.type || 'SMB',
              revenue: accountData.revenue || null,
              location: accountData.location || null,
              owner: accountData.owner || null
            }
          });
          results.push({ success: true, accountId: account.id, name: account.name });
        } catch (error: any) {
          results.push({ success: false, name: accountData.name, error: error.message });
        }
      }
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      return {
        success: true,
        created: successCount,
        failed: failCount,
        total: results.length,
        results
      };
    }

    default:
      return { error: 'Unknown function: ' + name };
  }
}

// Run assistant and handle function calls
export async function runAssistant(threadId: string, assistantId: string): Promise<AsyncGenerator<any, void, unknown>> {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    stream: true
  });

  return (async function* () {
    for await (const event of run) {
      if (event.event === 'thread.message.delta') {
        const delta = event.data.delta;
        if (delta.content && delta.content[0] && delta.content[0].type === 'text') {
          yield { type: 'text', content: delta.content[0].text?.value || '' };
        }
      } else if (event.event === 'thread.run.requires_action') {
        const toolCalls = event.data.required_action?.submit_tool_outputs?.tool_calls || [];
        const toolOutputs = [];

        for (const toolCall of toolCalls) {
          if (toolCall.type === 'function') {
            const args = JSON.parse(toolCall.function.arguments);
            const result = await executeCRMFunction(toolCall.function.name, args);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: JSON.stringify(result)
            });
            yield { type: 'function_call', name: toolCall.function.name, args, result };
          }
        }

        // Submit tool outputs and continue
        if (toolOutputs.length > 0) {
          const submitRun = await openai.beta.threads.runs.submitToolOutputs(
            event.data.thread_id,
            event.data.id,
            { tool_outputs: toolOutputs, stream: true }
          );

          for await (const submitEvent of submitRun) {
            if (submitEvent.event === 'thread.message.delta') {
              const delta = submitEvent.data.delta;
              if (delta.content && delta.content[0] && delta.content[0].type === 'text') {
                yield { type: 'text', content: delta.content[0].text?.value || '' };
              }
            }
          }
        }
      } else if (event.event === 'thread.run.completed') {
        yield { type: 'done' };
      } else if (event.event === 'thread.run.failed') {
        yield { type: 'error', error: event.data.last_error };
      }
    }
  })();
}

export { openai };
