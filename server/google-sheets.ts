// Google Sheets Integration for MDRRMO Pio Duran
// Using the google-sheet connector blueprint with shared token manager

import { google } from "googleapis";
import type {
  InventoryItem,
  CalendarEvent,
  CalendarTask,
  Contact,
  MapFrame,
  InsertInventoryItem,
  InsertCalendarEvent,
  InsertCalendarTask,
  InsertContact,
  InsertMapFrame,
} from "@shared/schema";
import { getGoogleSheetsToken } from "./google-token-manager";

const SPREADSHEET_ID =
  process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
  "1UtT9t2LZ5NEc-wbGv44mDeDjWLxOLBQHA5yy6jiLc7E";

async function getGoogleSheetsClient() {
  const accessToken = await getGoogleSheetsToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken,
  });

  return google.sheets({ version: "v4", auth: oauth2Client });
}

export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "supply!A2:G",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn("Google Sheet returned empty inventory data");
      return [];
    }

    return rows.map((row, index) => ({
      id: `inv-${index + 1}`,
      Item Name: row[0] || "",
      Category: row[1] || "",
      Quantity: row[2] || "",
      Unit: row[3] || "pcs",
      Location: parseInt(row[4]) || 0,
      Status: row[5] as InventoryItem["itemStatus"]) || "In Stock",
      Actions: (row[6] || "",
    }));
  } catch (error) {
    console.error("Error fetching inventory from Google Sheets:", error);
    throw error;
  }
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet2!A2:F",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn("Google Sheet returned empty calendar events");
      return [];
    }

    return rows.map((row, index) => ({
      id: `evt-${index + 1}`,
      eventName: row[0] || "",
      date: row[1] || "",
      time: row[2] || "",
      location: row[3] || "",
      notes: row[4] || "",
      priority: (row[5] as CalendarEvent["priority"]) || "Medium",
    }));
  } catch (error) {
    console.error("Error fetching calendar events from Google Sheets:", error);
    throw error;
  }
}

export async function getCalendarTasks(): Promise<CalendarTask[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet2!H2:L",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn("Google Sheet returned empty calendar tasks");
      return [];
    }

    return rows.map((row, index) => {
      const deadline = new Date(row[2]);
      const now = new Date();
      let status: CalendarTask["status"] =
        (row[4] as CalendarTask["status"]) || "Upcoming";
      if (!row[4] && deadline < now && status !== "Complete") {
        status = "Overdue";
      }

      return {
        id: `task-${index + 1}`,
        taskName: row[0] || "",
        dateTime: row[1] || "",
        deadlineDateTime: row[2] || "",
        description: row[3] || "",
        status,
      };
    });
  } catch (error) {
    console.error("Error fetching calendar tasks from Google Sheets:", error);
    throw error;
  }
}

export async function getContacts(): Promise<Contact[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet3!A2:F",
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn("Google Sheet returned empty contacts");
      return [];
    }

    return rows.map((row, index) => ({
      id: `contact-${index + 1}`,
      name: row[0] || "",
      agency: row[1] || "",
      designation: row[2] || "",
      phoneNumber: row[3] || "",
      email: row[4] || "",
      address: row[5] || "",
    }));
  } catch (error) {
    console.error("Error fetching contacts from Google Sheets:", error);
    throw error;
  }
}

export async function addInventoryItem(
  item: InsertInventoryItem,
): Promise<InventoryItem> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        item.itemName,
        item.itemDescription || "",
        item.itemCategory,
        item.itemLocation,
        item.currentStock.toString(),
        item.itemUnit,
        item.itemStatus,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet1!A:G",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    const items = await getInventoryItems();
    return items[items.length - 1];
  } catch (error) {
    console.error("Error adding inventory item:", error);
    throw error;
  }
}

export async function updateInventoryItem(
  rowIndex: number,
  item: InsertInventoryItem,
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        item.itemName,
        item.itemDescription || "",
        item.itemCategory,
        item.itemLocation,
        item.currentStock.toString(),
        item.itemUnit,
        item.itemStatus,
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet1!A${rowIndex + 2}:G${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }
}

export async function deleteInventoryItem(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const sheetId = 0;

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error deleting inventory item:", error);
    throw error;
  }
}

export async function addCalendarEvent(
  event: InsertCalendarEvent,
): Promise<CalendarEvent> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        event.eventName,
        event.date,
        event.time,
        event.location,
        event.notes || "",
        event.priority || "Medium",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet2!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    const events = await getCalendarEvents();
    return events[events.length - 1];
  } catch (error) {
    console.error("Error adding calendar event:", error);
    throw error;
  }
}

