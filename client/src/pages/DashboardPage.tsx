import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "../context/AuthContext";
import { CalendarIcon, LoaderIcon } from "lucide-react";
import DashboardLayout from "../components/DashboardLayout";

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Types
interface CategorySummary {
  id: string;
  name: string;
  color: string;
  monthlyLimit: number | null;
  totalSpent: number;
  percentage: number | null;
  status: "green" | "yellow" | "red" | null;
}

interface CategoryChartData {
  id: string;
  name: string;
  color: string;
  value: number;
  percentage: number;
}

interface TimeSeriesData {
  period: string;
  amount: number;
}

interface ExpenseSummary {
  totalExpenses: number;
  categoryData: CategoryChartData[];
  timeSeriesData: TimeSeriesData[];
  period: string;
}

const Dashboard: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<string>("month");
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<ExpenseSummary | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  // Get current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    fetchDashboardData();
  }, [periodFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch category budget summary for current month
      const categorySummaryResponse = await axios.get(
        `${API_URL}/categories/summary?month=${currentMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch expense summary data (pie chart and line chart)
      const expenseSummaryResponse = await axios.get(
        `${API_URL}/expenses/summary?period=${periodFilter}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCategorySummary(categorySummaryResponse.data.data);
      setExpenseSummary(expenseSummaryResponse.data.data);

      console.log("Category Summary:", categorySummaryResponse.data.data);
      console.log("Expense Summary:", expenseSummaryResponse.data.data);
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(
        err.response?.data?.message || "Failed to load dashboard data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Calculate total budget across all categories
  const totalBudget = categorySummary
    .filter((category) => category.monthlyLimit !== null)
    .reduce((sum, category) => sum + (category.monthlyLimit || 0), 0);

  // Calculate total spent across all categories
  const totalSpent = categorySummary.reduce(
    (sum, category) => sum + category.totalSpent,
    0
  );

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-3 shadow-sm">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date label for time series chart
  const formatDateLabel = (dateStr: string) => {
    if (periodFilter === "year") {
      // Extract the year from dateStr (assuming it's in the format "YYYY-MM-DD")
      const year = dateStr.split("-")[0]; // This will give you "2025" from "2025-04-16"

      // Create a new Date object for the first day of the year
      const startOfYear = new Date(`${year}-01-01`);

      if (isNaN(startOfYear.getTime())) {
        console.error("Invalid date string:", dateStr);
        return null; // Or handle appropriately
      }

      // Format the date to "MMM yyyy"
      return format(startOfYear, "MMM yyyy");
    }
    return format(new Date(dateStr), "d MMM");
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex h-full flex-col items-center justify-center">
          <h2 className="text-xl font-semibold text-destructive">
            Error Loading Dashboard
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  // Show empty state if no data
  if (categorySummary.length === 0 && (!expenseSummary || expenseSummary.categoryData.length === 0)) {
    return (
      <DashboardLayout>
        <div className="flex h-full flex-col items-center justify-center text-center p-4">
          <h2 className="text-2xl font-semibold mb-2">No expenses yet</h2>
          <p className="text-muted-foreground max-w-md mb-6">
            Start tracking your spending by adding expenses. You'll see insightful charts and
            summaries here once you have some data.
          </p>
          <Button asChild>
            <a href="/expenses">Add Your First Expense</a>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">DashBoard</h1>
            <p className="text-muted-foreground">
              Overview of your financial activities
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {format(new Date(), "MMMM yyyy")}
            </span>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Spent
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalSpent)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    For {format(new Date(), "MMMM yyyy")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Budget
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(totalBudget)}
                  </div>
                  <div className="flex items-center pt-1">
                    <Progress
                      value={(totalSpent / totalBudget) * 100}
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">
                    Top Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseSummary && expenseSummary.categoryData.length > 0 ? (
                    <>
                      <div className="text-2xl font-bold">
                        {expenseSummary.categoryData[0].name}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(expenseSummary.categoryData[0].value)} (
                        {expenseSummary.categoryData[0].percentage}%)
                      </p>
                    </>
                  ) : (
                    <div className="text-muted-foreground">No data available</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Expense Trends Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Expense Trends</CardTitle>
                    <CardDescription>
                      Your spending over time
                    </CardDescription>
                  </div>
                  <Select
                    value={periodFilter}
                    onValueChange={setPeriodFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="pt-2 px-2">
                {expenseSummary && expenseSummary.timeSeriesData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={expenseSummary.timeSeriesData}
                        margin={{
                          top: 10,
                          right: 30,
                          left: 0,
                          bottom: 30,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis
                          dataKey="period"
                          tickFormatter={(value: string) => formatDateLabel(value) ?? ""}
                          angle={-45}
                          textAnchor="end"
                          tick={{ fontSize: 12 }}
                          height={50}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Spending by Category</CardTitle>
                <CardDescription>
                  Distribution of your expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenseSummary && expenseSummary.categoryData.length > 0 ? (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={expenseSummary.categoryData}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) =>
                            `${name}: ${(percent * 100).toFixed(0)}%`
                          }
                          labelLine={false}
                        >
                          {expenseSummary.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => [
                            formatCurrency(value),
                            "Amount",
                          ]}
                        />
                        <Legend layout="vertical" align="right" verticalAlign="middle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No category data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budget" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Budget Overview */}
              <Card className="col-span-full md:col-span-2">
                <CardHeader>
                  <CardTitle>Budget Overview</CardTitle>
                  <CardDescription>
                    Your monthly spending limits and progress
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold mb-4">
                    {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
                  </div>
                  <div className="flex items-center mb-2">
                    <Progress
                      value={(totalSpent / totalBudget) * 100}
                      className="h-4"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {Math.round((totalSpent / totalBudget) * 100)}% of total budget used
                  </p>
                </CardContent>
              </Card>

              {/* Category Budget Cards */}
              {categorySummary.map((category) => (
                <Card
                  key={category.id}
                  className={
                    category.status === "red"
                      ? "border-destructive"
                      : category.status === "yellow"
                        ? "border-yellow-500"
                        : ""
                  }
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                        />
                        <CardTitle className="text-sm font-medium">
                          {category.name}
                        </CardTitle>
                      </div>
                      {category.status && (
                        <div
                          className={`text-xs px-2 py-1 rounded-full ${category.status === "red"
                              ? "bg-destructive/10 text-destructive"
                              : category.status === "yellow"
                                ? "bg-yellow-500/10 text-yellow-700"
                                : "bg-green-500/10 text-green-700"
                            }`}
                        >
                          {category.status === "red"
                            ? "Over Budget"
                            : category.status === "yellow"
                              ? "Warning"
                              : "Good"
                          }
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">
                        Spent: {formatCurrency(category.totalSpent)}
                      </span>
                      {category.monthlyLimit !== null && (
                        <span className="text-sm text-muted-foreground">
                          Limit: {formatCurrency(category.monthlyLimit)}
                        </span>
                      )}
                    </div>
                    {category.monthlyLimit !== null ? (
                      <>
                        <div className="flex items-center">
                          <Progress
                            value={category.percentage || 0}
                            className={`h-2 ${category.status === "red"
                                ? "bg-destructive/30"
                                : category.status === "yellow"
                                  ? "bg-yellow-500/30"
                                  : "bg-green-500/30"
                              }`}
                          />
                        </div>
                        <div className="text-xs mt-1 text-right">
                          {category.percentage}% used
                        </div>
                      </>
                    ) : (
                      <div className="text-xs italic text-muted-foreground mt-2">
                        No monthly limit set
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;