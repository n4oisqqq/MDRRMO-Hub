import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { SearchBar } from "@/components/search-bar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ExternalLink, 
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  Trash2,
  CheckSquare,
  Square
} from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { GalleryImage, DriveFolder } from "@shared/schema";

interface ImageModalProps {
  image: GalleryImage;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function ImageModal({ image, onClose, onPrev, onNext, hasPrev, hasNext }: ImageModalProps) {
  const getHighResUrl = (img: GalleryImage) => {
    if (img.thumbnailLink) {
      return img.thumbnailLink.replace(/=s\d+$/, '=s1600');
    }
    return img.webContentLink || img.thumbnailLink;
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0, 0, 0, 0.95)" }}
      onClick={onClose}
      data-testid="image-modal"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all z-50"
        style={{ background: "rgba(255, 255, 255, 0.2)" }}
        data-testid="button-close-modal"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {hasPrev && (
        <button
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-colors z-50"
          style={{ background: "rgba(255, 255, 255, 0.2)" }}
          data-testid="button-prev-image"
        >
          <ChevronLeft className="w-8 h-8 text-white" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full flex items-center justify-center transition-colors z-50"
          style={{ background: "rgba(255, 255, 255, 0.2)" }}
          data-testid="button-next-image"
        >
          <ChevronRight className="w-8 h-8 text-white" />
        </button>
      )}

      <div 
        className="flex flex-col items-center justify-center w-full h-full p-4 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex-1 flex items-center justify-center w-full max-w-6xl">
          <img
            src={getHighResUrl(image)}
            alt={image.name}
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
            style={{ boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)" }}
          />
        </div>
        
        <div className="mt-4 text-center w-full max-w-2xl">
          <h3 className="text-xl font-bold text-white mb-2 truncate">{image.name}</h3>
          {image.description && (
            <p className="text-sm text-white/70 mb-4 line-clamp-2">{image.description}</p>
          )}
          
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {image.webContentLink && (
              <a
                href={image.webContentLink}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ background: "rgba(200, 42, 82, 0.8)", color: "white" }}
                data-testid="button-download-image"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            {image.webViewLink && (
              <a
                href={image.webViewLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{ background: "rgba(255, 255, 255, 0.2)", color: "white" }}
                data-testid="button-open-image"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Drive
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface FolderItemProps {
  folder: DriveFolder;
  selectedFolder: string | null;
  onSelectFolder: (id: string) => void;
  openFolders: Set<string>;
  onToggleFolder: (id: string) => void;
  level?: number;
}

function FolderItem({ folder, selectedFolder, onSelectFolder, openFolders, onToggleFolder, level = 0 }: FolderItemProps) {
  const isOpen = openFolders.has(folder.id);
  const hasSubfolders = folder.subfolders && folder.subfolders.length > 0;
  const isSelected = selectedFolder === folder.id;
  const paddingLeft = level * 16 + 12;

  return (
    <div className="w-full">
      <div 
        className={`flex items-center gap-2 py-2 rounded-lg transition-colors cursor-pointer ${isSelected ? 'bg-[#C82A52]/30' : 'hover:bg-white/10'}`}
        style={{ paddingLeft: `${paddingLeft}px`, paddingRight: '12px', color: "#E3D095" }}
      >
        {hasSubfolders && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFolder(folder.id); }}
            className="p-0.5 rounded hover:bg-white/10 transition-colors"
            data-testid={`button-toggle-folder-${folder.id}`}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" style={{ color: "rgba(227, 208, 149, 0.6)" }} />
            ) : (
              <ChevronUp className="w-4 h-4 rotate-180" style={{ color: "rgba(227, 208, 149, 0.6)" }} />
            )}
          </button>
        )}
        
        <button
          onClick={() => onSelectFolder(folder.id)}
          className="flex-1 flex items-center gap-2 text-left min-w-0"
          data-testid={`folder-${folder.id}`}
        >
          {isOpen && hasSubfolders ? (
            <FolderOpen className="w-4 h-4 shrink-0" style={{ color: isSelected ? "#C82A52" : "rgba(227, 208, 149, 0.6)" }} />
          ) : (
            <Folder className="w-4 h-4 shrink-0" style={{ color: isSelected ? "#C82A52" : "rgba(227, 208, 149, 0.6)" }} />
          )}
          <span className="text-sm font-medium truncate">{folder.name}</span>
        </button>
      </div>

      {hasSubfolders && isOpen && (
        <div className="mt-1">
          {folder.subfolders!.map(subfolder => (
            <FolderItem
              key={subfolder.id}
              folder={subfolder as DriveFolder}
              selectedFolder={selectedFolder}
              onSelectFolder={onSelectFolder}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const { data: folders = [], isLoading: foldersLoading } = useQuery<DriveFolder[]>({
    queryKey: ["/api/gallery/folders"],
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery<GalleryImage[]>({
    queryKey: ["/api/gallery/images", selectedFolder],
    queryFn: async () => {
      const res = await fetch(`/api/gallery/images?folderId=${selectedFolder}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      return res.json();
    },
    enabled: !!selectedFolder,
  });

  const deleteImagesMutation = useMutation({
    mutationFn: async (imageIds: string[]) => {
      await apiRequest("DELETE", "/api/gallery/images", { imageIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/gallery/images", selectedFolder] });
      setSelectedImages(new Set());
      setIsSelectionMode(false);
      toast({
        title: "Images deleted",
        description: "Selected images have been moved to trash.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete images. Please try again.",
        variant: "destructive",
      });
    },
  });

  const isLoading = foldersLoading || imagesLoading;

  const filteredImages = images.filter(img =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handlePrevImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImage !== null && selectedImage < filteredImages.length - 1) {
      setSelectedImage(selectedImage + 1);
    }
  };

  const handleToggleFolder = (folderId: string) => {
    setOpenFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleSelectFolder = (folderId: string) => {
    setSelectedFolder(folderId);
    setSelectedImages(new Set());
    setIsSelectionMode(false);
  };

  const handleToggleImageSelection = (imageId: string) => {
    setSelectedImages(prev => {
      const next = new Set(prev);
      if (next.has(imageId)) {
        next.delete(imageId);
      } else {
        next.add(imageId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedImages.size === filteredImages.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(filteredImages.map(img => img.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedImages.size === 0) return;
    deleteImagesMutation.mutate(Array.from(selectedImages));
  };

  const handleDownloadSelected = async () => {
    const imagesToDownload = filteredImages.filter(img => selectedImages.has(img.id));
    for (const img of imagesToDownload) {
      if (img.webContentLink) {
        window.open(img.webContentLink, '_blank');
      }
    }
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      setSelectedImages(new Set());
    }
  };

  const handleImageClick = (idx: number, imageId: string) => {
    if (isSelectionMode) {
      handleToggleImageSelection(imageId);
    } else {
      setSelectedImage(idx);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1A1E32" }}>
      <BackgroundPattern />
      <Header title="PHOTO GALLERY" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div 
            className="rounded-3xl p-6 md:p-8"
            style={{
              background: "rgba(14, 33, 72, 0.85)",
              backdropFilter: "blur(25px)",
              border: "1px solid rgba(121, 101, 193, 0.4)",
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2" style={{ borderColor: "rgba(121, 101, 193, 0.4)" }}>
              <div className="flex items-center gap-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #C82A52, #C82A52CC)" }}
                >
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <h2 
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{ color: "#E3D095", textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)" }}
                  data-testid="text-gallery-title"
                >
                  Photo Gallery
                </h2>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <SearchBar 
                  value={searchQuery} 
                  onChange={setSearchQuery} 
                  placeholder="Search photos..." 
                />
                {selectedFolder && filteredImages.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleSelectionMode}
                    className={`gap-2 ${isSelectionMode ? 'bg-[#C82A52]/20 border-[#C82A52]' : ''}`}
                    style={{ borderColor: isSelectionMode ? "#C82A52" : "rgba(121, 101, 193, 0.4)", color: "#E3D095" }}
                    data-testid="button-toggle-selection"
                  >
                    {isSelectionMode ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    {isSelectionMode ? "Cancel" : "Select"}
                  </Button>
                )}
              </div>
            </div>

            {isSelectionMode && (
              <div 
                className="flex items-center justify-between gap-4 mb-6 p-4 rounded-xl flex-wrap"
                style={{ background: "rgba(200, 42, 82, 0.2)", border: "1px solid rgba(200, 42, 82, 0.4)" }}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSelectAll}
                    className="flex items-center gap-2 text-sm font-medium"
                    style={{ color: "#E3D095" }}
                    data-testid="button-select-all"
                  >
                    <Checkbox
                      checked={selectedImages.size === filteredImages.length && filteredImages.length > 0}
                      className="border-[#E3D095]"
                    />
                    {selectedImages.size === filteredImages.length && filteredImages.length > 0 ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-sm" style={{ color: "rgba(227, 208, 149, 0.7)" }}>
                    {selectedImages.size} of {filteredImages.length} selected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadSelected}
                    disabled={selectedImages.size === 0}
                    className="gap-2"
                    style={{ borderColor: "rgba(121, 101, 193, 0.4)", color: "#E3D095" }}
                    data-testid="button-download-selected"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    disabled={deleteImagesMutation.isPending || selectedImages.size === 0}
                    className="gap-2"
                    data-testid="button-delete-selected"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleteImagesMutation.isPending ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div 
                className="rounded-xl p-4 lg:col-span-1 max-h-[600px] overflow-y-auto"
                style={{ background: "rgba(255, 255, 255, 0.05)" }}
              >
                <h3 className="font-semibold mb-4 flex items-center gap-2 sticky top-0 py-2" style={{ color: "#E3D095", background: "rgba(255, 255, 255, 0.05)" }}>
                  <Folder className="w-5 h-5" style={{ color: "#C82A52" }} />
                  Albums
                </h3>

                {foldersLoading ? (
                  <LoadingSpinner size="sm" />
                ) : folders.length === 0 ? (
                  <p className="text-sm text-center py-8" style={{ color: "rgba(227, 208, 149, 0.6)" }}>
                    No albums available
                  </p>
                ) : (
                  <div className="space-y-1">
                    {folders.map(folder => (
                      <FolderItem
                        key={folder.id}
                        folder={folder}
                        selectedFolder={selectedFolder}
                        onSelectFolder={handleSelectFolder}
                        openFolders={openFolders}
                        onToggleFolder={handleToggleFolder}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-3">
                {!selectedFolder ? (
                  <EmptyState
                    icon={Folder}
                    title="Select an album"
                    description="Choose a photo album from the sidebar to view its images."
                  />
                ) : imagesLoading ? (
                  <LoadingSpinner message="Loading images..." />
                ) : filteredImages.length === 0 ? (
                  <EmptyState
                    icon={ImageIcon}
                    title="No images found"
                    description={searchQuery ? "Try adjusting your search." : "This album has no images yet."}
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map((image, idx) => {
                      const isImageSelected = selectedImages.has(image.id);
                      return (
                        <div
                          key={image.id}
                          onClick={() => handleImageClick(idx, image.id)}
                          className={`group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 ${!isSelectionMode && 'hover:-translate-y-1 hover:shadow-xl'}`}
                          style={{
                            background: "rgba(255, 255, 255, 0.1)",
                            border: isImageSelected ? "2px solid #C82A52" : "1px solid rgba(121, 101, 193, 0.3)"
                          }}
                          data-testid={`image-card-${image.id}`}
                        >
                          {isSelectionMode && (
                            <div className="absolute top-2 left-2 z-10">
                              <div 
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${isImageSelected ? 'bg-[#C82A52]' : 'bg-black/50 border border-white/50'}`}
                              >
                                {isImageSelected && <Check className="w-4 h-4 text-white" />}
                              </div>
                            </div>
                          )}
                          
                          <div className="aspect-square overflow-hidden">
                            <img
                              src={image.thumbnailLink || "/placeholder.jpg"}
                              alt={image.name}
                              className={`w-full h-full object-cover transition-transform duration-300 ${!isSelectionMode && 'group-hover:scale-110'}`}
                              loading="lazy"
                            />
                          </div>
                          
                          {!isSelectionMode && (
                            <div 
                              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
                              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)" }}
                            >
                              <div className="p-3 w-full">
                                <p className="text-sm font-medium text-white truncate">{image.name}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {selectedImage !== null && filteredImages[selectedImage] && (
        <ImageModal
          image={filteredImages[selectedImage]}
          onClose={() => setSelectedImage(null)}
          onPrev={handlePrevImage}
          onNext={handleNextImage}
          hasPrev={selectedImage > 0}
          hasNext={selectedImage < filteredImages.length - 1}
        />
      )}
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
