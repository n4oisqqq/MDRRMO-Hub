import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export interface InventoryItem {
  id: string;
  itemName: string;
  itemDescription: string;
  itemCategory: string;
  itemLocation: string;
  currentStock: number;
  itemUnit: string;
  itemStatus: "In Stock" | "Low Stock" | "Out of Stock";
}

export interface CalendarEvent {
  id: string;
  eventName: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  priority?: "High" | "Medium" | "Low";
}

export interface CalendarTask {
  id: string;
  taskName: string;
  dateTime: string;
  deadlineDateTime: string;
  description: string;
  status: "Upcoming" | "Overdue" | "Complete";
}

export interface Contact {
  id: string;
  name: string;
  agency: string;
  designation: string;
  phoneNumber: string;
  email: string;
  address?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
}

export interface DriveFolder {
  id: string;
  name: string;
  files?: DriveFile[];
  subfolders?: DriveFolder[];
}

export interface GalleryImage {
  id: string;
  name: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  description?: string;
  createdTime?: string;
  folder?: string;
}

export interface HazardZone {
  id: string;
  name: string;
  type: "flood" | "landslide" | "storm-surge" | "earthquake";
  riskLevel: "High" | "Medium" | "Low";
  coordinates: { lat: number; lng: number }[];
  description?: string;
  affectedBarangays?: string[];
  lastAssessment?: string;
}

export interface MapAsset {
  id: string;
  name: string;
  type: "evacuation-center" | "equipment" | "medical" | "rescue-vehicle" | "command-post";
  status: "available" | "low" | "deployed" | "unavailable";
  position: { lat: number; lng: number };
  description?: string;
  capacity?: number;
}

export interface MapLayer {
  id: string;
  name: string;
  type: "interactive" | "administrative" | "topographic" | "land-use" | "hazards" | "other" | "google-open";
  active: boolean;
  opacity?: number;
  folderId?: string;
  expanded?: boolean;
}

export interface GoogleOpenMap {
  id: string;
  name: string;
  iframeSrc: string;
}

export interface MapFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  thumbnailLink?: string;
}

export interface InventoryStats {
  totalItems: number;
  inStock: number;
  lowStock: number;
  outOfStock: number;
}

export interface ContactStats {
  totalContacts: number;
  agencies: number;
  phoneNumbers: number;
  emailAddresses: number;
}

export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  route: string;
}