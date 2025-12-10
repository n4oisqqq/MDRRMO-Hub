# MDRRMO Pio Duran File Inventory and Management System - Design Guidelines

## Design Approach
**System Type:** Purpose-built government dashboard - Custom design system approach with NO generic Bootstrap-default styling. This is a high-stakes emergency management system requiring professional, polished, and performance-driven design that exudes authority and modernity.

## Global Design System

### Color Palette
- **Primary Background:** Deep Navy/Indigo `#1A1E32`
- **Card Background:** `rgba(14, 33, 72, 0.85)` with glassmorphism
- **Accent 1:** `#f30059` (Interactive elements, highlights)
- **Accent 2:** `#7965C1` (Purple gradient components)
- **Text Highlight:** `#E3D095` (Primary text, headings)
- **Border Color:** `rgba(121, 101, 193, 0.4)`

### Module-Specific Colors
1. **Supply Inventory:** Rich Teal/Cyan `#00A38D`
2. **Calendar of Activities:** Vibrant Lime Green `#72E01F`
3. **Contact List:** Deep Violet/Purple `#6F42C1`
4. **Document:** Warm Amber/Orange `#E69500`
5. **Photo Gallery:** Striking Crimson Red `#C82A52`
6. **Maps:** Bright Magenta/Pink `#F74B8A`

### Typography
- **Primary Font:** Inter (with fallback to system fonts)
- **Hierarchy:**
  - H1: 32px, font-weight 800, letter-spacing 1.5px
  - H2: 24px, font-weight 800
  - Body: 16px, font-weight 500
  - Small: 14px, font-weight 400
- Text shadow on all headings: `0 2px 4px rgba(0,0,0,0.3)`

### Layout System
- **Spacing Units:** Use Tailwind units consistently: p-4, p-8, m-4, gap-6, gap-8
- **Container Max-Width:** max-w-7xl for main content areas
- **Card Padding:** 20-30px (p-5 to p-8)
- **Grid Gaps:** 25px minimum (gap-6)

## Component Library

### Header/Topbar
- **Height:** 70px, sticky positioning
- **Background:** `rgba(14, 33, 72, 0.95)` with backdrop-filter blur(15px)
- **Elements:** 
  - Left: Logo icons with gradient background `linear-gradient(135deg, #7965C1, #f30059)`
  - Center: System title in text-highlight color
  - Border: 1px bottom border with border-color
- **Logo Animation:** Pulse animation on logo icon

### Main Dashboard Cards (The Six Pillars)
- **Layout:** 2x3 grid with generous spacing (grid gap-8)
- **Card Design:**
  - Glassmorphism effect with backdrop-filter blur(25px)
  - Border-radius: 25px
  - Border: 1px solid border-color
  - Box-shadow: `0 12px 40px rgba(0,0,0,0.3)`
  - Background gradient overlay using radial-gradient
- **Card States:**
  - Hover: Slight lift (translateY(-5px)), enhanced shadow
  - Active: Inner shadow effect
- **CTA Button:**
  - Pill-shaped, high-contrast against card color
  - Arrow icon with translateX(5px) on hover
  - Smooth transitions (0.3s ease)

### Tables
- **Design:** Borderless with border-collapse separate
- **Header:** Linear gradient background `linear-gradient(135deg, #7965C1, #483AA0)`
- **Rows:**
  - Alternating backgrounds: `rgba(255,255,255,0.03)` on even rows
  - Hover: `rgba(121,101,193,0.2)` with scale(1.01)
  - Padding: 10-15px cells
- **Status Pills:**
  - In Stock: Green `#28A745`, solid pill with white text
  - Low Stock: Yellow `#FFC107`, dark text
  - Out of Stock: Red `#DC3545`, white text
  - Border-radius: 20px, padding: 5px 15px

### Search & Input Fields
- **Search Form:**
  - Background: `rgba(255,255,255,0.1)`
  - Border-radius: 40px
  - Border: 2px solid border-color
  - Padding: 12px 25px
  - Min-width: 300px
  - Focus state: Enhanced background, scale(1.02), accent-2 border
- **Icon:** Positioned left with margin-right 12px

