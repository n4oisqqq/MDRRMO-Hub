import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { StatCard } from "@/components/stat-card";
import { SearchBar } from "@/components/search-bar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Users, Building2, Phone, Mail, Plus, Edit2, Trash2, Download, Printer, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Contact, ContactStats, InsertContact } from "@shared/schema";
import { insertContactSchema } from "@shared/schema";

export default function Contacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [agencyFilter, setAgencyFilter] = useState<string>("all");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: contacts = [], isLoading, refetch } = useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });

  const addMutation = useMutation({
    mutationFn: async (data: InsertContact) => {
      return apiRequest("/api/contacts", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setAddModalOpen(false);
      toast({ title: "Success", description: "Contact added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add contact", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ index, data }: { index: number; data: InsertContact }) => {
      return apiRequest(`/api/contacts/${index}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setEditModalOpen(false);
      setSelectedContact(null);
      toast({ title: "Success", description: "Contact updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update contact", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (index: number) => {
      return apiRequest(`/api/contacts/${index}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
      setDeleteDialogOpen(false);
      setSelectedContact(null);
      toast({ title: "Success", description: "Contact deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete contact", variant: "destructive" });
    },
  });

  const addForm = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
    defaultValues: {
      name: "",
      agency: "",
      designation: "",
      phoneNumber: "",
      email: "",
      address: "",
    },
  });

  const editForm = useForm<InsertContact>({
    resolver: zodResolver(insertContactSchema),
  });

  const stats: ContactStats = {
    totalContacts: contacts.length,
    agencies: [...new Set(contacts.map(c => c.agency))].length,
    phoneNumbers: contacts.filter(c => c.phoneNumber).length,
    emailAddresses: contacts.filter(c => c.email).length,
  };

  const agencies = [...new Set(contacts.map(c => c.agency))];

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.agency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.designation.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAgency = agencyFilter === "all" || contact.agency === agencyFilter;
    return matchesSearch && matchesAgency;
  });

  const handleEdit = (contact: Contact, index: number) => {
    setSelectedContact(contact);
    setSelectedIndex(index);
    editForm.reset({
      name: contact.name,
      agency: contact.agency,
      designation: contact.designation,
      phoneNumber: contact.phoneNumber,
      email: contact.email,
      address: contact.address || "",
    });
    setEditModalOpen(true);
  };

  const handleDelete = (contact: Contact, index: number) => {
    setSelectedContact(contact);
    setSelectedIndex(index);
    setDeleteDialogOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Name", "Agency", "Designation", "Phone", "Email", "Address"];
    const rows = filteredContacts.map((c) => [
      c.name, c.agency, c.designation, c.phoneNumber, c.email, c.address || ""
    ]);
    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contacts_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Contacts exported to CSV" });
  };

  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1E32" }}>
      <BackgroundPattern />
      <Header title="CONTACT DIRECTORY" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div 
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: "rgba(14, 33, 72, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(121, 101, 193, 0.4)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2" style={{ borderColor: "rgba(121, 101, 193, 0.4)" }}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6F42C1, #6F42C1CC)" }}
                >
                  <Users className="w-6 h-6 text-white" />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{ color: "#E3D095", textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
                  data-testid="text-contacts-title"
                >
                  Contact Directory
                </h2>
              </div>
              <SearchBar 
                value={searchQuery} 
                onChange={setSearchQuery} 
                placeholder="Search contacts by name, agency, or designation..." 
              />
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard icon={Users} value={stats.totalContacts} label="Total Contacts" color="#6F42C1" loading={isLoading} />
              <StatCard icon={Building2} value={stats.agencies} label="Agencies" color="#007BFF" loading={isLoading} />
              <StatCard icon={Phone} value={stats.phoneNumbers} label="Phone Numbers" color="#28A745" loading={isLoading} />
              <StatCard icon={Mail} value={stats.emailAddresses} label="Email Addresses" color="#E69500" loading={isLoading} />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <select
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value)}
                className="px-4 py-2 rounded-lg text-sm font-medium outline-none"
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  color: "#E3D095",
                  border: "1px solid rgba(121, 101, 193, 0.4)"
                }}
                data-testid="select-agency"
              >
                <option value="all">All Agencies</option>
                {agencies.map(agency => (
                  <option key={agency} value={agency}>{agency}</option>
                ))}
              </select>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  className="rounded-lg px-4 gap-2"
                  style={{ background: "#6F42C1", color: "white" }}
                  onClick={() => { addForm.reset(); setAddModalOpen(true); }}
                  data-testid="button-add-contact"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
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
              <LoadingSpinner message="Loading contacts..." />
            ) : filteredContacts.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No contacts found"
                description={searchQuery ? "Try adjusting your search criteria." : "Start by adding your first contact."}
                actionLabel="Add Contact"
                onAction={() => { addForm.reset(); setAddModalOpen(true); }}
              />
            ) : (
              <div 
                className="rounded-xl overflow-hidden print:overflow-visible"
                style={{ boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)" }}
              >
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                    <thead>
                      <tr style={{ background: "linear-gradient(135deg, #7965C1, #483AA0)" }}>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">Name</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden md:table-cell">Agency</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden lg:table-cell">Designation</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white">Phone</th>
                        <th className="text-left px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white hidden md:table-cell">Email</th>
                        <th className="text-center px-4 py-3 text-sm font-semibold uppercase tracking-wide text-white print:hidden">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact, idx) => (
                        <tr 
                          key={contact.id}
                          className="transition-all duration-200 hover:scale-[1.01]"
                          style={{ 
                            background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.03)",
                            borderBottom: "1px solid rgba(121, 101, 193, 0.2)"
                          }}
                          data-testid={`row-contact-${contact.id}`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                                style={{ background: "linear-gradient(135deg, #6F42C1, #f30059)", color: "white" }}
                              >
                                {contact.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="font-semibold" style={{ color: "#E3D095" }}>{contact.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell" style={{ color: "#E3D095" }}>{contact.agency}</td>
                          <td className="px-4 py-3 hidden lg:table-cell" style={{ color: "#E3D095" }}>{contact.designation}</td>
                          <td className="px-4 py-3">
                            <a 
                              href={`tel:${contact.phoneNumber}`}
                              className="flex items-center gap-2 hover:underline"
                              style={{ color: "#E3D095" }}
                            >
                              <Phone className="w-4 h-4" style={{ color: "#f30059" }} />
                              {contact.phoneNumber}
                            </a>
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell">
                            <a 
                              href={`mailto:${contact.email}`}
                              className="flex items-center gap-2 hover:underline"
                              style={{ color: "#E3D095" }}
                            >
                              <Mail className="w-4 h-4" style={{ color: "#f30059" }} />
                              {contact.email}
                            </a>
                          </td>
                          <td className="px-4 py-3 print:hidden">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: "#E3D095" }}
                                onClick={() => handleEdit(contact, idx)}
                                data-testid={`button-edit-${contact.id}`}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button 
                                className="p-2 rounded-lg transition-colors hover:bg-white/10"
                                style={{ color: "#DC3545" }}
                                onClick={() => handleDelete(contact, idx)}
                                data-testid={`button-delete-${contact.id}`}
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
            <DialogTitle style={{ color: "#E3D095" }}>Add New Contact</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>
              Fill in the details to add a new contact.
            </DialogDescription>
          </DialogHeader>
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit((data) => addMutation.mutate(data))} className="space-y-4">
              <FormField
                control={addForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-contact-name" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Agency</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-agency" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Designation</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-designation" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-contact-phone" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-contact-email" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={addForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-contact-address" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addMutation.isPending} style={{ background: "#6F42C1" }} data-testid="button-submit-add">
                  {addMutation.isPending ? "Adding..." : "Add Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Edit Contact</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>
              Update the contact details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((data) => {
                if (selectedIndex !== null) updateMutation.mutate({ index: selectedIndex, data });
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Full Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-edit-contact-name" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="agency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Agency</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-contact-agency" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Designation</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-contact-designation" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-edit-contact-phone" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel style={{ color: "#E3D095" }}>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} data-testid="input-edit-contact-email" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel style={{ color: "#E3D095" }}>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea {...field} data-testid="input-edit-contact-address" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateMutation.isPending} style={{ background: "#6F42C1" }} data-testid="button-submit-edit">
                  {updateMutation.isPending ? "Updating..." : "Update Contact"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#E3D095" }}>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>
              Are you sure you want to delete "{selectedContact?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (selectedIndex !== null) deleteMutation.mutate(selectedIndex); }}
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
