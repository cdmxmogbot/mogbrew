import { createServerFn } from "@tanstack/react-start";
import { env } from "~/lib/env";

export interface BeerLogEntry {
  id: number;
  user_id: string;
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
  std_drinks: number;
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
  total_std_drinks: number;
  last_drink_date: string | null;
}

export interface HeatmapEntry {
  day: string;
  std_drinks: number;
}

export interface HistoryDay {
  day: string;
  count: number;
  volume: number;
  std_drinks: number;
}

export interface LeaderboardEntry {
  user_id: string;
  total_beers: number;
  total_volume: number;
  total_std_drinks: number;
  days_active: number;
}

export interface DailyBreakdown {
  user_id: string;
  day: string;
  count: number;
}

export interface UserBrand {
  user_id: string;
  brand: string;
  count: number;
}

// Log beer — now includes user_id and quantity
export const logBeer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: {
    user_id: string;
    beer_name: string;
    brand: string;
    abv: number;
    container_type: string;
    volume_ml: number;
    quantity: number
  }}) => {
    const stmt = env.DB.prepare(
      "INSERT INTO beer_log (user_id, beer_name, brand, abv, container_type, volume_ml) VALUES (?, ?, ?, ?, ?, ?)"
    );
    const inserts = Array.from({ length: data.quantity }, () =>
      stmt.bind(data.user_id, data.beer_name, data.brand, data.abv, data.container_type, data.volume_ml)
    );
    await env.DB.batch(inserts);
    return { success: true };
  });

// Today's beers for a user
export const getTodayBeers = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { user_id: string }}) => {
    const result = await env.DB.prepare(
      "SELECT * FROM beer_log WHERE user_id = ? AND date(logged_at) = date('now') ORDER BY logged_at DESC"
    ).bind(data.user_id).all<BeerLogEntry>();
    return result.results;
  });

// Recent beers for quick-add (last 3 unique)
export const getRecentBeers = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { user_id: string }}) => {
    const result = await env.DB.prepare(`
      SELECT beer_name, brand, abv, container_type, volume_ml, MAX(logged_at) as logged_at
      FROM beer_log
      WHERE user_id = ?
      GROUP BY beer_name, container_type
      ORDER BY logged_at DESC
      LIMIT 3
    `).bind(data.user_id).all<{
      beer_name: string;
      brand: string;
      abv: number;
      container_type: string;
      volume_ml: number;
    }>();
    return result.results;
  });

// History — day breakdown for a user (last 30 days with entries)
export const getHistory = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { user_id: string }}) => {
    const days = await env.DB.prepare(`
      SELECT date(logged_at) as day,
             COUNT(*) as count,
             SUM(volume_ml) as volume,
             SUM(volume_ml * (abv/100) * 0.789 / 14) as std_drinks
      FROM beer_log
      WHERE user_id = ? AND logged_at >= datetime('now', '-30 days')
      GROUP BY day ORDER BY day DESC
    `).bind(data.user_id).all<HistoryDay>();
    return days.results;
  });

// Beers for a specific day
export const getDayBeers = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { user_id: string; day: string }}) => {
    const result = await env.DB.prepare(
      "SELECT * FROM beer_log WHERE user_id = ? AND date(logged_at) = ? ORDER BY logged_at DESC"
    ).bind(data.user_id, data.day).all<BeerLogEntry>();
    return result.results;
  });

