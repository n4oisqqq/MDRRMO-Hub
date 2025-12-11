import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/header";
import { BackgroundPattern } from "@/components/background-pattern";
import { LoadingSpinner } from "@/components/loading-spinner";
import { 
  Map as MapIcon, 
  Layers, 
  AlertTriangle, 
  Mountain,
  Landmark,
  Navigation,
  Building,
  Compass,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  Ruler,
  Printer,
  Crosshair,
  FileText,
  Image as ImageIcon,
  File,
  FolderOpen,
  Globe,
  MapPinned
} from "lucide-react";
import type { MapLayer, HazardZone, MapAsset, DriveFolder, DriveFile, GoogleOpenMap } from "@shared/schema";

const GOOGLE_OPEN_MAPS: GoogleOpenMap[] = [
  { 
    id: "evac-centers", 
    name: "Evacuation Centers", 
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1mjXfpYAmLEhG2U2Gu9VWjRdcuI9H4kw&ehbc=2E312F" 
  },
  { 
    id: "hazard-zones", 
    name: "Hazard Zones", 
    iframeSrc: "https://www.google.com/maps/d/embed?mid=17JUWx271jjwJNBN2yVStmAPY_Y_iQOg&ehbc=2E312F" 
  },
  { 
    id: "response-routes", 
    name: "Response Routes", 
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1WqlvA465RCv29U-MyWi-1qU1MljXgAU&ehbc=2E312F" 
  },
];

const MAP_LAYERS: MapLayer[] = [
  { id: "interactive", name: "Interactive Map", type: "interactive", active: true },
  { id: "administrative", name: "Administrative Map", type: "administrative", active: false },
  { id: "topographic", name: "Topographic Map", type: "topographic", active: false },
  { id: "land-use", name: "Land Use Map", type: "land-use", active: false },
  { id: "hazards", name: "Hazards Maps", type: "hazards", active: false },
  { id: "other", name: "Other Map", type: "other", active: false },
  { id: "google-open", name: "Google Open Map", type: "google-open", active: false },
];

const layerIcons: Record<string, any> = {
  interactive: Compass,
  administrative: Building,
  topographic: Mountain,
  "land-use": Landmark,
  hazards: AlertTriangle,
  other: MapPinned,
  "google-open": Globe,
};

const getLayerApiEndpoint = (type: string): string | null => {
  switch (type) {
    case "administrative": return "/api/maps/administrative";
    case "topographic": return "/api/maps/topographic";
    case "land-use": return "/api/maps/land-use";
    case "hazards": return "/api/maps/hazards-files";
    case "other": return "/api/maps/other";
    default: return null;
  }
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return ImageIcon;
  if (mimeType.includes('pdf') || mimeType.includes('document')) return FileText;
  return File;
};

