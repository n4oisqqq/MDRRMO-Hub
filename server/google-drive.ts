// Google Drive Integration for MDRRMO Pio Duran
// Using the google-drive connector blueprint

import { google } from 'googleapis';
import type { DriveFolder, DriveFile, GalleryImage } from '@shared/schema';

const ADMIN_MAPS_FOLDER_ID = process.env.GOOGLE_DRIVE_MAPS_FOLDER_ID || '1Pz2MM0Ge4RPQ6tdUORibYGoeKepJ9RSt';
const DOCUMENTS_ROOT_FOLDER_ID = '15_xiFeXu_vdIe2CYrjGaRCAho2OqhGvo';

let connectionSettings: any = null;
let lastFetchTime = 0;

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
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-drive',
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
    throw new Error('Google Drive connector not configured. Please connect your Google Drive in the integrations panel.');
  }
  
  return accessToken;
}

async function getGoogleDriveClient() {
  const accessToken = await getAccessToken();

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}



export async function getDocumentFolders(): Promise<DriveFolder[]> {
  try {
    const drive = await getGoogleDriveClient();
    
    // Fetch only folders from the specific root folder
    const response = await drive.files.list({
      q: `'${DOCUMENTS_ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('No folders found in the specified Google Drive folder');
      return [];
    }
    
    // Fetch all files from the root folder (not from subfolders)
    const filesResponse = await drive.files.list({
      q: `'${DOCUMENTS_ROOT_FOLDER_ID}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink, createdTime, modifiedTime, size)',
      pageSize: 500,
      orderBy: 'name',
    });

    const allFiles = filesResponse.data.files || [];

    // Create folder structure
    const result: DriveFolder[] = folders.map(folder => ({
      id: folder.id!,
      name: folder.name!,
      files: [],
    }));

    // Add a special "All Files" entry at the beginning containing all files
    if (allFiles.length > 0) {
      result.unshift({
        id: DOCUMENTS_ROOT_FOLDER_ID,
        name: 'All Documents',
        files: allFiles.map(file => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          webViewLink: file.webViewLink || undefined,
          webContentLink: file.webContentLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
          createdTime: file.createdTime || undefined,
          modifiedTime: file.modifiedTime || undefined,
          size: file.size || undefined,
        })),
      });
    }

    return result;
  } catch (error) {
    console.error('Error fetching document folders from Google Drive:', error);
    throw error;
  }
}

export async function getAdministrativeMaps(): Promise<DriveFolder[]> {
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `'${ADMIN_MAPS_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 50,
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('No administrative maps found in Drive');
      return [];
    }
    
    const result: DriveFolder[] = await Promise.all(
      folders.map(async (folder) => {
        const filesResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
          pageSize: 50,
        });

        return {
          id: folder.id!,
          name: folder.name!,
          files: (filesResponse.data.files || []).map(file => ({
            id: file.id!,
            name: file.name!,
            mimeType: file.mimeType!,
            webViewLink: file.webViewLink || undefined,
            webContentLink: file.webContentLink || undefined,
            thumbnailLink: file.thumbnailLink || undefined,
          })),
        };
      })
    );

    return result;
  } catch (error) {
    console.error('Error fetching administrative maps from Google Drive:', error);
    throw error;
  }
}

export async function getGalleryFolders(): Promise<DriveFolder[]> {
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 30,
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('Google Drive returned no gallery folders');
      return [];
    }

    return folders.map(folder => ({
      id: folder.id!,
      name: folder.name!,
    }));
  } catch (error) {
    console.error('Error fetching gallery folders from Google Drive:', error);
    throw error;
  }
}

export async function getGalleryImages(folderId: string): Promise<GalleryImage[]> {
  if (!folderId) {
    throw new Error('Folder ID is required');
  }
  
  try {
    const drive = await getGoogleDriveClient();
    
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType contains 'image/') and trashed=false`,
      fields: 'files(id, name, thumbnailLink, webViewLink, webContentLink, description, createdTime)',
      pageSize: 100,
    });

    const files = response.data.files || [];

    return files.map(file => ({
      id: file.id!,
      name: file.name!,
      thumbnailLink: file.thumbnailLink || undefined,
      webViewLink: file.webViewLink || undefined,
      webContentLink: file.webContentLink || undefined,
      description: file.description || undefined,
      createdTime: file.createdTime || undefined,
      folder: folderId,
    }));
  } catch (error) {
    console.error('Error fetching gallery images from Google Drive:', error);
    throw error;
  }
}
