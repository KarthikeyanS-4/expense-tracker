import React, { useState, useEffect } from "react";
import axios from "axios";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LoaderIcon, PlusIcon, Pencil, Trash2 } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// API URL from environment or default
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Types
interface Category {
  id: string;
  name: string;
  color: string;
  monthlyLimit: number | null;
  totalSpent?: number;
  percentage?: number | null;
  status?: "green" | "yellow" | "red" | null;
}

// Form schema
const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(50, "Category name must be less than 50 characters"),
  color: z.string().min(1, "Color is required"),
  monthlyLimit: z.union([
    z.number().nonnegative("Monthly limit must be positive"),
    z.literal(null)
  ]).nullable()
});

const Categories: React.FC = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  
  // Current month in YYYY-MM format
  const currentMonth = format(new Date(), "yyyy-MM");

  // Form
  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      color: "#6366F1", // Default color
      monthlyLimit: null
    }
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset form when editing category changes
    if (editingCategory) {
      form.reset({
        name: editingCategory.name,
        color: editingCategory.color || "#6366F1",
        monthlyLimit: editingCategory.monthlyLimit
      });
    } else {
      form.reset({
        name: "",
        color: "#6366F1",
        monthlyLimit: null
      });
    }
  }, [editingCategory, form]);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all categories
      const categoryResponse = await axios.get(`${API_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Fetch category summary for budget progress
      const categorySummaryResponse = await axios.get(
        `${API_URL}/categories/summary?month=${currentMonth}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      // Merge data
      const categoriesData = categoryResponse.data.data;
      const summaryData = categorySummaryResponse.data.data;
      
      // Define a type for summary items
      interface CategorySummary {
        id: string;
        totalSpent: number;
        percentage: number | null;
        status: "green" | "yellow" | "red" | null;
      }

      // Map summary data to categories
      const enrichedCategories = categoriesData.map((category: Category) => {
        const summary = (summaryData as CategorySummary[]).find((s: CategorySummary) => s.id === category.id);
        return {
          ...category,
          totalSpent: summary?.totalSpent || 0,
          percentage: summary?.percentage || null,
          status: summary?.status || null
        };
      });
      
      setCategories(enrichedCategories);
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(
        err.response?.data?.message || "Failed to load categories"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      if (editingCategory) {
        // Update existing category
        await axios.put(
          `${API_URL}/categories/${editingCategory.id}`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        toast.success("Category updated", {
            description: `${values.name} has been updated successfully.`
        });
      } else {
        // Create new category
        await axios.post(
          `${API_URL}/categories`,
          values,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
        
        toast.success("Category updated", {
            description: `${values.name} has been updated successfully.`
        });
      }
      
      // Close dialog and refresh data
      setIsDialogOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Error saving category:", err);
      toast.error("Error", {
        description: err.response?.data?.message || "Failed to save category"
      });
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;
    
    try {
      await axios.delete(`${API_URL}/categories/${deletingCategory.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Close dialog and refresh data
      setDeleteConfirmOpen(false);
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      console.error("Error deleting category:", err);
      toast.error("Error", {
        description: err.response?.data?.message || "Failed to save category"
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setIsDialogOpen(true);
  };

  const openDeleteDialog = (category: Category) => {
    setDeletingCategory(category);
    setDeleteConfirmOpen(true);
  };

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Function to get status color
  const getStatusColor = (status: string | null) => {
    if (status === "green") return "bg-green-500";
    if (status === "yellow") return "bg-yellow-500";
    if (status === "red") return "bg-red-500";
    return "bg-gray-200";
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
            Error Loading Categories
          </h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchCategories}>Try Again</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
            <p className="text-muted-foreground">
              Manage your expense categories and budgets
            </p>
          </div>
          <Button onClick={() => {
            setEditingCategory(null);
            setIsDialogOpen(true);
          }} className="flex items-center gap-2">
            <PlusIcon className="h-4 w-4" />
            <span>Add Category</span>
          </Button>
        </div>

        {categories.length === 0 ? (
          <Card className="flex flex-col items-center justify-center text-center p-8">
            <CardHeader>
              <CardTitle>No Categories Yet</CardTitle>
              <CardDescription>
                Create your first expense category to start tracking your spending
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => {
                setEditingCategory(null);
                setIsDialogOpen(true);
              }}>
                Create Category
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Your Categories</CardTitle>
              <CardDescription>
                Manage categories and set monthly spending limits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Monthly Limit</TableHead>
                    <TableHead>Current Spend</TableHead>
                    <TableHead>Budget Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" style={{ backgroundColor: category.color, color: "#fff" }}>
                          {category.color}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {category.monthlyLimit ? formatCurrency(category.monthlyLimit) : "No limit"}
                      </TableCell>
                      <TableCell>
                        {formatCurrency(category.totalSpent || 0)}
                      </TableCell>
                      <TableCell>
                        {category.monthlyLimit ? (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span>{category.percentage}%</span>
                              {category.status && (
                                <Badge className={getStatusColor(category.status)}>
                                  {category.status === "green" && "Under Budget"}
                                  {category.status === "yellow" && "Near Limit"}
                                  {category.status === "red" && "Over Budget"}
                                </Badge>
                              )}
                            </div>
                            <Progress value={category.percentage || 0} className="h-2" />
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">No budget set</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(category)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => openDeleteDialog(category)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add/Edit Category Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add Category'}</DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Update your category details' 
                : 'Create a new expense category and set an optional monthly budget'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Groceries" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type="color" {...field} className="w-12 h-8 p-1" />
                      </FormControl>
                      <Input value={field.value} onChange={field.onChange} className="flex-1" />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="monthlyLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Budget Limit (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="e.g., 500" 
                        value={field.value === null ? "" : field.value}
                        onChange={e => field.onChange(e.target.value === "" ? null : Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Set a monthly spending limit for this category
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Save</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Category</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Categories;