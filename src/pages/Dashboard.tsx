"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/charts/StatsCard";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart";
import WeeklySalesChart from "@/components/charts/WeeklySalesChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

type MonthlyEntry = { month: string; sales: number; profit: number; orders: number };

function calcMonthlyChange(
  monthlySales: MonthlyEntry[],
  field: "sales" | "profit"
): { change: string; trend: "up" | "down" } {
  const now = new Date();
  const currentMonthName = now.toLocaleString("en-US", { month: "short" });
  const lastMonthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString(
    "en-US",
    { month: "short" }
  );

  const current = monthlySales.find((m) => m.month === currentMonthName)?.[field] ?? 0;
  const last = monthlySales.find((m) => m.month === lastMonthName)?.[field] ?? 0;

  if (last === 0) {
    return { change: "—", trend: "up" };
  }

  const pct = ((current - last) / last) * 100;
  const sign = pct >= 0 ? "+" : "";
  return {
    change: `${sign}${pct.toFixed(1)}%`,
    trend: pct >= 0 ? "up" : "down",
  };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const BASE_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch(`${BASE_URL}/dashboard/metrics`);
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error("Failed to fetch dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchMetrics();
  }, []);

  const cards = stats
    ? (() => {
        const salesChange = calcMonthlyChange(stats.monthlySales, "sales");
        const profitChange = calcMonthlyChange(stats.monthlySales, "profit");

        return [
          {
            id: 1,
            title: "Total Sales",
            value: `₱${stats.totalSales.toLocaleString()}`,
            change: salesChange.change,
            trend: salesChange.trend,
            icon: {
              path: "M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941",
              bgColor: "bg-blue-500",
            },
          },
          {
            id: 2,
            title: "Profit",
            value: `₱${stats.profit.toLocaleString()}`,
            change: profitChange.change,
            trend: profitChange.trend,
            icon: {
              path: "M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z",
              bgColor: "bg-green-500",
            },
          },
          {
            id: 3,
            title: "Low Stock Items",
            value: stats.lowStock,
            change: "—",
            trend: stats.lowStock > 0 ? ("down" as const) : ("up" as const),
            icon: {
              path: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
              bgColor: "bg-red-500",
            },
          },
          {
            id: 4,
            title: "Pending Orders",
            value: stats.pendingOrders,
            change: "—",
            trend: stats.pendingOrders > 0 ? ("up" as const) : ("down" as const),
            icon: {
              path: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
              bgColor: "bg-yellow-500",
            },
          },
        ];
      })()
    : [];

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-1">
      <div className="max-w-full mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
            <Button variant="outline">Generate Sales Report</Button>
            <Button
              onClick={() => navigate("/sales-orders", { state: { openForm: true } })}
            >
              + Add New Order
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {loading ? (
            <p>Loading metrics...</p>
          ) : (
            cards.map((stat) => (
              <div key={stat.id} className="min-w-0">
                <StatsCard {...stat} />
              </div>
            ))
          )}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          <Card className="min-w-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Monthly Sales</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full overflow-hidden">
                {stats && <MonthlySalesChart data={stats.monthlySales} />}
              </div>
            </CardContent>
          </Card>

          <Card className="min-w-0">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg sm:text-xl">Weekly Performance</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="w-full overflow-hidden">
                {stats && <WeeklySalesChart data={stats.weeklySales} />}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}