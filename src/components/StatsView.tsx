import React, { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subscribeBookings, subscribeTerrainBoxes } from '../services/firebaseService';
import * as firebaseService from '../services/firebaseService';
import type { Booking, TerrainBox, User } from '../types';
import {
  getGameSystemSuggestion,
  getMatchTypeLabel,
  type GameSystemSuggestion,
} from '../utils/gameSystemSuggestions';

type RangeMode = 'all' | 'range';
type MetricMode = 'total' | 'perNight';

type ChartDatum = {
  name: string;
  count: number;
  displayName?: string;
};

type SectionFiltersProps = {
  mode: RangeMode;
  setMode: (mode: RangeMode) => void;
  metric: MetricMode;
  setMetric: (metric: MetricMode) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  selectedGameSystem?: string;
  setSelectedGameSystem?: (value: string) => void;
  gameSystemOptions?: string[];
};

const COLORS = ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03', '#57534e'];

const normalizeText = (value: string) => value.trim().toLowerCase();
const isVisibleGameSystem = (value: string) => {
  const normalized = normalizeText(value);
  return Boolean(normalized) && normalized !== 'unavailable' && normalized !== 'not available';
};

const getChartHeight = (itemCount: number) => Math.max(240, itemCount * 32 + 24);

const getAxisWidth = (items: ChartDatum[]) => {
  const longestLabel = items.reduce((max, item) => Math.max(max, (item.displayName ?? item.name).length), 0);
  return Math.min(380, Math.max(180, longestLabel * 8));
};

const SectionFilters: React.FC<SectionFiltersProps> = ({
  mode,
  setMode,
  metric,
  setMetric,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  selectedGameSystem,
  setSelectedGameSystem,
  gameSystemOptions,
}) => (
  <div className="flex flex-wrap items-center gap-3 mb-6">
    <button
      onClick={() => setMode('all')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        mode === 'all'
          ? 'bg-amber-600 text-white'
          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
      }`}
    >
      All Time
    </button>
    <button
      onClick={() => setMode('range')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        mode === 'range'
          ? 'bg-amber-600 text-white'
          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
      }`}
    >
      Date Range
    </button>
    <div className="w-px h-6 bg-neutral-600" />
    <button
      onClick={() => setMetric('total')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        metric === 'total'
          ? 'bg-amber-600 text-white'
          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
      }`}
    >
      Total Games
    </button>
    <button
      onClick={() => setMetric('perNight')}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        metric === 'perNight'
          ? 'bg-amber-600 text-white'
          : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
      }`}
    >
      Games Per Night
    </button>
    {selectedGameSystem !== undefined && setSelectedGameSystem && gameSystemOptions && (
      <div className="min-w-[14rem] flex-1 md:flex-none">
        <select
          value={selectedGameSystem}
          onChange={(e) => setSelectedGameSystem(e.target.value)}
          className="w-full bg-neutral-700 border border-neutral-600 text-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        >
          <option value="all">All game systems</option>
          {gameSystemOptions.map(gameSystem => (
            <option key={gameSystem} value={gameSystem}>
              {gameSystem}
            </option>
          ))}
        </select>
      </div>
    )}
    {mode === 'range' && (
      <div className="flex items-center gap-2 ml-2">
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="bg-neutral-700 border border-neutral-600 text-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
        <span className="text-neutral-500">to</span>
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="bg-neutral-700 border border-neutral-600 text-neutral-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
      </div>
    )}
  </div>
);

interface SummaryChartProps {
  data: ChartDatum[];
  emptyMessage: string;
  onDatumClick?: (datum: ChartDatum) => void;
}

