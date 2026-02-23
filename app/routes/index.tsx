import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MEXICAN_BEERS, CONTAINER_TYPES, type Beer } from '~/lib/beers';
import { getTodayBeers, logBeer, deleteBeer, getRecentBeers, type BeerLogEntry } from '~/lib/api';
import { useUser } from '~/lib/user-context';
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
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [selectedBeer, setSelectedBeer] = useState<Beer | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<typeof CONTAINER_TYPES[number] | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const queryClient = useQueryClient();

  const userId = user?.id || 'ian';

  const { data: todayBeers = [], isLoading } = useQuery({
    queryKey: ['todayBeers', userId],
    queryFn: () => getTodayBeers({ data: { user_id: userId } }),
    enabled: !!user,
  });

  const { data: recentBeers = [] } = useQuery({
    queryKey: ['recentBeers', userId],
    queryFn: () => getRecentBeers({ data: { user_id: userId } }),
    enabled: !!user,
  });

  const logMutation = useMutation({
    mutationFn: (data: {
      user_id: string;
      beer_name: string;
      brand: string;
      abv: number;
      container_type: string;
      volume_ml: number;
      quantity: number;
    }) => logBeer({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayBeers', userId] });
      queryClient.invalidateQueries({ queryKey: ['recentBeers', userId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBeer({ data: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayBeers', userId] });
    },
  });

  const handleContainerSelect = (container: typeof CONTAINER_TYPES[number]) => {
    setSelectedContainer(container);
    setSelectedQuantity(1);
  };

  const handleQuantitySelect = (quantity: number) => {
    if (!selectedBeer || !selectedContainer) return;
    logMutation.mutate({
      user_id: userId,
      beer_name: selectedBeer.name,
      brand: selectedBeer.brand,
      abv: selectedBeer.abv,
      container_type: selectedContainer.id,
      volume_ml: selectedContainer.volume_ml,
      quantity,
    }, {
      onSuccess: () => {
        setSelectedBeer(null);
        setSelectedContainer(null);
        setSelectedQuantity(1);
      }
    });
  };

  const handleQuickAdd = (beer: typeof recentBeers[number]) => {
    logMutation.mutate({
      user_id: userId,
      beer_name: beer.beer_name,
      brand: beer.brand,
      abv: beer.abv,
      container_type: beer.container_type,
      volume_ml: beer.volume_ml,
      quantity: 1,
    });
  };

  const totalBeers = todayBeers.length;
  const totalVolume = todayBeers.reduce((sum, b) => sum + (b.volume_ml || 0), 0);
  const stdDrinks = todayBeers.reduce((sum, b) => sum + ((b.volume_ml * (b.abv / 100) * 0.789) / 14), 0);

  if (!user) return null;

  return (
    <main className="p-4 max-w-lg mx-auto">
      {/* Today Summary Card */}
      <Card className="p-4 mb-6 bg-zinc-900 border-zinc-800 rounded-2xl">
        <p className="text-sm text-zinc-400 mb-2">Today</p>
        <div className="flex justify-around text-center">
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
      </Card>

      {/* Quick Add */}
      {recentBeers.length > 0 && !selectedBeer && (
        <section className="mb-6">
          <p className="text-sm text-zinc-400 mb-2">Quick add</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {recentBeers.map((beer, i) => {
              const container = CONTAINER_TYPES.find((c) => c.id === beer.container_type);
              return (
                <Button
                  key={`${beer.beer_name}-${beer.container_type}-${i}`}
                  variant="outline"
                  className="flex-shrink-0 h-14 px-4 bg-zinc-900 border-zinc-700 hover:bg-green-500/20 hover:border-green-500"
                  onClick={() => handleQuickAdd(beer)}
                  disabled={logMutation.isPending}
                >
                  <span className="mr-2">{container?.emoji || '🍺'}</span>
                  <span className="text-sm truncate max-w-24">{beer.beer_name}</span>
                </Button>
              );
            })}
          </div>
        </section>
      )}

      {/* Beer Search */}
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

      {/* Container Selection */}
      {selectedBeer && !selectedContainer && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-zinc-300">Select Container</h2>
          <div className="grid grid-cols-2 gap-3">
            {CONTAINER_TYPES.map((container) => (
              <Button
                key={container.id}
                variant="outline"
                className="h-16 flex flex-col items-center justify-center bg-zinc-900 border-zinc-800 hover:bg-green-500/20 hover:border-green-500"
                onClick={() => handleContainerSelect(container)}
              >
                <span className="text-2xl">{container.emoji}</span>
                <span className="text-xs mt-1">{container.label}</span>
              </Button>
            ))}
          </div>
        </section>
      )}

      {/* Quantity Selection */}
      {selectedBeer && selectedContainer && (
        <section className="mb-6">
          <h2 className="text-lg font-semibold mb-3 text-zinc-300">
            {selectedBeer.name} - {selectedContainer.emoji} {selectedContainer.label}
          </h2>
          <p className="text-sm text-zinc-400 mb-3">How many?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((qty) => (
              <Button
                key={qty}
                variant="outline"
                className={`flex-1 h-14 text-lg ${selectedQuantity === qty ? 'bg-green-500/20 border-green-500 text-green-500' : 'bg-zinc-900 border-zinc-800'}`}
                onClick={() => setSelectedQuantity(qty)}
                disabled={logMutation.isPending}
              >
                {qty}
              </Button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              variant="outline"
              className="flex-1 h-12 bg-zinc-900 border-zinc-800"
              onClick={() => {
                setSelectedContainer(null);
                setSelectedQuantity(1);
              }}
              disabled={logMutation.isPending}
            >
              Back
            </Button>
            <Button
              className="flex-1 h-12 bg-green-500 hover:bg-green-600 text-black font-semibold"
              onClick={() => handleQuantitySelect(selectedQuantity)}
              disabled={logMutation.isPending}
            >
              {logMutation.isPending ? 'Logging...' : `Log ${selectedQuantity} ${selectedQuantity === 1 ? 'beer' : 'beers'}`}
            </Button>
          </div>
        </section>
      )}

      {/* Today's Beers List */}
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
    </main>
  );
}
