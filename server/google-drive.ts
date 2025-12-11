// Google Drive Integration for MDRRMO Pio Duran
// Using the google-drive connector blueprint

import { google } from 'googleapis';
import type { DriveFolder, DriveFile, GalleryImage } from '@shared/schema';

const DOCUMENTS_ROOT_FOLDER_ID = '15_xiFeXu_vdIe2CYrjGaRCAho2OqhGvo';

const MAP_FOLDER_IDS = {
  administrative: '1Wh2wSQuyzHiz25Vbr4ICETj18RRUEpvi',
  topographic: '1Y01dJR_YJdixvsi_B9Xs7nQaXD31_Yn2',
  'land-use': '1yQmtrKfKiMOFA933W0emzeGoexMpUDGM',
  hazards: '16xy_oUAr6sWb3JE9eNrxYJdAMDRKGYLn',
  other: '1MI1aO_-gQwsRbSJsfHY2FI4AOz9Jney1',
};

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

export async function getMapFolderContents(mapType: keyof typeof MAP_FOLDER_IDS): Promise<DriveFolder[]> {
  const folderId = MAP_FOLDER_IDS[mapType];
  if (!folderId) {
    throw new Error(`Unknown map type: ${mapType}`);
  }

  try {
    const drive = await getGoogleDriveClient();
    
    const foldersResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    });

    const folders = foldersResponse.data.files || [];
    
    const filesInRootResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType!='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
      pageSize: 100,
      orderBy: 'name',
    });

    const rootFiles = filesInRootResponse.data.files || [];

    const result: DriveFolder[] = [];

    if (rootFiles.length > 0) {
      result.push({
        id: folderId,
        name: 'Root Files',
        files: rootFiles.map(file => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          webViewLink: file.webViewLink || undefined,
          webContentLink: file.webContentLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
        })),
      });
    }

    const folderContents = await Promise.all(
      folders.map(async (folder) => {
        const filesResponse = await drive.files.list({
          q: `'${folder.id}' in parents and trashed=false`,
          fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
          pageSize: 100,
        });

        const subFoldersResponse = await drive.files.list({
          q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          pageSize: 50,
        });

        return {
          id: folder.id!,
          name: folder.name!,
          files: (filesResponse.data.files || [])
            .filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
            .map(file => ({
              id: file.id!,
              name: file.name!,
              mimeType: file.mimeType!,
              webViewLink: file.webViewLink || undefined,
              webContentLink: file.webContentLink || undefined,
              thumbnailLink: file.thumbnailLink || undefined,
            })),
          subfolders: (subFoldersResponse.data.files || []).map(sf => ({
            id: sf.id!,
            name: sf.name!,
          })),
        };
      })
    );

    result.push(...folderContents);

    return result;
  } catch (error) {
    console.error(`Error fetching ${mapType} maps from Google Drive:`, error);
    throw error;
  }
}

export async function getSubfolderContents(folderId: string): Promise<DriveFolder> {
  try {
    const drive = await getGoogleDriveClient();
    
    const folderInfo = await drive.files.get({
      fileId: folderId,
      fields: 'id, name',
    });

    const filesResponse = await drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, webViewLink, webContentLink, thumbnailLink)',
      pageSize: 100,
      orderBy: 'name',
    });

    const subFoldersResponse = await drive.files.list({
      q: `'${folderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 50,
    });

    return {
      id: folderInfo.data.id!,
      name: folderInfo.data.name!,
      files: (filesResponse.data.files || [])
        .filter(f => f.mimeType !== 'application/vnd.google-apps.folder')
        .map(file => ({
          id: file.id!,
          name: file.name!,
          mimeType: file.mimeType!,
          webViewLink: file.webViewLink || undefined,
          webContentLink: file.webContentLink || undefined,
          thumbnailLink: file.thumbnailLink || undefined,
        })),
      subfolders: (subFoldersResponse.data.files || []).map(sf => ({
        id: sf.id!,
        name: sf.name!,
      })),
    };
  } catch (error) {
    console.error('Error fetching subfolder contents:', error);
    throw error;
  }
}

export async function getAdministrativeMaps(): Promise<DriveFolder[]> {
  return getMapFolderContents('administrative');
}

export async function getGalleryFolders(): Promise<DriveFolder[]> {
  try {
    const drive = await getGoogleDriveClient();
    const GALLERY_ROOT_FOLDER_ID = '111ShUKgBwTA1qre5JjVelfzNSddQqa23';
    
    // Fetch sub-folders (first level)
    const response = await drive.files.list({
      q: `'${GALLERY_ROOT_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      fields: 'files(id, name)',
      pageSize: 100,
      orderBy: 'name',
    });

    const folders = response.data.files || [];
    
    if (folders.length === 0) {
      console.warn('No sub-folders found in gallery root folder');
      return [];
    }

    // For each sub-folder, fetch its sub-sub-folders
    const result: DriveFolder[] = await Promise.all(
      folders.map(async (folder) => {
        const subFoldersResponse = await drive.files.list({
          q: `'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
          fields: 'files(id, name)',
          pageSize: 100,
          orderBy: 'name',
        });

        const subFolders = (subFoldersResponse.data.files || []).map(subFolder => ({
          id: subFolder.id!,
          name: subFolder.name!,
        }));

        return {
          id: folder.id!,
          name: folder.name!,
          subfolders: subFolders,
        };
      })
    );

    return result;
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
