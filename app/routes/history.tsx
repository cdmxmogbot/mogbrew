import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHistory, getDayBeers, deleteBeer, type BeerLogEntry } from '~/lib/api';
import { CONTAINER_TYPES } from '~/lib/beers';
import { useUser } from '~/lib/user-context';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/history')({
  component: History,
});

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function DayCard({ day, count, volume, stdDrinks, userId }: {
  day: string;
  count: number;
  volume: number;
  stdDrinks: number;
  userId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  const { data: beers = [], isLoading } = useQuery({
    queryKey: ['dayBeers', userId, day],
    queryFn: () => getDayBeers({ data: { user_id: userId, day } }),
    enabled: expanded,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBeer({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dayBeers', userId, day] });
      queryClient.invalidateQueries({ queryKey: ['history', userId] });
    },
  });

  return (
    <Card className="bg-zinc-900 border-zinc-800 rounded-2xl overflow-hidden">
      <button
        className="w-full p-4 text-left flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div>
          <p className="font-semibold">{formatDate(day)}</p>
          <p className="text-sm text-zinc-400">
            {count} beers | {(volume / 1000).toFixed(1)}L | {stdDrinks.toFixed(1)} std
          </p>
        </div>
        <span className="text-zinc-400 text-xl">{expanded ? '▼' : '▶'}</span>
      </button>

      {expanded && (
        <div className="border-t border-zinc-800 p-4 space-y-3">
          {isLoading ? (
            <p className="text-zinc-400 text-sm">Loading...</p>
          ) : beers.length === 0 ? (
            <p className="text-zinc-400 text-sm">No entries</p>
          ) : (
            beers.map((entry: BeerLogEntry) => {
              const container = CONTAINER_TYPES.find((c) => c.id === entry.container_type);
              const time = new Date(entry.logged_at + 'Z').toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <div key={entry.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{container?.emoji || '🍺'}</span>
                    <div>
                      <p className="font-medium text-sm">{entry.beer_name}</p>
                      <p className="text-xs text-zinc-400">
                        {container?.label || entry.container_type} - {entry.abv}% - {time}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-zinc-400 hover:text-red-500 h-8 w-8 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(entry.id);
                    }}
                    disabled={deleteMutation.isPending}
                  >
                    ✕
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}
    </Card>
  );
}

function History() {
  const { user } = useUser();
  const userId = user?.id || 'ian';

  const { data: history = [], isLoading } = useQuery({
    queryKey: ['history', userId],
    queryFn: () => getHistory({ data: { user_id: userId } }),
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <main className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">📅 History</h1>

      {isLoading ? (
        <p className="text-zinc-400">Loading...</p>
      ) : history.length === 0 ? (
        <Card className="p-8 bg-zinc-900 border-zinc-800 rounded-2xl text-center">
          <p className="text-zinc-400">No history yet. Start logging beers!</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {history.map((day) => (
            <DayCard
              key={day.day}
              day={day.day}
              count={day.count}
              volume={day.volume}
              stdDrinks={day.std_drinks}
              userId={userId}
            />
          ))}
        </div>
      )}
    </main>
  );
}
