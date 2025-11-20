export const stageLabelToEnum = {
    Prospecting: 'Prospecting',
    Qualification: 'Qualification',
    'Proposal/Price Quote': 'ProposalPriceQuote',
    'Negotiation/Review': 'NegotiationReview',
    'Closed Won': 'ClosedWon',
    'Closed Lost': 'ClosedLost'
};
export const stageEnumToLabel = Object.fromEntries(Object.entries(stageLabelToEnum).map(([label, value]) => [value, label]));
export const presentStage = (stage) => stageEnumToLabel[stage] ?? stage;
