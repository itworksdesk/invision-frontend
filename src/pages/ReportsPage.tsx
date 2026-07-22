// src/pages/Reports.tsx
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, Download, Search, ArrowUp, ArrowDown, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart"; // Reuse if applicable
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, differenceInDays } from "date-fns";

type LastSoldSortKey = "product" | "so_number" | "quantity" | "customer" | "last_shipped" | "status";

interface ReportData {
  // Sales report fields
  total?: number;
  items: any[];
  total_sales?: number;
  total_profit?: number;
  total_orders?: number;
  // Inventory report fields
  total_products?: number;
  low_stock_count?: number;
  total_inventory_value?: number;
  total_customers?: number;
  total_suppliers?: number;
  total_revenue?: number;
  total_expenditure?: number;
  // Customer report fields
  // Add more fields as needed for customers and suppliers
  // Extra for inventory
  top_selling?: { product_id: number; name: string; sku: string; total_sold: number }[];
  last_sold?: {
    product_id: number;
    product_code?: string | null;
    name: string;
    sku: string;
    last_sold: string | null;
    last_customer_name?: string | null;
    last_quantity?: number | null;
    last_order_number?: string | null;
  }[];
  total_sales_persons?: number;
}



export default function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sales");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastSoldSearch, setLastSoldSearch] = useState("");
  const [lastSoldSort, setLastSoldSort] = useState<{ key: LastSoldSortKey; direction: "asc" | "desc" } | null>(null);
  const BASE_URL = import.meta.env.VITE_API_URL;

  const handleLastSoldSort = (key: LastSoldSortKey) => {
    setLastSoldSort((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      // Dates and quantities are more useful sorted newest/highest first by default
      const defaultDirection = key === "last_shipped" || key === "quantity" ? "desc" : "asc";
      return { key, direction: defaultDirection };
    });
  };

  const LastSoldSortIcon = ({ column }: { column: LastSoldSortKey }) => {
    if (lastSoldSort?.key !== column) {
      return <ChevronsUpDown className="h-3 w-3 text-gray-300" />;
    }
    return lastSoldSort.direction === "asc" ? (
      <ArrowUp className="h-3 w-3 text-gray-700" />
    ) : (
      <ArrowDown className="h-3 w-3 text-gray-700" />
    );
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab, startDate, endDate]);

async function fetchReport() {
  setLoading(true);
  try {
    if (activeTab === "inventory") {
      // Fetch all 3 in parallel
      const [invRes, topRes, lastRes] = await Promise.all([
        fetch(`${BASE_URL}/reports/inventory`),
        fetch(`${BASE_URL}/reports/top-selling`),
        fetch(`${BASE_URL}/reports/last-sold`),
      ]);

      const invData = await invRes.json();
      const topData = await topRes.json();
      const lastData = await lastRes.json();

      setReportData({
        ...invData,
        top_selling: topData,
        last_sold: lastData,
      });
    } else {
      // Existing single endpoint fetch
      const res = await fetch(
        `${BASE_URL}/reports/${activeTab}?start_date=${format(
          startDate,
          "yyyy-MM-dd"
        )}&end_date=${format(endDate, "yyyy-MM-dd")}`
      );
      const data = await res.json();
      setReportData(data);
    }
  } catch (err) {
    console.error(`Failed to fetch ${activeTab} report:`, err);
  } finally {
    setLoading(false);
  }
}

const INVENTORY_CSV_COLUMNS = [
  "name",
  "description",
  "category",
  "quantity",
  "cost_price",
  "selling_price",
  "unit_measure",
];

