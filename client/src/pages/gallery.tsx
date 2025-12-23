import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { SearchBar } from "@/components/search-bar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import { ImageModal } from "@/components/image-modal";
import {
  FileText,
  Folder,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import type { GalleryImage, DriveFolder } from "@shared/schema";

// Recursive component for nested folders
interface FolderTreeProps {
  folder: DriveFolder;
  level: number;
  selectedFolder: string | null;
  openFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectFolder: (folderId: string) => void;
  loadSubfolderContents: (folderId: string) => Promise<void>;
  subfolderContents: Record<string, DriveFolder>;
  loadingSubfolder: string | null;
}

function FolderTree({
  folder,
  level,
  selectedFolder,
  openFolders,
  onToggleFolder,
  onSelectFolder,
  loadSubfolderContents,
  subfolderContents,
  loadingSubfolder,
}: FolderTreeProps) {
  const isOpen = openFolders.has(folder.id);
  const loadedFolder = subfolderContents[folder.id];
  const currentSubfolders = loadedFolder?.subfolders || folder.subfolders || [];
  const hasSubfolders = currentSubfolders.length > 0;
  const isLoading = loadingSubfolder === folder.id;

  const handleToggle = () => {
    onToggleFolder(folder.id);
    if (!isOpen && hasSubfolders && !subfolderContents[folder.id]) {
      loadSubfolderContents(folder.id);
    }
  };

  const handleSelect = () => {
    onSelectFolder(folder.id);
  };

  return (
    <div className={`${level > 0 ? "ml-2" : ""}`}>
      <div className="flex items-center gap-1">
        {hasSubfolders ? (
          <button
            className="p-1 hover:bg-white rounded transition-colors flex-shrink-0"
            style={{ color: "#1e40af" }}
            onClick={handleToggle}
          >
            {isOpen ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRightIcon className="w-4 h-4" />
            )}
          </button>
        ) : (
          <div className="w-6 flex-shrink-0" />
        )}
        <button
          onClick={handleSelect}
          className={`flex-1 flex items-center gap-2 py-2 px-2 rounded-lg transition-colors text-left ${
            selectedFolder === folder.id
              ? "bg-blue-500 text-white"
              : "hover:bg-blue-100 text-blue-900"
          }`}
          data-testid={`folder-${folder.id}`}
        >
          <Folder
            className="w-4 h-4 flex-shrink-0"
            style={{
              color: selectedFolder === folder.id ? "white" : "#f59e0b",
            }}
          />
          <span className="text-sm font-medium truncate">{folder.name}</span>
          {isLoading && (
            <span className="ml-auto text-xs" style={{ color: "#f59e0b" }}>
              Loading...
            </span>
          )}
        </button>
      </div>

      {hasSubfolders && isOpen && (
        <div className="space-y-1 mt-1">
          {currentSubfolders.map((subfolder) => (
            <FolderTree
              key={subfolder.id}
              folder={subfolder}
              level={level + 1}
              selectedFolder={selectedFolder}
              openFolders={openFolders}
              onToggleFolder={onToggleFolder}
              onSelectFolder={onSelectFolder}
              loadSubfolderContents={loadSubfolderContents}
              subfolderContents={subfolderContents}
              loadingSubfolder={loadingSubfolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [subfolderContents, setSubfolderContents] = useState<
    Record<string, DriveFolder>
  >({});
  const [loadingSubfolder, setLoadingSubfolder] = useState<string | null>(null);

  const { data: folders = [], isLoading: foldersLoading } = useQuery<
    DriveFolder[]
  >({
    queryKey: ["/api/gallery/folders"],
  });

  const { data: images = [], isLoading: imagesLoading } = useQuery<
    GalleryImage[]
  >({
    queryKey: ["/api/gallery/images", selectedFolder],
    queryFn: async () => {
      const res = await fetch(`/api/gallery/images?folderId=${selectedFolder}`);
      if (!res.ok) throw new Error("Failed to fetch images");
      return res.json();
    },
    enabled: !!selectedFolder,
  });

  const isLoading = foldersLoading || imagesLoading;

  const filteredImages = images.filter((img) =>
    img.name.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const toggleFolder = (folderId: string) => {
    const newOpenFolders = new Set(openFolders);
    if (newOpenFolders.has(folderId)) {
      newOpenFolders.delete(folderId);
    } else {
      newOpenFolders.add(folderId);
    }
    setOpenFolders(newOpenFolders);
  };

  const loadSubfolderContents = async (folderId: string) => {
    if (subfolderContents[folderId]) return;

    setLoadingSubfolder(folderId);
    try {
      const response = await fetch(`/api/gallery/subfolder/${folderId}`);
      if (response.ok) {
        const data = await response.json();
        setSubfolderContents((prev) => ({ ...prev, [folderId]: data }));
      }
    } catch (error) {
      console.error("Failed to load subfolder:", error);
    } finally {
      setLoadingSubfolder(null);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #dbeafe, #eff6ff)" }}
    >
      <BackgroundPattern />
      <Header title="PHOTO GALLERY" showBack />

      <main className="flex-1 relative z-10 px-4 md:px-2 py-2">
        <div className="max-w-7xl mx-auto">
          <div
            className="rounded-3xl p-6 md:p-8 shadow-2xl"
            style={{
              background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
              border: "1px solid #fbbf24",
            }}
          >
            <div
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: "rgba(251, 191, 36, 0.5)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shadow-md"
                  style={{
                    background: "linear-gradient(135deg, #f59e0b, #fbbf24)",
                  }}
                >
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{
                    color: "white",
                    textShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  Photo Gallery
                </h2>
              </div>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search photos..."
                className="bg-white/90 border-2 border-[#fbbf24] focus:border-[#1e40af]"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
              <div
                className="rounded-xl p-4 lg:col-span-1"
                style={{ background: "rgba(255, 255, 255, 0.9)" }}
              >
                <h3
                  className="font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "#1e40af" }}
                >
                  <Folder className="w-5 h-5" style={{ color: "#f59e0b" }} />
                  PHOTO ALBUMS
                </h3>

                {foldersLoading ? (
                  <LoadingSpinner size="sm" />
                ) : folders.length === 0 ? (
                  <p
                    className="text-sm text-center py-8"
                    style={{ color: "rgba(30, 64, 175, 0.7)" }}
                  >
                    No album available
                  </p>
                ) : (
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <FolderTree
                        key={folder.id}
                        folder={folder}
                        level={0}
                        selectedFolder={selectedFolder}
                        openFolders={openFolders}
                        onToggleFolder={toggleFolder}
                        onSelectFolder={setSelectedFolder}
                        loadSubfolderContents={loadSubfolderContents}
                        subfolderContents={subfolderContents}
                        loadingSubfolder={loadingSubfolder}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-3">
                {!selectedFolder ? (
                  <EmptyState
                    icon={Folder}
                    title="Select a album"
                    description="Choose a photo album from the sidebar to view its images."
                  />
                ) : imagesLoading ? (
                  <LoadingSpinner message="Loading images..." />
                ) : filteredImages.length === 0 ? (
                  <EmptyState
                    icon={FileText}
                    title="No images found"
                    description={
                      searchQuery
                        ? "Try adjusting your search."
                        : "This photo album has no images yet."
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map((image, idx) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImage(idx)}
                        className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-md"
                        style={{
                          background:
                            "linear-gradient(135deg, #eff6ff, #dbeafe)",
                          border: "1px solid #fbbf24",
                        }}
                        data-testid={`image-card-${image.id}`}
                      >
                        <div className="aspect-square overflow-hidden">
                          <img
                            src={image.thumbnailLink || "/placeholder.jpg"}
                            alt={image.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        </div>

                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end"
                          style={{
                            background:
                              "linear-gradient(to top, rgba(30, 64, 175, 0.8) 0%, transparent 50%)",
                          }}
                        >
                          <div className="p-3 w-full">
                            <p className="text-sm font-medium text-white truncate">
                              {image.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
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
          isOpen={selectedImage !== null}
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