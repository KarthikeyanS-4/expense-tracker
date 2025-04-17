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
  BarChart, Bar,
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
  Sector,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  Area,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "../context/AuthContext";
import { CalendarIcon, LoaderIcon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
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
  
  // State for active pie chart sector
  const [activePieIndex, setActivePieIndex] = useState<number | undefined>(undefined);
  
  // Month-over-month data (we'll simulate this for now)
  const [monthOverMonthData, setMonthOverMonthData] = useState<any[]>([]);

  // Get current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    fetchDashboardData();
    // Simulate fetching month-over-month comparison data
    simulateMonthOverMonthData();
  }, [periodFilter]);

  const simulateMonthOverMonthData = () => {
    // This would ideally come from the backend
    if (expenseSummary && expenseSummary.categoryData.length > 0) {
      const topCategories = [...expenseSummary.categoryData]
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);
      
      const data = topCategories.map(category => {
        // Generate a previous month value that's somewhat related to current value
        const prevMonthValue = category.value * (0.85 + Math.random() * 0.3);
        const change = ((category.value - prevMonthValue) / prevMonthValue) * 100;
        
        return {
          name: category.name,
          color: category.color,
          currentMonth: category.value,
          previousMonth: parseFloat(prevMonthValue.toFixed(2)),
          change: parseFloat(change.toFixed(1))
        };
      });
      
      setMonthOverMonthData(data);
    }
  };

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

      // After setting expense summary, also update month-over-month data
      if (expenseSummaryResponse.data.data) {
        simulateMonthOverMonthData();
      }
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

  // Enhanced pie chart tooltip
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-md p-3 shadow-sm">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-primary">
            {formatCurrency(payload[0].value)}
          </p>
          <p className="text-xs text-muted-foreground">
            {payload[0].payload.percentage}% of total
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
      const month = dateStr.split("-")[1]; // This will give you "04" from "2025-04-16"
      // Create a new Date object for the first day of the year
      const startOfYear = new Date(`${year}-${month}-01`);

      if (isNaN(startOfYear.getTime())) {
        console.error("Invalid date string:", dateStr);
        return null; // Or handle appropriately
      }

      // Format the date to "MMM yyyy"
      return format(startOfYear, "MMM yyyy");
    }
    return format(new Date(dateStr), "d MMM");
  };
  
  // Active shape for PieChart (animated on hover)
  const renderActiveShape = (props: any) => {
    const RADIAN = Math.PI / 180;
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 30) * cos;
    const my = cy + (outerRadius + 30) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} className="text-xs">
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333" className="text-xs">
          {`${(percent * 100).toFixed(1)}%`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999" className="text-xs">
          {formatCurrency(value)}
        </text>
      </g>
    );
  };

  // Generate radar data from categories
  const getRadarData = () => {
    if (!expenseSummary || !expenseSummary.categoryData) return [];
    
    // Select top 6 categories for better visualization
    return expenseSummary.categoryData
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map(cat => ({
        subject: cat.name,
        A: cat.value, // Current period
        B: cat.value * (0.7 + Math.random() * 0.6), // Previous period (simulated)
        fullMark: Math.ceil(cat.value * 1.2) // Just for scale
      }));
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
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
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
                      <ComposedChart
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
                        <Area
                          type="monotone"
                          dataKey="amount"
                          fill="#8884d822"
                          stroke="#8884d8"
                          strokeWidth={0}
                        />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#8884d8"
                          strokeWidth={2}
                          dot={true}
                          activeDot={{ r: 6 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No trend data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution Chart - Enhanced interactive pie chart */}
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
                          innerRadius={60}
                          outerRadius={90}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="name"
                          activeIndex={activePieIndex}
                          activeShape={renderActiveShape}
                          onMouseEnter={(_, index) => setActivePieIndex(index)}
                          onMouseLeave={() => setActivePieIndex(undefined)}
                        >
                          {expenseSummary.categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || `hsl(${index * 45}, 70%, 60%)`} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Legend 
                          layout="vertical" 
                          align="right" 
                          verticalAlign="middle"
                          formatter={(value, entry, index) => {
                            const item = expenseSummary.categoryData[index];
                            return `${value} (${item.percentage}%)`;
                          }}
                        />
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

          <TabsContent value="analysis" className="space-y-6">
            {/* Month over Month Comparison Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Month-over-Month Comparison</CardTitle>
                <CardDescription>
                  How your spending changed from last month
                </CardDescription>
              </CardHeader>
              <CardContent>
                {monthOverMonthData && monthOverMonthData.length > 0 ? (
                  <>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={monthOverMonthData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value: number) => formatCurrency(value)}
                            labelFormatter={(name) => `Category: ${name}`}
                          />
                          <Legend />
                          <Bar name="Previous Month" dataKey="previousMonth" fill="#8884d8" />
                          <Bar name="Current Month" dataKey="currentMonth" fill="#82ca9d" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-6 space-y-3">
                      <h3 className="text-sm font-medium">Top Changes</h3>
                      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                        {monthOverMonthData.map((item, index) => (
                          <div key={index} className="flex items-center p-3 bg-muted/50 rounded-md">
                            <div 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: item.color || `hsl(${index * 45}, 70%, 60%)` }}
                            />
                            <div className="flex-1">
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatCurrency(item.currentMonth)} vs {formatCurrency(item.previousMonth)}
                              </div>
                            </div>
                            <div className={`flex items-center text-sm ${item.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {item.change > 0 ? <TrendingUpIcon className="h-4 w-4 mr-1" /> : <TrendingDownIcon className="h-4 w-4 mr-1" />}
                              {Math.abs(item.change)}%
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">No comparison data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Comparison Radar Chart */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Category Spending Patterns</CardTitle>
                <CardDescription>
                  Compare your spending across top categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {expenseSummary && expenseSummary.categoryData.length > 0 ? (
                  <div className="h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius={120} data={getRadarData()}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis />
                        <Radar name="Current Period" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.5} />
                        <Radar name="Previous Period" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.5} />
                        <Legend />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="text-muted-foreground">Not enough data for pattern analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Spending Insights */}
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Spending Insights</CardTitle>
                <CardDescription>
                  Key observations based on your spending patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* These would ideally be algorithmically generated based on actual data */}
                  {expenseSummary && expenseSummary.categoryData.length > 0 ? (
                    <>
                      <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-md">
                        <TrendingUpIcon className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <h4 className="font-medium text-sm">Spending Trend</h4>
                          <p className="text-sm text-muted-foreground">
                            Your overall spending {periodFilter === "week" ? "this week" : periodFilter === "month" ? "this month" : "this year"} 
                            is focused on {expenseSummary.categoryData.slice(0, 2).map(c => c.name).join(" and ")}.
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-muted-foreground">
                      Add more expenses to see personalized insights
                    </div>
                  )}
                </div>
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
                        : "border-green-500"
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