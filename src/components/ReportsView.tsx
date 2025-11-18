import { useEffect, useMemo, useState } from 'react';
import { COLORS, formatCurrency } from '../data/uiConstants';
import type { StageId } from '../types';

type ReportSummary = {
  totalPipeline: number;
  wonThisMonth: number;
  winRate: number;
  averageDealSize: number;
};

type StageMetric = {
  stage: StageId;
  count: number;
  amount: number;
};

const defaultSummary: ReportSummary = {
  totalPipeline: 0,
  wonThisMonth: 0,
  winRate: 0,
  averageDealSize: 0
};

const ReportsView = () => {
  const [summary, setSummary] = useState<ReportSummary>(defaultSummary);
  const [stageMetrics, setStageMetrics] = useState<StageMetric[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/reports');
        if (!response.ok) {
          throw new Error('Unable to load reports data');
        }
        const data = await response.json();
        setSummary(data.summary ?? defaultSummary);
        setStageMetrics(data.stageBreakdown ?? []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const stagePercentages = useMemo(() => {
    const total = stageMetrics.reduce((sum, stage) => sum + stage.count, 0);
    return stageMetrics.map((stage) => ({
      ...stage,
      percentage: total > 0 ? Math.round((stage.count / total) * 100) : 0
    }));
  }, [stageMetrics]);

  return (
    <div style={{ padding: '24px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '24px' }}>Reports & Analytics</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Pipeline', value: formatCurrency(summary.totalPipeline) },
          { label: 'Won This Month', value: formatCurrency(summary.wonThisMonth) },
          { label: 'Win Rate', value: `${summary.winRate}%` },
          { label: 'Avg Deal Size', value: formatCurrency(summary.averageDealSize) },
        ].map((stat, idx) => (
          <div key={idx} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            border: `2px solid ${COLORS.gold}`
          }}>
            <div style={{ fontSize: '14px', color: '#6B7280', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 'bold', color: COLORS.navyDark, marginBottom: '4px' }}>
              {loading ? '—' : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: COLORS.navyDark }}>Sales Funnel</h3>
        {stagePercentages.map((stage) => (
          <div key={stage.stage} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span style={{ fontWeight: '500' }}>{stage.stage}</span>
              <span style={{ color: '#6B7280' }}>{stage.percentage}% • {formatCurrency(stage.amount)}</span>
            </div>
            <div style={{ height: '24px', background: '#E5E7EB', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${stage.percentage}%`,
                background: `linear-gradient(90deg, ${COLORS.gold} 0%, ${COLORS.goldDark} 100%)`,
                transition: 'width 0.3s'
              }}></div>
            </div>
          </div>
        ))}
        {!loading && stagePercentages.length === 0 && (
          <div style={{ color: '#6B7280' }}>No stage performance data yet.</div>
        )}
      </div>
    </div>
  );
};

export default ReportsView;
