import type { WorkflowAction } from '@prisma/client';
import {
  WorkflowActionType,
  NotificationType,
  NotificationStatus,
  AIInsightType,
  TaskPriority,
  InvoiceStatus
} from '@prisma/client';
import prisma from '../prismaClient.js';
import type { WorkflowJobData } from '../jobs/automationQueue.js';

type OpportunityContext = Awaited<ReturnType<typeof loadOpportunity>>;

const loadOpportunity = async (opportunityId?: number) => {
  if (!opportunityId) return null;
  return prisma.opportunity.findUnique({
    where: { id: opportunityId },
    include: { account: true, contact: true }
  });
};

const matchesStageTrigger = (triggerConfig: Record<string, unknown> | null, context: Record<string, unknown> | undefined) => {
  if (!triggerConfig || !context) return true;
  if ('toStage' in triggerConfig && triggerConfig.toStage) {
    return triggerConfig.toStage === context.toStage;
  }
  if ('fromStage' in triggerConfig && triggerConfig.fromStage) {
    return triggerConfig.fromStage === context.fromStage;
  }
  return true;
};

const matchesConditions = (conditionConfig: Record<string, unknown> | null, opportunity: OpportunityContext) => {
  if (!conditionConfig || !opportunity) return true;

  if (typeof conditionConfig.amountGreaterThan === 'number' && opportunity.amount <= conditionConfig.amountGreaterThan) {
    return false;
  }

  if (typeof conditionConfig.probabilityLessThan === 'number' && opportunity.probability >= conditionConfig.probabilityLessThan) {
    return false;
  }

  if (Array.isArray(conditionConfig.stageIn) && conditionConfig.stageIn.length > 0) {
    if (!conditionConfig.stageIn.includes(opportunity.stage)) {
      return false;
    }
  }

  return true;
};

const createTaskFromAction = async (
  action: WorkflowAction,
  opportunity: OpportunityContext,
  config: Record<string, unknown> | null | undefined
) => {
  if (!opportunity) return;
  const title = typeof config?.title === 'string' ? config.title : `${action.type} - ${opportunity.name}`;
  const assignedTo = typeof config?.assignedTo === 'string' ? config.assignedTo : opportunity.owner;
  const dueInDays = typeof config?.dueInDays === 'number' ? config.dueInDays : 2;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + dueInDays);
  const priority = (config?.priority as TaskPriority) || TaskPriority.MEDIUM;

  await prisma.task.create({
    data: {
      title,
      assignedTo,
      dueDate,
      priority,
      status: 'OPEN',
      opportunityId: opportunity.id,
      workflowRuleId: action.ruleId
    }
  });
};

const createNotificationFromAction = async (
  action: WorkflowAction,
  opportunity: OpportunityContext,
  config: Record<string, unknown> | null | undefined
) => {
  const recipient =
    (typeof config?.recipient === 'string' && config.recipient) || opportunity?.owner || 'system@quartermaster.ai';
  const title = typeof config?.title === 'string' ? config.title : `${action.type} notification`;
  const body =
    typeof config?.body === 'string'
      ? config.body
      : `Workflow ${action.ruleId} triggered for ${opportunity?.name ?? 'record'}.`;

  await prisma.notification.create({
    data: {
      type: NotificationType.WORKFLOW,
      status: NotificationStatus.UNREAD,
      title,
      body,
      recipient,
      link: config?.link as string | undefined,
      accountId: opportunity?.accountId
    }
  });
};

const createInsightFromAction = async (
  action: WorkflowAction,
  opportunity: OpportunityContext,
  config: Record<string, unknown> | null | undefined
) => {
  if (!opportunity) return;
  const summary =
    typeof config?.summary === 'string'
      ? config.summary
      : `Workflow ${action.ruleId} suggested follow-up for ${opportunity.name} on ${new Date().toISOString()}.`;
  const insightType =
    (config?.insightType as AIInsightType) ??
    (action.type === WorkflowActionType.INVOKE_AI ? AIInsightType.NEXT_STEP : AIInsightType.SUMMARY);

  await prisma.aiInsight.create({
    data: {
      type: insightType,
      summary,
      confidence: typeof config?.confidence === 'number' ? config.confidence : 50,
      opportunityId: opportunity.id
    }
  });
};

const createInvoiceFromAction = async (
  action: WorkflowAction,
  opportunity: OpportunityContext,
  config: Record<string, unknown> | null | undefined
) => {
  if (!opportunity?.accountId) return;
  const amount = typeof config?.amount === 'number' ? config.amount : opportunity.amount;
  const invoiceId = `WF-${action.ruleId}-${Date.now()}`;

  await prisma.invoice.create({
    data: {
      id: invoiceId,
      amount,
      status: (config?.status as InvoiceStatus) || 'DRAFT',
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      accountId: opportunity.accountId,
      notes: `Automation generated invoice for ${opportunity.name}`,
      items: {
        create: [
          {
            description: config?.description ? String(config.description) : `Automated entry for ${opportunity.name}`,
            quantity: 1,
            rate: amount
          }
        ]
      }
    }
  });
};

const executeAction = async (action: WorkflowAction, opportunity: OpportunityContext) => {
  const config = action.actionConfig as Record<string, unknown> | undefined;
  switch (action.type) {
    case WorkflowActionType.CREATE_TASK:
      return createTaskFromAction(action, opportunity, config);
    case WorkflowActionType.SEND_EMAIL:
      return createNotificationFromAction(action, opportunity, config);
    case WorkflowActionType.INVOKE_AI:
      return createInsightFromAction(action, opportunity, config);
    case WorkflowActionType.CREATE_INVOICE:
      return createInvoiceFromAction(action, opportunity, config);
    default:
      return;
  }
};

export const processWorkflowJob = async (jobData: WorkflowJobData) => {
  const opportunity = await loadOpportunity(jobData.opportunityId);

  const rules = await prisma.workflowRule.findMany({
    where: {
      isActive: true,
      triggerType: jobData.triggerType
    },
    include: {
      actions: true
    }
  });

  for (const rule of rules) {
    const triggerConfig = rule.triggerConfig as Record<string, unknown> | null;
    const conditionConfig = rule.conditionConfig as Record<string, unknown> | null;

    if (!matchesStageTrigger(triggerConfig, jobData.context)) {
      continue;
    }

    if (!matchesConditions(conditionConfig, opportunity)) {
      continue;
    }

    for (const action of rule.actions) {
      await executeAction(action, opportunity);
    }
  }
};
