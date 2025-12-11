import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { BackgroundPattern } from "@/components/background-pattern";
import { SearchBar } from "@/components/search-bar";
import { LoadingSpinner } from "@/components/loading-spinner";
import { EmptyState } from "@/components/empty-state";
import {
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Folder,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { GalleryImage, DriveFolder } from "@shared/schema";

interface ImageModalProps {
  image: GalleryImage;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

function ImageModal({
  image,
  onClose,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: ImageModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0, 0, 0, 0.9)" }}
      onClick={onClose}
      data-testid="image-modal"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:rotate-90"
        style={{ background: "rgba(255, 255, 255, 0.2)" }}
        data-testid="button-close-modal"
      >
        <X className="w-6 h-6 text-white" />
      </button>

      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onPrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-white/30"
          style={{ background: "rgba(255, 255, 255, 0.2)" }}
          data-testid="button-prev-image"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
      )}

      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full flex items-center justify-center transition-colors hover:bg-white/30"
          style={{ background: "rgba(255, 255, 255, 0.2)" }}
          data-testid="button-next-image"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      )}

      <div
        className="max-w-5xl max-h-[80vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={image.webContentLink || image.thumbnailLink}
          alt={image.name}
          className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-2xl"
        />

        <div className="mt-6 text-center">
          <h3 className="text-xl font-bold text-white mb-2">{image.name}</h3>
          {image.description && (
            <p className="text-sm text-white/70 mb-4">{image.description}</p>
          )}

          <div className="flex items-center justify-center gap-3">
            {image.webContentLink && (
              <a
                href={image.webContentLink}
                download
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors"
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                }}
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
                style={{
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                }}
                data-testid="button-open-image"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Gallery() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set());
  const [openSubfolders, setOpenSubfolders] = useState<Set<string>>(new Set());

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

  const toggleSubfolder = (subfolderId: string) => {
    const newOpenSubfolders = new Set(openSubfolders);
    if (newOpenSubfolders.has(subfolderId)) {
      newOpenSubfolders.delete(subfolderId);
    } else {
      newOpenSubfolders.add(subfolderId);
    }
    setOpenSubfolders(newOpenSubfolders);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#1A1E32" }}
    >
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
              boxShadow: "0 12px 40px rgba(0, 0, 0, 0.3)",
            }}
          >
            <div
              className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-8 pb-6 border-b-2"
              style={{ borderColor: "rgba(121, 101, 193, 0.4)" }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: "linear-gradient(135deg, #C82A52, #C82A52CC)",
                  }}
                >
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2
                  className="text-2xl md:text-3xl font-extrabold"
                  style={{
                    color: "#E3D095",
                    textShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                  data-testid="text-gallery-title"
                >
                  Photo Gallery
                </h2>
              </div>
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search photos..."
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div
                className="rounded-xl p-4 lg:col-span-1"
                style={{ background: "rgba(255, 255, 255, 0.05)" }}
              >
                <h3
                  className="font-semibold mb-4 flex items-center gap-2"
                  style={{ color: "#E3D095" }}
                >
                  <Folder className="w-5 h-5" style={{ color: "#C82A52" }} />
                  Categories
                </h3>

                {foldersLoading ? (
                  <LoadingSpinner size="sm" />
                ) : folders.length === 0 ? (
                  <p
                    className="text-sm text-center py-8"
                    style={{ color: "rgba(227, 208, 149, 0.6)" }}
                  >
                    No categories available
                  </p>
                ) : (
                  <div className="space-y-1">
                    {folders.map((folder) => (
                      <Collapsible
                        key={folder.id}
                        open={openFolders.has(folder.id)}
                        onOpenChange={() => toggleFolder(folder.id)}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <CollapsibleTrigger asChild>
                              <button
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                style={{ color: "#E3D095" }}
                              >
                                {openFolders.has(folder.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRightIcon className="w-4 h-4" />
                                )}
                              </button>
                            </CollapsibleTrigger>
                            <button
                              onClick={() => setSelectedFolder(folder.id)}
                              className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${selectedFolder === folder.id ? "bg-[#C82A52]/30" : "hover:bg-white/10"}`}
                              style={{ color: "#E3D095" }}
                              data-testid={`folder-${folder.id}`}
                            >
                              <Folder
                                className="w-4 h-4"
                                style={{
                                  color:
                                    selectedFolder === folder.id
                                      ? "#C82A52"
                                      : "rgba(227, 208, 149, 0.6)",
                                }}
                              />
                              <span className="text-sm font-medium truncate">
                                {folder.name}
                              </span>
                            </button>
                          </div>

                          {folder.subfolders &&
                            folder.subfolders.length > 0 && (
                              <CollapsibleContent className="ml-6 space-y-1">
                                {folder.subfolders.map((subfolder) => (
                                  <Collapsible
                                    key={subfolder.id}
                                    open={openSubfolders.has(subfolder.id)}
                                    onOpenChange={() =>
                                      toggleSubfolder(subfolder.id)
                                    }
                                  >
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1">
                                        {subfolder.subfolders &&
                                          subfolder.subfolders.length > 0 && (
                                            <CollapsibleTrigger asChild>
                                              <button
                                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                                style={{ color: "#E3D095" }}
                                              >
                                                {openSubfolders.has(
                                                  subfolder.id,
                                                ) ? (
                                                  <ChevronDown className="w-3 h-3" />
                                                ) : (
                                                  <ChevronRightIcon className="w-3 h-3" />
                                                )}
                                              </button>
                                            </CollapsibleTrigger>
                                          )}
                                        <button
                                          onClick={() =>
                                            setSelectedFolder(subfolder.id)
                                          }
                                          className={`flex-1 flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${selectedFolder === subfolder.id ? "bg-[#C82A52]/30" : "hover:bg-white/10"} ${!(subfolder.subfolders && subfolder.subfolders.length > 0) ? "ml-5" : ""}`}
                                          style={{ color: "#E3D095" }}
                                          data-testid={`subfolder-${subfolder.id}`}
                                        >
                                          <Folder
                                            className="w-3 h-3"
                                            style={{
                                              color:
                                                selectedFolder === subfolder.id
                                                  ? "#C82A52"
                                                  : "rgba(227, 208, 149, 0.6)",
                                            }}
                                          />
                                          <span className="text-sm font-medium truncate">
                                            {subfolder.name}
                                          </span>
                                        </button>
                                      </div>

                                      {subfolder.subfolders &&
                                        subfolder.subfolders.length > 0 && (
                                          <CollapsibleContent className="ml-5 space-y-1">
                                            {subfolder.subfolders.map(
                                              (childFolder) => (
                                                <button
                                                  key={childFolder.id}
                                                  onClick={() =>
                                                    setSelectedFolder(
                                                      childFolder.id,
                                                    )
                                                  }
                                                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${selectedFolder === childFolder.id ? "bg-[#C82A52]/30" : "hover:bg-white/10"}`}
                                                  style={{ color: "#E3D095" }}
                                                  data-testid={`child-folder-${childFolder.id}`}
                                                >
                                                  <Folder
                                                    className="w-3 h-3"
                                                    style={{
                                                      color:
                                                        selectedFolder ===
                                                        childFolder.id
                                                          ? "#C82A52"
                                                          : "rgba(227, 208, 149, 0.6)",
                                                    }}
                                                  />
                                                  <span className="text-sm font-medium truncate">
                                                    {childFolder.name}
                                                  </span>
                                                </button>
                                              ),
                                            )}
                                          </CollapsibleContent>
                                        )}
                                    </div>
                                  </Collapsible>
                                ))}
                              </CollapsibleContent>
                            )}
                        </div>
                      </Collapsible>
                    ))}
                  </div>
                )}
              </div>

              <div className="lg:col-span-3">
                {!selectedFolder ? (
                  <EmptyState
                    icon={Folder}
                    title="Select a category"
                    description="Choose a photo category from the sidebar to view its images."
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
                        : "This category has no images yet."
                    }
                  />
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {filteredImages.map((image, idx) => (
                      <div
                        key={image.id}
                        onClick={() => setSelectedImage(idx)}
                        className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                        style={{
                          background: "rgba(255, 255, 255, 0.1)",
                          border: "1px solid rgba(121, 101, 193, 0.3)",
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
                              "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)",
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
