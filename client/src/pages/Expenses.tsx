import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CalendarIcon, PencilIcon, TrashIcon, PlusIcon, FilterIcon, LoaderIcon } from "lucide-react";
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Label } from "@/components/ui/label"; // Import Label component

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Expense form schema
const expenseFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  amount: z.coerce.number().positive("Amount must be positive"),
  categoryId: z.string().uuid("Please select a category"),
  date: z.date(),
  notes: z.string().max(500).optional(),
});

type ExpenseFormValues = z.infer<typeof expenseFormSchema>;

// Types
interface Category {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  title: string;
  amount: string;
  date: string;
  notes?: string;
  categoryId: string;
  category: {
    name: string;
    color: string;
  };
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
}

const Expenses: React.FC = () => {
  const { token } = useAuth();
  
  // State management
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [totalExpenses, setTotalExpenses] = useState<number>(0);
  
  // Filter state
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [filterStartDate, setFilterStartDate] = useState<Date | null>(null);
  const [filterEndDate, setFilterEndDate] = useState<Date | null>(null);
  const [sortBy, setSortBy] = useState<string>("date");
  const [sortOrder, setSortOrder] = useState<string>("desc");
  
  // Dialog state
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [currentExpenseId, setCurrentExpenseId] = useState<string | null>(null);
  
  // Form setup
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      title: "",
      amount: 0,
      categoryId: "",
      date: new Date(),
      notes: "",
    },
  });

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  // Fetch expenses with filters applied
  const fetchExpenses = async (page = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", pagination.limit.toString());
      params.append("sortBy", sortBy);
      params.append("sortOrder", sortOrder);
      
      if (filterCategory) {
        params.append("categoryId", filterCategory);
      }
      
      if (filterStartDate) {
        params.append("startDate", format(filterStartDate, "yyyy-MM-dd"));
      }
      
      if (filterEndDate) {
        params.append("endDate", format(filterEndDate, "yyyy-MM-dd"));
      }
      
      const response = await axios.get(`${API_URL}/expenses?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setExpenses(response.data.data);
      setPagination({
        page: response.data.pagination.page,
        limit: response.data.pagination.limit,
        totalPages: response.data.pagination.totalPages,
      });
      setTotalExpenses(response.data.total);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setError(err.response?.data?.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      setCategories(response.data.data);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      toast("Failed to load categories. Please try again.");
    }
  };

  // Apply filters
  const handleApplyFilters = () => {
    setPagination({ ...pagination, page: 1 }); // Reset to first page when filtering
    fetchExpenses(1);
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilterCategory("");
    setFilterStartDate(null);
    setFilterEndDate(null);
    setSortBy("date");
    setSortOrder("desc");
    setPagination({ ...pagination, page: 1 });
    fetchExpenses(1);
  };

  // Change page
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination({ ...pagination, page: newPage });
      fetchExpenses(newPage);
    }
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount));
  };

  // Open create dialog
  const handleOpenCreateDialog = () => {
    setFormMode("create");
    form.reset({
      title: "",
      amount: 0,
      categoryId: "",
      date: new Date(),
      notes: "",
    });
    setDialogOpen(true);
  };

  // Open edit dialog
  const handleOpenEditDialog = (expense: Expense) => {
    setFormMode("edit");
    setCurrentExpenseId(expense.id);
    form.reset({
      title: expense.title,
      amount: parseFloat(expense.amount),
      categoryId: expense.categoryId,
      date: new Date(expense.date),
      notes: expense.notes || "",
    });
    setDialogOpen(true);
  };

  // Open delete dialog
  const handleOpenDeleteDialog = (id: string) => {
    setCurrentExpenseId(id);
    setDeleteDialogOpen(true);
  };

  // Create expense
  const handleCreateExpense = async (values: ExpenseFormValues) => {
    try {
      await axios.post(
        `${API_URL}/expenses`,
        {
          ...values,
          date: format(values.date, "yyyy-MM-dd"),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast("Expense created successfully");
      
      setDialogOpen(false);
      fetchExpenses(pagination.page);
    } catch (err: any) {
      console.error("Error creating expense:", err);
      toast("Failed to create expense");
    }
  };

  // Update expense
  const handleUpdateExpense = async (values: ExpenseFormValues) => {
    if (!currentExpenseId) return;
    
    try {
      await axios.put(
        `${API_URL}/expenses/${currentExpenseId}`,
        {
          ...values,
          date: format(values.date, "yyyy-MM-dd"),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      toast("Expense updated successfully");
      
      setDialogOpen(false);
      setCurrentExpenseId(null);
      fetchExpenses(pagination.page);
    } catch (err: any) {
      console.error("Error updating expense:", err);
      toast("Failed to update expense");
    }
  };

  // Delete expense
  const handleDeleteExpense = async () => {
    if (!currentExpenseId) return;
    
    try {
      await axios.delete(`${API_URL}/expenses/${currentExpenseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      toast("Expense deleted successfully");
      
      setDeleteDialogOpen(false);
      setCurrentExpenseId(null);
      fetchExpenses(pagination.page);
    } catch (err: any) {
      console.error("Error deleting expense:", err);
      toast("Failed to delete expense");
    }
  };

  // Handle form submission
  const onSubmit = (values: ExpenseFormValues) => {
    if (formMode === "create") {
      handleCreateExpense(values);
    } else {
      handleUpdateExpense(values);
    }
  };

  if (loading && expenses.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex h-full items-center justify-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  // Empty state when no expenses and no filter is applied
  const showEmptyState = expenses.length === 0 && 
    !filterCategory && 
    !filterStartDate && 
    !filterEndDate;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
            <p className="text-muted-foreground">
              Track and manage your spending
            </p>
          </div>
          <Button onClick={handleOpenCreateDialog}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select 
                  value={filterCategory} 
                  onValueChange={setFilterCategory}
                >
                  <SelectTrigger id="category-filter">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="start-date-filter">Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="start-date-filter" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterStartDate ? format(filterStartDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterStartDate ?? undefined}
                      onSelect={day => setFilterEndDate(day ?? null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="end-date-filter">End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button id="end-date-filter" variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterEndDate ? format(filterEndDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterEndDate ?? undefined}
                      onSelect={day => setFilterEndDate(day ?? null)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div>
                <Label htmlFor="sort-by">Sort By</Label>
                <div className="flex space-x-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger id="sort-by" className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="title">Title</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sortOrder} onValueChange={setSortOrder}>
                    <SelectTrigger id="sort-order" className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">Asc</SelectItem>
                      <SelectItem value="desc">Desc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={handleResetFilters}>
                Reset
              </Button>
              <Button onClick={handleApplyFilters}>
                <FilterIcon className="mr-2 h-4 w-4" />
                Apply Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        {error ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h2 className="text-xl font-semibold text-destructive">Error Loading Expenses</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={() => fetchExpenses(pagination.page)}>Try Again</Button>
            </div>
          </Card>
        ) : showEmptyState ? (
          <Card className="p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <h2 className="text-xl font-semibold mb-2">No expenses yet</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                Start tracking your spending by adding your first expense. You'll see them listed here.
              </p>
              <Button onClick={handleOpenCreateDialog}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Your First Expense
              </Button>
            </div>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Your Expenses</CardTitle>
                <div className="text-sm text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, totalExpenses)} of {totalExpenses}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <p className="text-muted-foreground">No expenses match your filters</p>
                  <Button variant="link" onClick={handleResetFilters}>
                    Clear filters
                  </Button>
                </div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense.id}>
                          <TableCell className="font-medium">{expense.title}</TableCell>
                          <TableCell>
                            <Badge
                              style={{
                                backgroundColor: expense.category.color || "hsl(var(--primary))",
                              }}
                            >
                              {expense.category.name}
                            </Badge>
                          </TableCell>
                          <TableCell>{format(new Date(expense.date), "MMM d, yyyy")}</TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenEditDialog(expense)}
                              >
                                <PencilIcon className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDeleteDialog(expense.id)}
                              >
                                <TrashIcon className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            // Show current page, first page, last page, and pages around current
                            return (
                              page === 1 ||
                              page === pagination.totalPages ||
                              Math.abs(page - pagination.page) <= 1
                            );
                          })
                          .map((page, index, array) => {
                            // Add ellipsis
                            const showEllipsisBefore = index > 0 && array[index - 1] !== page - 1;
                            const showEllipsisAfter = index < array.length - 1 && array[index + 1] !== page + 1;
                            
                            return (
                              <React.Fragment key={page}>
                                {showEllipsisBefore && (
                                  <Button variant="outline" size="sm" disabled>
                                    ...
                                  </Button>
                                )}
                                
                                <Button
                                  variant={pagination.page === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </Button>
                                
                                {showEllipsisAfter && (
                                  <Button variant="outline" size="sm" disabled>
                                    ...
                                  </Button>
                                )}
                              </React.Fragment>
                            );
                          })}
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{formMode === "create" ? "Add Expense" : "Edit Expense"}</DialogTitle>
            <DialogDescription>
              {formMode === "create" 
                ? "Add a new expense to track your spending"
                : "Update the details of your expense"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Lunch, Movie tickets, etc." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0.01" 
                        step="0.01" 
                        {...field} 
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Additional details about this expense..."
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {formMode === "create" ? "Add Expense" : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this expense. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
};

export default Expenses;