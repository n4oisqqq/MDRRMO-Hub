import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { BackgroundPattern } from "@/components/background-pattern";
import { LoadingSpinner } from "@/components/loading-spinner";
import { InteractiveMapView } from "@/components/interactive-map-view";
import { type MapFeature, type DrawingMode } from "@/components/map-drawing-tools";
import {
  Map as MapIcon,
  Layers,
  AlertTriangle,
  Mountain,
  Landmark,
  Building,
  Compass,
  ChevronRight,
  ChevronDown,
  X,
  Search,
  FileText,
  Image as ImageIcon,
  File,
  FolderOpen,
  Globe,
  MapPinned,
  Download,
  Copy,
  Eye,
  Printer,
} from "lucide-react";
import type {
  MapLayer,
  HazardZone,
  MapAsset,
  DriveFolder,
  DriveFile,
  GoogleOpenMap,
} from "@shared/schema";

const GOOGLE_OPEN_MAPS: GoogleOpenMap[] = [
  {
    id: "evac-centers",
    name: "Evacuation Centers",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1mjXfpYAmLEhG2U2Gu9VWjRdcuI9H4kw&ehbc=2E312F",
  },
  {
    id: "hazard-zones",
    name: "Hazard Zones",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=17JUWx271jjwJNBN2yVStmAPY_Y_iQOg&ehbc=2E312F",
  },
  {
    id: "response-routes",
    name: "Response Routes",
    iframeSrc: "https://www.google.com/maps/d/embed?mid=1WqlvA465RCv29U-MyWi-1qU1MljXgAU&ehbc=2E312F",
  },
];

const MAP_LAYERS: MapLayer[] = [
  { id: "interactive", name: "Interactive Map", type: "interactive", active: true },
  { id: "administrative", name: "Administrative Map", type: "administrative", active: false },
  { id: "topographic", name: "Topographic Map", type: "topographic", active: false },
  { id: "land-use", name: "Land Use Map", type: "land-use", active: false },
  { id: "hazards", name: "Hazards Maps", type: "hazards", active: false },
  { id: "other", name: "Other Map", type: "other", active: false },
  { id: "panorama", name: "Panorama Map", type: "panorama", active: false },
  { id: "google-open", name: "Google Open Map", type: "google-open", active: false },
];

const layerIcons: Record<string, any> = {
  interactive: Compass,
  administrative: Building,
  topographic: Mountain,
  "land-use": Landmark,
  hazards: AlertTriangle,
  other: MapPinned,
  panorama: Eye,
  "google-open": Globe,
};

const getLayerApiEndpoint = (type: string): string | null => {
  switch (type) {
    case "administrative": return "/api/maps/administrative";
    case "topographic": return "/api/maps/topographic";
    case "land-use": return "/api/maps/land-use";
    case "hazards": return "/api/maps/hazards-files";
    case "other": return "/api/maps/other";
    case "panorama": return `/api/maps/drive-folder/1tsbcsTEfg5RLHLJLYXR41avy9SrajsqM`;
    default: return null;
  }
};

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes("image")) return ImageIcon;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
};

const PANORAMA_VIEW_TYPES = [
  { value: "360-degree", label: "360-Degree" },
  { value: "spherical", label: "Spherical" },
  { value: "cylindrical", label: "Cylindrical" },
  { value: "horizontal", label: "Horizontal" },
  { value: "vertical", label: "Vertical" },
  { value: "wide-angle", label: "Wide-Angle" },
  { value: "planar", label: "Planar" },
];

