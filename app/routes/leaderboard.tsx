import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getLeaderboard } from '~/lib/api';
import { CREW, CREW_COLORS, getCrewMember } from '~/lib/crew';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export const Route = createFileRoute('/leaderboard')({
  component: Leaderboard,
});

const MEDALS = ['🥇', '🥈', '🥉'];

function Leaderboard() {
  const [period, setPeriod] = useState<'week' | 'all'>('week');

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', period],
    queryFn: () => getLeaderboard({ data: { period } }),
  });

  // Build head-to-head chart data (last 7 days)
  const chartData = (() => {
    if (!data?.daily) return [];

    // Get last 7 days
    const today = new Date();
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }

    // Map daily data by user and day
    const dayUserMap = new Map<string, Map<string, number>>();
    data.daily.forEach((d) => {
      if (!dayUserMap.has(d.day)) {
        dayUserMap.set(d.day, new Map());
      }
      dayUserMap.get(d.day)!.set(d.user_id, d.count);
    });

    return days.map((day) => {
      const entry: any = { day: day.slice(5) }; // MM-DD
      CREW.forEach((member) => {
        entry[member.id] = dayUserMap.get(day)?.get(member.id) || 0;
      });
      return entry;
    });
  })();

  // Get top brand per user
  const userTopBrands = (() => {
    if (!data?.brands) return new Map<string, string>();
    const result = new Map<string, { brand: string; count: number }>();

    data.brands.forEach((b) => {
      const existing = result.get(b.user_id);
      if (!existing || b.count > existing.count) {
        result.set(b.user_id, { brand: b.brand, count: b.count });
      }
    });

    return result;
  })();

  const funStats = data?.funStats;

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-6">🏆 Leaderboard</h1>

      {/* Period Toggle */}
      <div className="flex gap-2 mb-6">
        <Button
          variant="outline"
          className={`flex-1 ${period === 'week' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-800'}`}
          onClick={() => setPeriod('week')}
        >
          This Week
        </Button>
        <Button
          variant="outline"
          className={`flex-1 ${period === 'all' ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-800'}`}
          onClick={() => setPeriod('all')}
        >
          All Time
        </Button>
      </div>

      {/* Leaderboard */}
      <section className="mb-8">
        {isLoading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : !data?.totals?.length ? (
          <Card className="p-8 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
            <p className="text-zinc-400">No data yet. Start logging beers!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.totals.map((entry, i) => {
              const member = getCrewMember(entry.user_id);
              if (!member) return null;

              return (
                <Card
                  key={entry.user_id}
                  className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl"
                  style={{ borderLeftColor: CREW_COLORS[member.id], borderLeftWidth: 4 }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MEDALS[i] || `#${i + 1}`}</span>
                    <span className="text-2xl">{member.emoji}</span>
                    <div className="flex-1">
                      <p className="font-semibold">{member.name}</p>
                      <p className="text-sm text-zinc-400">
                        {entry.total_beers} beers | {((entry.total_volume || 0) / 1000).toFixed(1)}L | {(entry.total_std_drinks || 0).toFixed(1)} std
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Head-to-Head Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Head-to-Head (7 Days)</h2>
        <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
          {chartData.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
                {CREW.map((member) => (
                  <Bar
                    key={member.id}
                    dataKey={member.id}
                    name={member.name}
                    fill={CREW_COLORS[member.id]}
                    radius={[2, 2, 0, 0]}
                    stackId="a"
                  />
                ))}
                <Legend
                  wrapperStyle={{ fontSize: 12 }}
                  formatter={(value) => {
                    const member = CREW.find((m) => m.id === value);
                    return member ? `${member.emoji} ${member.name}` : value;
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      {/* Fun Stats */}
      {funStats && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-zinc-300">Fun Stats</h2>
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl space-y-4">
            {funStats.mostBeersDay && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🍺</span>
                <div>
                  <p className="font-medium">Most beers in one day</p>
                  <p className="text-sm text-zinc-400">
                    {getCrewMember(funStats.mostBeersDay.user_id)?.name || funStats.mostBeersDay.user_id} with {funStats.mostBeersDay.count} ({funStats.mostBeersDay.day})
                  </p>
                </div>
              </div>
            )}
            {funStats.caguamaKing && funStats.caguamaKing.count > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">🐢</span>
                <div>
                  <p className="font-medium">Caguama King</p>
                  <p className="text-sm text-zinc-400">
                    {getCrewMember(funStats.caguamaKing.user_id)?.name || funStats.caguamaKing.user_id} ({funStats.caguamaKing.count} caguamas)
                  </p>
                </div>
              </div>
            )}
            {funStats.fortyOzLegend && funStats.fortyOzLegend.count > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-2xl">💀</span>
                <div>
                  <p className="font-medium">40oz Legend</p>
                  <p className="text-sm text-zinc-400">
                    {getCrewMember(funStats.fortyOzLegend.user_id)?.name || funStats.fortyOzLegend.user_id} ({funStats.fortyOzLegend.count} confirmed)
                  </p>
                </div>
              </div>
            )}
          </Card>
        </section>
      )}

      {/* Brand Battle */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Favorite Brands</h2>
        <div className="grid grid-cols-1 gap-3">
          {CREW.map((member) => {
            const topBrand = userTopBrands.get(member.id);
            return (
              <Card
                key={member.id}
                className="p-3 bg-zinc-900 border-zinc-800 rounded-xl flex items-center gap-3"
                style={{ borderLeftColor: CREW_COLORS[member.id], borderLeftWidth: 3 }}
              >
                <span className="text-xl">{member.emoji}</span>
                <span className="font-medium">{member.name}</span>
                <span className="text-zinc-400 ml-auto">
                  {topBrand ? `${topBrand.brand} (${topBrand.count})` : 'No data'}
                </span>
              </Card>
            );
          })}
        </div>
      </section>
    </main>
  );
}
