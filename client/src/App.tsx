import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import Inventory from "@/pages/inventory";
import CalendarPage from "@/pages/calendar";
import Contacts from "@/pages/contacts";
import Documents from "@/pages/documents";
import Gallery from "@/pages/gallery";
import Maps from "@/pages/maps";
import Panorama from "@/pages/panorama";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/calendar" component={CalendarPage} />
      <Route path="/contacts" component={Contacts} />
      <Route path="/documents" component={Documents} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/maps" component={Maps} />
      <Route path="/panorama" component={Panorama} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