### Stat Cards (Summary Metrics)
- **Layout:** Grid auto-fit, min 250px per card
- **Background:** `rgba(121,101,193,0.15)` with glassmorphism
- **Border-radius:** 20px
- **Padding:** 25px
- **Hover:** translateY(-5px), enhanced shadow
- **Content:**
  - Icon: 25px, accent-1 color
  - Value: 20px, font-weight 800, text-highlight
  - Label: 14px, semi-transparent text-highlight

### Buttons
- **Primary Actions:**
  - Background: Linear gradient using module color
  - Border-radius: 8-50px (context dependent)
  - Padding: 12px 25px
  - Font-weight: 600-700
  - Box-shadow with module color at 40% opacity
- **Hover:** translateY(-3px), enhanced shadow
- **Icon Animations:** Pulse or rotate effects

### Modals
- **Background:** `rgba(0,0,0,0.9)` overlay
- **Content Card:** Glassmorphism with same styling as main cards
- **Close Button:** Circular, top-right, rotate(90deg) on hover
- **Animation:** fadeIn 0.3s ease

## Module-Specific Designs

### Supply Inventory
- **Summary Bar:** 4 stat cards above table (Total Items, In Stock, Low Stock, Out of Stock)
- **Table Features:** Custom status pills, action icons with tooltips
- **Search/Tools:** Prominent search + ADD ITEM (primary) + EXPORT/REFRESH (secondary outline buttons)

### Calendar of Activities
- **Layout:** Two-panel - Monthly calendar widget + Event/Task tables
- **Calendar Widget:**
  - Clean grid with current day circled in teal
  - Event days with colored dots below date
  - Click to filter tables
- **Tables:** Card-per-row design, priority color dots, status chips for tasks
- **CTA:** + ADD EVENT/TASK button, top-right, teal gradient

### Contact Directory
- **Stats:** 4 summary cards (Total Contacts, Agencies, Phone Numbers, Emails)
- **Table:** Icon-enhanced cells, hover effects, search integration

### Document Management
- **Sidebar:** Collapsible folder structure, clear active states
- **File Cards:** Custom icons per file type, hover overlays for metadata
- **Grid:** Consistent aspect ratios, gap-4

### Photo Gallery
- **Layout:** Grid auto-fill, min 180px per card
- **Cards:** Image with overlay title/description, translateY(-5px) on hover
- **Modal Viewer:** Full-screen with controls (prev/next/download/close)

### Maps Interface
- **Layout:** Full-screen map with collapsible left sidebar
- **Sidebar:** Semi-transparent glassmorphism, layer toggle buttons
- **Active Layer:** Highlighted in teal with icon
- **Hazard Layers:** Color-coded polygons with opacity slider
- **Pins:** Custom icons with status indicators (Green/Yellow/Red)
- **Popups:** Minimal cards with key hazard data

## Background Effects
- **Animated Pattern:** Fixed, radial gradients with opacity 0.1, repeating-linear-gradient
- **Floating Particles:** Absolute positioned, animated float (15s infinite)
- **Gradient Overlays:** Radial gradients on cards for depth

## Animations
- **Duration:** 0.3s standard, 0.5s for complex
- **Easing:** ease, ease-in-out
- **60fps Target:** Use transform and opacity only
- **Effects:**
  - Pulse on logo icons
  - Hover lifts (translateY)
  - Smooth scale transitions
  - Gradient shifts on buttons
  - Icon rotations (limited use)

## Footer
- **Background:** Linear gradient `linear-gradient(135deg, #7965C1, #483AA0)`
- **Padding:** 8px, centered text
- **Border-top:** 1px border-color
- **Sticky:** Bottom positioning

## Accessibility
- Sufficient contrast ratios for all text over colored backgrounds
- Focus states visible on all interactive elements
- Aria labels on search inputs and buttons
- Tooltips on icon-only actions

## Performance Requirements
- Lightweight, fast loading
- Smooth 60fps animations
- Minimize heavy libraries
- Native CSS/JS preferred
- Fully responsive (desktop priority, tablet/mobile supported)

## Icons
Use Font Awesome 6.4.0 CDN for consistent iconography throughout all modules.