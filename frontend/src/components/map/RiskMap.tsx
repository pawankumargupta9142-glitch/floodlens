import { useMemo, useState } from 'react';
import { CircleMarker, MapContainer, Polygon, TileLayer, Tooltip } from 'react-leaflet';
import type { LatLngBoundsExpression, LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useRiskGrid } from '../../hooks/useRiskGrid';
import { classifyRiskTier, formatPercent, tierColor, tierEmoji, tierLabel, type RiskTier } from '../../lib/format';
import type { RegionInfo } from '../../types/region';
import type { RiskGridCell, RiskSnapshot } from '../../types/risk';
import { GridCellDetail } from './GridCellDetail';
import styles from './RiskMap.module.css';

interface RiskMapProps {
  region: RegionInfo;
  risk: RiskSnapshot | null;
  /** 'compact' fits inline in a dashboard panel; 'full' fills a dedicated map page. */
  variant?: 'compact' | 'full';
}

const TIERS: RiskTier[] = ['low', 'moderate', 'high', 'critical'];

function toLatLngBounds(bounds: { west: number; south: number; east: number; north: number }): LatLngBoundsExpression {
  return [
    [bounds.south, bounds.west],
    [bounds.north, bounds.east],
  ];
}

export function RiskMap({ region, risk, variant = 'compact' }: RiskMapProps) {
  const grid = useRiskGrid(risk?.gridUrl);
  const [selectedCell, setSelectedCell] = useState<RiskGridCell | null>(null);
  const [filter, setFilter] = useState<'all' | RiskTier>('all');
  const aoiPath: LatLngTuple[] = region.geojson.coordinates[0].map(([lon, lat]) => [lat, lon]);
  const overlayBounds = risk?.bounds ? toLatLngBounds(risk.bounds) : null;
  const mapBounds = overlayBounds ?? toLatLngBounds(region.bounds);
  const boundsOptions = overlayBounds ? { padding: [60, 60] as [number, number] } : undefined;

  const counts: Record<RiskTier, number> = { low: 0, moderate: 0, high: 0, critical: 0 };
  grid?.cells.forEach((cell) => {
    counts[classifyRiskTier(cell.value)] += 1;
  });

  const visibleCells = useMemo(
    () => (grid?.cells ?? []).filter((cell) => filter === 'all' || classifyRiskTier(cell.value) === filter),
    [filter, grid],
  );

  return (
    <div className={styles.wrap} data-variant={variant} data-detail-open={selectedCell ? 'true' : 'false'}>
      <div className={styles.filters} aria-label="Risk filters">
        {(['all', ...TIERS] as const).map((tier) => (
          <button
            key={tier}
            type="button"
            className={styles.filterButton}
            data-active={filter === tier}
            onClick={() => setFilter(tier)}
          >
            {tier === 'all' ? 'All' : `${tierEmoji(tier)} ${tierLabel(tier)}`}
            {tier !== 'all' ? ` (${counts[tier]})` : ''}
          </button>
        ))}
      </div>

      <MapContainer bounds={mapBounds} boundsOptions={boundsOptions} scrollWheelZoom={variant === 'full'} className={styles.map}>
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics"
        />
        <Polygon positions={aoiPath} pathOptions={{ color: '#38bdf8', weight: 1.5, fillOpacity: 0.02 }} />
        {visibleCells.map((cell) => {
          const tier = classifyRiskTier(cell.value);
          const isSelected = selectedCell?.lat === cell.lat && selectedCell?.lon === cell.lon;
          return (
            <CircleMarker
              key={`${cell.lat}-${cell.lon}`}
              center={[cell.lat, cell.lon]}
              radius={isSelected ? 11 : 9}
              pathOptions={{
                color: isSelected ? tierColor(tier) : '#f8fafc',
                weight: isSelected ? 2.5 : 1.25,
                fillColor: tierColor(tier),
                fillOpacity: 0.8,
                opacity: 0.95,
              }}
              eventHandlers={{
                click: () => setSelectedCell(isSelected ? null : cell),
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                {tierEmoji(tier)} {formatPercent(cell.value)} flood risk — click for detail
              </Tooltip>
            </CircleMarker>
          );
        })}
      </MapContainer>

      <div className={styles.legend}>
        <span className={styles.legendTitle}>Flood risk</span>
        {TIERS.map((tier) => (
          <span key={tier} className={styles.legendRow}>
            <span className={styles.dot} style={{ background: tierColor(tier) }} />
            {tierEmoji(tier)} {tierLabel(tier)} ({counts[tier]})
          </span>
        ))}
      </div>

      {!grid || visibleCells.length === 0 ? (
        <div className={styles.emptyOverlay}>
          <strong>No spatial prediction available</strong>
          <span>Run the prediction pipeline to generate the current risk grid.</span>
        </div>
      ) : null}

      {selectedCell && risk && (
        <GridCellDetail cell={selectedCell} risk={risk} onClose={() => setSelectedCell(null)} />
      )}
    </div>
  );
}
