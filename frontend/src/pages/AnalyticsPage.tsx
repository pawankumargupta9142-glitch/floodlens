import { Panel } from '../components/dashboard/Panel';
import { RiskTrend } from '../components/dashboard/RiskTrend';
import { ClockIcon, GridIcon, SatelliteIcon, ShieldIcon } from '../components/icons/Icons';
import { formatPercent, formatShortDate, formatTime, normalizeAlertLevel, tierColor, tierLabel } from '../lib/format';
import type { HistoricalEvent } from '../types/events';
import type { RiskHistoryPoint, RiskSnapshot } from '../types/risk';
import styles from './AnalyticsPage.module.css';

interface AnalyticsPageProps {
  risk: RiskSnapshot | null;
  history: RiskHistoryPoint[];
  events: HistoricalEvent[];
  loading: boolean;
}

export function AnalyticsPage({ risk, history, events, loading }: AnalyticsPageProps) {
  if (loading) {
    return (
      <div className={styles.wrap}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>Model analytics</span>
          <h1 className={styles.heading}>Analytics unavailable</h1>
        </div>
        <div className={styles.skeleton} />
      </div>
    );
  }

  const hasAnalytics = Boolean(risk || history.length > 0 || events.length > 0);

  if (!hasAnalytics) {
    return (
      <div className={styles.wrap}>
        <div className={styles.pageHead}>
          <span className={styles.eyebrow}>Model analytics</span>
          <h1 className={styles.heading}>Analytics unavailable</h1>
          <p className={styles.lede}>No model evaluation data has been provided.</p>
        </div>
        <div className={styles.emptyState}>
          <p>Analytics unavailable</p>
          <span>No model evaluation data has been provided.</span>
        </div>
      </div>
    );
  }

  const latestRisk = history[history.length - 1];
  const latestTier = risk ? normalizeAlertLevel(risk.alert.level) : latestRisk ? normalizeAlertLevel(latestRisk.alertLevel) : null;

  return (
    <div className={styles.wrap}>
      <div className={styles.pageHead}>
        <span className={styles.eyebrow}>Model analytics</span>
        <h1 className={styles.heading}>System performance and risk distribution</h1>
        <p className={styles.lede}>
          Monitoring the current model state, recent predictions, and the available validation record.
        </p>
      </div>

      <div className={styles.grid}>
        <Panel icon={<ShieldIcon />} title="Model performance" subtitle="Current signal quality">
          <div className={styles.metricGrid}>
            <div className={styles.metric}>
              <span>Alert level</span>
              <strong>{risk ? tierLabel(latestTier ?? 'low') : 'Unavailable'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Mean risk</span>
              <strong>{risk ? formatPercent(risk.risk.mean) : 'No prediction available'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Model version</span>
              <strong>{risk?.modelVersion ?? 'No model version reported'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Last successful prediction</span>
              <strong>
                {risk ? `${formatShortDate(risk.predictionTimestamp)} ${formatTime(risk.predictionTimestamp)}` : 'No prediction available'}
              </strong>
            </div>
          </div>
        </Panel>

        <Panel icon={<GridIcon />} title="Data quality" subtitle="Evidence currently available">
          <div className={styles.metricGrid}>
            <div className={styles.metric}>
              <span>Historical observations</span>
              <strong>{history.length}</strong>
            </div>
            <div className={styles.metric}>
              <span>Validated event records</span>
              <strong>{events.length}</strong>
            </div>
            <div className={styles.metric}>
              <span>Spatial coverage</span>
              <strong>{risk ? `${risk.gridShape?.[0] ?? 0} × ${risk.gridShape?.[1] ?? 0}` : 'Unavailable'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Grid resolution</span>
              <strong>{risk ? `${risk.resolutionMeters}m` : 'Unavailable'}</strong>
            </div>
          </div>
        </Panel>

        <Panel icon={<SatelliteIcon />} title="Risk distribution" subtitle="Recent prediction trend">
          <RiskTrend points={history} variant="full" />
        </Panel>

        <Panel icon={<ClockIcon />} title="Regional analysis" subtitle="Active AOI coverage">
          <div className={styles.metricGrid}>
            <div className={styles.metric}>
              <span>Focus region</span>
              <strong>{risk?.regionId ?? 'Unavailable'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Prediction horizon</span>
              <strong>{risk ? `${Math.round(risk.predictionHorizonHours / 24)} days` : 'Not available'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Satellite source</span>
              <strong>{risk?.satellite ?? 'Not reported'}</strong>
            </div>
            <div className={styles.metric}>
              <span>Alert color</span>
              <strong style={latestTier ? { color: tierColor(latestTier) } : undefined}>
                {latestTier ? tierLabel(latestTier) : 'No alert'}
              </strong>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
