import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MEXICAN_BEERS, CONTAINER_TYPES, type Beer } from '~/lib/beers';
import { getTodayBeers, logBeer, deleteBeer, type BeerLogEntry } from '~/lib/api';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '~/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

export const Route = createFileRoute('/')({
  component: Home,
});

function Home() {
  const [open, setOpen] = useState(false);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const queryClient = useQueryClient();

  const { data: todayBeers = [], isLoading } = useQuery({
    queryKey: ['todayBeers'],
    queryFn: () => getTodayBeers(),
  });

  const logMutation = useMutation({
    mutationFn: (data: { beer_name: string; brand: string; abv: number; container_type: string; volume_ml: number }) =>
      logBeer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayBeers'] });
      setSelectedBeer(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBeer({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayBeers'] });
    },
  });

  const handleContainerSelect = (container: typeof CONTAINER_TYPES[number]) => {
    if (!selectedBeer) return;
    logMutation.mutate({
      beer_name: selectedBeer.name,
      brand: selectedBeer.brand,
      abv: selectedBeer.abv,
      container_type: container.id,
      volume_ml: container.volume_ml,
    });
  };

  const totalBeers = todayBeers.length;
  const totalVolume = todayBeers.reduce((sum, b) => sum + (b.volume_ml || 0), 0);
  const stdDrinks = todayBeers.reduce((sum, b) => sum + ((b.volume_ml * b.abv * 0.789) / 10000), 0);

  return (
    <main className="p-4 max-w-lg mx-auto">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">🍺 MOGBREW</h1>
        <Badge variant="secondary" className="bg-green-500/20 text-green-500 text-lg px-3 py-1">
          {totalBeers}
        </Badge>
      </header>

      <section className="mb-6">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left h-14 text-lg bg-zinc-900 border-zinc-800"
            >
              {selectedBeer ? (
                <span>{selectedBeer.name}</span>
              ) : (
                <span className="text-zinc-400">Search beers...</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[calc(100vw-2rem)] max-w-lg p-0 bg-zinc-900 border-zinc-800" align="start">
            <Command className="bg-zinc-900">
              <CommandInput placeholder="Search by name or brand..." className="h-12" />
              <CommandList className="max-h-64">
                <CommandEmpty>No beer found.</CommandEmpty>
                <CommandGroup>
                  {MEXICAN_BEERS.map((beer) => (
                    <CommandItem
                      key={beer.name}
                      value={`${beer.name} ${beer.brand}`}
                      onSelect={() => {
                        setSelectedBeer(beer);
                        setOpen(false);
                      }}
                      className="py-3 cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{beer.name}</span>
                        <span className="text-sm text-zinc-400">{beer.brand} - {beer.abv}%</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </section>

      {selectedBeer && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-zinc-300">Select Container</h2>
          <div className="grid grid-cols-2 gap-3">
            {CONTAINER_TYPES.map((container) => (
              <Button
                key={container.id}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center bg-zinc-900 border-zinc-800 hover:bg-green-500/20 hover:border-green-500"
                onClick={() => handleContainerSelect(container)}
                disabled={logMutation.isPending}
              >
                <span className="text-2xl">{container.emoji}</span>
                <span className="text-xs mt-1">{container.label}</span>
              </Button>
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3 text-zinc-300">Today's Beers</h2>
        {isLoading ? (
          <p className="text-zinc-400">Loading...</p>
        ) : todayBeers.length === 0 ? (
          <p className="text-zinc-400">No beers logged today. Time to fix that!</p>
        ) : (
          <div className="space-y-3">
            {todayBeers.map((entry) => {
              const container = CONTAINER_TYPES.find((c) => c.id === entry.container_type);
              const time = new Date(entry.logged_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              return (
                <Card key={entry.id} className="p-4 bg-zinc-900 border-zinc-800 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{container?.emoji || '🍺'}</span>
                      <div>
                        <p className="font-medium">{entry.beer_name}</p>
                        <p className="text-sm text-zinc-400">
                          {container?.label || entry.container_type} - {entry.abv}% - {time}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-zinc-400 hover:text-red-500"
                      onClick={() => deleteMutation.mutate(entry.id)}
                      disabled={deleteMutation.isPending}
                    >
                      ✕
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="fixed bottom-20 left-0 right-0 bg-zinc-950 border-t border-zinc-800 p-4">
        <div className="flex justify-around text-center max-w-lg mx-auto">
          <div>
            <p className="text-2xl font-bold text-green-500">{totalBeers}</p>
            <p className="text-xs text-zinc-400">beers</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{totalVolume}</p>
            <p className="text-xs text-zinc-400">mL</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-500">{stdDrinks.toFixed(1)}</p>
            <p className="text-xs text-zinc-400">std drinks</p>
          </div>
        </div>
      </section>
    </main>
  );
}
