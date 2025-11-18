import type { Stage } from '@prisma/client';

export const stageLabelToEnum: Record<string, Stage> = {
  Prospecting: 'Prospecting',
  Qualification: 'Qualification',
  'Proposal/Price Quote': 'ProposalPriceQuote',
  'Negotiation/Review': 'NegotiationReview',
  'Closed Won': 'ClosedWon',
  'Closed Lost': 'ClosedLost'
};

export const stageEnumToLabel: Record<Stage, string> = Object.fromEntries(
  Object.entries(stageLabelToEnum).map(([label, value]) => [value, label])
) as Record<Stage, string>;

export const presentStage = (stage: Stage) => stageEnumToLabel[stage] ?? stage;
