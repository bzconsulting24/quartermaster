import type { DragEvent } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { COLORS, PIPELINE_STAGES, formatCurrency, formatDisplayDate } from '../data/uiConstants';
import type { Opportunity, StageId } from '../types';

type BZPipelineProps = {
  opportunities: Opportunity[];
  onDragStart: (event: DragEvent<HTMLDivElement>, opportunity: Opportunity) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>, newStage: StageId) => void;
  onOpportunityClick: (opportunity: Opportunity) => void;
};

const BZPipeline = ({ opportunities, onDragStart, onDragOver, onDrop, onOpportunityClick }: BZPipelineProps) => (
  <div style={{ padding: '16px' }}>
    <div style={{ marginBottom: '16px' }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: COLORS.navyDark, marginBottom: '8px' }}>Sales Pipeline</h2>
      <div style={{ display: 'flex', gap: '8px', fontSize: '14px', color: '#6B7280' }}>
        <span>Total Pipeline: <strong style={{ color: COLORS.navyDark }}>{formatCurrency(opportunities.reduce((sum, o) => sum + o.amount, 0))}</strong></span>
        <span>•</span>
        <span>Total Opportunities: <strong style={{ color: COLORS.navyDark }}>{opportunities.length}</strong></span>
      </div>
    </div>

    <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px' }}>
      {PIPELINE_STAGES.map((stage) => {
        const stageOpps = opportunities.filter(o => o.stage === stage.id);
        const stageTotal = stageOpps.reduce((sum, o) => sum + o.amount, 0);

        return (
          <div key={stage.id} style={{ flexShrink: 0, width: '288px' }}>
            <div style={{
              background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navyLight} 100%)`,
              borderRadius: '8px 8px 0 0',
              border: `2px solid ${COLORS.navyDark}`,
              borderBottom: 'none'
            }}>
              <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: stage.color, border: '2px solid white' }}></div>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>{stage.name}</span>
                </div>
                <span style={{ background: COLORS.gold, color: COLORS.navyDark, padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{stageOpps.length}</span>
              </div>
              <div style={{ padding: '0 12px 12px', fontSize: '12px', color: COLORS.gold, fontWeight: '600' }}>
                {formatCurrency(stageTotal)}
              </div>
            </div>

            <div
              onDragOver={onDragOver}
              onDrop={(event) => onDrop(event, stage.id)}
              style={{
                background: '#F9FAFB',
                border: `2px solid ${COLORS.navyDark}`,
                borderTop: 'none',
                borderRadius: '0 0 8px 8px',
                minHeight: '500px',
                padding: '8px'
              }}
            >
              {stageOpps.map((opp) => (
                <div
                  key={opp.id}
                  draggable
                  onDragStart={(event) => onDragStart(event, opp)}
                  onClick={() => onOpportunityClick(opp)}
                  style={{
                    background: 'white',
                    border: '2px solid #E5E7EB',
                    borderRadius: '6px',
                    padding: '12px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(event) => event.currentTarget.style.borderColor = COLORS.gold}
                  onMouseLeave={(event) => event.currentTarget.style.borderColor = '#E5E7EB'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <div style={{ color: COLORS.navyDark, fontSize: '14px', fontWeight: '600', flex: 1 }}>
                      {opp.name}
                    </div>
                    <button onClick={(e)=>{ e.stopPropagation(); onOpportunityClick(opp); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <MoreHorizontal size={16} color="#6B7280" />
                    </button>
                  </div>

                  <div style={{ fontSize: '12px', color: '#6B7280', marginBottom: '8px' }}>
                    {opp.account?.name ?? 'Unassigned'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px', fontWeight: 'bold', color: COLORS.navyDark }}>
                      {formatCurrency(opp.amount)}
                    </span>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>{formatDisplayDate(opp.closeDate)}</span>
                  </div>

                  <div style={{ paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', marginBottom: '4px' }}>
                      <span style={{ color: '#6B7280' }}>{opp.owner}</span>
                      <span style={{ fontWeight: '600', color: COLORS.navyDark }}>{opp.probability}%</span>
                    </div>
                    <div style={{ height: '6px', background: '#E5E7EB', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${opp.probability}%`,
                        background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`
                      }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

export default BZPipeline;

