# MDRRMO Pio Duran File Inventory and Management System

## Overview

This is a government dashboard application for the Municipal Disaster Risk Reduction and Management Office (MDRRMO) of Pio Duran, Albay, Philippines. The system provides file inventory management, emergency supply tracking, contact directories, document management, photo galleries, calendar scheduling, and GIS mapping capabilities for disaster response coordination.

The application follows a custom dark-theme design system with glassmorphism effects, specifically built for high-stakes emergency management operations. It integrates with Google Sheets for data storage and Google Drive for document/image management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack React Query for server state caching and synchronization
- **Styling**: Tailwind CSS with custom design tokens defined in CSS variables
- **UI Components**: Radix UI primitives with shadcn/ui component library (New York style)
- **Build Tool**: Vite with path aliases (@/ for client/src, @shared/ for shared types)

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Pattern**: RESTful endpoints under /api/* prefix
- **Development**: Vite middleware for HMR during development
- **Production**: Static file serving from dist/public

### Data Storage Strategy
- **Primary Data**: Google Sheets via Replit Connectors (google-sheet connector)
  - Inventory items, calendar events, tasks, and contacts stored in spreadsheet
  - Spreadsheet ID: 11uutE9iZ2BjddbFkeX9cQVFOouphdvyP000vh1lGOo4
  - Sheet1: Inventory items (A2:G)
  - Sheet2: Calendar events (A2:F) and tasks (H2:L)
  - Sheet3: Contacts (A2:F)
  - Sheet4: Map frames (A2:F)
- **File Storage**: Google Drive via Replit Connectors (google-drive connector)
  - Documents root folder: 15_xiFeXu_vdIe2CYrjGaRCAho2OqhGvo
  - Gallery root folder: 1O1WlCjMvZ5lVcrOIGNMlBY4ZuQ-zEarg
  - Multiple folder IDs for different map types (administrative, topographic, hazards, etc.)
- **Token Management**: Shared token manager (server/google-token-manager.ts) prevents race conditions
- **User Data**: In-memory storage (MemStorage class) for user sessions
- **Database Schema**: Drizzle ORM with PostgreSQL dialect configured but primarily uses Google integrations

### Design System
- Deep Navy/Indigo background (#1A1E32)
- Glassmorphism cards with backdrop blur
- Module-specific accent colors (Teal, Lime, Purple, Amber, Crimson, Magenta)
- Inter font family with strict typography hierarchy
- Custom CSS variables for theming defined in client/src/index.css

### Module Structure
Six main dashboard modules:
1. Supply Inventory - Emergency equipment tracking with stock status
2. Calendar of Activities - Event and task scheduling
3. Contact List - Emergency responder directory
4. Document - File management with Google Drive integration
5. Photo Gallery - Documentation photo browser
6. Maps - GIS interface with multiple layer types and Google Maps embeds

## External Dependencies

### Google Services (via Replit Connectors)
- **Google Sheets API**: Data storage for inventory, calendar, and contacts
- **Google Drive API**: Document and image file management with folder hierarchy
- **Google Maps Embed**: Interactive maps with custom layers for hazard zones and evacuation centers

### Replit Infrastructure
- **Connectors**: OAuth token management for Google services via REPLIT_CONNECTORS_HOSTNAME
- **Environment**: REPL_IDENTITY or WEB_REPL_RENEWAL for authentication
- **Plugins**: vite-plugin-runtime-error-modal, vite-plugin-cartographer, vite-plugin-dev-banner

### Database
- **PostgreSQL**: Configured via DATABASE_URL environment variable
- **Drizzle ORM**: Schema definitions in shared/schema.ts with drizzle-kit for migrations
- **Session Storage**: connect-pg-simple available for production sessions

### Key NPM Packages
- googleapis: Google API client for Sheets and Drive
- @tanstack/react-query: Server state management
- drizzle-orm + drizzle-zod: Database ORM with Zod validation
- Radix UI: Accessible component primitives
- date-fns: Date manipulation utilities
- lucide-react: Icon library
- multer: File upload handling middleware

## API Endpoints

### Inventory (Google Sheets)
- GET /api/inventory - List all inventory items
- POST /api/inventory - Add new inventory item
- PUT /api/inventory/:index - Update inventory item
- DELETE /api/inventory/:index - Delete inventory item

### Calendar (Google Sheets)
- GET /api/calendar/events - List all events
- POST /api/calendar/events - Add new event
- PUT /api/calendar/events/:index - Update event
- DELETE /api/calendar/events/:index - Delete event
- GET /api/calendar/tasks - List all tasks
- POST /api/calendar/tasks - Add new task
- PUT /api/calendar/tasks/:index - Update task
- DELETE /api/calendar/tasks/:index - Delete task

### Contacts (Google Sheets)
- GET /api/contacts - List all contacts
- POST /api/contacts - Add new contact
- PUT /api/contacts/:index - Update contact
- DELETE /api/contacts/:index - Delete contact

### Documents (Google Drive)
- GET /api/documents - List document folders and files
- POST /api/documents/upload - Upload file (multipart/form-data with "file" field)
- POST /api/documents/folders - Create new folder
- PATCH /api/documents/:fileId - Rename file or folder
- DELETE /api/documents/:fileId - Delete file or folder

### Gallery (Google Drive)
- GET /api/gallery/folders - List gallery folders
- GET /api/gallery/images?folderId=X - List images in folder
- POST /api/gallery/upload - Bulk upload images (multipart/form-data with "images" field, up to 20)
- GET /api/gallery/images/:imageId/content - Get image for preview/download
- PATCH /api/gallery/images/:imageId - Rename image
- DELETE /api/gallery/images - Delete images (body: { imageIds: [] })

### Maps
- GET /api/maps/hazards - Get hazard zones
- GET /api/maps/assets - Get map assets
- GET /api/maps/frames - Get map frames from Google Sheets
- GET /api/maps/:type - Get map folder contents (administrative, topographic, land-use, hazards, other)
- GET /api/maps/subfolder/:folderId - Get subfolder contents

## Recent Changes (December 2024)
- Fixed token rate limiting by implementing shared token manager
- Added document file upload, folder creation, rename, and delete functionality
- Added gallery bulk image upload with drag-and-drop support (up to 20 images)
- Added image preview/download endpoint