export async function updateCalendarEvent(
  rowIndex: number,
  event: InsertCalendarEvent,
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        event.eventName,
        event.date,
        event.time,
        event.location,
        event.notes || "",
        event.priority || "Medium",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet2!A${rowIndex + 2}:F${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating calendar event:", error);
    throw error;
  }
}

export async function deleteCalendarEvent(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet2!A${rowIndex + 2}:F${rowIndex + 2}`,
    });
  } catch (error) {
    console.error("Error deleting calendar event:", error);
    throw error;
  }
}

export async function addCalendarTask(
  task: InsertCalendarTask,
): Promise<CalendarTask> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        task.taskName,
        task.dateTime,
        task.deadlineDateTime,
        task.description || "",
        task.status || "Upcoming",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet2!H:L",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    const tasks = await getCalendarTasks();
    return tasks[tasks.length - 1];
  } catch (error) {
    console.error("Error adding calendar task:", error);
    throw error;
  }
}

export async function updateCalendarTask(
  rowIndex: number,
  task: InsertCalendarTask,
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        task.taskName,
        task.dateTime,
        task.deadlineDateTime,
        task.description || "",
        task.status || "Upcoming",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet2!H${rowIndex + 2}:L${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating calendar task:", error);
    throw error;
  }
}

export async function deleteCalendarTask(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet2!H${rowIndex + 2}:L${rowIndex + 2}`,
    });
  } catch (error) {
    console.error("Error deleting calendar task:", error);
    throw error;
  }
}

export async function addContact(contact: InsertContact): Promise<Contact> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        contact.name,
        contact.agency,
        contact.designation,
        contact.phoneNumber,
        contact.email,
        contact.address || "",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet3!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    const contacts = await getContacts();
    return contacts[contacts.length - 1];
  } catch (error) {
    console.error("Error adding contact:", error);
    throw error;
  }
}

export async function updateContact(
  rowIndex: number,
  contact: InsertContact,
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        contact.name,
        contact.agency,
        contact.designation,
        contact.phoneNumber,
        contact.email,
        contact.address || "",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet3!A${rowIndex + 2}:F${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating contact:", error);
    throw error;
  }
}

export async function deleteContact(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const sheetId = await getSheetIdByName("Sheet3");

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error deleting contact:", error);
    throw error;
  }
}

async function getSheetIdByName(sheetName: string): Promise<number> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
    });

    const sheet = response.data.sheets?.find(
      (s) => s.properties?.title === sheetName,
    );
    return sheet?.properties?.sheetId || 0;
  } catch (error) {
    console.error("Error getting sheet ID:", error);
    return 0;
  }
}

export async function getMapFrames(): Promise<MapFrame[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet4!A2:F",
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => ({
      id: `frame-${index + 1}`,
      name: row[0] || "",
      description: row[1] || "",
      type: (row[2] as MapFrame["type"]) || "marker",
      coordinates: row[3] || "",
      color: row[4] || "#FF0000",
      active: row[5] === "true" || row[5] === "TRUE",
    }));
  } catch (error) {
    console.error("Error fetching map frames:", error);
    return [];
  }
}

export async function addMapFrame(frame: InsertMapFrame): Promise<MapFrame> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        frame.name,
        frame.description || "",
        frame.type,
        frame.coordinates,
        frame.color,
        frame.active ? "TRUE" : "FALSE",
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Sheet4!A:F",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    const frames = await getMapFrames();
    return frames[frames.length - 1];
  } catch (error) {
    console.error("Error adding map frame:", error);
    throw error;
  }
}

export async function updateMapFrame(
  rowIndex: number,
  frame: InsertMapFrame,
): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const values = [
      [
        frame.name,
        frame.description || "",
        frame.type,
        frame.coordinates,
        frame.color,
        frame.active ? "TRUE" : "FALSE",
      ],
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `Sheet4!A${rowIndex + 2}:F${rowIndex + 2}`,
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });
  } catch (error) {
    console.error("Error updating map frame:", error);
    throw error;
  }
}

export async function deleteMapFrame(rowIndex: number): Promise<void> {
  try {
    const sheets = await getGoogleSheetsClient();
    const sheetId = await getSheetIdByName("Sheet4");

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: rowIndex + 1,
                endIndex: rowIndex + 2,
              },
            },
          },
        ],
      },
    });
  } catch (error) {
    console.error("Error deleting map frame:", error);
    throw error;
  }
}