// Insights for a user
export const getInsights = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { user_id: string }}) => {
    const [daily, brands, containers, totals, heatmap, personalBests] = await Promise.all([
      env.DB.prepare(`
        SELECT date(logged_at) as day, COUNT(*) as count,
          SUM(volume_ml * (abv/100) * 0.789 / 14) as std_drinks
        FROM beer_log WHERE user_id = ? AND logged_at >= datetime('now', '-14 days')
        GROUP BY day ORDER BY day
      `).bind(data.user_id).all<{ day: string; count: number; std_drinks: number }>(),

      env.DB.prepare(`
        SELECT brand, COUNT(*) as count FROM beer_log
        WHERE user_id = ? GROUP BY brand ORDER BY count DESC LIMIT 5
      `).bind(data.user_id).all<BrandStats>(),

      env.DB.prepare(`
        SELECT container_type, COUNT(*) as count FROM beer_log
        WHERE user_id = ? GROUP BY container_type ORDER BY count DESC
      `).bind(data.user_id).all<ContainerStats>(),

      env.DB.prepare(`
        SELECT COUNT(*) as total_beers, SUM(volume_ml) as total_volume,
          AVG(abv) as avg_abv, SUM(volume_ml * (abv/100) * 0.789 / 14) as total_std_drinks,
          MAX(date(logged_at)) as last_drink_date,
          COUNT(DISTINCT date(logged_at)) as days_tracked
        FROM beer_log WHERE user_id = ?
      `).bind(data.user_id).first<TotalStats & { days_tracked: number }>(),

      env.DB.prepare(`
        SELECT date(logged_at) as day, SUM(volume_ml * (abv/100) * 0.789 / 14) as std_drinks
        FROM beer_log WHERE user_id = ? AND logged_at >= datetime('now', '-91 days')
        GROUP BY day
      `).bind(data.user_id).all<HeatmapEntry>(),

      // Personal bests
      env.DB.prepare(`
        SELECT date(logged_at) as day, COUNT(*) as count,
               SUM(volume_ml * (abv/100) * 0.789 / 14) as std_drinks
        FROM beer_log WHERE user_id = ?
        GROUP BY day
        ORDER BY count DESC LIMIT 1
      `).bind(data.user_id).first<{ day: string; count: number; std_drinks: number }>(),
    ]);

    // Calculate avg std drinks per day
    const daysTracked = (totals as any)?.days_tracked || 1;
    const avgPerDay = ((totals?.total_std_drinks || 0) / daysTracked);

    return {
      daily: daily.results,
      brands: brands.results,
      containers: containers.results,
      totals: { ...totals, avg_per_day: avgPerDay, days_tracked: daysTracked },
      heatmap: heatmap.results,
      personalBests,
    };
  });

// Leaderboard — all users
export const getLeaderboard = createServerFn({ method: "GET" })
  .handler(async ({ data }: { data: { period: 'week' | 'all' }}) => {
    const sinceClause = data.period === 'week'
      ? "logged_at >= datetime('now', '-7 days')"
      : "1=1";

    const totals = await env.DB.prepare(`
      SELECT user_id, COUNT(*) as total_beers,
             SUM(volume_ml) as total_volume,
             SUM(volume_ml * (abv/100) * 0.789 / 14) as total_std_drinks,
             COUNT(DISTINCT date(logged_at)) as days_active
      FROM beer_log WHERE ${sinceClause}
      GROUP BY user_id ORDER BY total_beers DESC
    `).all<LeaderboardEntry>();

    // 7-day daily breakdown per user for the head-to-head chart
    const daily = await env.DB.prepare(`
      SELECT user_id, date(logged_at) as day, COUNT(*) as count
      FROM beer_log WHERE logged_at >= datetime('now', '-7 days')
      GROUP BY user_id, day ORDER BY day
    `).all<DailyBreakdown>();

    // Brand per user (top brand for each)
    const brands = await env.DB.prepare(`
      SELECT user_id, brand, COUNT(*) as count FROM beer_log
      GROUP BY user_id, brand
    `).all<UserBrand>();

    // Fun stats
    const funStats = await Promise.all([
      // Most beers in one day (any user)
      env.DB.prepare(`
        SELECT user_id, date(logged_at) as day, COUNT(*) as count
        FROM beer_log GROUP BY user_id, day ORDER BY count DESC LIMIT 1
      `).first<{ user_id: string; day: string; count: number }>(),

      // Caguama count per user
      env.DB.prepare(`
        SELECT user_id, COUNT(*) as count FROM beer_log
        WHERE container_type = 'caguama' GROUP BY user_id ORDER BY count DESC LIMIT 1
      `).first<{ user_id: string; count: number }>(),

      // 40oz count per user
      env.DB.prepare(`
        SELECT user_id, COUNT(*) as count FROM beer_log
        WHERE container_type = '40oz' GROUP BY user_id ORDER BY count DESC LIMIT 1
      `).first<{ user_id: string; count: number }>(),
    ]);

    return {
      totals: totals.results,
      daily: daily.results,
      brands: brands.results,
      funStats: {
        mostBeersDay: funStats[0],
        caguamaKing: funStats[1],
        fortyOzLegend: funStats[2],
      },
    };
  });

// Delete a beer
export const deleteBeer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { id: number } }) => {
    await env.DB.prepare("DELETE FROM beer_log WHERE id = ?").bind(data.id).run();
    return { success: true };
  });