const SummaryChart: React.FC<SummaryChartProps> = ({ data, emptyMessage, onDatumClick }) => {
  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center rounded-lg border border-neutral-700 bg-neutral-900/50 text-neutral-500">
        {emptyMessage}
      </div>
    );
  }

  const chartHeight = getChartHeight(data.length);
  const axisWidth = getAxisWidth(data);

  const Tick = ({ x, y, payload }: { x?: number; y?: number; payload?: { value?: string } }) => {
    const label = payload?.value ?? '';
    const datum = data.find(item => item.name === label);
    if (!datum) return null;
    const displayLabel = datum.displayName ?? datum.name;

    const isClickable = Boolean(onDatumClick);
    const handleTickClick = () => {
      if (onDatumClick) {
        onDatumClick(datum);
      }
    };
    const handleTickKeyDown = (e: React.KeyboardEvent<SVGGElement>) => {
      if (!onDatumClick) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDatumClick(datum);
      }
    };

    return (
      <g
        transform={`translate(${x ?? 0},${y ?? 0})`}
        className={isClickable ? 'cursor-pointer group' : undefined}
        role={isClickable ? 'button' : undefined}
        tabIndex={isClickable ? 0 : undefined}
        onClick={isClickable ? handleTickClick : undefined}
        onKeyDown={isClickable ? handleTickKeyDown : undefined}
      >
        <text
          x={-8}
          y={0}
          dy={4}
          textAnchor="end"
          fill={isClickable ? '#d4d4d4' : '#a3a3a3'}
          className={`text-[12px] transition-colors ${isClickable ? 'group-hover:fill-amber-400 group-focus-visible:fill-amber-400' : ''}`}
        >
          {displayLabel}
        </text>
      </g>
    );
  };

  return (
    <div style={{ height: chartHeight }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={axisWidth}
            tick={<Tick />}
          />
          <Tooltip
            contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', color: '#fff' }}
            itemStyle={{ color: '#fbbf24' }}
            formatter={(value: number) => [value.toLocaleString(undefined, { maximumFractionDigits: 2 }), 'Count']}
            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const formatNumber = (value: number) => value.toLocaleString(undefined, { maximumFractionDigits: 2 });

type RenameGameSystemModalProps = {
  currentName: string;
  suggestion?: GameSystemSuggestion | null;
  onClose: () => void;
  onSave: (nextName: string) => Promise<void>;
};

const RenameGameSystemModal: React.FC<RenameGameSystemModalProps> = ({ currentName, suggestion, onClose, onSave }) => {
  const [value, setValue] = useState(currentName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setValue(currentName);
    setError('');
    setSaving(false);
  }, [currentName]);

  const handleSave = async () => {
    const nextName = value.trim();
    if (!nextName || nextName === currentName) return;

    setSaving(true);
    setError('');
    try {
      await onSave(nextName);
      onClose();
    } catch (err) {
      console.error('Failed to rename game system:', err);
      setError(err instanceof Error ? err.message : 'Failed to rename game system.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-neutral-700 bg-neutral-800 shadow-2xl shadow-black/50 overflow-hidden">
        <div className="p-6 border-b border-neutral-700">
          <h3 className="text-xl font-bold text-white">Rename Game System</h3>
          <p className="text-sm text-neutral-400 mt-1">Rename "{currentName}" for all existing bookings.</p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
              Game system name
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  void handleSave();
                } else if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
          </div>
          {suggestion && (
            <div className="rounded-lg border border-amber-700/40 bg-amber-950/20 p-4">
              <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">Suggested match</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-white">{suggestion.name}</div>
                  <div className="text-xs text-neutral-400">
                    {suggestion.count} bookings · {getMatchTypeLabel(suggestion.matchType)}
                    {suggestion.distance !== undefined ? ` · distance ${suggestion.distance}` : ''}
                  </div>
                </div>
                <button
                  onClick={() => setValue(suggestion.name)}
                  className="text-xs bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 rounded-lg font-medium"
                >
                  Use suggestion
                </button>
              </div>
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-900/50 bg-red-950/30 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
        <div className="p-6 pt-0 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-neutral-700 text-neutral-200 hover:bg-neutral-600 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving || !value.trim() || value.trim() === currentName}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-sm font-semibold"
          >
            {saving ? 'Saving...' : 'Rename'}
          </button>
        </div>
      </div>
    </div>
  );
};

type StatsViewProps = {
  currentUser?: User | null;
};

export const StatsView: React.FC<StatsViewProps> = ({ currentUser }) => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [terrainBoxes, setTerrainBoxes] = useState<TerrainBox[]>([]);
  const [gameMode, setGameMode] = useState<RangeMode>('all');
  const [gameMetric, setGameMetric] = useState<MetricMode>('total');
  const [gameStartDate, setGameStartDate] = useState('');
  const [gameEndDate, setGameEndDate] = useState('');
  const [terrainMode, setTerrainMode] = useState<RangeMode>('all');
  const [terrainMetric, setTerrainMetric] = useState<MetricMode>('total');
  const [terrainSelectedGameSystem, setTerrainSelectedGameSystem] = useState('all');
  const [terrainStartDate, setTerrainStartDate] = useState('');
  const [terrainEndDate, setTerrainEndDate] = useState('');
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const canRenameGameSystems = Boolean(currentUser?.isAdmin || import.meta.env.DEV);

  useEffect(() => {
    const unsubBookings = subscribeBookings((bookings) => {
      setAllBookings(bookings.filter(b => b.status !== 'cancelled'));
    });
    const unsubTerrainBoxes = subscribeTerrainBoxes(setTerrainBoxes);

    return () => {
      unsubBookings();
      unsubTerrainBoxes();
    };
  }, []);

  const gameSystemOptions = useMemo(() => {
    const options = Array.from(
      new Set(
        allBookings
          .map(b => b.gameSystem.trim())
          .filter(isVisibleGameSystem)
      )
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

    return options;
  }, [allBookings]);

  useEffect(() => {
    if (terrainSelectedGameSystem !== 'all' && !gameSystemOptions.some(option => normalizeText(option) === normalizeText(terrainSelectedGameSystem))) {
      setTerrainSelectedGameSystem('all');
    }
  }, [gameSystemOptions, terrainSelectedGameSystem]);

  const gameDateFilteredBookings = useMemo(() => {
    if (gameMode === 'all') return allBookings;
    return allBookings.filter(b => {
      if (gameStartDate && b.date < gameStartDate) return false;
      if (gameEndDate && b.date > gameEndDate) return false;
      return true;
    });
  }, [allBookings, gameEndDate, gameMode, gameStartDate]);

  const terrainDateFilteredBookings = useMemo(() => {
    if (terrainMode === 'all') return allBookings;
    return allBookings.filter(b => {
      if (terrainStartDate && b.date < terrainStartDate) return false;
      if (terrainEndDate && b.date > terrainEndDate) return false;
      return true;
    });
  }, [allBookings, terrainEndDate, terrainMode, terrainStartDate]);

  const terrainFilteredBookings = useMemo(() => {
    if (terrainSelectedGameSystem === 'all') return terrainDateFilteredBookings;
    const selected = normalizeText(terrainSelectedGameSystem);
    return terrainDateFilteredBookings.filter(b => normalizeText(b.gameSystem) === selected);
  }, [terrainDateFilteredBookings, terrainSelectedGameSystem]);

  const terrainById = useMemo(() => {
    return new Map(terrainBoxes.map(box => [box.id, box.name]));
  }, [terrainBoxes]);

  const activeTerrainById = useMemo(() => {
    return new Map(terrainBoxes.filter(box => !box.disabled).map(box => [box.id, box.name]));
  }, [terrainBoxes]);

  const gameUniqueNights = useMemo(() => {
    return new Set(gameDateFilteredBookings.map(b => b.date)).size;
  }, [gameDateFilteredBookings]);

  const terrainUniqueNights = useMemo(() => {
    return new Set(terrainFilteredBookings.map(b => b.date)).size;
  }, [terrainFilteredBookings]);

  const gameStatsData = useMemo(() => {
    const counts: Record<string, number> = {};
    gameDateFilteredBookings.forEach(b => {
      const game = b.gameSystem;
      if (!isVisibleGameSystem(game)) return;
      counts[game] = (counts[game] || 0) + 1;
    });

    const divisor = gameMetric === 'perNight' && gameUniqueNights > 0 ? gameUniqueNights : 1;

    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        displayName: name.trim(),
        count: Math.round((count / divisor) * 100) / 100,
      }))
      .sort((a, b) => b.count - a.count);
  }, [gameDateFilteredBookings, gameMetric, gameUniqueNights]);

  const gameSystemCounts = useMemo(() => {
    const counts = new Map<string, number>();
    gameDateFilteredBookings.forEach(b => {
      const game = b.gameSystem;
      if (!isVisibleGameSystem(game)) return;
      counts.set(game, (counts.get(game) ?? 0) + 1);
    });
    return counts;
  }, [gameDateFilteredBookings]);

  const renameSuggestion = useMemo(() => {
    if (!renameTarget) return null;
    return getGameSystemSuggestion(renameTarget, gameSystemCounts);
  }, [gameSystemCounts, renameTarget]);

  const handleRenameGameSystem = async (nextName: string) => {
    if (!renameTarget) return;
    await firebaseService.renameGameSystem(renameTarget, nextName);
    const oldName = renameTarget;
    const normalizedNextName = nextName.trim();
    setAllBookings(prev => prev.map(booking => (
      booking.gameSystem === oldName
        ? { ...booking, gameSystem: normalizedNextName }
        : booking
    )));
  };

  const openRenameModal = (gameSystem: string) => {
    if (!canRenameGameSystems) return;
    setRenameTarget(gameSystem);
  };

  const terrainStats = useMemo(() => {
    const counts: Record<string, number> = {};
    let noTerrainCount = 0;
    const terrainNameById = terrainMode === 'all' ? activeTerrainById : terrainById;

    terrainFilteredBookings.forEach(b => {
      const terrainIds = [b.terrainBoxId, b.secondaryTerrainId].filter((id): id is string => Boolean(id));

      if (terrainIds.length === 0) {
        noTerrainCount += 1;
        return;
      }

      terrainIds.forEach(id => {
        const terrainName = terrainNameById.get(id);
        if (!terrainName) return;
        counts[terrainName] = (counts[terrainName] || 0) + 1;
      });
    });

    const divisor = terrainMetric === 'perNight' && terrainUniqueNights > 0 ? terrainUniqueNights : 1;

    return {
      data: Object.entries(counts)
        .map(([name, count]) => ({
          name,
          count: Math.round((count / divisor) * 100) / 100,
        }))
        .sort((a, b) => b.count - a.count),
      noTerrainCount,
    };
  }, [activeTerrainById, terrainById, terrainFilteredBookings, terrainMetric, terrainMode, terrainUniqueNights]);

  const totalGames = gameDateFilteredBookings.length;
  const terrainTotalSelections = terrainStats.data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="space-y-6">
      <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-2xl font-bold text-amber-500 mb-1">Game Stats</h2>
        <p className="text-neutral-400 text-sm mb-6">Historical data analysis of games and terrain selected by members.</p>

        <div className="space-y-6">
          <div className="space-y-4">
            <SectionFilters
              mode={gameMode}
              setMode={setGameMode}
              metric={gameMetric}
              setMetric={setGameMetric}
              startDate={gameStartDate}
              setStartDate={setGameStartDate}
              endDate={gameEndDate}
              setEndDate={setGameEndDate}
            />
            <SummaryChart
              data={gameStatsData}
              emptyMessage="No games found for the selected filters."
              onDatumClick={canRenameGameSystems ? (datum) => openRenameModal(datum.name) : undefined}
            />
            {canRenameGameSystems && (
              <p className="text-xs text-neutral-500">
                Admins can click a game system name to rename it.
              </p>
            )}
            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 flex items-center justify-center gap-6 flex-wrap">
              <div className="flex items-center">
                <span className="text-4xl font-bold text-white">{formatNumber(totalGames)}</span>
                <span className="text-neutral-500 ml-3">
                  Total Games Logged{gameMode === 'range' && gameStartDate && gameEndDate ? ` (${gameStartDate} - ${gameEndDate})` : ''}
                </span>
              </div>
              <div className="flex items-center">
                <span className="text-4xl font-bold text-white">{formatNumber(gameUniqueNights)}</span>
                <span className="text-neutral-500 ml-3">
                  Game Night{gameUniqueNights !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl">
            <h3 className="text-xl font-bold text-amber-500 mb-1">Terrain Stats</h3>
            <p className="text-neutral-400 text-sm mb-6">
              Breakdown of terrain set usage for the filters in this section, grouped by terrain set.
            </p>
            <SectionFilters
              mode={terrainMode}
              setMode={setTerrainMode}
              metric={terrainMetric}
              setMetric={setTerrainMetric}
              startDate={terrainStartDate}
              setStartDate={setTerrainStartDate}
              endDate={terrainEndDate}
              setEndDate={setTerrainEndDate}
              selectedGameSystem={terrainSelectedGameSystem}
              setSelectedGameSystem={setTerrainSelectedGameSystem}
              gameSystemOptions={gameSystemOptions}
            />
            <SummaryChart
              data={terrainStats.data}
              emptyMessage="No terrain selections found for the selected filters."
            />
            <div className="mt-4 bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 text-neutral-400 text-sm">
              <span className="text-white font-medium">{formatNumber(terrainStats.noTerrainCount)}</span>{' '}
              table booking{terrainStats.noTerrainCount === 1 ? '' : 's'} had no terrain selected for the current filters.
              {terrainTotalSelections > 0 && terrainMetric === 'perNight' && (
                <span className="block mt-1 text-neutral-500">
                  Counts are shown as average terrain selections per night.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      {renameTarget && canRenameGameSystems && (
        <RenameGameSystemModal
          currentName={renameTarget}
          suggestion={renameSuggestion}
          onClose={() => setRenameTarget(null)}
          onSave={handleRenameGameSystem}
        />
      )}
    </div>
  );
};