export default function Maps() {
  const [layers, setLayers] = useState<MapLayer[]>(MAP_LAYERS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedGoogleMap, setSelectedGoogleMap] = useState<GoogleOpenMap | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mouseCoords, setMouseCoords] = useState({ lat: 13.4767, lng: 123.5012 });
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [subfolderContents, setSubfolderContents] = useState<Record<string, DriveFolder>>({});
  const [loadingSubfolder, setLoadingSubfolder] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: hazardZones = [] } = useQuery<HazardZone[]>({
    queryKey: ["/api/maps/hazards"],
  });

  const { data: assets = [] } = useQuery<MapAsset[]>({
    queryKey: ["/api/maps/assets"],
  });

  const activeLayer = useMemo(() => layers.find(l => l.active), [layers]);
  const layerEndpoint = activeLayer ? getLayerApiEndpoint(activeLayer.type) : null;

  const { data: layerFolders = [], isLoading: foldersLoading } = useQuery<DriveFolder[]>({
    queryKey: [layerEndpoint],
    enabled: !!layerEndpoint,
  });

  const loadSubfolderContents = useCallback(async (folderId: string) => {
    if (subfolderContents[folderId]) return;
    
    setLoadingSubfolder(folderId);
    try {
      const response = await fetch(`/api/maps/subfolder/${folderId}`);
      if (response.ok) {
        const data = await response.json();
        setSubfolderContents(prev => ({ ...prev, [folderId]: data }));
      }
    } catch (error) {
      console.error("Failed to load subfolder:", error);
    } finally {
      setLoadingSubfolder(null);
    }
  }, [subfolderContents]);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers(prev => prev.map(l => ({
      ...l,
      active: l.id === layerId
    })));
    setExpandedFolders(new Set());
    setSelectedFile(null);
    setSelectedGoogleMap(null);
    setSubfolderContents({});
  }, []);

  const toggleFolder = useCallback((folderId: string, hasSubfolders?: boolean) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
        if (hasSubfolders) {
          loadSubfolderContents(folderId);
        }
      }
      return next;
    });
  }, [loadSubfolderContents]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMouseCoords({
      lat: 13.4767 + (0.5 - y) * 0.1,
      lng: 123.5012 + (x - 0.5) * 0.1
    });
  }, []);

  const handleLocateMe = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMouseCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log("Geolocation error:", error.message);
        }
      );
    }
  }, []);

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  const filteredFolders = useMemo(() => {
    if (!searchQuery.trim()) return layerFolders;
    const query = searchQuery.toLowerCase();
    return layerFolders.map(folder => ({
      ...folder,
      files: folder.files?.filter(f => 
        f.name.toLowerCase().includes(query)
      ) || []
    })).filter(folder => 
      folder.name.toLowerCase().includes(query) || 
      (folder.files && folder.files.length > 0)
    );
  }, [layerFolders, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1E32" }}>
      <BackgroundPattern />
      <Header title="MDRRMO Pio Duran Maps" showBack />

      <main className="flex-1 relative z-10 flex overflow-hidden">
        <div 
          className={`absolute lg:relative z-20 h-full transition-all duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:-translate-x-full'}`}
          style={{ width: sidebarOpen ? "300px" : "0" }}
        >
          <div 
            className="h-full flex flex-col overflow-hidden"
            style={{
              background: "rgba(14, 33, 72, 0.85)",
              backdropFilter: "blur(25px)",
              borderRight: "1px solid rgba(121, 101, 193, 0.4)"
            }}
          >
            <div className="p-4 border-b" style={{ borderColor: "rgba(121, 101, 193, 0.3)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2" style={{ color: "#E3D095" }}>
                  <Layers className="w-5 h-5" style={{ color: "#F74B8A" }} />
                  Map Layers
                </h3>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-2 rounded-lg"
                  style={{ color: "#E3D095" }}
                  data-testid="button-close-sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {layers.map(layer => {
                  const Icon = layerIcons[layer.type] || MapIcon;
                  const isActive = layer.active;
                  const hasSubfolders = layerEndpoint && isActive && filteredFolders.length > 0;
                  
                  return (
                    <div key={layer.id}>
                      <button
                        onClick={() => toggleLayer(layer.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                          isActive ? '' : 'hover-elevate'
                        }`}
                        style={{
                          background: isActive 
                            ? "linear-gradient(135deg, #00A38D, #00A38DCC)" 
                            : "rgba(255, 255, 255, 0.05)",
                          color: isActive ? "white" : "#E3D095",
                          boxShadow: isActive ? "0 8px 24px rgba(0, 163, 141, 0.4)" : "none"
                        }}
                        data-testid={`layer-${layer.id}`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium text-sm flex-1 text-left">{layer.name}</span>
                        {isActive && <ChevronRight className="w-4 h-4" />}
                      </button>

                      {hasSubfolders && (
                        <div className="mt-2 ml-4 space-y-1">
                          {filteredFolders.map(folder => (
                            <div key={folder.id}>
                              <button
                                onClick={() => toggleFolder(folder.id, (folder.subfolders?.length || 0) > 0)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover-elevate"
                                style={{ 
                                  color: "rgba(227, 208, 149, 0.9)",
                                  background: expandedFolders.has(folder.id) 
                                    ? "rgba(0, 163, 141, 0.2)" 
                                    : "transparent"
                                }}
                                data-testid={`folder-${folder.id}`}
                              >
                                {expandedFolders.has(folder.id) 
                                  ? <ChevronDown className="w-4 h-4" /> 
                                  : <ChevronRight className="w-4 h-4" />
                                }
                                <FolderOpen className="w-4 h-4" style={{ color: "#00A38D" }} />
                                <span className="truncate flex-1 text-left">{folder.name}</span>
                                {folder.files && (
                                  <span className="text-xs opacity-60">({folder.files.length})</span>
                                )}
                              </button>

                              {expandedFolders.has(folder.id) && folder.files && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {folder.files.map(file => {
                                    const FileIcon = getFileIcon(file.mimeType);
                                    return (
                                      <button
                                        key={file.id}
                                        onClick={() => setSelectedFile(file)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover-elevate text-left"
                                        style={{ 
                                          color: "rgba(227, 208, 149, 0.7)",
                                          background: selectedFile?.id === file.id 
                                            ? "rgba(247, 75, 138, 0.2)" 
                                            : "transparent"
                                        }}
                                        data-testid={`file-${file.id}`}
                                      >
                                        <FileIcon className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {expandedFolders.has(folder.id) && folder.subfolders && folder.subfolders.length > 0 && (
                                <div className="ml-6 mt-1 space-y-1">
                                  {folder.subfolders.map(subfolder => (
                                    <div key={subfolder.id}>
                                      <button
                                        onClick={() => toggleFolder(subfolder.id, true)}
                                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs hover-elevate"
                                        style={{ 
                                          color: "rgba(227, 208, 149, 0.7)",
                                          background: expandedFolders.has(subfolder.id) 
                                            ? "rgba(0, 163, 141, 0.15)" 
                                            : "transparent"
                                        }}
                                        data-testid={`subfolder-${subfolder.id}`}
                                      >
                                        {expandedFolders.has(subfolder.id) 
                                          ? <ChevronDown className="w-3 h-3" /> 
                                          : <ChevronRight className="w-3 h-3" />
                                        }
                                        <FolderOpen className="w-3 h-3" style={{ color: "#00A38D" }} />
                                        <span className="truncate flex-1 text-left">{subfolder.name}</span>
                                        {loadingSubfolder === subfolder.id && (
                                          <span className="animate-spin w-3 h-3 border border-t-transparent rounded-full" style={{ borderColor: "#00A38D" }} />
                                        )}
                                      </button>
                                      {expandedFolders.has(subfolder.id) && subfolderContents[subfolder.id] && (
                                        <div className="ml-4 mt-1 space-y-1">
                                          {subfolderContents[subfolder.id].files?.map(file => {
                                            const FileIcon = getFileIcon(file.mimeType);
                                            return (
                                              <button
                                                key={file.id}
                                                onClick={() => setSelectedFile(file)}
                                                className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover-elevate text-left"
                                                style={{ 
                                                  color: "rgba(227, 208, 149, 0.6)",
                                                  background: selectedFile?.id === file.id 
                                                    ? "rgba(247, 75, 138, 0.2)" 
                                                    : "transparent"
                                                }}
                                              >
                                                <FileIcon className="w-3 h-3 flex-shrink-0" />
                                                <span className="truncate">{file.name}</span>
                                              </button>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {layer.type === "google-open" && isActive && (
                        <div className="mt-2 ml-4 space-y-1">
                          {GOOGLE_OPEN_MAPS.map(gmap => (
                            <button
                              key={gmap.id}
                              onClick={() => setSelectedGoogleMap(gmap)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover-elevate"
                              style={{ 
                                color: "rgba(227, 208, 149, 0.9)",
                                background: selectedGoogleMap?.id === gmap.id 
                                  ? "rgba(0, 163, 141, 0.2)" 
                                  : "transparent"
                              }}
                              data-testid={`google-map-${gmap.id}`}
                            >
                              <Globe className="w-4 h-4" style={{ color: "#00A38D" }} />
                              <span className="truncate">{gmap.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {activeLayer?.type === "hazards" && (
                <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                  <h4 className="text-sm font-semibold mb-3" style={{ color: "#E3D095" }}>
                    Hazard Legend
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(227, 208, 149, 0.8)" }}>
                      <span className="w-3 h-3 rounded-full bg-[#DC3545]" /> Flood-Prone Areas
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(227, 208, 149, 0.8)" }}>
                      <span className="w-3 h-3 rounded-full bg-[#FFC107]" /> Landslide Zones
                    </div>
                    <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(227, 208, 149, 0.8)" }}>
                      <span className="w-3 h-3 rounded-full bg-[#007BFF]" /> Storm Surge Areas
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                <h4 className="text-sm font-semibold mb-3" style={{ color: "#E3D095" }}>
                  Quick Stats
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg" style={{ background: "rgba(247, 75, 138, 0.15)" }}>
                    <div className="text-lg font-bold" style={{ color: "#F74B8A" }}>
                      {hazardZones.length}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(227, 208, 149, 0.6)" }}>
                      Hazard Zones
                    </div>
                  </div>
                  <div className="text-center p-3 rounded-lg" style={{ background: "rgba(0, 163, 141, 0.15)" }}>
                    <div className="text-lg font-bold" style={{ color: "#00A38D" }}>
                      {assets.length}
                    </div>
                    <div className="text-xs" style={{ color: "rgba(227, 208, 149, 0.6)" }}>
                      Assets
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-4 z-20 p-3 rounded-r-xl"
            style={{
              background: "rgba(14, 33, 72, 0.95)",
              color: "#E3D095",
              borderRight: "1px solid rgba(121, 101, 193, 0.4)",
              borderTop: "1px solid rgba(121, 101, 193, 0.4)",
              borderBottom: "1px solid rgba(121, 101, 193, 0.4)"
            }}
            data-testid="button-open-sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 relative flex flex-col">
          <div 
            className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4"
          >
            <div 
              className="relative"
              style={{
                background: "rgba(14, 33, 72, 0.9)",
                backdropFilter: "blur(15px)",
                borderRadius: "40px",
                border: "2px solid rgba(121, 101, 193, 0.4)"
              }}
            >
              <Search 
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" 
                style={{ color: "rgba(227, 208, 149, 0.6)" }} 
              />
              <input
                type="text"
                placeholder="Search maps, places, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-3 pl-12 pr-4 text-sm outline-none"
                style={{ color: "#E3D095" }}
                data-testid="input-search"
              />
            </div>
          </div>

          <div 
            className="absolute top-4 right-4 z-10 flex flex-col gap-2"
          >
            <button
              onClick={() => {}}
              className="p-3 rounded-full transition-all hover-elevate"
              style={{
                background: "rgba(14, 33, 72, 0.9)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(121, 101, 193, 0.4)",
                color: "#E3D095"
              }}
              title="Measure Distance"
              data-testid="button-measure"
            >
              <Ruler className="w-5 h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-3 rounded-full transition-all hover-elevate"
              style={{
                background: "rgba(14, 33, 72, 0.9)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(121, 101, 193, 0.4)",
                color: "#E3D095"
              }}
              title="Print Map"
              data-testid="button-print"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              onClick={handleLocateMe}
              className="p-3 rounded-full transition-all hover-elevate"
              style={{
                background: "rgba(14, 33, 72, 0.9)",
                backdropFilter: "blur(15px)",
                border: "1px solid rgba(121, 101, 193, 0.4)",
                color: "#E3D095"
              }}
              title="My Location"
              data-testid="button-locate"
            >
              <Crosshair className="w-5 h-5" />
            </button>
          </div>

          <div 
            className="flex-1 relative"
            onMouseMove={(e) => handleMouseMove(e as unknown as MouseEvent)}
          >
            {foldersLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner message="Loading map data..." />
              </div>
            ) : activeLayer?.type === "google-open" && selectedGoogleMap ? (
              <iframe
                src={selectedGoogleMap.iframeSrc}
                className="w-full h-full border-0"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={selectedGoogleMap.name}
                data-testid="google-map-iframe"
              />
            ) : activeLayer?.type === "interactive" ? (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ 
                  background: "linear-gradient(135deg, #1A1E32 0%, #0E2148 50%, #1A1E32 100%)",
                }}
              >
                <div 
                  className="rounded-2xl p-8 text-center max-w-lg mx-4"
                  style={{
                    background: "rgba(14, 33, 72, 0.9)",
                    border: "1px solid rgba(121, 101, 193, 0.4)"
                  }}
                >
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: "linear-gradient(135deg, #00A38D, #00A38DCC)" }}
                  >
                    <MapIcon className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#E3D095" }}>
                    Interactive Map View
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
                    Select a map layer from the sidebar to view documents and files from Google Drive, 
                    or choose Google Open Map to view interactive maps with real-time data.
                  </p>
                  <p className="text-xs" style={{ color: "rgba(227, 208, 149, 0.5)" }}>
                    Use the search bar to find specific maps, places, or MDRRMO documents.
                  </p>
                </div>
              </div>
            ) : selectedFile ? (
              <div className="w-full h-full flex flex-col">
                <div 
                  className="p-4 flex items-center justify-between gap-4"
                  style={{ 
                    background: "rgba(14, 33, 72, 0.9)",
                    borderBottom: "1px solid rgba(121, 101, 193, 0.3)"
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile.mimeType);
                      return <FileIcon className="w-5 h-5 flex-shrink-0" style={{ color: "#00A38D" }} />;
                    })()}
                    <span className="font-medium truncate" style={{ color: "#E3D095" }}>
                      {selectedFile.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFile.webViewLink && (
                      <a
                        href={selectedFile.webViewLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                        style={{
                          background: "linear-gradient(135deg, #00A38D, #00A38DCC)",
                          color: "white"
                        }}
                        data-testid="link-open-file"
                      >
                        Open in Drive
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-2 rounded-lg hover-elevate"
                      style={{ color: "#E3D095" }}
                      data-testid="button-close-file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  {selectedFile.mimeType.includes('image') && selectedFile.thumbnailLink ? (
                    <img
                      src={selectedFile.thumbnailLink.replace('=s220', '=s1000')}
                      alt={selectedFile.name}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                    />
                  ) : selectedFile.webViewLink ? (
                    <iframe
                      src={selectedFile.webViewLink.replace('/view', '/preview')}
                      className="w-full h-full rounded-lg"
                      style={{ 
                        border: "1px solid rgba(121, 101, 193, 0.3)",
                        minHeight: "500px"
                      }}
                      title={selectedFile.name}
                    />
                  ) : (
                    <div 
                      className="text-center p-8 rounded-xl"
                      style={{ background: "rgba(255, 255, 255, 0.05)" }}
                    >
                      <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: "#00A38D" }} />
                      <p style={{ color: "#E3D095" }}>Preview not available</p>
                      <p className="text-sm mt-2" style={{ color: "rgba(227, 208, 149, 0.6)" }}>
                        Click "Open in Drive" to view this file
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : layerFolders.length > 0 ? (
              <div 
                className="w-full h-full overflow-auto p-6"
                style={{ 
                  background: "linear-gradient(135deg, #1A1E32 0%, #0E2148 50%, #1A1E32 100%)",
                }}
              >
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-xl font-bold mb-6" style={{ color: "#E3D095" }}>
                    {activeLayer?.name} Files
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFolders.flatMap(folder => 
                      (folder.files || []).map(file => {
                        const FileIcon = getFileIcon(file.mimeType);
                        return (
                          <button
                            key={file.id}
                            onClick={() => setSelectedFile(file)}
                            className="p-4 rounded-xl text-left transition-all hover-elevate"
                            style={{
                              background: "rgba(14, 33, 72, 0.85)",
                              border: "1px solid rgba(121, 101, 193, 0.3)"
                            }}
                            data-testid={`file-card-${file.id}`}
                          >
                            {file.thumbnailLink && file.mimeType.includes('image') ? (
                              <div 
                                className="w-full h-32 rounded-lg mb-3 bg-cover bg-center"
                                style={{ backgroundImage: `url(${file.thumbnailLink})` }}
                              />
                            ) : (
                              <div 
                                className="w-full h-32 rounded-lg mb-3 flex items-center justify-center"
                                style={{ background: "rgba(0, 163, 141, 0.1)" }}
                              >
                                <FileIcon className="w-12 h-12" style={{ color: "#00A38D" }} />
                              </div>
                            )}
                            <p 
                              className="font-medium text-sm truncate" 
                              style={{ color: "#E3D095" }}
                            >
                              {file.name}
                            </p>
                            <p 
                              className="text-xs mt-1 truncate" 
                              style={{ color: "rgba(227, 208, 149, 0.5)" }}
                            >
                              {folder.name}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center"
                style={{ 
                  background: "linear-gradient(135deg, #1A1E32 0%, #0E2148 50%, #1A1E32 100%)",
                }}
              >
                <div 
                  className="rounded-2xl p-8 text-center max-w-lg mx-4"
                  style={{
                    background: "rgba(14, 33, 72, 0.9)",
                    border: "1px solid rgba(121, 101, 193, 0.4)"
                  }}
                >
                  <div 
                    className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    style={{ background: "linear-gradient(135deg, #00A38D, #00A38DCC)" }}
                  >
                    <FolderOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#E3D095" }}>
                    {activeLayer?.name}
                  </h3>
                  <p className="text-sm" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
                    {activeLayer?.type === "google-open" 
                      ? "Select a map from the sidebar to view the interactive Google Map."
                      : "No files found in this map layer. Files from Google Drive will appear here when available."}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div 
            className="flex items-center justify-between px-4 py-2 text-xs gap-4"
            style={{
              background: "rgba(14, 33, 72, 0.95)",
              borderTop: "1px solid rgba(121, 101, 193, 0.3)",
              color: "rgba(227, 208, 149, 0.7)"
            }}
          >
            <div className="flex items-center gap-4">
              <span data-testid="text-coordinates">
                Lat: {mouseCoords.lat.toFixed(4)}, Lng: {mouseCoords.lng.toFixed(4)}
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Layer: {activeLayer?.name || 'None'}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span>
                Source: {activeLayer?.type === 'google-open' ? 'Google Maps' : 
                        activeLayer?.type === 'interactive' ? 'MDRRMO' :
                        'Google Drive'}
              </span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">MDRRMO Pio Duran</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
