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
import { CalendarIcon, Download } from "lucide-react";
import MonthlySalesChart from "@/components/charts/MonthlySalesChart"; // Reuse if applicable
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow, differenceInDays } from "date-fns";

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
  last_sold?: { product_id: number; name: string; sku: string; last_sold: string | null }[];
  total_sales_persons?: number;
}



export default function Reports() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("sales");
  const [startDate, setStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const BASE_URL = import.meta.env.VITE_API_URL;

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

const handleDownload = () => {
  if (!reportData) {
    alert("No data available to download");
    return;
  }

  let csvContent = "";
  const fileName = `${activeTab}_report_${format(startDate, "yyyyMMdd")}_${format(endDate, "yyyyMMdd")}.csv`;

  if (reportData.items && reportData.items.length > 0) {
    // Extract headers
    const headers = Object.keys(reportData.items[0]);
    csvContent += headers.join(",") + "\n";

    // Extract rows
    reportData.items.forEach((row: any) => {
      const values = headers.map((h) => JSON.stringify(row[h] ?? "")); // escape commas/quotes
      csvContent += values.join(",") + "\n";
    });
  } else {
    csvContent = "No data available for this report";
  }

  // Download as CSV file
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
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
            <Card>
              <CardHeader>
                <CardTitle>Last Sold Dates</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading last sold data...</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Sold Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Sold (Ago)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData?.last_sold?.length ? (
                          reportData.last_sold.map((p, i) => {
                            const soldDate = p.last_sold ? new Date(p.last_sold) : null;
                            const daysAgo = soldDate ? differenceInDays(new Date(), soldDate) : null;
                            const status = !soldDate
                              ? "Inactive"
                              : daysAgo <= 30
                              ? "Active"
                              : "Inactive";

                            return (
                              <tr key={i}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {p.name} ({p.sku})
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {soldDate ? soldDate.toLocaleDateString() : "Never Sold"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {soldDate ? formatDistanceToNow(soldDate, { addSuffix: true }) : "—"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
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
                          })
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                              No last sold data available.
                            </td>
                          </tr>
                        )}
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