// RFC 4180-compliant CSV escaping — no backslashes, ever.
// Values containing a comma, double-quote, or newline are wrapped in double
// quotes; any internal double-quote is doubled ("").
const escapeCSV = (value: any): string => {
  const str = value == null ? "" : String(value);
  if (str.includes('"') || str.includes(",") || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

const handleDownload = () => {
  if (!reportData) {
    alert("No data available to download");
    return;
  }

  let csvContent = "";
  const fileName = `${activeTab}_report_${format(startDate, "yyyyMMdd")}_${format(endDate, "yyyyMMdd")}.csv`;

  if (reportData.items && reportData.items.length > 0) {
    // For inventory use the explicit column list; for other tabs keep all keys.
    const headers =
      activeTab === "inventory"
        ? INVENTORY_CSV_COLUMNS
        : Object.keys(reportData.items[0]);

    csvContent += headers.join(",") + "\n";

    reportData.items.forEach((row: any) => {
      const values = headers.map((h) => escapeCSV(row[h] ?? ""));
      csvContent += values.join(",") + "\n";
    });
  } else {
    csvContent = "No data available for this report";
  }

  // \uFEFF is the UTF-8 BOM — without it Excel on Windows misreads
  // multi-byte characters (e.g. ¼ appears as Â¼).
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-1">
      <div className="max-w-full mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Reports</h1>
          <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-2 sm:gap-3">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" /> Download Report
            </Button>
            <Button onClick={() => navigate("/sales-orders", { state: { openForm: true } })}>
              + Add New Order
            </Button>
          </div>
        </div>

        {/* Date Range Selector */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, "PPP") : <span>Pick a start date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "PPP") : <span>Pick an end date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tabs for different reports */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="sales">Sales Report</TabsTrigger>
            <TabsTrigger value="inventory">Inventory Report</TabsTrigger>
            <TabsTrigger value="customers">Customer Report</TabsTrigger>
            <TabsTrigger value="suppliers">Supplier Report</TabsTrigger>
            <TabsTrigger value="salespersons">Sales Person Report</TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading sales report...</p>
                ) : (
                  reportData && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Sales</h3>
                          <p className="text-2xl font-bold">₱{Number(reportData.total_sales).toLocaleString()}</p>
                        </div>
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Profit</h3>
                          <p className="text-2xl font-bold">₱{Number(reportData.total_profit).toLocaleString()}</p>
                        </div>
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Orders</h3>
                          <p className="text-2xl font-bold">{Number(reportData.total_orders).toLocaleString()}</p>
                        </div>
                      </div>
                      {/* Add table or chart for items */}
                      <MonthlySalesChart data={reportData.items} /> {/* Adapt as needed */}
                    </>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading inventory report...</p>
                ) : (
                  reportData && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Products</h3>
                          <p className="text-2xl font-bold">{reportData.total_products}</p>
                        </div>
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Low Stock</h3>
                          <p className="text-2xl font-bold">{reportData.low_stock_count}</p>
                        </div>
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Inventory Value</h3>
                          <p className="text-2xl font-bold">₱{Number(reportData.total_inventory_value).toLocaleString()}</p>
                        </div>
                      </div>
                      {/* Add table for inventory items */}
                    </>
                  )
                )}
              </CardContent>
            </Card>

            {/* Top Selling Products */}
            <Card>
              <CardHeader>
                <CardTitle>Top Selling Products</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading top selling products...</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {reportData?.top_selling?.length ? (
                      reportData.top_selling.map((p, i) => (
                        <li key={i} className="py-2 flex justify-between">
                          <span>{p.name} ({p.sku})</span>
                          <span className="font-bold">{p.total_sold}</span>
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-500">No sales data available.</p>
                    )}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Last Sold Dates */}
            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <CardTitle>Last Sold Dates</CardTitle>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by product ID or name..."
                      value={lastSoldSearch}
                      onChange={(e) => setLastSoldSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading last sold data...</p>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full divide-y divide-gray-200 text-sm">
                      <thead>
                        <tr>
                          <th
                            onClick={() => handleLastSoldSort("product")}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                          >
                            <span className="inline-flex items-center gap-1">
                              Product
                              <LastSoldSortIcon column="product" />
                            </span>
                          </th>
                          <th
                            onClick={() => handleLastSoldSort("so_number")}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                          >
                            <span className="inline-flex items-center gap-1">
                              SO Number
                              <LastSoldSortIcon column="so_number" />
                            </span>
                          </th>
                          <th
                            onClick={() => handleLastSoldSort("quantity")}
                            className="px-3 py-2.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                          >
                            <span className="inline-flex items-center justify-end gap-1">
                              Qty
                              <LastSoldSortIcon column="quantity" />
                            </span>
                          </th>
                          <th
                            onClick={() => handleLastSoldSort("customer")}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                          >
                            <span className="inline-flex items-center gap-1">
                              Customer
                              <LastSoldSortIcon column="customer" />
                            </span>
                          </th>
                          <th
                            onClick={() => handleLastSoldSort("last_shipped")}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                          >
                            <span className="inline-flex items-center gap-1">
                              Last Shipped
                              <LastSoldSortIcon column="last_shipped" />
                            </span>
                          </th>
                          <th
                            onClick={() => handleLastSoldSort("status")}
                            className="px-3 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:text-gray-700"
                          >
                            <span className="inline-flex items-center gap-1">
                              Status
                              <LastSoldSortIcon column="status" />
                            </span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(() => {
                          const query = lastSoldSearch.trim().toLowerCase();
                          const filtered = (reportData?.last_sold ?? []).filter((p) =>
                            query === ""
                              ? true
                              : String(p.product_id).includes(query) ||
                                (p.product_code ?? "").toLowerCase().includes(query) ||
                                p.name.toLowerCase().includes(query)
                          );

                          // Compute the derived display values once so sorting and
                          // rendering agree, instead of recomputing per-cell.
                          const enriched = filtered.map((p) => {
                            const soldDate = p.last_sold ? new Date(p.last_sold) : null;
                            const daysAgo = soldDate ? differenceInDays(new Date(), soldDate) : null;
                            const status = !soldDate
                              ? "Inactive"
                              : daysAgo! <= 30
                              ? "Active"
                              : "Inactive";
                            return { ...p, soldDate, daysAgo, status };
                          });

                          if (lastSoldSort) {
                            const { key, direction } = lastSoldSort;
                            const dir = direction === "asc" ? 1 : -1;
                            enriched.sort((a, b) => {
                              let cmp = 0;
                              switch (key) {
                                case "product":
                                  cmp = a.name.localeCompare(b.name);
                                  break;
                                case "so_number":
                                  cmp = (a.last_order_number ?? "").localeCompare(b.last_order_number ?? "");
                                  break;
                                case "quantity":
                                  cmp = (a.last_quantity ?? -Infinity) - (b.last_quantity ?? -Infinity);
                                  break;
                                case "customer":
                                  cmp = (a.last_customer_name ?? "").localeCompare(b.last_customer_name ?? "");
                                  break;
                                case "last_shipped":
                                  cmp = (a.soldDate?.getTime() ?? -Infinity) - (b.soldDate?.getTime() ?? -Infinity);
                                  break;
                                case "status":
                                  cmp = a.status.localeCompare(b.status);
                                  break;
                              }
                              return cmp * dir;
                            });
                          }

                          if (!enriched.length) {
                            return (
                              <tr>
                                <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                                  {query ? "No products match your search." : "No last shipped data available."}
                                </td>
                              </tr>
                            );
                          }

                          return enriched.map((p, i) => {
                            const { soldDate, status } = p;

                            return (
                              <tr key={i}>
                                <td className="px-3 py-2.5 max-w-[220px]">
                                  <div className="text-gray-900 truncate" title={`${p.name} (${p.sku})`}>
                                    {p.name}
                                  </div>
                                  <div className="text-xs text-gray-400 font-mono">
                                    {p.product_code ?? "—"}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-gray-500 font-mono">
                                  {p.last_order_number ?? "—"}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-right text-gray-900">
                                  {p.last_quantity ?? "—"}
                                </td>
                                <td className="px-3 py-2.5 max-w-[140px] truncate text-gray-900" title={p.last_customer_name ?? undefined}>
                                  {p.last_customer_name ?? "—"}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="text-gray-900">
                                    {soldDate ? soldDate.toLocaleDateString() : "Never Shipped"}
                                  </div>
                                  {soldDate && (
                                    <div className="text-xs text-gray-400">
                                      {formatDistanceToNow(soldDate, { addSuffix: true })}
                                    </div>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                                  <span
                                    className={
                                      status === "Active" ? "text-green-600" : "text-red-600"
                                    }
                                  >
                                    {status}
                                  </span>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar structure for customers and suppliers tabs */}
          <TabsContent value="customers" className="space-y-4">
            {/* Implement similar to above */}
            <Card>
              <CardHeader>
                <CardTitle>Customer Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading customer report...</p>
                ) : (
                  reportData && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Customers</h3>
                          <p className="text-2xl font-bold">{reportData.total_customers}</p>
                        </div>
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Revenue</h3>
                          <p className="text-2xl font-bold">₱{reportData.total_revenue}</p>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.items.map((customer, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{customer.total_orders}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{customer.total_spent}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="suppliers" className="space-y-4">
            {/* Implement similar to above */}
            <Card>
              <CardHeader>
                <CardTitle>Supplier Overview</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading supplier report...</p>
                ) : (
                  reportData && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Suppliers</h3>
                          <p className="text-2xl font-bold">{reportData.total_suppliers}</p>
                        </div>
                        <div className="p-4 border rounded">
                          <h3 className="text-sm font-medium">Total Spend</h3>
                          <p className="text-2xl font-bold">₱{reportData.total_expenditure}</p>
                        </div>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier Name</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Products Supplied</th>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spend</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {reportData.items.map((supplier, index) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{supplier.total_orders}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{supplier.total_spent}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="salespersons" className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Sales Person Overview</CardTitle></CardHeader>
              <CardContent>
                {loading ? <p>Loading sales person report...</p> : reportData && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                      <div className="p-4 border rounded">
                        <h3 className="text-sm font-medium">Active Sales Persons</h3>
                        <p className="text-2xl font-bold">{reportData.total_sales_persons}</p>
                      </div>
                      <div className="p-4 border rounded">
                        <h3 className="text-sm font-medium">Total Revenue</h3>
                        <p className="text-2xl font-bold">
                          ₱{Number(reportData.total_revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 border rounded">
                        <h3 className="text-sm font-medium">Total Profit</h3>
                        <p className="text-2xl font-bold">
                          ₱{Number(reportData.total_profit ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 border rounded">
                        <h3 className="text-sm font-medium">Total Orders</h3>
                        <p className="text-2xl font-bold">
                          {reportData.items.reduce((sum: number, sp: any) => sum + sp.total_orders, 0)}
                        </p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            {["Code", "Name", "Total Orders", "Total Revenue", "Total Profit", "Avg. Order Value"].map((h) => (
                              <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.items.length > 0 ? (
                            reportData.items.map((sp: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sp.sales_person_code}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sp.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sp.total_orders}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{Number(sp.total_revenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{Number(sp.total_profit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₱{Number(sp.average_order_value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                No sales person data available for this period.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}