import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
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
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  CheckSquare,
  Edit2,
  Trash2,
  Download,
  Printer,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CalendarEvent, CalendarTask, InsertCalendarEvent, InsertCalendarTask } from "@shared/schema";
import { insertEventSchema, insertTaskSchema } from "@shared/schema";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function CalendarPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [editEventOpen, setEditEventOpen] = useState(false);
  const [deleteEventOpen, setDeleteEventOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editTaskOpen, setEditTaskOpen] = useState(false);
  const [deleteTaskOpen, setDeleteTaskOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedTask, setSelectedTask] = useState<CalendarTask | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading: eventsLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery<CalendarTask[]>({
    queryKey: ["/api/calendar/tasks"],
  });

  const isLoading = eventsLoading || tasksLoading;

  const addEventMutation = useMutation({
    mutationFn: async (data: InsertCalendarEvent) => {
      return apiRequest("/api/calendar/events", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setAddEventOpen(false);
      toast({ title: "Success", description: "Event added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add event", variant: "destructive" });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ index, data }: { index: number; data: InsertCalendarEvent }) => {
      return apiRequest(`/api/calendar/events/${index}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setEditEventOpen(false);
      toast({ title: "Success", description: "Event updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update event", variant: "destructive" });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (index: number) => {
      return apiRequest(`/api/calendar/events/${index}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
      setDeleteEventOpen(false);
      toast({ title: "Success", description: "Event deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete event", variant: "destructive" });
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: async (data: InsertCalendarTask) => {
      return apiRequest("/api/calendar/tasks", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/tasks"] });
      setAddTaskOpen(false);
      toast({ title: "Success", description: "Task added successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to add task", variant: "destructive" });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ index, data }: { index: number; data: InsertCalendarTask }) => {
      return apiRequest(`/api/calendar/tasks/${index}`, {
        method: "PUT",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/tasks"] });
      setEditTaskOpen(false);
      toast({ title: "Success", description: "Task updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (index: number) => {
      return apiRequest(`/api/calendar/tasks/${index}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/tasks"] });
      setDeleteTaskOpen(false);
      toast({ title: "Success", description: "Task deleted successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete task", variant: "destructive" });
    },
  });

  const eventForm = useForm<InsertCalendarEvent>({
    resolver: zodResolver(insertEventSchema),
    defaultValues: { eventName: "", date: "", time: "", location: "", notes: "", priority: "Medium" },
  });

  const editEventForm = useForm<InsertCalendarEvent>({
    resolver: zodResolver(insertEventSchema),
  });

  const taskForm = useForm<InsertCalendarTask>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: { taskName: "", dateTime: "", deadlineDateTime: "", description: "", status: "Upcoming" },
  });

  const editTaskForm = useForm<InsertCalendarTask>({
    resolver: zodResolver(insertTaskSchema),
  });

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    const days: (number | null)[] = [];
    for (let i = 0; i < startingDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [currentDate]);

  const eventDates = useMemo(() => {
    const dates = new Set<string>();
    events.forEach((e) => {
      const d = new Date(e.date);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [events]);

  const taskDates = useMemo(() => {
    const dates = new Set<string>();
    tasks.forEach((t) => {
      const d = new Date(t.dateTime);
      dates.add(`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`);
    });
    return dates;
  }, [tasks]);

  const filteredEvents = events.filter((e) =>
    e.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTasks = tasks.filter((t) =>
    t.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const navigateMonth = (direction: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && currentDate.getMonth() === today.getMonth() && currentDate.getFullYear() === today.getFullYear();
  };

  const hasEvent = (day: number) => eventDates.has(`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`);
  const hasTask = (day: number) => taskDates.has(`${currentDate.getFullYear()}-${currentDate.getMonth()}-${day}`);

  const handleEditEvent = (event: CalendarEvent, index: number) => {
    setSelectedEvent(event);
    setSelectedIndex(index);
    editEventForm.reset({
      eventName: event.eventName,
      date: event.date,
      time: event.time,
      location: event.location,
      notes: event.notes,
      priority: event.priority || "Medium",
    });
    setEditEventOpen(true);
  };

  const handleDeleteEvent = (event: CalendarEvent, index: number) => {
    setSelectedEvent(event);
    setSelectedIndex(index);
    setDeleteEventOpen(true);
  };

  const handleEditTask = (task: CalendarTask, index: number) => {
    setSelectedTask(task);
    setSelectedIndex(index);
    editTaskForm.reset({
      taskName: task.taskName,
      dateTime: task.dateTime,
      deadlineDateTime: task.deadlineDateTime,
      description: task.description,
      status: task.status,
    });
    setEditTaskOpen(true);
  };

  const handleDeleteTask = (task: CalendarTask, index: number) => {
    setSelectedTask(task);
    setSelectedIndex(index);
    setDeleteTaskOpen(true);
  };

  const exportToCSV = () => {
    const headers = ["Type", "Name", "Date/Time", "Location/Deadline", "Status/Priority", "Notes/Description"];
    const eventRows = filteredEvents.map((e) => ["Event", e.eventName, `${e.date} ${e.time}`, e.location, e.priority || "", e.notes]);
    const taskRows = filteredTasks.map((t) => ["Task", t.taskName, t.dateTime, t.deadlineDateTime, t.status, t.description]);
    const csvContent = [headers.join(","), ...eventRows.map((r) => r.join(",")), ...taskRows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `calendar_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", description: "Calendar exported to CSV" });
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
      <BackgroundPattern />
      <Header title="CALENDAR OF ACTIVITIES" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8 backdrop-blur-xl"
            style={{ background: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.2)", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)" }}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2" style={{ borderColor: "rgba(255, 255, 255, 0.2)" }}>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: "linear-gradient(135deg, #45B7D1, #96CEB4)", boxShadow: "0 10px 25px rgba(69, 183, 209, 0.3)" }}>
                  <CalendarIcon className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: "#FFFFFF", textShadow: "0 4px 12px rgba(0, 0, 0, 0.2)" }} data-testid="text-calendar-title">
                  Calendar of Activities
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search events or tasks..." />
                <Button
                  className="rounded-xl px-4 gap-2 font-bold shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #45B7D1, #96CEB4)", color: "white" }}
                  onClick={() => { eventForm.reset(); setAddEventOpen(true); }}
                  data-testid="button-add-event"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </Button>
                <Button
                  className="rounded-xl px-4 gap-2 font-bold shadow-lg transition-all duration-300 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #96CEB4, #45B7D1)", color: "white" }}
                  onClick={() => { taskForm.reset(); setAddTaskOpen(true); }}
                  data-testid="button-add-task"
                >
                  <Plus className="w-4 h-4" />
                  Add Task
                </Button>
                <Button variant="outline" className="rounded-xl px-4 gap-2" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} onClick={exportToCSV} data-testid="button-export">
                  <Download className="w-4 h-4" />
                  Export
                </Button>
                <Button variant="outline" className="rounded-xl px-4 gap-2" style={{ color: "white", borderColor: "rgba(255,255,255,0.3)" }} onClick={() => window.print()} data-testid="button-print">
                  <Printer className="w-4 h-4" />
                  Print
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="rounded-2xl p-5 backdrop-blur-lg" style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => navigateMonth(-1)} className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110" style={{ color: "#FFFFFF" }} data-testid="button-prev-month">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-black" style={{ color: "#FFFFFF" }} data-testid="text-current-month">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <button onClick={() => navigateMonth(1)} className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110" style={{ color: "#FFFFFF" }} data-testid="button-next-month">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {DAYS.map((day) => (
                    <div key={day} className="text-center text-xs font-black py-2" style={{ color: "#FFFFFF" }}>{day}</div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDays.map((day, idx) => (
                    <div
                      key={idx}
                      onClick={() => day && setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                      className={`aspect-square flex flex-col items-center justify-center rounded-xl text-sm cursor-pointer transition-all duration-200 ${day ? "hover:bg-white/10 hover:scale-105" : ""}`}
                      style={{
                        background: day && isToday(day) ? "linear-gradient(135deg, #FF6B9D, #FF8E53)" : "transparent",
                        color: day ? "#FFFFFF" : "transparent",
                        fontWeight: day && isToday(day) ? "800" : "normal",
                        boxShadow: day && isToday(day) ? "0 4px 15px rgba(255, 107, 157, 0.4)" : "none",
                      }}
                      data-testid={day ? `calendar-day-${day}` : undefined}
                    >
                      {day}
                      {day && (hasEvent(day) || hasTask(day)) && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasEvent(day) && <span className="w-1.5 h-1.5 rounded-full bg-[#FFEAA7]" />}
                          {hasTask(day) && <span className="w-1.5 h-1.5 rounded-full bg-[#DDA0DD]" />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t" style={{ borderColor: "rgba(255, 255, 255, 0.15)" }}>
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <span className="w-2 h-2 rounded-full bg-[#FFEAA7]" /> Events
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "rgba(255, 255, 255, 0.8)" }}>
                    <span className="w-2 h-2 rounded-full bg-[#DDA0DD]" /> Tasks
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl p-5 backdrop-blur-lg" style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: "#FFFFFF" }}>
                    <CalendarIcon className="w-6 h-6" style={{ color: "#45B7D1" }} />
                    Event Schedule
                  </h3>

                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : filteredEvents.length === 0 ? (
                    <EmptyState icon={CalendarIcon} title="No events scheduled" description="Add your first event to get started." actionLabel="Add Event" onAction={() => { eventForm.reset(); setAddEventOpen(true); }} />
                  ) : (
                    <div className="rounded-xl overflow-hidden shadow-lg print:overflow-visible" style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(5px)" }}>
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full">
                          <thead>
                            <tr style={{ background: "linear-gradient(135deg, #45B7D1, #96CEB4)", boxShadow: "0 4px 15px rgba(69, 183, 209, 0.2)" }}>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white">Event Name</th>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white hidden md:table-cell">Date & Time</th>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white hidden lg:table-cell">Location</th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white">Priority</th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white print:hidden">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredEvents.map((event, idx) => (
                              <tr
                                key={event.id}
                                className="transition-all duration-200 hover:bg-white/5"
                                style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}
                                data-testid={`event-row-${event.id}`}
                              >
                                <td className="px-4 py-4">
                                  <div>
                                    <p className="font-bold text-white">{event.eventName}</p>
                                    {event.notes && <p className="text-xs opacity-80 text-white mt-1 line-clamp-1">{event.notes}</p>}
                                  </div>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell text-white font-medium">
                                  <div className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{new Date(event.date).toLocaleDateString()}</div>
                                  <div className="flex items-center gap-1 text-xs opacity-80 mt-1"><Clock className="w-3 h-3" />{event.time}</div>
                                </td>
                                <td className="px-4 py-4 hidden lg:table-cell text-white font-medium">
                                  <div className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  {event.priority && (
                                    <span
                                      className="px-2 py-1 rounded-full text-xs font-black"
                                      style={{
                                        background: event.priority === "High" ? "linear-gradient(135deg, #FF6B9D, #FF8E53)" : event.priority === "Medium" ? "linear-gradient(135deg, #FFEAA7, #FFD166)" : "linear-gradient(135deg, #45B7D1, #96CEB4)",
                                        color: event.priority === "Medium" ? "#333" : "#FFFFFF",
                                      }}
                                    >
                                      {event.priority}
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-4 print:hidden">
                                  <div className="flex items-center justify-center gap-2">
                                    <button className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110" style={{ color: "#45B7D1" }} onClick={() => handleEditEvent(event, idx)} data-testid={`button-edit-event-${event.id}`}>
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110" style={{ color: "#FF6B9D" }} onClick={() => handleDeleteEvent(event, idx)} data-testid={`button-delete-event-${event.id}`}>
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

                <div className="rounded-2xl p-5 backdrop-blur-lg" style={{ background: "rgba(255, 255, 255, 0.1)", border: "1px solid rgba(255, 255, 255, 0.15)" }}>
                  <h3 className="text-xl font-black mb-4 flex items-center gap-2" style={{ color: "#FFFFFF" }}>
                    <CheckSquare className="w-6 h-6" style={{ color: "#96CEB4" }} />
                    Task Schedule
                  </h3>

                  {isLoading ? (
                    <LoadingSpinner size="sm" />
                  ) : filteredTasks.length === 0 ? (
                    <EmptyState icon={CheckSquare} title="No tasks scheduled" description="Add tasks to track your deadlines." actionLabel="Add Task" onAction={() => { taskForm.reset(); setAddTaskOpen(true); }} />
                  ) : (
                    <div className="rounded-xl overflow-hidden shadow-lg print:overflow-visible" style={{ background: "rgba(255, 255, 255, 0.05)", backdropFilter: "blur(5px)" }}>
                      <div className="overflow-x-auto print:overflow-visible">
                        <table className="w-full">
                          <thead>
                            <tr style={{ background: "linear-gradient(135deg, #96CEB4, #45B7D1)", boxShadow: "0 4px 15px rgba(150, 206, 180, 0.2)" }}>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white">Task Name</th>
                              <th className="text-left px-4 py-3 text-sm font-black uppercase tracking-wide text-white hidden md:table-cell">Deadline</th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white">Status</th>
                              <th className="text-center px-4 py-3 text-sm font-black uppercase tracking-wide text-white print:hidden">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTasks.map((task, idx) => (
                              <tr
                                key={task.id}
                                className="transition-all duration-200 hover:bg-white/5"
                                style={{ background: idx % 2 === 0 ? "transparent" : "rgba(255, 255, 255, 0.03)", borderBottom: "1px solid rgba(255, 255, 255, 0.1)" }}
                                data-testid={`task-row-${task.id}`}
                              >
                                <td className="px-4 py-4">
                                  <div>
                                    <p className={`font-bold ${task.status === "Complete" ? "line-through opacity-60" : ""}`} style={{ color: "#FFFFFF" }}>{task.taskName}</p>
                                    {task.description && <p className="text-xs opacity-80 text-white mt-1 line-clamp-1">{task.description}</p>}
                                  </div>
                                </td>
                                <td className="px-4 py-4 hidden md:table-cell text-white font-medium">
                                  <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(task.deadlineDateTime).toLocaleString()}</div>
                                </td>
                                <td className="px-4 py-4 text-center">
                                  <span
                                    className="px-2 py-1 rounded-full text-xs font-black"
                                    style={{
                                      background: task.status === "Complete" ? "linear-gradient(135deg, #96CEB4, #45B7D1)" : task.status === "Overdue" ? "linear-gradient(135deg, #FF6B9D, #FF8E53)" : "linear-gradient(135deg, #FFEAA7, #FFD166)",
                                      color: task.status === "Upcoming" ? "#333" : "#FFFFFF",
                                    }}
                                  >
                                    {task.status}
                                  </span>
                                </td>
                                <td className="px-4 py-4 print:hidden">
                                  <div className="flex items-center justify-center gap-2">
                                    <button className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110" style={{ color: "#96CEB4" }} onClick={() => handleEditTask(task, idx)} data-testid={`button-edit-task-${task.id}`}>
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button className="p-2 rounded-xl transition-all duration-200 hover:bg-white/10 hover:scale-110" style={{ color: "#FF6B9D" }} onClick={() => handleDeleteTask(task, idx)} data-testid={`button-delete-task-${task.id}`}>
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
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Add New Event</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>Schedule a new event on the calendar.</DialogDescription>
          </DialogHeader>
          <Form {...eventForm}>
            <form onSubmit={eventForm.handleSubmit((data) => addEventMutation.mutate(data))} className="space-y-4">
              <FormField control={eventForm.control} name="eventName" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Event Name</FormLabel><FormControl><Input {...field} data-testid="input-event-name" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={eventForm.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Date</FormLabel><FormControl><Input type="date" {...field} data-testid="input-event-date" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={eventForm.control} name="time" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Time</FormLabel><FormControl><Input type="time" {...field} data-testid="input-event-time" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={eventForm.control} name="location" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Location</FormLabel><FormControl><Input {...field} data-testid="input-event-location" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={eventForm.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Priority</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-event-priority" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white"><SelectValue placeholder="Select priority" /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={eventForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Notes</FormLabel><FormControl><Textarea {...field} data-testid="input-event-notes" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddEventOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addEventMutation.isPending} style={{ background: "#45B7D1" }} data-testid="button-submit-event">{addEventMutation.isPending ? "Adding..." : "Add Event"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editEventOpen} onOpenChange={setEditEventOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Edit Event</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>Update event details.</DialogDescription>
          </DialogHeader>
          <Form {...editEventForm}>
            <form onSubmit={editEventForm.handleSubmit((data) => { if (selectedIndex !== null) updateEventMutation.mutate({ index: selectedIndex, data }); })} className="space-y-4">
              <FormField control={editEventForm.control} name="eventName" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Event Name</FormLabel><FormControl><Input {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editEventForm.control} name="date" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Date</FormLabel><FormControl><Input type="date" {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editEventForm.control} name="time" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Time</FormLabel><FormControl><Input type="time" {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editEventForm.control} name="location" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Location</FormLabel><FormControl><Input {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={editEventForm.control} name="priority" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Priority</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="High">High</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={editEventForm.control} name="notes" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Notes</FormLabel><FormControl><Textarea {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditEventOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateEventMutation.isPending} style={{ background: "#45B7D1" }}>{updateEventMutation.isPending ? "Updating..." : "Update Event"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteEventOpen} onOpenChange={setDeleteEventOpen}>
        <AlertDialogContent style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#E3D095" }}>Delete Event</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>Are you sure you want to delete "{selectedEvent?.eventName}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (selectedIndex !== null) deleteEventMutation.mutate(selectedIndex); }} style={{ background: "#DC3545" }}>{deleteEventMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Add New Task</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>Create a new task with deadline.</DialogDescription>
          </DialogHeader>
          <Form {...taskForm}>
            <form onSubmit={taskForm.handleSubmit((data) => addTaskMutation.mutate(data))} className="space-y-4">
              <FormField control={taskForm.control} name="taskName" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Task Name</FormLabel><FormControl><Input {...field} data-testid="input-task-name" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={taskForm.control} name="dateTime" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Start Date/Time</FormLabel><FormControl><Input type="datetime-local" {...field} data-testid="input-task-datetime" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={taskForm.control} name="deadlineDateTime" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Deadline</FormLabel><FormControl><Input type="datetime-local" {...field} data-testid="input-task-deadline" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={taskForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger data-testid="select-task-status" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Overdue">Overdue</SelectItem><SelectItem value="Complete">Complete</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={taskForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Description</FormLabel><FormControl><Textarea {...field} data-testid="input-task-description" className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={addTaskMutation.isPending} style={{ background: "#96CEB4" }} data-testid="button-submit-task">{addTaskMutation.isPending ? "Adding..." : "Add Task"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editTaskOpen} onOpenChange={setEditTaskOpen}>
        <DialogContent className="max-w-md" style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <DialogHeader>
            <DialogTitle style={{ color: "#E3D095" }}>Edit Task</DialogTitle>
            <DialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>Update task details.</DialogDescription>
          </DialogHeader>
          <Form {...editTaskForm}>
            <form onSubmit={editTaskForm.handleSubmit((data) => { if (selectedIndex !== null) updateTaskMutation.mutate({ index: selectedIndex, data }); })} className="space-y-4">
              <FormField control={editTaskForm.control} name="taskName" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Task Name</FormLabel><FormControl><Input {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={editTaskForm.control} name="dateTime" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Start Date/Time</FormLabel><FormControl><Input type="datetime-local" {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={editTaskForm.control} name="deadlineDateTime" render={({ field }) => (
                  <FormItem><FormLabel style={{ color: "#E3D095" }}>Deadline</FormLabel><FormControl><Input type="datetime-local" {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <FormField control={editTaskForm.control} name="status" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white"><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent><SelectItem value="Upcoming">Upcoming</SelectItem><SelectItem value="Overdue">Overdue</SelectItem><SelectItem value="Complete">Complete</SelectItem></SelectContent>
                  </Select><FormMessage /></FormItem>
              )} />
              <FormField control={editTaskForm.control} name="description" render={({ field }) => (
                <FormItem><FormLabel style={{ color: "#E3D095" }}>Description</FormLabel><FormControl><Textarea {...field} className="bg-white/10 border-[rgba(121,101,193,0.4)] text-white" /></FormControl><FormMessage /></FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditTaskOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={updateTaskMutation.isPending} style={{ background: "#96CEB4" }}>{updateTaskMutation.isPending ? "Updating..." : "Update Task"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteTaskOpen} onOpenChange={setDeleteTaskOpen}>
        <AlertDialogContent style={{ background: "#1A1E32", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: "#E3D095" }}>Delete Task</AlertDialogTitle>
            <AlertDialogDescription style={{ color: "rgba(227, 208, 149, 0.6)" }}>Are you sure you want to delete "{selectedTask?.taskName}"?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (selectedIndex !== null) deleteTaskMutation.mutate(selectedIndex); }} style={{ background: "#DC3545" }}>{deleteTaskMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
