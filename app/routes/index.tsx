import { createFileRoute } from '@tanstack/react-router';
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MEXICAN_BEERS, CONTAINER_TYPES, BEER_BRANDS, BRAND_META, type Beer } from '~/lib/beers';
import { getTodayBeers, logBeer, deleteBeer, getRecentBeers } from '~/lib/api';
import { useUser } from '~/lib/user-context';
import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { BeerLogo } from '~/components/BeerLogo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';

export const Route = createFileRoute('/')({
  component: Home,
});

function getAbvColor(abv: number): string {
  if (abv < 4.5) return 'bg-green-500/20 text-green-400';
  if (abv <= 6) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

function getAbvBorderColor(abv: number): string {
  if (abv < 4.5) return 'border-l-green-500';
  if (abv <= 6) return 'border-l-yellow-500';
  return 'border-l-red-500';
}

function Home() {
  const { user } = useUser();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
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

  // Filter beers by search + brand
  const filteredBeers = useMemo(() => {
    return MEXICAN_BEERS.filter((beer) => {
      const matchesSearch = searchQuery === '' ||
        beer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        beer.brand.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBrand = !brandFilter || beer.brand === brandFilter;
      return matchesSearch && matchesBrand;
    });
  }, [searchQuery, brandFilter]);

  const handleBeerSelect = (beer: Beer) => {
    setSelectedBeer(beer);
    setPickerOpen(false);
    setSearchQuery('');
    setBrandFilter(null);
  };

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

  const handleRecentSelect = (beer: typeof recentBeers[number]) => {
    const foundBeer = MEXICAN_BEERS.find(b => b.name === beer.beer_name);
    const foundContainer = CONTAINER_TYPES.find(c => c.id === beer.container_type);
    if (foundBeer && foundContainer) {
      setSelectedBeer(foundBeer);
      setSelectedContainer(foundContainer);
      setSelectedQuantity(1);
      setPickerOpen(false);
    }
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

      {/* Beer Picker Trigger */}
      {!selectedBeer && (
        <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left h-14 text-lg bg-zinc-900 border-zinc-800 mb-6"
            >
              <span className="text-zinc-400">Search beers...</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg h-[85vh] flex flex-col p-0 bg-zinc-950 border-zinc-800">
            <DialogHeader className="p-4 pb-0">
              <DialogTitle>Select Beer</DialogTitle>
            </DialogHeader>

            {/* Search Input */}
            <div className="px-4 pt-3">
              <input
                type="text"
                placeholder="Search by name or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-zinc-900 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:border-green-500"
              />
            </div>

            {/* Recent Row */}
            {recentBeers.length > 0 && (
              <div className="px-4 pt-4">
                <p className="text-xs text-zinc-400 mb-2">Recent</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {recentBeers.map((beer, i) => {
                    const container = CONTAINER_TYPES.find((c) => c.id === beer.container_type);
                    return (
                      <button
                        key={`${beer.beer_name}-${beer.container_type}-${i}`}
                        className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-green-500 transition-colors"
                        onClick={() => handleRecentSelect(beer)}
                      >
                        <BeerLogo beerName={beer.beer_name} brand={beer.brand} size="sm" />
                        <div className="text-left">
                          <p className="text-sm font-medium truncate max-w-20">{beer.beer_name}</p>
                          <p className="text-xs text-zinc-400">{container?.emoji}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Brand Filter Chips */}
            <div className="px-4 pt-3">
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    !brandFilter
                      ? 'bg-green-500 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                  onClick={() => setBrandFilter(null)}
                >
                  All
                </button>
                {BEER_BRANDS.map((brand) => {
                  const meta = BRAND_META[brand];
                  return (
                    <button
                      key={brand}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        brandFilter === brand
                          ? 'bg-green-500 text-black'
                          : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                      onClick={() => setBrandFilter(brandFilter === brand ? null : brand)}
                    >
                      {meta?.abbr || brand.slice(0, 4)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Beer Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-3 pt-3">
                {filteredBeers.map((beer) => (
                  <button
                    key={beer.name}
                    className="flex flex-col items-center p-4 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 active:border-green-500 transition-colors"
                    onClick={() => handleBeerSelect(beer)}
                  >
                    <BeerLogo beerName={beer.name} brand={beer.brand} size="lg" />
                    <p className="font-semibold text-white mt-2 text-center text-sm leading-tight">
                      {beer.name}
                    </p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {BRAND_META[beer.brand]?.abbr || beer.brand.slice(0, 4)}
                    </p>
                    <span className={`mt-2 px-2 py-0.5 rounded-full text-xs font-medium ${getAbvColor(beer.abv)}`}>
                      {beer.abv}%
                    </span>
                  </button>
                ))}
              </div>
              {filteredBeers.length === 0 && (
                <p className="text-zinc-400 text-center py-8">No beers found</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Container Selection */}
      {selectedBeer && !selectedContainer && (
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BeerLogo beerName={selectedBeer.name} brand={selectedBeer.brand} size="md" />
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedBeer.name}</h2>
              <p className="text-sm text-zinc-400">{selectedBeer.brand} • {selectedBeer.abv}%</p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-3">Select container</p>
          <div className="grid grid-cols-2 gap-3">
            {CONTAINER_TYPES.map((container) => (
              <button
                key={container.id}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-zinc-900 border border-zinc-700 hover:border-zinc-600 active:border-green-500 transition-colors"
                onClick={() => handleContainerSelect(container)}
              >
                <span className="text-3xl mb-1">{container.emoji}</span>
                <span className="text-sm font-medium text-white">{container.label.split(' ')[0]}</span>
                <span className="text-xs text-zinc-400">{container.volume_ml}ml</span>
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            className="w-full mt-3 h-12 bg-zinc-900 border-zinc-800"
            onClick={() => setSelectedBeer(null)}
          >
            Back to beers
          </Button>
        </section>
      )}

      {/* Quantity Selection */}
      {selectedBeer && selectedContainer && (
        <section className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <BeerLogo beerName={selectedBeer.name} brand={selectedBeer.brand} size="md" />
            <div>
              <h2 className="text-lg font-semibold text-white">{selectedBeer.name}</h2>
              <p className="text-sm text-zinc-400">
                {selectedContainer.emoji} {selectedContainer.label}
              </p>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-3">How many?</p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((qty) => (
              <Button
                key={qty}
                variant="outline"
                className={`flex-1 h-14 text-lg ${
                  selectedQuantity === qty
                    ? 'bg-green-500/20 border-green-500 text-green-500'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
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
                <Card
                  key={entry.id}
                  className={`p-4 bg-zinc-900 border-zinc-800 rounded-2xl border-l-4 ${getAbvBorderColor(entry.abv)}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BeerLogo beerName={entry.beer_name} brand={entry.brand} size="sm" />
                      <div>
                        <p className="font-semibold">{entry.beer_name}</p>
                        <p className="text-sm text-zinc-400">
                          {container?.emoji} {container?.label.split(' ')[0] || entry.container_type} • {time}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getAbvColor(entry.abv)}`}>
                        {entry.abv}%
                      </span>
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
