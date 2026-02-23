import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getInsights } from '~/lib/api';
import { CONTAINER_TYPES } from '~/lib/beers';
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

function Insights() {
  const { data, isLoading } = useQuery({
    queryKey: ['insights'],
    queryFn: () => getInsights(),
  });

  if (isLoading) {
    return (
      <main className="p-4 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">📊 INSIGHTS</h1>
        <p className="text-zinc-400">Loading...</p>
      </main>
    );
  }

  const dailyData = data?.daily?.map((d) => ({
    day: d.day?.slice(5) || '', // MM-DD format
    count: d.count || 0,
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

  const totals = data?.totals || { total_beers: 0, total_volume: 0, avg_abv: 0 };
  const topBrand = brandsData[0]?.name || 'N/A';

  return (
    <main className="p-4 max-w-lg mx-auto pb-32">
      <h1 className="text-2xl font-bold mb-6">📊 INSIGHTS</h1>

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
                <Bar dataKey="count" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Top Brands</h2>
        <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
          {brandsData.length === 0 ? (
            <p className="text-zinc-400 text-center py-8">No data yet</p>
          ) : (
            <div className="space-y-3">
              {brandsData.slice(0, 5).map((brand, i) => (
                <div key={brand.name} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="flex-1 text-sm">{brand.name}</span>
                  <span className="text-zinc-400 text-sm">{brand.value}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </section>

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

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">All-Time Stats</h2>
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
            <p className="text-3xl font-bold text-green-500">
              {(totals.avg_abv || 0).toFixed(1)}%
            </p>
            <p className="text-sm text-zinc-400">Avg ABV</p>
          </Card>
          <Card className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
            <p className="text-xl font-bold text-green-500 truncate">{topBrand}</p>
            <p className="text-sm text-zinc-400">Top Brand</p>
          </Card>
        </div>
      </section>
    </main>
  );
}
