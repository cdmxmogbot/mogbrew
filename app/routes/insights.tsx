import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getInsights } from '~/lib/api';
import { CONTAINER_TYPES } from '~/lib/beers';
import { useUser } from '~/lib/user-context';
import { Card } from '~/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const Route = createFileRoute('/insights')({
  component: Insights,
});

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function getHeatmapColor(stdDrinks: number): string {
  if (stdDrinks === 0) return 'bg-zinc-800';
  if (stdDrinks < 2) return 'bg-green-900';
  if (stdDrinks < 3) return 'bg-green-700';
  if (stdDrinks < 4) return 'bg-green-500';
  if (stdDrinks < 5) return 'bg-yellow-500';
  if (stdDrinks < 6) return 'bg-orange-500';
  return 'bg-red-500';
}

function getBarColor(stdDrinks: number): string {
  if (stdDrinks < 2) return '#22c55e'; // green
  if (stdDrinks < 4) return '#eab308'; // yellow
  return '#ef4444'; // red
}

function Heatmap({ data }: { data: { day: string; std_drinks: number }[] }) {
  // Create a map of day -> std_drinks
  const dayMap = new Map(data.map((d) => [d.day, d.std_drinks]));

  // Generate 91 days (13 weeks)
  const today = new Date();
  const days: { date: Date; drinks: number }[] = [];

  for (let i = 90; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: d, drinks: dayMap.get(dateStr) || 0 });
  }

  // Organize into weeks (7 cols x 13 rows for portrait)
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-1 text-xs text-zinc-500 mb-1">
        <span className="w-4">S</span>
        <span className="w-4">M</span>
        <span className="w-4">T</span>
        <span className="w-4">W</span>
        <span className="w-4">T</span>
        <span className="w-4">F</span>
        <span className="w-4">S</span>
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="flex gap-1">
          {week.map((day, di) => (
            <div
              key={di}
              className={`w-4 h-4 rounded-sm ${getHeatmapColor(day.drinks)}`}
              title={`${day.date.toLocaleDateString()}: ${day.drinks.toFixed(1)} std drinks`}
            />
          ))}
          {/* Fill remaining cells if week is incomplete */}
          {week.length < 7 && Array.from({ length: 7 - week.length }).map((_, i) => (
            <div key={`empty-${i}`} className="w-4 h-4" />
          ))}
        </div>
      ))}
      <div className="flex items-center gap-2 mt-2 text-xs text-zinc-400">
        <span>Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-zinc-800" />
          <div className="w-3 h-3 rounded-sm bg-green-900" />
          <div className="w-3 h-3 rounded-sm bg-green-700" />
          <div className="w-3 h-3 rounded-sm bg-green-500" />
          <div className="w-3 h-3 rounded-sm bg-yellow-500" />
          <div className="w-3 h-3 rounded-sm bg-orange-500" />
          <div className="w-3 h-3 rounded-sm bg-red-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

function Insights() {
  const { user } = useUser();
  const userId = user?.id || 'ian';

  const { data, isLoading } = useQuery({
    queryKey: ['insights', userId],
    queryFn: () => getInsights({ data: { user_id: userId } }),
    enabled: !!user,
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <main className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">📊 Insights</h1>
        <p className="text-zinc-400">Loading...</p>
      </main>
    );
  }

  const dailyData = data?.daily?.map((d) => ({
    day: d.day?.slice(5) || '',
    count: d.count || 0,
    stdDrinks: d.std_drinks || 0,
    fill: getBarColor(d.std_drinks || 0),
  })) || [];

  const brandsData = data?.brands?.map((b) => ({
    name: b.brand || 'Unknown',
    value: b.count || 0,
  })) || [];

  const containersData = data?.containers?.map((c) => {
    const container = CONTAINER_TYPES.find((ct) => ct.id === c.container_type);
    return {
      name: container?.emoji || '🍺',
      label: container?.label || c.container_type,
      value: c.count || 0,
    };
  }) || [];

  const totals = data?.totals || { total_beers: 0, total_volume: 0, avg_abv: 0, total_std_drinks: 0, avg_per_day: 0, days_tracked: 0 };
  const heatmapData = data?.heatmap || [];
  const personalBests = data?.personalBests;

  return (
    <main className="p-4 max-w-lg mx-auto pb-24">
      <h1 className="text-2xl font-bold mb-6">📊 Insights</h1>

      {/* Header Stats */}
      <section className="mb-8">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
            <p className="text-3xl font-bold text-green-500">{totals.total_beers || 0}</p>
            <p className="text-sm text-zinc-400">Total Beers</p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
            <p className="text-3xl font-bold text-green-500">
              {((totals.total_volume || 0) / 1000).toFixed(1)}L
            </p>
            <p className="text-sm text-zinc-400">Total Volume</p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
            <p className="text-3xl font-bold text-green-500">{(totals.avg_per_day || 0).toFixed(1)}</p>
            <p className="text-sm text-zinc-400">Avg Std/Day</p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
            <p className="text-3xl font-bold text-green-500">{totals.days_tracked || 0}</p>
            <p className="text-sm text-zinc-400">Days Tracked</p>
          </Card>
        </div>
      </section>

      {/* 14-Day Chart */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Last 14 Days</h2>
        <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
          {dailyData.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyData}>
                <XAxis dataKey="day" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} allowDecimals={false} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      {/* Heatmap */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">90-Day Activity</h2>
        <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
          <Heatmap data={heatmapData} />
        </Card>
      </section>

      {/* Personal Bests */}
      {personalBests && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-zinc-300">Personal Bests</h2>
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Most beers in a day</span>
                <span className="font-semibold text-green-500">{personalBests.count} beers</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Heaviest day (std drinks)</span>
                <span className="font-semibold text-green-500">{(personalBests.std_drinks || 0).toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Date</span>
                <span className="text-zinc-300">{personalBests.day}</span>
              </div>
            </div>
          </Card>
        </section>
      )}

      {/* Top Brands */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Top 5 Brands</h2>
        <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
          {brandsData.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {brandsData.slice(0, 5).map((brand, i) => {
                const maxCount = brandsData[0]?.value || 1;
                const width = Math.max((brand.value / maxCount) * 100, 10);
                return (
                  <div key={brand.name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{brand.name}</span>
                      <span className="text-zinc-400">{brand.value}</span>
                    </div>
                    <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${width}%`,
                          backgroundColor: COLORS[i % COLORS.length],
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </section>

      {/* Container Types */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Container Types</h2>
        <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
          {containersData.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <div className="flex items-center justify-center">
              <ResponsiveContainer width={200} height={200}>
                <PieChart>
                  <Pie
                    data={containersData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {containersData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {containersData.map((c, i) => (
                  <div key={c.label} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span>{c.name}</span>
                    <span className="text-zinc-400">{c.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
