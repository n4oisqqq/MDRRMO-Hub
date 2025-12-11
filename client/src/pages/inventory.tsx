import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { StatCard } from "@/components/stat-card";
import { SearchBar } from "@/components/search-bar";
import { StatusPill } from "@/components/status-pill";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import {
  Package,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Plus,
  Download,
  RefreshCw,
  Edit2,
  Trash2,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { InventoryItem, InventoryStats, InsertInventoryItem } from "@shared/schema";
import { insertInventorySchema } from "@shared/schema";

export default function Inventory() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const {
    data: items = [],
    isLoading,
    refetch,
  } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertInventoryItem) => {
      return apiRequest("/api/inventory", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setAddModalOpen(false);
      toast({ title: "Success", description: "Item added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add item", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ index, data }: { index: number; data: InsertInventoryItem }) => {
      return apiRequest(`/api/inventory/${index}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setEditModalOpen(false);
      setSelectedItem(null);
      toast({ title: "Success", description: "Item updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update item", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (index: number) => {
      return apiRequest(`/api/inventory/${index}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setDeleteDialogOpen(false);
      setSelectedItem(null);
      toast({ title: "Success", description: "Item deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete item", variant: "destructive" });
    },
  });

  const addForm = useForm<InsertInventoryItem>({
    resolver: zodResolver(insertInventorySchema),
    defaultValues: {
      itemName: "",
      itemDescription: "",
      itemCategory: "",
      itemLocation: "",
      currentStock: 0,
      itemUnit: "",
      itemStatus: "In Stock",
    },
  });

  const editForm = useForm<InsertInventoryItem>({
    resolver: zodResolver(insertInventorySchema),
  });

  const stats: InventoryStats = {
    totalItems: items.length,
    inStock: items.filter((i) => i.itemStatus === "In Stock").length,
    lowStock: items.filter((i) => i.itemStatus === "Low Stock").length,
    outOfStock: items.filter((i) => i.itemStatus === "Out of Stock").length,
  };

  const categories = [...new Set(items.map((i) => i.itemCategory))];

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemLocation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.itemCategory === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleEdit = (item: InventoryItem, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    editForm.reset({
      itemName: item.itemName,
      itemDescription: item.itemDescription,
      itemCategory: item.itemCategory,
      itemLocation: item.itemLocation,
      currentStock: item.currentStock,
      itemUnit: item.itemUnit,
      itemStatus: item.itemStatus,
    });
    setEditModalOpen(true);
  };

  const handleDelete = (item: InventoryItem, index: number) => {
    setSelectedItem(item);
    setSelectedIndex(index);
    setDeleteDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Item Name", "Description", "Category", "Location", "Stock", "Unit", "Status"];
    const rows = filteredItems.map((item) => [
      item.itemName,
      item.itemDescription,
      item.itemCategory,
      item.itemLocation,
      item.currentStock.toString(),
      item.itemUnit,
      item.itemStatus,
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Inventory exported to CSV" });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#1A1E32" }}
    >
      <BackgroundPattern />
      <Header title="SUPPLY INVENTORY" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: "rgba(14, 33, 72, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(121, 101, 193, 0.4)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: "rgba(121, 101, 193, 0.4)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                  }}
                >
                  <Package className="w-6 h-6 text-white" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{
                    color: "#E3D095",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                  data-testid="text-inventory-title"
                >
                  Supply Inventory
                </h2>
              </div>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search items by name, description, or location..."
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={Package}
                value={stats.totalItems}
                label="Total Items"
                color="#007BFF"
                loading={isLoading}
              />
              <StatCard
                icon={CheckCircle}
                value={stats.inStock}
                label="In Stock"
                color="#28A745"
                loading={isLoading}
              />
              <StatCard
                icon={AlertTriangle}
                value={stats.lowStock}
                label="Low Stock"
                color="#FFC107"
                loading={isLoading}
              />
              <StatCard
                icon={XCircle}
                value={stats.outOfStock}
                label="Out of Stock"
                color="#DC3545"
                loading={isLoading}
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-4 py-2 rounded-lg text-sm font-medium outline-none"
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                    color: "#E3D095",
                    border: "1px solid rgba(121, 101, 193, 0.4)",
                  }}
                  data-testid="select-category"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  className="rounded-lg px-4 gap-2"
                  style={{ background: "#00A38D", color: "white" }}
                  onClick={() => {
                    addForm.reset();
                    setAddModalOpen(true);
                  }}
                  data-testid="button-add-item"
                >
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg px-4 gap-2 border-[rgba(121,101,193,0.4)]"
                  style={{ color: "#E3D095" }}
                  onClick={exportToCSV}
                  data-testid="button-export"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </Button>
                <Button
                  variant="outline"
                  className="rounded-lg px-4 gap-2 border-[rgba(121,101,193,0.4)]"
                  style={{ color: "#E3D095" }}
                  onClick={handlePrint}
                  data-testid="button-print"
                >
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-lg border-[rgba(121,101,193,0.4)]"
                  style={{ color: "#E3D095" }}
                  onClick={() => refetch()}
                  data-testid="button-refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading ? (
              <LoadingSpinner message="Loading inventory..." />
            ) : filteredItems.length === 0 ? (
              <EmptyState
                icon={Package}
                title="No items found"
                description={
                  searchQuery
                    ? "Try adjusting your search or filter criteria."
                    : "Start by adding your first inventory item."
                }
                actionLabel="Add Item"
                onAction={() => {
                  addForm.reset();
                  setAddModalOpen(true);
                }}
              />
            ) : (
              <div
                className="rounded-xl overflow-hidden print:overflow-visible"
                style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
              >
                <div className="overflow-x-auto print:overflow-visible">
                  <table
                    className="w-full"
                    style={{ background: "rgba(255, 255, 255, 0.05)" }}
                  >
                    <thead>
                      <tr
                        style={{
                          background:
                            "linear-gradient(135deg, #7965C1, #483AA0)",
                        }}
                      >
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Item Name
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden md:table-cell">
                          Category
                        </th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden lg:table-cell">
                          Location
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Stock
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">
                          Status
                        </th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white print:hidden">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredItems.map((item, idx) => (
                        <tr
                          key={item.id}
                          className="transition-all duration-200 hover:scale-[1.01]"
                          style={{
                            background:
                              idx % 2 === 0
                                ? "transparent"
                                : "rgba(255, 255, 255, 0.03)",
                            borderBottom: "1px solid rgba(121, 101, 193, 0.2)",
                          }}
                          data-testid={`row-item-${item.id}`}
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p
                                className="font-semibold"
                                style={{ color: "#E3D095" }}
                              >
                                {item.itemName}
                              </p>
                              <p
                                className="text-xs"
                                style={{ color: "rgba(227, 208, 149, 0.6)" }}
                              >
                                {item.itemDescription}
                              </p>
                            </div>
                          </td>
                          <td
                            className="px-4 py-3 hidden md:table-cell"
                            style={{ color: "#E3D095" }}
                          >
                            {item.itemCategory}
                          </td>
                          <td
                            className="px-4 py-3 hidden lg:table-cell"
                            style={{ color: "#E3D095" }}
                          >
                            {item.itemLocation}
                          </td>
                          <td
                            className="px-4 py-3 text-center"
                            style={{ color: "#E3D095" }}
                          >
                            <span className="font-bold">
                              {item.currentStock}
                            </span>
                            <span
                              className="text-xs ml-1"
                              style={{ color: "rgba(227, 208, 149, 0.6)" }}
                            >
                              {item.itemUnit}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <StatusPill status={item.itemStatus} />
                          </td>
                          <td className="px-4 py-3 print:hidden">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: "#E3D095" }}
                                onClick={() => handleEdit(item, idx)}
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: "#DC3545" }}
                                onClick={() => handleDelete(item, idx)}
                                data-testid={`button-delete-${item.id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Add New Item</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>
              Fill in the details to add a new inventory item.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-item-name" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={addForm.control}
                name="itemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-item-description" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="itemCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Category</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-item-category" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="itemLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Location</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-item-location" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-item-stock"
                          className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="itemUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Unit</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="pcs, kg, etc." data-testid="input-item-unit" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="itemStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-item-status" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={addMutation.isPending} style={{ background: "#00A38D" }} data-testid="button-submit-add">
                  {addMutation.isPending ? "Adding..." : "Add Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Edit Item</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>
              Update the details of this inventory item.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((data) => {
                if (selectedIndex !== null) {
                  updateMutation.mutate({ index: selectedIndex, data });
                }
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="itemName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Item Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-item-name" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="itemDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-edit-item-description" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="itemCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Category</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-item-category" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="itemLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Location</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-item-location" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="currentStock"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Stock</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-edit-item-stock"
                          className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="itemUnit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Unit</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-item-unit" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="itemStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-item-status" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="In Stock">In Stock</SelectItem>
                        <SelectItem value="Low Stock">Low Stock</SelectItem>
                        <SelectItem value="Out of Stock">Out of Stock</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateMutation.isPending} style={{ background: "#00A38D" }} data-testid="button-submit-edit">
                  {updateMutation.isPending ? "Updating..." : "Update Item"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#E3D095" }}>Delete Item</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>
              Are you sure you want to delete "{selectedItem?.itemName}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedIndex !== null) {
                  deleteMutation.mutate(selectedIndex);
                }
              }}
              style={{ background: "#DC3545" }}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
