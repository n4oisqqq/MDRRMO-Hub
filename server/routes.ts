import type { Express } from "express";
import { createServer, type Server } from "http";
import { getInventoryItems, getCalendarEvents, getCalendarTasks, getContacts } from "./google-sheets";
import { getDocumentFolders, getGalleryFolders, getGalleryImages, getAdministrativeMaps, getMapFolderContents, getSubfolderContents } from "./google-drive";
import { getHazardZones, getMapAssets } from "./maps-data";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Inventory API endpoints
  app.get("/api/inventory", async (req, res) => {
    try {
      const items = await getInventoryItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching inventory:", error);
      res.status(500).json({ error: "Failed to fetch inventory data" });
    }
  });

  // Calendar API endpoints
  app.get("/api/calendar/events", async (req, res) => {
    try {
      const events = await getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/tasks", async (req, res) => {
    try {
      const tasks = await getCalendarTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching calendar tasks:", error);
      res.status(500).json({ error: "Failed to fetch calendar tasks" });
    }
  });

  // Contacts API endpoints
  app.get("/api/contacts", async (req, res) => {
    try {
      const contacts = await getContacts();
      res.json(contacts);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      res.status(500).json({ error: "Failed to fetch contacts" });
    }
  });

  // Documents API endpoints
  app.get("/api/documents", async (req, res) => {
    try {
      const folders = await getDocumentFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ error: "Failed to fetch documents" });
    }
  });

  // Gallery API endpoints
  app.get("/api/gallery/folders", async (req, res) => {
    try {
      const folders = await getGalleryFolders();
      res.json(folders);
    } catch (error) {
      console.error("Error fetching gallery folders:", error);
      res.status(500).json({ error: "Failed to fetch gallery folders" });
    }
  });

  app.get("/api/gallery/images", async (req, res) => {
    try {
      const folderId = req.query.folderId as string;
      if (!folderId) {
        return res.status(400).json({ error: "Folder ID is required" });
      }
      const images = await getGalleryImages(folderId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching gallery images:", error);
      res.status(500).json({ error: "Failed to fetch gallery images" });
    }
  });

  // Maps API endpoints
  app.get("/api/maps/hazards", async (req, res) => {
    try {
      const zones = getHazardZones();
      res.json(zones);
    } catch (error) {
      console.error("Error fetching hazard zones:", error);
      res.status(500).json({ error: "Failed to fetch hazard zones" });
    }
  });

  app.get("/api/maps/assets", async (req, res) => {
    try {
      const assets = getMapAssets();
      res.json(assets);
    } catch (error) {
      console.error("Error fetching map assets:", error);
      res.status(500).json({ error: "Failed to fetch map assets" });
    }
  });

  app.get("/api/maps/administrative", async (req, res) => {
    try {
      const maps = await getAdministrativeMaps();
      res.json(maps);
    } catch (error) {
      console.error("Error fetching administrative maps:", error);
      res.status(500).json({ error: "Failed to fetch administrative maps" });
    }
  });

  app.get("/api/maps/topographic", async (req, res) => {
    try {
      const maps = await getMapFolderContents('topographic');
      res.json(maps);
    } catch (error) {
      console.error("Error fetching topographic maps:", error);
      res.status(500).json({ error: "Failed to fetch topographic maps" });
    }
  });

  app.get("/api/maps/land-use", async (req, res) => {
    try {
      const maps = await getMapFolderContents('land-use');
      res.json(maps);
    } catch (error) {
      console.error("Error fetching land use maps:", error);
      res.status(500).json({ error: "Failed to fetch land use maps" });
    }
  });

  app.get("/api/maps/hazards-files", async (req, res) => {
    try {
      const maps = await getMapFolderContents('hazards');
      res.json(maps);
    } catch (error) {
      console.error("Error fetching hazard maps:", error);
      res.status(500).json({ error: "Failed to fetch hazard maps" });
    }
  });

  app.get("/api/maps/other", async (req, res) => {
    try {
      const maps = await getMapFolderContents('other');
      res.json(maps);
    } catch (error) {
      console.error("Error fetching other maps:", error);
      res.status(500).json({ error: "Failed to fetch other maps" });
    }
  });

  app.get("/api/maps/subfolder/:folderId", async (req, res) => {
    try {
      const { folderId } = req.params;
      const folder = await getSubfolderContents(folderId);
      res.json(folder);
    } catch (error) {
      console.error("Error fetching subfolder contents:", error);
      res.status(500).json({ error: "Failed to fetch subfolder contents" });
    }
  });

  return httpServer;
}
