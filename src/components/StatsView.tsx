import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { subscribeBookings } from '../services/firebaseService';

export const StatsView: React.FC = () => {
  const [data, setData] = useState<{name: string, count: number}[]>([]);
  const [totalGames, setTotalGames] = useState(0);

  useEffect(() => {
    const unsub = subscribeBookings((bookings) => {
      const active = bookings.filter(b => b.status !== 'cancelled');
      setTotalGames(active.length);
      const counts: Record<string, number> = {};
      active.forEach(b => {
        const game = b.gameSystem.trim();
        counts[game] = (counts[game] || 0) + 1;
      });
      const chartData = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      setData(chartData);
    });
    return () => unsub();
  }, []);

  const COLORS = ['#d97706', '#b45309', '#92400e', '#78350f', '#451a03', '#57534e'];

  return (
    <div className="space-y-6">
        <div className="bg-neutral-800 rounded-xl p-6 border border-neutral-700 shadow-xl">
            <h2 className="text-2xl font-bold text-amber-500 mb-1">Club Intelligence</h2>
            <p className="text-neutral-400 text-sm mb-6">Historical data analysis of game systems played.</p>
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
                <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 flex items-center justify-center">
                    <span className="text-4xl font-bold text-white">{totalGames}</span>
                    <span className="text-neutral-500 ml-3">Total Games Logged</span>
                </div>
            </div>
        </div>
    </div>
  );
};