import React, { useEffect, useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subscribeBookings } from '../services/firebaseService';
import type { Booking } from '../types';

type RangeMode = 'all' | 'range';
type MetricMode = 'total' | 'perNight';

export const StatsView: React.FC = () => {
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [mode, setMode] = useState<RangeMode>('all');
  const [metric, setMetric] = useState<MetricMode>('total');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const unsub = subscribeBookings((bookings) => {
      setAllBookings(bookings.filter(b => b.status !== 'cancelled'));
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    if (mode === 'all') return allBookings;
    return allBookings.filter(b => {
      if (startDate && b.date < startDate) return false;
      if (endDate && b.date > endDate) return false;
      return true;
    });
  }, [allBookings, mode, startDate, endDate]);

  const uniqueNights = useMemo(() => {
    const dates = new Set(filtered.map(b => b.date));
    return dates.size;
  }, [filtered]);

  const { data, totalGames } = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(b => {
      const game = b.gameSystem.trim();
      counts[game] = (counts[game] || 0) + 1;
    });
    const divisor = metric === 'perNight' && uniqueNights > 0 ? uniqueNights : 1;
    const chartData = Object.entries(counts)
      .map(([name, count]) => ({ name, count: Math.round((count / divisor) * 100) / 100 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return { data: chartData, totalGames: filtered.length };
  }, [filtered, metric, uniqueNights]);

  const COLORS = ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03', '#57534e'];

  return (
    <div className="space-y-6">
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-500 mb-1">Club Intelligence</h2>
            <p className="text-neutral-400 text-sm mb-6">Historical data analysis of game systems played.</p>

            {/* Date range controls */}
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

            <div className="space-y-6">
                <div className="h-96">
                     <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={120} tick={{fill: '#a3a3a3', fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: '#262626', border: '1px solid #404040', color: '#fff' }} itemStyle={{ color: '#fbbf24' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                {data.map((_, index) => ( <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} /> ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 flex items-center justify-center gap-6">
                    <div className="flex items-center">
                        <span className="text-4xl font-bold text-white">{totalGames}</span>
                        <span className="text-neutral-500 ml-3">Total Games Logged{mode === 'range' && startDate && endDate ? ` (${startDate} – ${endDate})` : ''}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-4xl font-bold text-white">{uniqueNights}</span>
                        <span className="text-neutral-500 ml-3">Game Night{uniqueNights !== 1 ? 's' : ''}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};