// Google Sheets Integration for MDRRMO Pio Duran
// Using the google-sheet connector blueprint

import { google } from 'googleapis';
import type { InventoryItem, CalendarEvent, CalendarTask, Contact } from '@shared/schema';

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '11uutE9iZ2BjddbFkeX9cQVFOouphdvyP000vh1lGOo4';

let connectionSettings: any = null;
let lastFetchTime = 0;
const TOKEN_REFRESH_INTERVAL = 30 * 60 * 1000;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (connectionSettings && 
      connectionSettings.settings?.expires_at && 
      new Date(connectionSettings.settings.expires_at).getTime() > now + 60000) {
    return connectionSettings.settings.access_token;
  }

  if (now - lastFetchTime < 5000) {
    throw new Error('Token fetch rate limited');
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken || !hostname) {
    throw new Error('Replit connector environment not available');
  }

  lastFetchTime = now;
  
  const response = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  );
  
  if (!response.ok) {
    throw new Error(`Connector fetch failed: ${response.status}`);
  }
  
  const data = await response.json();
  connectionSettings = data.items?.[0];

  const accessToken = connectionSettings?.settings?.access_token || 
                      connectionSettings?.settings?.oauth?.credentials?.access_token;

  if (!connectionSettings || !accessToken) {
    throw new Error('Google Sheet connector not configured. Please connect your Google Sheet in the integrations panel.');
  }
  
  return accessToken;
}

async function getGoogleSheetsClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}



export async function getInventoryItems(): Promise<InventoryItem[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:G',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn('Google Sheet returned empty inventory data');
      return [];
    }
    
    return rows.map((row, index) => ({
      id: `inv-${index + 1}`,
      itemName: row[0] || '',
      itemDescription: row[1] || '',
      itemCategory: row[2] || '',
      itemLocation: row[3] || '',
      currentStock: parseInt(row[4]) || 0,
      itemUnit: row[5] || 'pcs',
      itemStatus: (row[6] as InventoryItem['itemStatus']) || 'In Stock',
    }));
  } catch (error) {
    console.error('Error fetching inventory from Google Sheets:', error);
    throw error;
  }
}

export async function getCalendarEvents(): Promise<CalendarEvent[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet2!A2:F',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn('Google Sheet returned empty calendar events');
      return [];
    }
    
    return rows.map((row, index) => ({
      id: `evt-${index + 1}`,
      eventName: row[0] || '',
      date: row[1] || '',
      time: row[2] || '',
      location: row[3] || '',
      notes: row[4] || '',
      priority: (row[5] as CalendarEvent['priority']) || 'Medium',
    }));
  } catch (error) {
    console.error('Error fetching calendar events from Google Sheets:', error);
    throw error;
  }
}

export async function getCalendarTasks(): Promise<CalendarTask[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet2!H2:L',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn('Google Sheet returned empty calendar tasks');
      return [];
    }
    
    return rows.map((row, index) => {
      const deadline = new Date(row[2]);
      const now = new Date();
      let status: CalendarTask['status'] = row[4] as CalendarTask['status'] || 'Upcoming';
      if (!row[4] && deadline < now && status !== 'Complete') {
        status = 'Overdue';
      }
      
      return {
        id: `task-${index + 1}`,
        taskName: row[0] || '',
        dateTime: row[1] || '',
        deadlineDateTime: row[2] || '',
        description: row[3] || '',
        status,
      };
    });
  } catch (error) {
    console.error('Error fetching calendar tasks from Google Sheets:', error);
    throw error;
  }
}

export async function getContacts(): Promise<Contact[]> {
  try {
    const sheets = await getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet3!A2:F',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      console.warn('Google Sheet returned empty contacts');
      return [];
    }
    
    return rows.map((row, index) => ({
      id: `contact-${index + 1}`,
      name: row[0] || '',
      agency: row[1] || '',
      designation: row[2] || '',
      phoneNumber: row[3] || '',
      email: row[4] || '',
      address: row[5] || '',
    }));
  } catch (error) {
    console.error('Error fetching contacts from Google Sheets:', error);
    throw error;
  }
}
