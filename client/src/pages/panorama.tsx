import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Viewer } from "@photo-sphere-viewer/core";
import "@photo-sphere-viewer/core/index.css";
import {
  Search,
  Image as ImageIcon,
  Folder,
  ChevronRight,
  ChevronDown,
  X,
  Eye,
  Maximize2,
  RotateCw,
  Grid3X3,
  List,
} from "lucide-react";
import type { GalleryImage, DriveFolder } from "@shared/schema";

interface PanoramaData {
  folders: DriveFolder[];
  allImages: GalleryImage[];
}

export default function Panorama() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [is360Viewer, setIs360Viewer] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const viewerContainerRef = useRef<HTMLDivElement>(null);
  const viewerInstanceRef = useRef<Viewer | null>(null);

  const { data, isLoading } = useQuery<PanoramaData>({
    queryKey: ["/api/panorama"],
  });

  const folders = data?.folders || [];
  const allImages = data?.allImages || [];

  const filteredImages = allImages.filter((image) => {
    const matchesSearch = image.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFolder = !selectedFolder || image.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  const toggleFolder = (folderId: string) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(folderId)) {
      newOpenFolders.delete(folderId);
    } else {
      newOpenFolders.add(folderId);
    }
    setOpenFolders(newOpenFolders);
  };

  const openViewer = (image: GalleryImage, use360: boolean) => {
    setSelectedImage(image);
    setIs360Viewer(use360);
    setViewerOpen(true);
  };

  const closeViewer = () => {
    if (viewerInstanceRef.current) {
      viewerInstanceRef.current.destroy();
      viewerInstanceRef.current = null;
    }
    setViewerOpen(false);
    setSelectedImage(null);
    setIs360Viewer(false);
  };

  useEffect(() => {
    if (viewerOpen && is360Viewer && selectedImage && viewerContainerRef.current) {
      const timer = setTimeout(() => {
        if (viewerContainerRef.current && !viewerInstanceRef.current) {
          try {
            viewerInstanceRef.current = new Viewer({
              container: viewerContainerRef.current,
              panorama: `/api/panorama/image/${selectedImage.id}`,
              navbar: ["autorotate", "zoom", "fullscreen"],
              defaultZoomLvl: 50,
              touchmoveTwoFingers: true,
              mousewheelCtrlKey: false,
            });
          } catch (error) {
            console.error("Error initializing panorama viewer:", error);
          }
        }
      }, 100);

      return () => {
        clearTimeout(timer);
        if (viewerInstanceRef.current) {
          viewerInstanceRef.current.destroy();
          viewerInstanceRef.current = null;
        }
      };
    }
  }, [viewerOpen, is360Viewer, selectedImage]);

  const getImageUrl = (image: GalleryImage) => {
    return `/api/panorama/image/${image.id}`;
  };

  const getThumbnailUrl = (image: GalleryImage) => {
    if (image.thumbnailLink) {
      return image.thumbnailLink.replace("=s220", "=s400");
    }
    return `/api/panorama/image/${image.id}`;
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      <BackgroundPattern />
      <Header title="Panorama Map" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-6">
            <Card className="lg:w-72 shrink-0 bg-gradient-to-b from-[#FFF5EE] to-[#FFE4D6] border-none shadow-xl">
              <CardContent className="p-4">
                <h3
                  className="text-lg font-bold mb-4 flex items-center gap-2"
                  style={{ color: "#8B4513" }}
                >
                  <Folder className="w-5 h-5" />
                  Folders
                </h3>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedFolder(null)}
                      className={`w-full flex items-center gap-2 py-2 px-3 rounded-lg transition-colors text-left ${
                        selectedFolder === null
                          ? "bg-[#FEAE97]/30"
                          : "hover:bg-white/50"
                      }`}
                      style={{ color: "#8B4513" }}
                      data-testid="folder-all"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-sm font-medium">All Images</span>
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {allImages.length}
                      </Badge>
                    </button>

                    {folders.map((folder) => (
                      <div key={folder.id}>
                        <div className="flex items-center gap-1">
                          {folder.subfolders && folder.subfolders.length > 0 ? (
                            <button
                              className="p-1 hover:bg-white rounded transition-colors"
                              onClick={() => toggleFolder(folder.id)}
                              style={{ color: "#8B4513" }}
                              data-testid={`toggle-folder-${folder.id}`}
                            >
                              {openFolders.has(folder.id) ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-6" />
                          )}
                          <button
                            onClick={() => setSelectedFolder(folder.id)}
                            className={`flex-1 flex items-center gap-2 py-2 px-2 rounded-lg transition-colors text-left ${
                              selectedFolder === folder.id
                                ? "bg-[#FEAE97]/30"
                                : "hover:bg-white/50"
                            }`}
                            style={{ color: "#8B4513" }}
                            data-testid={`folder-${folder.id}`}
                          >
                            <Folder
                              className="w-4 h-4"
                              style={{
                                color:
                                  selectedFolder === folder.id
                                    ? "#8B4513"
                                    : "#FEAE97",
                              }}
                            />
                            <span className="text-sm font-medium truncate">
                              {folder.name}
                            </span>
                            {folder.files && (
                              <Badge
                                variant="secondary"
                                className="ml-auto text-xs"
                              >
                                {folder.files.length}
                              </Badge>
                            )}
                          </button>
                        </div>

                        {openFolders.has(folder.id) &&
                          folder.subfolders &&
                          folder.subfolders.map((subfolder) => (
                            <button
                              key={subfolder.id}
                              onClick={() => setSelectedFolder(subfolder.id)}
                              className={`w-full flex items-center gap-2 py-2 px-3 ml-6 rounded-lg transition-colors text-left ${
                                selectedFolder === subfolder.id
                                  ? "bg-[#FEAE97]/30"
                                  : "hover:bg-white/50"
                              }`}
                              style={{ color: "#8B4513" }}
                              data-testid={`subfolder-${subfolder.id}`}
                            >
                              <Folder className="w-4 h-4" />
                              <span className="text-sm truncate">
                                {subfolder.name}
                              </span>
                            </button>
                          ))}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <div className="flex-1">
              <Card className="bg-white/95 backdrop-blur-sm border-none shadow-xl mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative flex-1 w-full">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search panorama images..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="input-search"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant={viewMode === "grid" ? "default" : "outline"}
                        onClick={() => setViewMode("grid")}
                        data-testid="button-grid-view"
                      >
                        <Grid3X3 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant={viewMode === "list" ? "default" : "outline"}
                        onClick={() => setViewMode("list")}
                        data-testid="button-list-view"
                      >
                        <List className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/95 backdrop-blur-sm border-none shadow-xl">
                <CardContent className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RotateCw className="w-8 h-8 animate-spin text-primary" />
                    </div>
                  ) : filteredImages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No panorama images found</p>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {filteredImages.map((image) => (
                        <div
                          key={image.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
                          data-testid={`image-card-${image.id}`}
                        >
                          <img
                            src={getThumbnailUrl(image)}
                            alt={image.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => openViewer(image, false)}
                              data-testid={`button-view-${image.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="default"
                              onClick={() => openViewer(image, true)}
                              data-testid={`button-360-${image.id}`}
                            >
                              <Maximize2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-white text-xs truncate">
                              {image.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredImages.map((image) => (
                        <div
                          key={image.id}
                          className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
                          data-testid={`image-row-${image.id}`}
                        >
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0">
                            <img
                              src={getThumbnailUrl(image)}
                              alt={image.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{image.name}</p>
                            {image.createdTime && (
                              <p className="text-sm text-muted-foreground">
                                {new Date(image.createdTime).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openViewer(image, false)}
                              data-testid={`button-view-list-${image.id}`}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => openViewer(image, true)}
                              data-testid={`button-360-list-${image.id}`}
                            >
                              <Maximize2 className="w-4 h-4 mr-1" />
                              360
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      <Dialog open={viewerOpen} onOpenChange={closeViewer}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-[90vh] p-0">
          <DialogHeader className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/70 to-transparent">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-white truncate pr-4">
                {selectedImage?.name}
              </DialogTitle>
              <div className="flex items-center gap-2">
                {!is360Viewer && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => setIs360Viewer(true)}
                    data-testid="button-switch-360"
                  >
                    <Maximize2 className="w-4 h-4 mr-1" />
                    View as 360
                  </Button>
                )}
                {is360Viewer && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (viewerInstanceRef.current) {
                        viewerInstanceRef.current.destroy();
                        viewerInstanceRef.current = null;
                      }
                      setIs360Viewer(false);
                    }}
                    data-testid="button-switch-normal"
                  >
                    <ImageIcon className="w-4 h-4 mr-1" />
                    Normal View
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={closeViewer}
                  className="text-white hover:bg-white/20"
                  data-testid="button-close-viewer"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="w-full h-full bg-black flex items-center justify-center pt-16">
            {is360Viewer ? (
              <div
                ref={viewerContainerRef}
                className="w-full h-full"
                data-testid="panorama-viewer"
              />
            ) : (
              selectedImage && (
                <img
                  src={getImageUrl(selectedImage)}
                  alt={selectedImage.name}
                  className="max-w-full max-h-full object-contain"
                  data-testid="image-viewer"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