export default function Maps() {
  const [layers, setLayers] = useState<MapLayer[]>(MAP_LAYERS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedGoogleMap, setSelectedGoogleMap] = useState<GoogleOpenMap | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mouseCoords, setMouseCoords] = useState({ lat: 13.0752, lng: 123.5298 });
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  const [subfolderContents, setSubfolderContents] = useState<Record<string, DriveFolder>>({});
  const [loadingSubfolder, setLoadingSubfolder] = useState<string | null>(null);

  // Drawing state
  const [mapFeatures, setMapFeatures] = useState<MapFeature[]>([]);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [tempCoordinates, setTempCoordinates] = useState<{ lat: number; lng: number }[]>([]);
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  const [selectedFillColor, setSelectedFillColor] = useState("#FF000040");
  const [selectedWeight, setSelectedWeight] = useState(3);
  const [featureTitle, setFeatureTitle] = useState("");
  const [featureDescription, setFeatureDescription] = useState("");
  const [showLegend, setShowLegend] = useState(true);

  // Modal state
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [modalImageName, setModalImageName] = useState("");

  // Panorama state
  const [panoramaImages, setPanoramaImages] = useState<DriveFile[]>([]);
  const [selectedPanorama, setSelectedPanorama] = useState<DriveFile | null>(null);
  const [selectedPanoramaFolder, setSelectedPanoramaFolder] = useState<string | null>(null);
  const [panoramaViewerReady, setPanoramaViewerReady] = useState(false);
  const [panoramaViewType, setPanoramaViewType] = useState<string>("360-degree");
  const [panoramaSettings, setPanoramaSettings] = useState({
    yaw: 0,
    pitch: 0,
    zoom: 1,
    fov: 90,
  });
  const panoramaViewerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<any>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const planarImageRef = useRef<HTMLImageElement>(null);
  const threeSixtyRef = useRef<any>(null);

  const saveFeatureToDb = useCallback(async (feature: MapFeature) => {
    // Feature saving logic - can be expanded for persistence
    console.log('Feature saved:', feature);
  }, []);

  const deleteFeatureFromDb = useCallback(async (id: string) => {
    console.log('Feature deleted:', id);
  }, []);

  const clearAllFeaturesFromDb = useCallback(async () => {
    console.log('All features cleared');
  }, []);

  const deleteFeature = useCallback((id: string) => {
    setMapFeatures((prev) => prev.filter((feature) => feature.id !== id));
    deleteFeatureFromDb(id);
  }, [deleteFeatureFromDb]);

  const clearAllFeatures = useCallback(() => {
    setMapFeatures([]);
    clearAllFeaturesFromDb();
  }, [clearAllFeaturesFromDb]);

  const { data: hazardZones = [] } = useQuery<HazardZone[]>({
    queryKey: ["/api/maps/hazards"],
  });

  const { data: assets = [] } = useQuery<MapAsset[]>({
    queryKey: ["/api/maps/assets"],
  });

  const activeLayer = useMemo(() => layers.find((l) => l.active), [layers]);
  const layerEndpoint = activeLayer ? getLayerApiEndpoint(activeLayer.type) : null;

  const { data: layerFolders = [], isLoading: foldersLoading } = useQuery<DriveFolder[]>({
    queryKey: [layerEndpoint],
    enabled: !!layerEndpoint,
  });

  const { data: panoramaData, isLoading: panoramaLoading } = useQuery<{
    folders: DriveFolder[];
    allImages: Array<{
      id: string;
      name: string;
      thumbnailLink?: string;
      webViewLink?: string;
      webContentLink?: string;
      folder: string;
    }>;
  }>({
    queryKey: ["/api/panorama"],
    enabled: activeLayer?.type === "panorama",
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (panoramaData?.allImages) {
      const images = panoramaData.allImages.map(img => ({
        id: img.id,
        name: img.name,
        mimeType: "image/jpeg",
        thumbnailLink: img.thumbnailLink,
        webViewLink: img.webViewLink,
        webContentLink: img.webContentLink,
        folder: img.folder,
      }));
      setPanoramaImages(images as DriveFile[]);
    }
  }, [panoramaData]);

  useEffect(() => {
    if (!selectedPanorama || !panoramaViewerRef.current) return;

    const initViewer = async () => {
      try {
        // Clean up previous viewer
        if (viewerInstanceRef.current) {
          viewerInstanceRef.current.destroy();
          viewerInstanceRef.current = null;
        }

        const panoramaUrl = `/api/panorama/image/${selectedPanorama.id}`;

        // Handle different panorama types
        switch (panoramaViewType) {
          case "planar":
          case "wide-angle":
            // For planar/wide-angle, we just show the image normally
            setPanoramaViewerReady(true);
            break;

          case "360-degree":
          case "spherical":
            // Full spherical panorama
            const { Viewer } = await import("@photo-sphere-viewer/core");
            await import("@photo-sphere-viewer/core/index.css");

            viewerInstanceRef.current = new Viewer({
              container: panoramaViewerRef.current,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading 360° panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
            });
            setPanoramaViewerReady(true);
            break;

          case "cylindrical":
            // Cylindrical panorama (360° horizontal, limited vertical)
            const { Viewer: CylindricalViewer } = await import("@photo-sphere-viewer/core");
            await import("@photo-sphere-viewer/core/index.css");

            viewerInstanceRef.current = new CylindricalViewer({
              container: panoramaViewerRef.current,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading cylindrical panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
              sphereCorrection: { pan: 0, tilt: 0, roll: 0 },
              fisheye: false,
            });
            setPanoramaViewerReady(true);
            break;

          case "horizontal":
            // Horizontal panorama (wide field of view horizontally)
            const { Viewer: HorizontalViewer } = await import("@photo-sphere-viewer/core");
            await import("@photo-sphere-viewer/core/index.css");

            viewerInstanceRef.current = new HorizontalViewer({
              container: panoramaViewerRef.current,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading horizontal panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
              latRange: [-Math.PI / 6, Math.PI / 6], // Limit vertical movement
            });
            setPanoramaViewerReady(true);
            break;

          case "vertical":
            // Vertical panorama (tall field of view vertically)
            const { Viewer: VerticalViewer } = await import("@photo-sphere-viewer/core");
            await import("@photo-sphere-viewer/core/index.css");

            viewerInstanceRef.current = new VerticalViewer({
              container: panoramaViewerRef.current,
              panorama: panoramaUrl,
              caption: selectedPanorama.name,
              loadingTxt: "Loading vertical panorama...",
              defaultZoomLvl: 50,
              navbar: ["zoom", "fullscreen", "caption"],
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
              longRange: [-Math.PI / 6, Math.PI / 6], // Limit horizontal movement
            });
            setPanoramaViewerReady(true);
            break;

          default:
            setPanoramaViewerReady(true);
        }
      } catch (error) {
        console.error("Failed to initialize panorama viewer:", error);
        setPanoramaViewerReady(false);
      }
    };

    initViewer();

    return () => {
      if (viewerInstanceRef.current) {
        viewerInstanceRef.current.destroy();
        viewerInstanceRef.current = null;
      }
      setPanoramaViewerReady(false);
    };
  }, [selectedPanorama, panoramaViewType]);

  const loadSubfolderContents = useCallback(async (folderId: string) => {
    if (subfolderContents[folderId]) return;

    setLoadingSubfolder(folderId);
    try {
      const response = await fetch(`/api/maps/subfolder/${folderId}`);
      if (response.ok) {
        const data = await response.json();
        setSubfolderContents((prev) => ({ ...prev, [folderId]: data }));
      }
    } catch (error) {
      console.error("Failed to load subfolder:", error);
    } finally {
      setLoadingSubfolder(null);
    }
  }, [subfolderContents]);

  const toggleLayer = useCallback((layerId: string) => {
    setLayers((prev) => prev.map((l) => ({ ...l, active: l.id === layerId })));
    setExpandedFolders(new Set());
    setSelectedFile(null);
    // Auto-select first Google map when switching to google-open layer
    if (layerId === "google-open") {
      setSelectedGoogleMap(GOOGLE_OPEN_MAPS[0]);
    } else {
      setSelectedGoogleMap(null);
    }
    setSubfolderContents({});
    setSelectedPanorama(null);
    setPanoramaViewType("360-degree");
  }, []);

  const toggleFolder = useCallback((folderId: string, hasSubfolders?: boolean) => {
    setExpandedFolders((prev) => {
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

  const openImageModal = useCallback((imageUrl: string, imageName: string) => {
    setModalImageUrl(imageUrl);
    setModalImageName(imageName);
    setImageModalOpen(true);
  }, []);

  const closeImageModal = useCallback(() => {
    setImageModalOpen(false);
    setModalImageUrl("");
    setModalImageName("");
    setSelectedPanorama(null);
  }, []);

  const handleCopyImage = useCallback(async () => {
    if (!modalImageUrl) return;
    try {
      const response = await fetch(modalImageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert("Image copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy image:", error);
      alert("Failed to copy image. Please try again.");
    }
  }, [modalImageUrl]);

  const handleDownloadImage = useCallback(() => {
    if (!modalImageUrl) return;
    const link = document.createElement("a");
    link.href = modalImageUrl;
    link.download = modalImageName || "image.jpg";
    link.click();
  }, [modalImageUrl, modalImageName]);

  const handlePrintImage = useCallback(() => {
    if (!imageRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head><title>Print ${modalImageName}</title>
          <style>body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
            img { max-width: 100%; height: auto; }</style>
        </head>
        <body><img src="${modalImageUrl}" alt="${modalImageName}" onload="window.print(); window.close();" /></body>
      </html>
    `);
    printWindow.document.close();
  }, [modalImageUrl, modalImageName]);

  const filteredFolders = useMemo(() => {
    if (!searchQuery) return layerFolders;
    const query = searchQuery.toLowerCase();
    return layerFolders.filter((folder) =>
      folder.name.toLowerCase().includes(query) ||
      folder.files?.some((file) => file.name.toLowerCase().includes(query))
    );
  }, [layerFolders, searchQuery]);

  const filteredPanoramaImages = useMemo(() => {
    let images = panoramaImages;
    if (selectedPanoramaFolder) {
      images = images.filter((img: any) => img.folder === selectedPanoramaFolder);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      images = images.filter((img) => img.name.toLowerCase().includes(query));
    }
    return images;
  }, [panoramaImages, selectedPanoramaFolder, searchQuery]);

  // Panorama control handlers
  const handlePanoramaChange = useCallback((setting: string, value: number) => {
    setPanoramaSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  }, []);

  const resetPanoramaView = useCallback(() => {
    setPanoramaSettings({
      yaw: 0,
      pitch: 0,
      zoom: 1,
      fov: 90,
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg, #0E2148 0%, #1A1E32 100%)" }}>
      <BackgroundPattern />
      <Header />

      <main className="flex-1 flex relative overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 flex-shrink-0 z-10 overflow-hidden`}
          style={{ background: "rgba(14, 33, 72, 0.95)", borderRight: sidebarOpen ? "1px solid rgba(121, 101, 193, 0.3)" : "none" }}
        >
          <div className="h-full flex flex-col p-4 w-80">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #00A38D, #00A38DCC)" }}>
                  <Layers className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold" style={{ color: "#E3D095" }}>Map Layers</h2>
                  <p className="text-xs" style={{ color: "rgba(227, 208, 149, 0.6)" }}>Select a layer to view</p>
                </div>
              </div>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-lg hover-elevate" style={{ color: "#E3D095" }} data-testid="button-close-sidebar">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {layers.map((layer) => {
                const Icon = layerIcons[layer.type] || MapIcon;
                const isActive = layer.active;
                const hasFolders = layerFolders.length > 0;

                return (
                  <div key={layer.id}>
                    <button
                      onClick={() => toggleLayer(layer.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-elevate ${isActive ? "" : ""}`}
                      style={{
                        background: isActive ? "rgba(0, 163, 141, 0.2)" : "rgba(255, 255, 255, 0.05)",
                        border: isActive ? "1px solid rgba(0, 163, 141, 0.4)" : "1px solid transparent",
                        color: "#E3D095",
                      }}
                      data-testid={`layer-${layer.id}`}
                    >
                      <Icon className="w-5 h-5" style={{ color: isActive ? "#00A38D" : "rgba(227, 208, 149, 0.6)" }} />
                      <span className="flex-1 text-left font-medium">{layer.name}</span>
                      {hasFolders && isActive && layer.type !== "interactive" && layer.type !== "google-open" && (
                        <ChevronDown className="w-4 h-4" style={{ color: "rgba(227, 208, 149, 0.6)" }} />
                      )}
                    </button>

                    {/* Folder expansion for file-based layers */}
                    {isActive && layer.type !== "interactive" && layer.type !== "google-open" && layer.type !== "panorama" && hasFolders && (
                      <div className="mt-2 ml-4 space-y-1 max-h-[300px] overflow-y-auto">
                        {filteredFolders.map((folder) => (
                          <div key={folder.id}>
                            <button
                              onClick={() => toggleFolder(folder.id, folder.subfolders && folder.subfolders.length > 0)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover-elevate"
                              style={{ color: "rgba(227, 208, 149, 0.8)", background: expandedFolders.has(folder.id) ? "rgba(247, 75, 138, 0.1)" : "transparent" }}
                              data-testid={`folder-${folder.id}`}
                            >
                              {expandedFolders.has(folder.id) ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                              <FolderOpen className="w-4 h-4 flex-shrink-0" style={{ color: "#F74B8A" }} />
                              <span className="truncate">{folder.name}</span>
                            </button>

                            {expandedFolders.has(folder.id) && (
                              <div className="ml-6 mt-1 space-y-1">
                                {folder.files?.map((file) => {
                                  const FileIcon = getFileIcon(file.mimeType);
                                  return (
                                    <button
                                      key={file.id}
                                      onClick={() => setSelectedFile(file)}
                                      className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover-elevate text-left"
                                      style={{ color: "rgba(227, 208, 149, 0.6)", background: selectedFile?.id === file.id ? "rgba(247, 75, 138, 0.2)" : "transparent" }}
                                    >
                                      <FileIcon className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{file.name}</span>
                                    </button>
                                  );
                                })}

                                {folder.subfolders?.map((subfolder) => (
                                  <div key={subfolder.id}>
                                    <button
                                      onClick={() => toggleFolder(subfolder.id, true)}
                                      className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover-elevate text-left"
                                      style={{ color: "rgba(227, 208, 149, 0.7)", background: expandedFolders.has(subfolder.id) ? "rgba(121, 101, 193, 0.1)" : "transparent" }}
                                    >
                                      {loadingSubfolder === subfolder.id ? (
                                        <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                      ) : expandedFolders.has(subfolder.id) ? (
                                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 flex-shrink-0" />
                                      )}
                                      <FolderOpen className="w-3 h-3 flex-shrink-0" style={{ color: "#7965C1" }} />
                                      <span className="truncate">{subfolder.name}</span>
                                    </button>

                                    {expandedFolders.has(subfolder.id) && subfolderContents[subfolder.id] && (
                                      <div className="ml-4 mt-1 space-y-1">
                                        {subfolderContents[subfolder.id].files?.map((file) => {
                                          const FileIcon = getFileIcon(file.mimeType);
                                          return (
                                            <button
                                              key={file.id}
                                              onClick={() => setSelectedFile(file)}
                                              className="w-full flex items-center gap-2 px-2 py-1 rounded text-xs hover-elevate text-left"
                                              style={{ color: "rgba(227, 208, 149, 0.6)", background: selectedFile?.id === file.id ? "rgba(247, 75, 138, 0.2)" : "transparent" }}
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
                        {GOOGLE_OPEN_MAPS.map((gmap) => (
                          <button
                            key={gmap.id}
                            onClick={() => setSelectedGoogleMap(gmap)}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover-elevate"
                            style={{ color: "rgba(227, 208, 149, 0.9)", background: selectedGoogleMap?.id === gmap.id ? "rgba(0, 163, 141, 0.2)" : "transparent" }}
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
                <h4 className="text-sm font-semibold mb-3" style={{ color: "#E3D095" }}>Hazard Legend</h4>
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
              <h4 className="text-sm font-semibold mb-3" style={{ color: "#E3D095" }}>Quick Stats</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 rounded-lg" style={{ background: "rgba(247, 75, 138, 0.15)" }}>
                  <div className="text-lg font-bold" style={{ color: "#F74B8A" }}>{hazardZones.length}</div>
                  <div className="text-xs" style={{ color: "rgba(227, 208, 149, 0.6)" }}>Hazard Zones</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ background: "rgba(0, 163, 141, 0.15)" }}>
                  <div className="text-lg font-bold" style={{ color: "#00A38D" }}>{assets.length}</div>
                  <div className="text-xs" style={{ color: "rgba(227, 208, 149, 0.6)" }}>Assets</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute left-0 top-4 z-20 p-3 rounded-r-xl"
            style={{ background: "rgba(14, 33, 72, 0.95)", color: "#E3D095", borderRight: "1px solid rgba(121, 101, 193, 0.4)", borderTop: "1px solid rgba(121, 101, 193, 0.4)", borderBottom: "1px solid rgba(121, 101, 193, 0.4)" }}
            data-testid="button-open-sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* Main Content Area */}
        <div className="flex-1 relative flex flex-col">
          {/* Search Bar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
            <div className="relative" style={{ background: "rgba(14, 33, 72, 0.9)", backdropFilter: "blur(15px)", borderRadius: "40px", border: "2px solid rgba(121, 101, 193, 0.4)" }}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "rgba(227, 208, 149, 0.6)" }} />
              <input
                type="text"
                placeholder="Search maps, places, documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent py-1 pl-12 pr-4 text-sm outline-none"
                style={{ color: "#E3D095" }}
                data-testid="input-search"
              />
            </div>
          </div>

          {/* Map Content */}
          <div className="flex-1 relative">
            {foldersLoading || panoramaLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <LoadingSpinner message="Loading map data..." />
              </div>
            ) : activeLayer?.type === "interactive" ? (
              <InteractiveMapView
                mapFeatures={mapFeatures}
                setMapFeatures={setMapFeatures}
                drawingMode={drawingMode}
                setDrawingMode={setDrawingMode}
                tempCoordinates={tempCoordinates}
                setTempCoordinates={setTempCoordinates}
                selectedColor={selectedColor}
                setSelectedColor={setSelectedColor}
                selectedFillColor={selectedFillColor}
                setSelectedFillColor={setSelectedFillColor}
                selectedWeight={selectedWeight}
                setSelectedWeight={setSelectedWeight}
                featureTitle={featureTitle}
                setFeatureTitle={setFeatureTitle}
                featureDescription={featureDescription}
                setFeatureDescription={setFeatureDescription}
                showLegend={showLegend}
                setShowLegend={setShowLegend}
                onSaveFeature={saveFeatureToDb}
                onDeleteFeature={deleteFeature}
                onClearAll={clearAllFeatures}
                mouseCoords={mouseCoords}
                setMouseCoords={setMouseCoords}
              />
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
            ) : activeLayer?.type === "panorama" ? (
              <div className="w-full h-full flex flex-col bg-gray-900">
                {selectedPanorama ? (
                  <div className="flex-1 flex flex-col">
                    <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
                      <h2 className="text-xl font-bold text-yellow-400 truncate max-w-md">{selectedPanorama.name}</h2>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2">
                          <label htmlFor="panorama-view-type" className="text-sm text-gray-300 whitespace-nowrap">View Type:</label>
                          <select
                            id="panorama-view-type"
                            value={panoramaViewType}
                            onChange={(e) => setPanoramaViewType(e.target.value)}
                            className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500"
                            data-testid="select-panorama-view-type"
                          >
                            {PANORAMA_VIEW_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Panorama Controls for 360-degree views */}
                        {(panoramaViewType === "360-degree" || panoramaViewType === "spherical") && viewerInstanceRef.current && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={resetPanoramaView}
                              className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-white hover:bg-gray-600"
                            >
                              Reset View
                            </button>
                          </div>
                        )}

                        <a href={selectedPanorama.webViewLink} target="_blank" rel="noopener noreferrer" className="px-3 py-2 rounded-lg text-sm bg-teal-600 text-white flex items-center gap-2 whitespace-nowrap" data-testid="link-open-panorama-drive">
                          <Globe className="w-4 h-4" /> Open in Drive
                        </a>
                        <button
                          onClick={() => {
                            if (viewerInstanceRef.current) {
                              viewerInstanceRef.current.destroy();
                              viewerInstanceRef.current = null;
                            }
                            setSelectedPanorama(null);
                            setPanoramaViewerReady(false);
                          }}
                          className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700"
                          data-testid="button-close-panorama"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Panorama Settings Panel */}
                    {(panoramaViewType === "360-degree" || panoramaViewType === "spherical" || panoramaViewType === "cylindrical") && (
                      <div className="p-3 bg-gray-800 border-b border-gray-700 flex flex-wrap gap-4 items-center">
                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Yaw:</label>
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            value={panoramaSettings.yaw}
                            onChange={(e) => handlePanoramaChange('yaw', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-xs text-white w-10">{panoramaSettings.yaw}°</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Pitch:</label>
                          <input
                            type="range"
                            min="-90"
                            max="90"
                            value={panoramaSettings.pitch}
                            onChange={(e) => handlePanoramaChange('pitch', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-xs text-white w-10">{panoramaSettings.pitch}°</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">Zoom:</label>
                          <input
                            type="range"
                            min="1"
                            max="10"
                            value={panoramaSettings.zoom}
                            onChange={(e) => handlePanoramaChange('zoom', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-xs text-white w-10">{panoramaSettings.zoom}x</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-gray-400">FOV:</label>
                          <input
                            type="range"
                            min="30"
                            max="120"
                            value={panoramaSettings.fov}
                            onChange={(e) => handlePanoramaChange('fov', parseInt(e.target.value))}
                            className="w-24"
                          />
                          <span className="text-xs text-white w-10">{panoramaSettings.fov}°</span>
                        </div>
                      </div>
                    )}

                    <div className="flex-1 relative bg-black">
                      {panoramaViewType === "planar" || panoramaViewType === "wide-angle" ? (
                        <div className="absolute inset-0 flex items-center justify-center p-8 overflow-auto">
                          {panoramaViewerReady ? (
                            <img
                              ref={planarImageRef}
                              src={`/api/panorama/image/${selectedPanorama.id}`}
                              alt={selectedPanorama.name}
                              className="max-w-full max-h-full object-contain"
                              style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }}
                            />
                          ) : (
                            <LoadingSpinner message={`Loading ${panoramaViewType} view...`} />
                          )}
                        </div>
                      ) : (
                        <>
                          <div ref={panoramaViewerRef} className="absolute inset-0" style={{ width: '100%', height: '100%' }} data-testid="panorama-viewer-container" />
                          {!panoramaViewerReady && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                              <LoadingSpinner message={`Loading ${panoramaViewType} panorama...`} />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto p-6">
                    <div className="max-w-6xl mx-auto">
                      {panoramaData?.folders && panoramaData.folders.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold text-yellow-300 mb-3">Folders</h3>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setSelectedPanoramaFolder(null)}
                              className={`px-4 py-2 rounded-lg text-sm transition-colors ${selectedPanoramaFolder === null ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                              data-testid="button-all-panoramas"
                            >
                              All Images ({panoramaData.allImages?.length || 0})
                            </button>
                            {panoramaData.folders.map((folder) => (
                              <button
                                key={folder.id}
                                onClick={() => setSelectedPanoramaFolder(folder.id)}
                                className={`px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2 ${selectedPanoramaFolder === folder.id ? 'bg-teal-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                data-testid={`button-folder-${folder.id}`}
                              >
                                <FolderOpen className="w-4 h-4" /> {folder.name}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <h3 className="text-lg font-semibold text-yellow-300 mb-4">360° Panoramic Images</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredPanoramaImages.map((image) => (
                          <button
                            key={image.id}
                            onClick={() => setSelectedPanorama(image)}
                            className="group relative aspect-square rounded-xl overflow-hidden bg-gray-800 hover:ring-2 hover:ring-teal-500 transition-all"
                            data-testid={`panorama-${image.id}`}
                          >
                            {image.thumbnailLink ? (
                              <img src={image.thumbnailLink.replace("=s220", "=s400")} alt={image.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><Eye className="w-12 h-12 text-gray-600" /></div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                              <span className="text-white text-sm font-medium truncate">{image.name}</span>
                            </div>
                          </button>
                        ))}
                      </div>

                      <div className="mt-8 p-6 rounded-xl bg-gray-800 border border-gray-700">
                        <h4 className="text-lg font-semibold text-yellow-300 mb-4">Panorama View Types</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">360-Degree</h5>
                              <p className="text-gray-300">Full spherical panorama with complete 360° horizontal and vertical viewing.</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">Spherical</h5>
                              <p className="text-gray-300">Interactive spherical view allowing exploration in all directions.</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">Cylindrical</h5>
                              <p className="text-gray-300">360° horizontal view with limited vertical range, ideal for landscapes.</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">Horizontal</h5>
                              <p className="text-gray-300">Wide horizontal panorama with restricted vertical movement.</p>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">Vertical</h5>
                              <p className="text-gray-300">Tall vertical panorama with restricted horizontal movement.</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">Wide-Angle</h5>
                              <p className="text-gray-300">Standard wide-angle image display without sphere wrapping.</p>
                            </div>
                            <div>
                              <h5 className="font-medium text-teal-400 mb-1">Planar</h5>
                              <p className="text-gray-300">Flat 2D image view for standard photographs.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : selectedFile ? (
              <div className="w-full h-full flex flex-col">
                <div className="p-4 flex items-center justify-between gap-4" style={{ background: "rgba(14, 33, 72, 0.9)", borderBottom: "1px solid rgba(121, 101, 193, 0.3)" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    {(() => {
                      const FileIcon = getFileIcon(selectedFile.mimeType);
                      return <FileIcon className="w-5 h-5 flex-shrink-0" style={{ color: "#00A38D" }} />;
                    })()}
                    <span className="font-medium truncate" style={{ color: "#E3D095" }}>{selectedFile.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFile.webViewLink && (
                      <a href={selectedFile.webViewLink} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-lg text-sm font-medium transition-all" style={{ background: "linear-gradient(135deg, #00A38D, #00A38DCC)", color: "white" }} data-testid="link-open-file">
                        Open in Drive
                      </a>
                    )}
                    <button onClick={() => setSelectedFile(null)} className="p-2 rounded-lg hover-elevate" style={{ color: "#E3D095" }} data-testid="button-close-file">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center p-4">
                  {selectedFile.mimeType.includes("image") && selectedFile.thumbnailLink ? (
                    <img
                      src={selectedFile.thumbnailLink.replace("=s220", "=s1000")}
                      alt={selectedFile.name}
                      className="max-w-full max-h-full object-contain rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                      onClick={() => openImageModal(selectedFile.thumbnailLink!.replace("=s220", "=s1000"), selectedFile.name)}
                    />
                  ) : selectedFile.webViewLink ? (
                    <iframe
                      src={selectedFile.webViewLink.replace("/view", "/preview")}
                      className="w-full h-full rounded-lg"
                      style={{ border: "1px solid rgba(121, 101, 193, 0.3)", minHeight: "500px" }}
                      title={selectedFile.name}
                    />
                  ) : (
                    <div className="text-center p-8 rounded-xl" style={{ background: "rgba(255, 255, 255, 0.05)" }}>
                      <FileText className="w-16 h-16 mx-auto mb-4" style={{ color: "#00A38D" }} />
                      <p style={{ color: "#E3D095" }}>Preview not available</p>
                      <p className="text-sm mt-2" style={{ color: "rgba(227, 208, 149, 0.6)" }}>Click "Open in Drive" to view this file</p>
                    </div>
                  )}
                </div>
              </div>
            ) : layerFolders.length > 0 ? (
              <div className="w-full h-full overflow-auto p-6" style={{ background: "linear-gradient(135deg, #1A1E32 0%, #0E2148 50%, #1A1E32 100%)" }}>
                <div className="max-w-6xl mx-auto">
                  <h2 className="text-xl font-bold mb-6" style={{ color: "#E3D095" }}>{activeLayer?.name} Files</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredFolders.flatMap((folder) =>
                      (folder.files || []).map((file) => {
                        const FileIcon = getFileIcon(file.mimeType);
                        const isImage = file.mimeType.includes("image");
                        return (
                          <button
                            key={file.id}
                            onClick={() => isImage && file.thumbnailLink ? openImageModal(file.thumbnailLink.replace("=s220", "=s1000"), file.name) : setSelectedFile(file)}
                            className="p-4 rounded-xl text-left transition-all hover-elevate"
                            style={{ background: "rgba(14, 33, 72, 0.85)", border: "1px solid rgba(121, 101, 193, 0.3)" }}
                            data-testid={`file-card-${file.id}`}
                          >
                            {file.thumbnailLink && isImage ? (
                              <div className="w-full h-32 rounded-lg mb-3 bg-cover bg-center" style={{ backgroundImage: `url(${file.thumbnailLink})` }} />
                            ) : (
                              <div className="w-full h-32 rounded-lg mb-3 flex items-center justify-center" style={{ background: "rgba(0, 163, 141, 0.1)" }}>
                                <FileIcon className="w-12 h-12" style={{ color: "#00A38D" }} />
                              </div>
                            )}
                            <p className="font-medium text-sm truncate" style={{ color: "#E3D095" }}>{file.name}</p>
                            <p className="text-xs mt-1 truncate" style={{ color: "rgba(227, 208, 149, 0.5)" }}>{folder.name}</p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #1A1E32 0%, #0E2148 50%, #1A1E32 100%)" }}>
                <div className="rounded-2xl p-8 text-center max-w-lg mx-4" style={{ background: "rgba(14, 33, 72, 0.9)", border: "1px solid rgba(121, 101, 193, 0.4)" }}>
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #00A38D, #00A38DCC)" }}>
                    <FolderOpen className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: "#E3D095" }}>{activeLayer?.name}</h3>
                  <p className="text-sm" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
                    {activeLayer?.type === "google-open"
                      ? "Select a map from the sidebar to view the interactive Google Map."
                      : activeLayer?.type === "panorama"
                        ? "Loading panoramic images from Google Drive folder..."
                        : "No files found in this map layer. Files from Google Drive will appear here when available."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between px-4 py-2 text-xs gap-4" style={{ background: "rgba(14, 33, 72, 0.95)", borderTop: "1px solid rgba(121, 101, 193, 0.3)", color: "rgba(227, 208, 149, 0.7)" }}>
            <div className="flex items-center gap-4">
              <span data-testid="text-coordinates">Lat: {mouseCoords.lat.toFixed(4)}, Lng: {mouseCoords.lng.toFixed(4)}</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">Layer: {activeLayer?.name || "None"}</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <span>Source: {activeLayer?.type === "google-open" ? "Google Maps" : activeLayer?.type === "panorama" ? "Google Drive (Panorama)" : activeLayer?.type === "interactive" ? "MDRRMO" : "Google Drive"}</span>
              <span className="hidden sm:inline">|</span>
              <span className="hidden sm:inline">MDRRMO Pio Duran</span>
            </div>
          </div>
        </div>
      </main>

      {/* Image Modal */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0, 0, 0, 0.9)" }} onClick={closeImageModal}>
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 rounded-t-xl" style={{ background: "rgba(14, 33, 72, 0.95)", backdropFilter: "blur(15px)", border: "1px solid rgba(121, 101, 193, 0.4)", borderBottom: "none" }}>
              <h3 className="font-bold text-lg truncate" style={{ color: "#E3D095" }}>{modalImageName}</h3>
              <div className="flex items-center gap-2">
                <button onClick={handleCopyImage} className="p-2 rounded-lg transition-all hover-elevate" style={{ background: "rgba(0, 163, 141, 0.2)", color: "#00A38D" }} title="Copy Image" data-testid="button-copy-image">
                  <Copy className="w-5 h-5" />
                </button>
                <button onClick={handleDownloadImage} className="p-2 rounded-lg transition-all hover-elevate" style={{ background: "rgba(0, 163, 141, 0.2)", color: "#00A38D" }} title="Download Image" data-testid="button-download-image">
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={handlePrintImage} className="p-2 rounded-lg transition-all hover-elevate" style={{ background: "rgba(0, 163, 141, 0.2)", color: "#00A38D" }} title="Print Image" data-testid="button-print-modal-image">
                  <Printer className="w-5 h-5" />
                </button>
                <button onClick={closeImageModal} className="p-2 rounded-lg transition-all hover-elevate" style={{ color: "#E3D095" }} title="Close" data-testid="button-close-modal">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center p-8 rounded-b-xl overflow-auto" style={{ background: "rgba(14, 33, 72, 0.95)", backdropFilter: "blur(15px)", border: "1px solid rgba(121, 101, 193, 0.4)", borderTop: "none" }}>
              <img ref={imageRef} src={modalImageUrl} alt={modalImageName} className="max-w-full max-h-full object-contain" style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.6)" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}