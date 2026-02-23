import { createServerFn } from "@tanstack/react-start";
import { env } from "~/lib/env";

export interface BeerLogEntry {
  id: number;
  beer_name: string;
  brand: string;
  abv: number;
  container_type: string;
  volume_ml: number;
  logged_at: string;
  notes: string | null;
}

export interface DailyStats {
  day: string;
  count: number;
  volume: number;
}

export interface BrandStats {
  brand: string;
  count: number;
}

export interface ContainerStats {
  container_type: string;
  count: number;
}

export interface TotalStats {
  total_beers: number;
  total_volume: number;
  avg_abv: number;
}

export const logBeer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { beer_name: string; brand: string; abv: number; container_type: string; volume_ml: number } }) => {
    await env.DB.prepare(
      "INSERT INTO beer_log (beer_name, brand, abv, container_type, volume_ml) VALUES (?, ?, ?, ?, ?)"
    ).bind(data.beer_name, data.brand, data.abv, data.container_type, data.volume_ml).run();
    return { success: true };
  });

export const getTodayBeers = createServerFn({ method: "GET" })
  .handler(async () => {
    const result = await env.DB.prepare(
      "SELECT * FROM beer_log WHERE date(logged_at) = date('now') ORDER BY logged_at DESC"
    ).all<BeerLogEntry>();
    return result.results;
  });

export const getInsights = createServerFn({ method: "GET" })
  .handler(async () => {
    const [daily, brands, containers, totals] = await Promise.all([
      env.DB.prepare("SELECT date(logged_at) as day, COUNT(*) as count, SUM(volume_ml) as volume FROM beer_log WHERE logged_at >= datetime('now', '-14 days') GROUP BY day ORDER BY day").all<DailyStats>(),
      env.DB.prepare("SELECT brand, COUNT(*) as count FROM beer_log GROUP BY brand ORDER BY count DESC LIMIT 10").all<BrandStats>(),
      env.DB.prepare("SELECT container_type, COUNT(*) as count FROM beer_log GROUP BY container_type ORDER BY count DESC").all<ContainerStats>(),
      env.DB.prepare("SELECT COUNT(*) as total_beers, SUM(volume_ml) as total_volume, AVG(abv) as avg_abv FROM beer_log").first<TotalStats>(),
    ]);
    return { daily: daily.results, brands: brands.results, containers: containers.results, totals };
  });

export const deleteBeer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: number } }) => {
    await env.DB.prepare("DELETE FROM beer_log WHERE id = ?").bind(data.id).run();
    return { success: true };
  });
